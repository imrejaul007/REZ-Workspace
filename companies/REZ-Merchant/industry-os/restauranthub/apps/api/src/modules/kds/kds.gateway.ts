import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  Optional } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenBlacklistService } from '../auth/services/token-blacklist.service';
import { KitchenAIConnector, type KDSOrder } from './kitchen-ai.connector';

/** Map Prisma OrderStatus → KDS display status */
const PRISMA_TO_KDS_STATUS: Record<string, string> = {
  PENDING: 'new',
  CONFIRMED: 'new',
  PREPARING: 'preparing',
  PROCESSING: 'ready',
  SHIPPED: 'served',
  DELIVERED: 'served',
  CANCELLED: 'served',
  REFUNDED: 'served',
};

@WebSocketGateway({
  namespace: '/kds',
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'https://rez.money').split(','),
    credentials: true
  }
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(KdsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly prisma: PrismaService,
    @Optional() private readonly kitchenAIConnector?: KitchenAIConnector,
  ) {}

  // ---------------------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------------------

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        this.logger.warn(`[KDS] Client ${client.id} rejected — no token`);
        client.disconnect(true);
        return;
      }

      const secret = process.env.JWT_SECRET;
      let payload;
      try {
        payload = this.jwtService.verify(token, { secret });
      } catch {
        this.logger.warn(`[KDS] Client ${client.id} rejected — invalid token`);
        client.disconnect(true);
        return;
      }

      if (await this.tokenBlacklistService.isTokenBlacklisted(token)) {
        this.logger.warn(`[KDS] Client ${client.id} rejected — token revoked`);
        client.disconnect(true);
        return;
      }

      // Attach user info to the socket for downstream handlers
      (client as unknown).user = payload;
      this.logger.log(`[KDS] Client connected: ${client.id} (user ${payload.id})`);
    } catch (err: unknown) {
      this.logger.error(`[KDS] handleConnection error: ${err instanceof Error ? err.message : String(err)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`[KDS] Client disconnected: ${client.id}`);
  }

  // ---------------------------------------------------------------------------
  // Client → Server messages
  // ---------------------------------------------------------------------------

  /**
   * join-store — client joins the room for a specific store.
   * Room name: "store:<storeId>"
   */
  @SubscribeMessage('join-store')
  async handleJoinStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { storeId: string },
  ): Promise<{ success: boolean; room: string }> {
    const room = `store:${data.storeId}`;
    await client.join(room);
    this.logger.log(`[KDS] ${client.id} joined room ${room}`);
    return { success: true, room };
  }

  /**
   * get-current-orders — returns all active orders for the given store.
   * Active = PENDING, CONFIRMED, PREPARING, PROCESSING.
   */
  @SubscribeMessage('get-current-orders')
  async handleGetCurrentOrders(
    @MessageBody() data: { storeId: string },
  ): Promise<{ orders: unknown[] }> {
    try {
      const activeStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'PROCESSING'];
      const dbOrders = await this.prisma.order.findMany({
        where: {
          restaurantId: data.storeId,
          status: { in: activeStatuses as unknown },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const orders = dbOrders.map((order) => this.mapOrderToKds(order));
      return { orders };
    } catch (err: unknown) {
      this.logger.error(`[KDS] get-current-orders error: ${err instanceof Error ? err.message : String(err)}`);
      return { orders: [] };
    }
  }

  /**
   * order-status-changed — broadcasts the new status to all displays in the store room.
   * The frontend already persisted the status via HTTP PUT; this is purely a broadcast.
   */
  @SubscribeMessage('order-status-changed')
  handleOrderStatusChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: string; storeId: string },
  ): void {
    const room = `store:${data.storeId}`;
    client.to(room).emit('order:status_updated', {
      orderId: data.orderId,
      status: data.status,
    });
  }

  /**
   * item-status-changed — broadcasts the item status update to all displays in the room.
   */
  @SubscribeMessage('item-status-changed')
  handleItemStatusChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; itemId: string; status: string; storeId: string },
  ): void {
    const room = `store:${data.storeId}`;
    client.to(room).emit('order:item_status_updated', {
      orderId: data.orderId,
      itemId: data.itemId,
      status: data.status,
    });
    // Acknowledge back to the sender
    client.emit('item-status-updated:ack', { orderId: data.orderId, itemId: data.itemId, status: data.status });
  }

  // ---------------------------------------------------------------------------
  // Server-initiated broadcasts (called from OrdersService)
  // ---------------------------------------------------------------------------

  /**
   * Called by OrdersService after a new order is created.
   * Broadcasts to all KDS displays watching the given restaurant/store.
   *
   * Optionally triggers Kitchen AI analysis for insights.
   * KDS is not blocked by AI analysis - it runs async.
   */
  notifyNewOrder(restaurantId: string, order: KDSOrder, options?: { analyzeWithAI?: boolean }): void {
    const room = `store:${restaurantId}`;
    this.server.to(room).emit('merchant:new_order', order);
    this.logger.log(`[KDS] Broadcast merchant:new_order to ${room} (order ${order.orderId})`);

    // Trigger Kitchen AI analysis asynchronously (non-blocking)
    if (options?.analyzeWithAI !== false && this.kitchenAIConnector) {
      this.analyzeOrderWithAI(order).catch((error) => {
        this.logger.warn(`[KDS] AI analysis failed for order ${order.orderId}: ${error.message}`);
      });
    }
  }

  /**
   * Notify new order WITH Kitchen AI analysis.
   * Sends AI insights to the dashboard after analysis completes.
   */
  async notifyNewOrderWithAI(restaurantId: string, order: KDSOrder): Promise<void> {
    const room = `store:${restaurantId}`;
    const requestId = `kds-ai-${Date.now().toString(36)}`;

    this.logger.log(
      `[${requestId}] Processing order ${order.orderId} with AI analysis`,
    );

    // Broadcast immediately to KDS (don't wait for AI)
    this.server.to(room).emit('merchant:new_order', order);
    this.logger.log(`[KDS] Broadcast merchant:new_order to ${room} (order ${order.orderId})`);

    // Analyze with Kitchen AI
    if (this.kitchenAIConnector) {
      const analysis = await this.analyzeOrderWithAI(order);

      if (analysis) {
        // Emit AI insights to dashboard
        this.server.to(room).emit('merchant:ai_insights', {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          analysis,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `[${requestId}] AI insights emitted for order ${order.orderId}: ` +
            `${analysis.totalPrepTime}min prep, confidence ${(analysis.confidence * 100).toFixed(0)}%`,
        );
      }
    } else {
      this.logger.warn(`[${requestId}] KitchenAIConnector not available`);
    }
  }

  /**
   * Analyze order with Kitchen AI and return insights.
   */
  private async analyzeOrderWithAI(order: KDSOrder) {
    if (!this.kitchenAIConnector) {
      return null;
    }

    const requestId = `kds-ai-${Date.now().toString(36)}`;

    try {
      // Full analysis: prep time, routing, station breakdown
      const analysis = await this.kitchenAIConnector.analyzeOrder(order);

      if (analysis) {
        this.logger.log(
          `[${requestId}] AI analysis for order ${order.orderId}: ` +
            `${analysis.totalPrepTime}min total prep, ` +
            `${analysis.itemPredictions.length} item predictions, ` +
            `routing: ${JSON.stringify(analysis.routing)}`,
        );

        // Get fire suggestions for optimal cooking sequence
        const fireSuggestions = await this.kitchenAIConnector.getFireSuggestions(order);

        return {
          ...analysis,
          fireSuggestions: fireSuggestions || [],
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `[${requestId}] Kitchen AI analysis failed for order ${order.orderId}: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get AI insights for a restaurant (for dashboard).
   */
  async getKitchenInsights(restaurantId: string, hours: number = 24): Promise<void> {
    if (!this.kitchenAIConnector) {
      return;
    }

    const insights = await this.kitchenAIConnector.getInsights(restaurantId, hours);

    if (insights) {
      this.server.to(`store:${restaurantId}`).emit('merchant:ai_metrics', {
        restaurantId,
        insights,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private mapOrderToKds(order): Record<string, unknown> {
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    const items = (order.items ?? []).map((item) => ({
      id: item.id,
      name: item.product?.name ?? item.productId,
      quantity: item.quantity,
      price: item.price,
      cookingTime: 15,
      station: 'main',
      status: 'pending' as const,
      allergens: [],
      modifications: [],
    }));

    const estimatedTime = items.length > 0 ? Math.ceil(15 * 1.2) : 15;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: undefined,
      orderType: 'delivery',
      status: PRISMA_TO_KDS_STATUS[order.status] ?? 'new',
      priority: 'normal',
      items,
      totalItems: items.length,
      estimatedTime,
      elapsedTime: elapsedMinutes,
      orderTime: new Date(order.createdAt).toLocaleTimeString(),
      specialInstructions: order.notes ?? undefined,
      allergens: [],
      station: 'mixed',
      createdAt: order.createdAt,
      storeId: order.restaurantId,
    };
  }
}
