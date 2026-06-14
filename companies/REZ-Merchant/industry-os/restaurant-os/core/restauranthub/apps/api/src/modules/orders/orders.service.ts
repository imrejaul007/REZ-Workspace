import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderQueryDto } from './dto/update-order.dto';
import { KdsGateway } from '../kds/kds.gateway';
import { InventoryService } from '../inventory/inventory.service';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';
import { track } from '../../services/intentCapture.service';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { RetryQueueService } from '../retry-queue/retry-queue.service';
import { ProcurementService } from '../procurement/procurement.service';

// REZ Revenue AI Integration
const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

/** Map controller status strings (lowercase) to Prisma OrderStatus enum (UPPERCASE) */
const STATUS_MAP: Record<string, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  processing: 'PROCESSING',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED',
  // aliases from DTO
  ready: 'PROCESSING',
  dispatched: 'SHIPPED',
  returned: 'REFUNDED',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly rezBackendUrl = process.env.REZ_BACKEND_URL || 'http://localhost:4000';
  private readonly webhookSecret = process.env.REZ_WEBHOOK_SECRET;
  private readonly isOfflineQueueEnabled = process.env.OFFLINE_QUEUE_ENABLED !== 'false'; // Default enabled

  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => KdsGateway)) private readonly kdsGateway?: KdsGateway,
    @Optional() private readonly inventoryService?: InventoryService,
    @Optional() private readonly offlineQueueService?: OfflineQueueService,
    @Optional() private readonly retryQueueService?: RetryQueueService,
    @Optional() private readonly procurementService?: ProcurementService,
  ) {
    if (!this.webhookSecret) {
      this.logger.warn('⚠️  REZ_WEBHOOK_SECRET is not configured. Webhook sending is disabled.');
    }
    if (!this.offlineQueueService) {
      this.logger.warn('⚠️  OfflineQueueService not available. Orders will not be queued when network fails.');
    }
    if (!this.retryQueueService) {
      this.logger.warn('⚠️  RetryQueueService not available. Retries will use setTimeout (not production-ready).');
    }
    if (!this.procurementService) {
      this.logger.warn('⚠️  ProcurementService not available. Low stock alerts will not create procurement requests.');
    }
  }

  // ============================================================
  // REZ REVENUE AI - DYNAMIC PRICING
  // ============================================================

  /**
   * Get dynamic price from REZ Revenue AI
   */
  private async getDynamicPrice(params: {
    productId: string;
    productName: string;
    category: string;
    basePrice: number;
    cost: number;
    restaurantId: string;
    customerId?: string;
    customerSegment?: string;
  }): Promise<{ dynamicPrice: number; adjustment: number; factors: any[] }> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/pricing/calculate`,
        {
          context: {
            entity: {
              id: params.productId,
              type: 'product',
              category: params.category,
              vertical: 'restaurant',
              name: params.productName,
              basePrice: params.basePrice,
              cost: params.cost,
            },
            time: {
              dayOfWeek: new Date().getDay(),
              hourOfDay: new Date().getHours(),
              isPeakHour: this.isPeakHour(new Date()),
              isWeekend: this.isWeekend(new Date()),
            },
            audience: params.customerId ? {
              segment: params.customerSegment || 'regular',
            } : undefined,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        return {
          dynamicPrice: response.data.data.finalPrice,
          adjustment: response.data.data.adjustment,
          factors: response.data.data.factors || [],
        };
      }
    } catch (error) {
      this.logger.warn('[RevenueAI] Dynamic pricing failed, using base price');
    }

    // Fallback to base price
    return {
      dynamicPrice: params.basePrice,
      adjustment: 0,
      factors: [],
    };
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }

  private isWeekend(time: Date): boolean {
    const day = time.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Credit cashback to customer wallet
   */
  private async creditCashback(params: {
    userId: string;
    amount: number;
    reason: string;
    restaurantId: string;
    orderId: string;
  }): Promise<{ success: boolean; transactionId?: string }> {
    // Skip if amount is 0 or negative
    if (params.amount <= 0) {
      return { success: false };
    }

    try {
      // Call REZ Revenue AI gateway which handles RABTUL wallet
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/rabtul/wallet/credit`,
        {
          userId: params.userId,
          amount: params.amount,
          type: 'cashback',
          reason: params.reason,
          metadata: {
            restaurantId: params.restaurantId,
            orderId: params.orderId,
            source: 'restaurant_hub_dynamic_pricing',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.data.transactionId,
        };
      }
    } catch (error) {
      this.logger.error('[RevenueAI] Cashback credit failed', error);
    }

    return { success: false };
  }

  /**
   * Get demand forecast for staffing recommendations
   */
  async getDemandForecast(restaurantId: string): Promise<{
    peakHour: number;
    avgDemand: number;
    peakDay: string;
    staffingRecommendation: { morning: number; evening: number };
  }> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/forecast`,
        {
          merchantId: restaurantId,
          vertical: 'restaurant',
          category: 'general',
          location: {},
          horizon: 'week',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          peakHour: data.forecasts?.[0]?.peakHour || 19,
          avgDemand: data.summary?.avgDailyDemand || 60,
          peakDay: data.summary?.peakDay || 'Saturday',
          staffingRecommendation: {
            morning: Math.ceil((data.forecasts?.[0]?.totalDemand || 60) / 20),
            evening: Math.ceil((data.forecasts?.[0]?.totalDemand || 60) / 10),
          },
        };
      }
    } catch (error) {
      this.logger.warn('[RevenueAI] Forecast failed');
    }

    return {
      peakHour: 19,
      avgDemand: 60,
      peakDay: 'Saturday',
      staffingRecommendation: { morning: 4, evening: 7 },
    };
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<unknown> {
    const requestId = uuidv4();
    try {
      this.logger.log(`[${requestId}] Creating order for restaurant ${createOrderDto.restaurantId}`);

      // Check for idempotent duplicate
      if (createOrderDto.idempotencyKey) {
        const existingOrder = await this.prisma.order.findFirst({
          where: { idempotencyKey: createOrderDto.idempotencyKey },
          include: { items: true },
        });
        if (existingOrder) {
          this.logger.log(`[${requestId}] Idempotent duplicate detected, returning existing order`);
          return {
            success: true,
            order: {
              id: existingOrder.id,
              orderNumber: existingOrder.orderNumber,
              status: existingOrder.status,
              total: existingOrder.totalAmount,
              items: existingOrder.items || [],
              createdAt: existingOrder.createdAt,
            },
          };
        }
      }

      const { subtotal, gstAmount, totalAmount, items: validatedItems, dynamicPricing } =
        await this.validateAndCalculateTotals(createOrderDto.items);

      // Validate total order amount (max 1 million INR per order)
      const maxOrderAmount = 1000000;
      if (totalAmount > maxOrderAmount) {
        throw new BadRequestException(`Order total (₹${totalAmount}) exceeds maximum allowed amount (₹${maxOrderAmount})`);
      }

      const orderNumber = this.generateOrderNumber();

      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          restaurantId: createOrderDto.restaurantId,
          status: 'PENDING',
          subtotal,
          gstAmount,
          totalAmount,
          discountAmount: createOrderDto.discountAmount || 0,
          creditUsed: createOrderDto.creditUsed || 0,
          paymentMethod: createOrderDto.paymentMethod,
          paymentStatus: 'PENDING',
          notes: createOrderDto.specialInstructions,
          shippingAddress: (createOrderDto.deliveryAddress as unknown) ?? undefined,
          idempotencyKey: createOrderDto.idempotencyKey,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              gstAmount: Math.round(item.price * item.quantity * 0.18 * 100) / 100,
              totalAmount: Math.round(item.price * item.quantity * 1.18 * 100) / 100,
            })),
          },
        },
        include: { items: true },
      });

      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          notes: 'Order placed',
        },
      });

      this.sendToRezBackend(order, createOrderDto).catch((err) =>
        this.logger.warn(`[${requestId}] REZ integration failed: ${err?.message}`),
      );

      // Notify all KDS displays watching this restaurant
      if (this.kdsGateway && order.items && order.items.length > 0) {
        const kdsPayload = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderType: 'delivery',
          items: order.items.map((item) => ({
            id: item.id,
            name: item.productId, // product name not stored on OrderItem; KDS display can enrich
            quantity: item.quantity,
            price: item.price,
            cookingTime: 15,
            station: 'main',
            allergens: [],
            modifications: [],
          })),
          specialInstructions: createOrderDto.specialInstructions ?? null,
          storeId: createOrderDto.restaurantId,
        };

        // Try to notify KDS with retry logic
        try {
          this.kdsGateway.notifyNewOrder(createOrderDto.restaurantId, kdsPayload);
          this.logger.log(`[${requestId}] KDS notified for order ${order.orderNumber}`);
        } catch (kdsError) {
          this.logger.error(`[${requestId}] KDS notification failed: ${(kdsError as Error)?.message}`);
          // Queue for retry - orders must reach the kitchen
          this.queueKDSRetry(createOrderDto.restaurantId, kdsPayload, requestId);
        }
      }

      // ============================================================
      // INTEGRATION: Deduct inventory on order creation
      // ============================================================
      if (this.inventoryService && validatedItems.length > 0) {
        const inventoryItems = validatedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        // Fire-and-forget: Don't block order response for inventory
        this.inventoryService.deductInventory({
          restaurantId: createOrderDto.restaurantId,
          items: inventoryItems,
          orderId: order.id,
          orderNumber: order.orderNumber,
        }).then((result) => {
          if (result.success) {
            this.logger.log(`[${requestId}] Inventory deducted for order ${order.orderNumber}: ${result.deducted.length} items`);
          }
          // Alert for low stock and create procurement request
          if (result.lowStockAlerts.length > 0) {
            this.logger.warn(`[${requestId}] Low stock alerts: ${JSON.stringify(result.lowStockAlerts)}`);

            // Queue low stock alert via RetryQueue (production)
            if (this.retryQueueService) {
              this.retryQueueService.enqueueLowStockAlert(
                createOrderDto.restaurantId,
                result.lowStockAlerts.map(alert => ({
                  ingredientId: alert.productId,
                  ingredientName: alert.productId,
                  shortage: Math.max(0, alert.minStock - alert.currentStock),
                }))
              ).catch(err => this.logger.error(`[${requestId}] Failed to enqueue low stock alert: ${err?.message}`));
            }

            // Create procurement request via NexaBizz (production)
            if (this.procurementService) {
              this.procurementService.checkAndCreateProcurement(
                createOrderDto.restaurantId,
                result.lowStockAlerts
              ).then(procurementResult => {
                if (procurementResult.success) {
                  this.logger.log(`[${requestId}] Procurement request created: ${procurementResult.rfqId || 'queued'}`);
                }
              }).catch(err => this.logger.error(`[${requestId}] Procurement failed: ${err?.message}`));
            }
          }
        }).catch((err) => {
          this.logger.error(`[${requestId}] Inventory deduction failed: ${err?.message}`);
          // Inventory failure should NOT fail the order - log for manual review
          this.logger.warn(`[${requestId}] Manual inventory adjustment needed for order ${order.orderNumber}`);
        });
      }

      // RTMN Commerce Memory: Capture order placed intent (non-blocking)
      track({
        userId: createOrderDto.customerId,
        event: 'order_placed',
        intentKey: `restaurant_${createOrderDto.restaurantId}`,
        properties: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          itemCount: validatedItems.length,
          fulfillmentType: createOrderDto.fulfillmentType,
          paymentMethod: createOrderDto.paymentMethod,
        },
      });

      // ============================================================
      // INTEGRATION: Credit cashback to customer wallet
      // ============================================================
      if (createOrderDto.customerId && dynamicPricing?.cashback?.amount > 0) {
        const cashbackAmount = dynamicPricing.cashback.amount;
        const cashbackReason = validatedItems.dynamicPricing.cashback.reason || 'Loyalty reward';

        // Fire-and-forget: Don't block order response for cashback
        this.creditCashback({
          userId: createOrderDto.customerId,
          amount: cashbackAmount,
          reason: cashbackReason,
          restaurantId: createOrderDto.restaurantId,
          orderId: order.id,
        }).then((result) => {
          if (result.success) {
            this.logger.log(`[${requestId}] Cashback credited: ₹${cashbackAmount} to user ${createOrderDto.customerId}`);
          }
        }).catch((err) => {
          this.logger.error(`[${requestId}] Cashback credit failed: ${err?.message}`);
          // Queue for retry via background job
          this.queueCashbackRetry(createOrderDto.customerId, cashbackAmount, cashbackReason, createOrderDto.restaurantId, order.id);
        });
      }

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.totalAmount,
          items: order.items || [],
          createdAt: order.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`[${requestId}] Failed to create order`, { error: (error as unknown).message });
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async getOrders(restaurantId: string, query: OrderQueryDto): Promise<unknown> {
    try {
      const skip = (query.page - 1) * query.limit;
      const where: unknown = { restaurantId };
      if (query.status) {
        where.status = STATUS_MAP[query.status] ?? query.status.toUpperCase();
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: { items: true, statusHistory: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        success: true,
        data: orders,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch orders:', error);
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async getOrderById(orderId: string, restaurantId: string): Promise<unknown> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, restaurantId },
        include: { items: true, statusHistory: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      return { success: true, order };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to fetch order:', error);
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  async updateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto, restaurantId: string): Promise<unknown> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, restaurantId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const newStatus = STATUS_MAP[updateDto.status] ?? updateDto.status.toUpperCase();
      if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${newStatus}`,
        );
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus as unknown },
        include: { items: true },
      });

      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus as unknown,
          notes: updateDto.notes || `Status changed to ${newStatus}`,
        },
      });

      this.notifyRezStatusChange(orderId, newStatus).catch((err) =>
        this.logger.warn(`REZ status notification failed: ${err?.message}`),
      );

      return {
        success: true,
        message: `Order status updated to ${newStatus}`,
        order: updatedOrder,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error('Failed to update order status:', error);
      throw new InternalServerErrorException('Failed to update order status');
    }
  }

  private async validateAndCalculateTotals(items: OrderItemDto[], restaurantId?: string) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Get menu items for category info
    const productIds = items.map(i => i.productId).filter(Boolean);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const validatedItems: Array<OrderItemDto & { dynamicPrice?: number; pricingFactors?: any[] }> = [];

    for (const item of items) {
      // Ensure quantity is a positive integer
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException(`Invalid item: ${item.productName} (quantity must be a positive integer)`);
      }
      if (item.price <= 0 || !Number.isFinite(item.price)) {
        throw new BadRequestException(`Invalid item: ${item.productName} (price must be a positive number)`);
      }

      // Get dynamic pricing from REZ Revenue AI
      const menuItem = menuItems.find(m => m.id === item.productId);
      let dynamicPrice = item.price;
      let pricingFactors: any[] = [];
      let adjustment = 0;

      if (restaurantId) {
        try {
          const dynamicPricing = await this.getDynamicPrice({
            productId: item.productId,
            productName: item.productName || 'Item',
            category: menuItem?.category || 'general',
            basePrice: item.price,
            cost: menuItem?.costPrice || item.price * 0.4,
            restaurantId,
          });
          dynamicPrice = dynamicPricing.dynamicPrice;
          pricingFactors = dynamicPricing.factors;
          adjustment = dynamicPricing.adjustment;
        } catch (e) {
          this.logger.warn(`[${item.productId}] Dynamic pricing failed, using base price`);
        }
      }

      subtotal += dynamicPrice * item.quantity;
      validatedItems.push({
        ...item,
        dynamicPrice,
        pricingFactors,
        adjustment,
      });
    }

    // Calculate cashback
    const cashbackRate = this.calculateCashbackRate();
    const cashbackAmount = Math.round(subtotal * cashbackRate);

    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const totalAmount = subtotal + gstAmount;

    return {
      subtotal,
      gstAmount,
      totalAmount,
      items: validatedItems,
      dynamicPricing: {
        applied: validatedItems.some(i => i.adjustment !== 0),
        totalAdjustment: validatedItems.reduce((sum, i) => sum + (i.adjustment || 0), 0),
        cashback: {
          amount: cashbackAmount,
          rate: cashbackRate,
          reason: 'Loyalty reward',
        },
      },
    };
  }

  private calculateCashbackRate(): number {
    // Standard cashback rate - can be customized per merchant
    return 0.05; // 5% cashback
  }

  /**
   * Queue KDS notification for retry
   * Critical: Orders MUST reach the kitchen
   *
   * Uses database-backed retry queue for production reliability.
   */
  private queueKDSRetry(restaurantId: string, kdsPayload: unknown, requestId: string): void {
    const orderId = (kdsPayload as { orderId?: string }).orderId || 'unknown';
    this.logger.warn(`[${requestId}] Queuing KDS retry for order ${orderId}`);

    // Use database-backed retry queue if available (production)
    if (this.retryQueueService) {
      this.retryQueueService.enqueueKDSRetry(restaurantId, kdsPayload as Record<string, unknown>, orderId)
        .then(job => {
          this.logger.log(`[${requestId}] KDS retry job created: ${job.id}`);
        })
        .catch(err => {
          this.logger.error(`[${requestId}] Failed to enqueue KDS retry: ${err?.message}`);
          // Fallback to setTimeout
          this.queueKDSRetryFallback(restaurantId, kdsPayload, requestId);
        });
    } else {
      // Fallback to setTimeout for development
      this.queueKDSRetryFallback(restaurantId, kdsPayload, requestId);
    }
  }

  /**
   * Fallback KDS retry using setTimeout (development only)
   */
  private queueKDSRetryFallback(restaurantId: string, kdsPayload: unknown, requestId: string): void {
    const retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s

    retryDelays.forEach((delay, attempt) => {
      setTimeout(() => {
        if (this.kdsGateway) {
          try {
            this.kdsGateway.notifyNewOrder(restaurantId, kdsPayload as Parameters<typeof this.kdsGateway.notifyNewOrder>[1]);
            this.logger.log(`[${requestId}] KDS retry ${attempt + 1} successful`);
          } catch (retryError) {
            this.logger.error(`[${requestId}] KDS retry ${attempt + 1} failed: ${(retryError as Error)?.message}`);
          }
        }
      }, delay);
    });
  }

  /**
   * Queue cashback credit for retry via background job
   * This ensures cashback is eventually credited even if immediate call fails
   *
   * Uses database-backed retry queue for production reliability.
   */
  private async queueCashbackRetry(
    userId: string,
    amount: number,
    reason: string,
    restaurantId: string,
    orderId: string,
  ): Promise<void> {
    this.logger.warn(
      `[CashbackRetry] User: ${userId}, Amount: ₹${amount}, Order: ${orderId}, Reason: ${reason}`,
    );

    // Use database-backed retry queue if available (production)
    if (this.retryQueueService) {
      try {
        const job = await this.retryQueueService.enqueueCashbackRetry(
          userId, amount, reason, restaurantId, orderId
        );
        this.logger.log(`[CashbackRetry] Job created: ${job.id}`);
        return;
      } catch (error) {
        this.logger.error(`[CashbackRetry] Failed to enqueue: ${error}`);
        // Fall through to fallback
      }
    }

    // Fallback to setTimeout for development
    setTimeout(() => {
      this.creditCashback({
        userId,
        amount,
        reason,
        restaurantId,
        orderId,
      }).catch((err) => {
        this.logger.error(`[CashbackRetry] Delayed retry failed: ${err?.message}`);
      });
    }, 30000); // Retry after 30 seconds
  }

  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const suffix = uuidv4().split('-')[0].toUpperCase();
    return `ORD-${dateStr}-${suffix}`;
  }

  private async sendToRezBackend(order, dto: CreateOrderDto): Promise<void> {
    if (!this.webhookSecret) return;
    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: dto.restaurantId,
      total: order.totalAmount,
      timestamp: new Date().toISOString(),
    };
    const signature = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    await axios.post(`${this.rezBackendUrl}/api/webhooks/restaurant/order-created`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      timeout: 5000,
    });
  }

  private async notifyRezStatusChange(orderId: string, status: string): Promise<void> {
    if (!this.webhookSecret) return;
    const payload = { orderId, status, timestamp: new Date().toISOString() };
    const signature = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    await axios.post(`${this.rezBackendUrl}/api/webhooks/restaurant/order-status-changed`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      timeout: 5000,
    });
  }

  // ============================================================
  // OFFLINE QUEUE INTEGRATION
  // ============================================================

  /**
   * Create order with offline queue support
   *
   * If order creation fails due to network error, the order is
   * automatically queued for later processing.
   *
   * @param createOrderDto - Order data
   * @param options - Options for offline handling
   * @returns Order result or queue status
   */
  async createOrderWithOfflineSupport(
    createOrderDto: CreateOrderDto,
    options: {
      timeoutMs?: number;
      skipQueueOnFailure?: boolean;
      clientOrderId?: string;
    } = {},
  ): Promise<{
    success: boolean;
    order?: unknown;
    queued?: boolean;
    pendingOrderId?: string;
    error?: string;
    source: 'live' | 'queued';
  }> {
    const { timeoutMs = 10000, skipQueueOnFailure = false, clientOrderId } = options;
    const requestId = uuidv4();

    try {
      // Try to create order normally with timeout
      const order = await this.createOrderWithTimeout(createOrderDto, timeoutMs);

      return {
        success: true,
        order,
        source: 'live',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isNetworkError = this.isNetworkError(error);

      this.logger.warn(
        `[${requestId}] Order creation failed: ${errorMessage}. Network error: ${isNetworkError}`,
      );

      // If offline queue is disabled or explicitly skipped, throw error
      if (skipQueueOnFailure || !this.isOfflineQueueEnabled) {
        return {
          success: false,
          error: errorMessage,
          source: 'live',
        };
      }

      // Queue the order for later processing
      if (this.offlineQueueService && (isNetworkError || errorMessage.includes('ECONNREFUSED'))) {
        try {
          const queueResult = await this.offlineQueueService.enqueueOrder(
            createOrderDto,
            createOrderDto.restaurantId,
            createOrderDto.idempotencyKey,
            clientOrderId,
            'pos',
          );

          this.logger.log(
            `[${requestId}] Order queued for offline processing: ${queueResult.pendingOrderId}`,
          );

          return {
            success: true,
            queued: true,
            pendingOrderId: queueResult.pendingOrderId,
            source: 'queued',
          };
        } catch (queueError) {
          this.logger.error(
            `[${requestId}] Failed to queue order: ${queueError instanceof Error ? queueError.message : 'Unknown error'}`,
          );
          return {
            success: false,
            error: `Order creation failed and could not be queued: ${errorMessage}`,
            source: 'live',
          };
        }
      }

      return {
        success: false,
        error: errorMessage,
        source: 'live',
      };
    }
  }

  /**
   * Create order with timeout wrapper
   *
   * @param createOrderDto - Order data
   * @param timeoutMs - Timeout in milliseconds
   * @returns Created order
   */
  private async createOrderWithTimeout(
    createOrderDto: CreateOrderDto,
    timeoutMs: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Order creation timed out'));
      }, timeoutMs);

      this.createOrder(createOrderDto)
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Check if error is a network error
   *
   * @param error - Error to check
   * @returns True if error is network-related
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      // Network errors
      if (!error.response) {
        return true;
      }
      // Server errors (5xx) might indicate connectivity issues
      if (error.response.status >= 500) {
        return true;
      }
    }

    // Check for common network error messages
    const errorMessage = error instanceof Error ? error.message : '';
    const networkErrorPatterns = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'network',
      'fetch',
      'socket',
    ];

    return networkErrorPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  /**
   * Process all pending orders in the offline queue
   *
   * This method is called by the queue service when processing orders.
   * It wraps the createOrder method with proper error handling.
   *
   * @param orderData - Order data to process
   * @returns Result of order creation
   */
  async processQueuedOrder(
    orderData: CreateOrderDto,
  ): Promise<{
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    error?: string;
  }> {
    const requestId = uuidv4();

    try {
      this.logger.log(
        `[${requestId}] Processing queued order for restaurant ${orderData.restaurantId}`,
      );

      const result = await this.createOrder(orderData);

      if (result && typeof result === 'object' && 'order' in result) {
        const orderResult = result as { order: { id: string; orderNumber: string } };
        return {
          success: true,
          orderId: orderResult.order.id,
          orderNumber: orderResult.order.orderNumber,
        };
      }

      return {
        success: false,
        error: 'Unexpected response format from createOrder',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[${requestId}] Failed to process queued order: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the current offline queue status for a restaurant
   *
   * @param restaurantId - Restaurant identifier
   * @returns Queue status
   */
  async getOfflineQueueStatus(restaurantId: string): Promise<{
    pending: number;
    processing: number;
    failed: number;
    total: number;
  }> {
    if (!this.offlineQueueService) {
      return {
        pending: 0,
        processing: 0,
        failed: 0,
        total: 0,
      };
    }

    const status = await this.offlineQueueService.getQueueStatus(restaurantId);
    return {
      pending: status.pending,
      processing: status.processing,
      failed: status.failed,
      total: status.total,
    };
  }
}
