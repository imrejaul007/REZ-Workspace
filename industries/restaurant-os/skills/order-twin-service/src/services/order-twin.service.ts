import { v4 as uuidv4 } from 'uuid';
import { OrderTwin } from '../models/order-twin.model';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
  AddItemsRequest,
  AddItemsResponse,
  UpdateItemStatusRequest,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  ListOrdersRequest,
  ListOrdersResponse,
  OrderAnalytics,
  OrderStatus,
  OrderType,
  ItemStatus,
  PaymentStatus,
  defaultTiming
} from '../schemas/order-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { rezPOSClient } from '../utils/rez-pos-client';
import { rezKDSClient } from '../utils/rez-kds-client';
import { rezInventoryClient } from '../utils/rez-inventory-client';

export class OrderTwinService {
  private generateOrderNumber(restaurantId: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${dateStr}-${random}`;
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const orderId = uuidv4();
    const twinId = `twin.restaurant.order.${orderId}`;
    const orderNumber = this.generateOrderNumber(request.restaurantId);

    logger.info('Creating Order Twin', { orderId, restaurantId: request.restaurantId });

    const existingTwin = await OrderTwin.findByOrderId(orderId);
    if (existingTwin) {
      throw new Error(`Order Twin already exists for orderId: ${orderId}`);
    }

    // Calculate subtotal
    const subtotal = request.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );

    const orderTwin = new OrderTwin({
      twinId,
      orderId,
      restaurantId: request.restaurantId,
      orderNumber,
      orderType: request.orderType,
      source: request.source,
      status: OrderStatus.RECEIVED,
      tableId: request.tableId,
      customerId: request.customerId,
      items: request.items.map(item => ({
        ...item,
        modifiers: item.modifiers || [],
        status: ItemStatus.PENDING
      })),
      subtotal,
      tax: Math.round(subtotal * 0.05 * 100) / 100, // 5% GST
      discount: 0,
      total: subtotal + Math.round(subtotal * 0.05 * 100) / 100,
      timing: defaultTiming,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethods: [],
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0,
      notes: request.notes,
      priority: request.priority || 'normal'
    });

    await orderTwin.save();

    // Publish order created event
    await messageBroker.publish('restaurant.order.created', {
      twinId,
      orderId,
      orderNumber,
      restaurantId: request.restaurantId,
      tableId: request.tableId,
      items: request.items,
      priority: request.priority,
      twinOsEntityId: twinId,
      timestamp: new Date().toISOString()
    });

    // Route to KDS
    await rezKDSClient.routeOrder(orderId, request.items);

    logger.info('Order Twin created successfully', { twinId, orderId, orderNumber });

    return {
      twinId,
      orderId,
      orderNumber,
      twinOsEntityId: twinId,
      status: OrderStatus.RECEIVED,
      createdAt: orderTwin.createdAt.toISOString()
    };
  }

  async getOrder(orderId: string): Promise<GetOrderResponse> {
    logger.info('Fetching Order Twin', { orderId });

    const orderTwin = await OrderTwin.findByOrderId(orderId);
    if (!orderTwin) {
      throw new Error(`Order Twin not found for orderId: ${orderId}`);
    }

    return orderTwin.toJSON() as GetOrderResponse;
  }

  async updateOrderStatus(
    orderId: string,
    request: UpdateOrderStatusRequest
  ): Promise<UpdateOrderStatusResponse> {
    logger.info('Updating Order Twin status', { orderId, status: request.status });

    const orderTwin = await OrderTwin.findByOrderId(orderId);
    if (!orderTwin) {
      throw new Error(`Order Twin not found for orderId: ${orderId}`);
    }

    const previousStatus = orderTwin.status;
    orderTwin.status = request.status;

    // Update timing based on status
    const now = new Date().toISOString();
    switch (request.status) {
      case OrderStatus.CONFIRMED:
        orderTwin.timing.confirmedAt = now;
        break;
      case OrderStatus.PREPARING:
        orderTwin.timing.startedAt = now;
        // Update all items to preparing
        orderTwin.items.forEach(item => {
          item.status = ItemStatus.PREPARING;
          item.startedAt = now;
        });
        break;
      case OrderStatus.READY:
        orderTwin.timing.readyAt = now;
        // Update all items to ready
        orderTwin.items.forEach(item => {
          item.status = ItemStatus.READY;
          item.completedAt = now;
        });
        break;
      case OrderStatus.SERVED:
        orderTwin.timing.servedAt = now;
        // Update all items to served
        orderTwin.items.forEach(item => {
          item.status = ItemStatus.SERVED;
        });
        break;
      case OrderStatus.COMPLETED:
        orderTwin.timing.completedAt = now;
        // Deduct inventory
        await this.deductInventory(orderTwin);
        // Calculate loyalty points
        await this.calculateLoyaltyPoints(orderTwin);
        break;
      case OrderStatus.CANCELLED:
        orderTwin.timing.cancelledAt = now;
        break;
    }

    await orderTwin.save();

    // Publish status change event
    await messageBroker.publish('restaurant.order.status.changed', {
      twinId: orderTwin.twinId,
      orderId,
      previousStatus,
      newStatus: request.status,
      reason: request.reason,
      timestamp: now
    });

    // Notify POS
    await rezPOSClient.updateOrderStatus(orderId, request.status);

    logger.info('Order Twin status updated', { twinId: orderTwin.twinId, orderId });

    return {
      twinId: orderTwin.twinId,
      orderId,
      status: request.status,
      timing: orderTwin.timing,
      updatedAt: orderTwin.updatedAt.toISOString()
    };
  }

  async addItems(orderId: string, request: AddItemsRequest): Promise<AddItemsResponse> {
    logger.info('Adding items to Order Twin', { orderId, itemCount: request.items.length });

    const orderTwin = await OrderTwin.findByOrderId(orderId);
    if (!orderTwin) {
      throw new Error(`Order Twin not found for orderId: ${orderId}`);
    }

    if (orderTwin.status === OrderStatus.COMPLETED || orderTwin.status === OrderStatus.CANCELLED) {
      throw new Error(`Cannot add items to order with status: ${orderTwin.status}`);
    }

    const newItems = request.items.map(item => ({
      ...item,
      modifiers: item.modifiers || [],
      status: ItemStatus.PENDING
    }));

    orderTwin.items.push(...newItems);
    orderTwin.calculateTotals();
    await orderTwin.save();

    // Publish items added event
    await messageBroker.publish('restaurant.order.items.added', {
      twinId: orderTwin.twinId,
      orderId,
      items: newItems,
      timestamp: new Date().toISOString()
    });

    // Route new items to KDS
    await rezKDSClient.routeOrder(orderId, newItems);

    logger.info('Items added to Order Twin', { twinId: orderTwin.twinId, orderId });

    return {
      twinId: orderTwin.twinId,
      orderId,
      items: orderTwin.items,
      subtotal: orderTwin.subtotal,
      total: orderTwin.total,
      updatedAt: orderTwin.updatedAt.toISOString()
    };
  }

  async updateItemStatus(orderId: string, request: UpdateItemStatusRequest): Promise<void> {
    logger.info('Updating item status', { orderId, menuItemId: request.menuItemId, status: request.status });

    const orderTwin = await OrderTwin.findByOrderId(orderId);
    if (!orderTwin) {
      throw new Error(`Order Twin not found for orderId: ${orderId}`);
    }

    const item = orderTwin.items.find(i => i.menuItemId === request.menuItemId);
    if (!item) {
      throw new Error(`Item not found: ${request.menuItemId}`);
    }

    item.status = request.status;
    if (request.status === ItemStatus.PREPARING) {
      item.startedAt = new Date().toISOString();
    } else if (request.status === ItemStatus.READY || request.status === ItemStatus.SERVED) {
      item.completedAt = new Date().toISOString();
    }

    await orderTwin.save();

    await messageBroker.publish('restaurant.order.item.status.changed', {
      twinId: orderTwin.twinId,
      orderId,
      menuItemId: request.menuItemId,
      status: request.status,
      timestamp: new Date().toISOString()
    });
  }

  async processPayment(orderId: string, request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    logger.info('Processing payment', { orderId, method: request.paymentMethod, amount: request.amount });

    const orderTwin = await OrderTwin.findByOrderId(orderId);
    if (!orderTwin) {
      throw new Error(`Order Twin not found for orderId: ${orderId}`);
    }

    orderTwin.paymentMethods.push({
      method: request.paymentMethod,
      amount: request.amount,
      transactionId: request.transactionId
    });

    const totalPaid = orderTwin.getTotalPaid();
    const remainingBalance = orderTwin.getRemainingBalance();

    if (remainingBalance <= 0) {
      orderTwin.paymentStatus = PaymentStatus.PAID;
    } else if (totalPaid > 0) {
      orderTwin.paymentStatus = PaymentStatus.PARTIAL;
    }

    await orderTwin.save();

    // Publish payment event
    await messageBroker.publish('restaurant.order.payment.processed', {
      twinId: orderTwin.twinId,
      orderId,
      paymentMethod: request.paymentMethod,
      amount: request.amount,
      totalPaid,
      remainingBalance,
      paymentStatus: orderTwin.paymentStatus,
      timestamp: new Date().toISOString()
    });

    logger.info('Payment processed', { twinId: orderTwin.twinId, orderId, totalPaid, remainingBalance });

    return {
      twinId: orderTwin.twinId,
      orderId,
      paymentStatus: orderTwin.paymentStatus,
      paymentMethods: orderTwin.paymentMethods,
      totalPaid,
      remainingBalance,
      updatedAt: orderTwin.updatedAt.toISOString()
    };
  }

  async listOrders(request: ListOrdersRequest): Promise<ListOrdersResponse> {
    logger.info('Listing Order Twins', { request });

    const limit = request.limit || 50;
    const offset = request.offset || 0;

    let query: Record<string, unknown> = { restaurantId: request.restaurantId };

    if (request.status) {
      query.status = request.status;
    }
    if (request.orderType) {
      query.orderType = request.orderType;
    }
    if (request.tableId) {
      query.tableId = request.tableId;
    }
    if (request.customerId) {
      query.customerId = request.customerId;
    }
    if (request.date) {
      const startOfDay = new Date(request.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(request.date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() };
    }

    const [orders, total, totalAmountResult] = await Promise.all([
      OrderTwin.find(query).skip(offset).limit(limit).sort({ createdAt: -1 }),
      OrderTwin.countDocuments(query),
      OrderTwin.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    return {
      orders: orders.map(o => o.toJSON() as any),
      total,
      totalAmount: totalAmountResult[0]?.total || 0
    };
  }

  async getOrderAnalytics(restaurantId: string, date?: string): Promise<OrderAnalytics> {
    logger.info('Getting order analytics', { restaurantId, date });

    let dateFilter: Record<string, unknown> = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() } };
    }

    const query = { restaurantId, ...dateFilter };

    const [orders, completedCount, cancelledCount, topItems] = await Promise.all([
      OrderTwin.find(query),
      OrderTwin.countDocuments({ ...query, status: OrderStatus.COMPLETED }),
      OrderTwin.countDocuments({ ...query, status: OrderStatus.CANCELLED }),
      OrderTwin.aggregate([
        { $match: { restaurantId, ...dateFilter } },
        { $unwind: '$items' },
        { $group: { _id: { menuItemId: '$items.menuItemId', name: '$items.name' }, count: { $sum: '$items.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status === OrderStatus.COMPLETED)
      .reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate average prep time
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED && o.timing.startedAt && o.timing.readyAt);
    const averagePrepTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          const start = new Date(o.timing.startedAt!).getTime();
          const ready = new Date(o.timing.readyAt!).getTime();
          return sum + (ready - start) / 60000;
        }, 0) / completedOrders.length
      : 0;

    return {
      totalOrders,
      completedOrders: completedCount,
      cancelledOrders: cancelledCount,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      averagePrepTime: Math.round(averagePrepTime),
      totalRevenue,
      topItems: topItems.map(t => ({
        menuItemId: t._id.menuItemId,
        name: t._id.name,
        count: t.count
      }))
    };
  }

  private async deductInventory(orderTwin: any): Promise<void> {
    try {
      await rezInventoryClient.deductForOrder(orderTwin.orderId, orderTwin.items);
    } catch (error) {
      logger.warn('Failed to deduct inventory', { orderId: orderTwin.orderId, error: (error as Error).message });
    }
  }

  private async calculateLoyaltyPoints(orderTwin: any): Promise<void> {
    if (orderTwin.customerId) {
      const points = Math.floor(orderTwin.total);
      orderTwin.loyaltyPointsEarned = points;
      await orderTwin.save();
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    logger.info('Deleting Order Twin', { orderId });

    const result = await OrderTwin.deleteOne({ orderId });
    if (result.deletedCount === 0) {
      throw new Error(`Order Twin not found for orderId: ${orderId}`);
    }

    await messageBroker.publish('restaurant.order.deleted', {
      orderId,
      timestamp: new Date().toISOString()
    });

    logger.info('Order Twin deleted', { orderId });
  }
}

export const orderTwinService = new OrderTwinService();
