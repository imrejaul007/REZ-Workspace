/**
 * Order Service
 *
 * Business logic for order processing
 */

import { Order, IOrder, OrderType, OrderStatus, IOrderItem } from '../models/Order';
import { Menu } from '../models/Menu';
import { logger } from '../config/logger';
import axios from 'axios';

const log = (msg: string, meta?) => logger.info(`[order] ${msg}`, meta);

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4005';

// WhatsApp Service import - will be loaded dynamically to avoid circular dependencies
let restaurantWhatsAppService: typeof import('./RestaurantWhatsAppService').restaurantWhatsAppService | null = null;

async function getWhatsAppService() {
  if (!restaurantWhatsAppService) {
    try {
      const module = await import('./RestaurantWhatsAppService');
      restaurantWhatsAppService = module.restaurantWhatsAppService;
    } catch (error) {
      log('Failed to load WhatsApp service', { error });
      return null;
    }
  }
  return restaurantWhatsAppService;
}

export interface CreateOrderInput {
  restaurantId: string;
  branchId: string;
  userId: string;
  orderType: OrderType;
  items: Array<{
    itemId: string;
    quantity: number;
    customizations?: Array<{ name: string; priceModifier: number }>;
    specialInstructions?: string;
  }>;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  tableId?: string;
  guestCount?: number;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    instructions?: string;
  };
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  items?: Array<{
    itemId: string;
    quantity: number;
    customizations?: Array<{ name: string; priceModifier: number }>;
    specialInstructions?: string;
  }>;
  specialInstructions?: string;
  cancellationReason?: string;
}

export interface OrderFilters {
  restaurantId?: string;
  branchId?: string;
  userId?: string;
  orderType?: OrderType;
  status?: OrderStatus[];
  fromDate?: Date;
  toDate?: Date;
}

/**
 * FIX (security): Generate secure ID using crypto
 */
function generateSecureId(prefix: string, length: number = 4): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, length).toUpperCase();
    return `${prefix}${Date.now().toString(36)}${uuid}`;
  } catch {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, length).toUpperCase()}`;
  }
}

function generateOrderId(): string {
  return generateSecureId('ORD', 4);
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  // FIX (security): Use crypto for random portion
  let random: string;
  try {
    const { randomUUID } = require('crypto');
    random = randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
  } catch {
    random = Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  return `${year}${month}${day}${random}`;
}

class OrderService {
  private taxRate = 0.05; // 5% GST

  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<IOrder> {
    // Fetch menu items for pricing
    const menu = await Menu.findOne({
      restaurantId: input.restaurantId,
      isActive: true,
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    // Build order items with pricing
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const itemInput of input.items) {
      let menuItem: unknown = null;

      // Find item in menu categories
      for (const category of menu.categories) {
        const found = category.items.find(i => i.itemId === itemInput.itemId);
        if (found) {
          menuItem = found;
          break;
        }
      }

      if (!menuItem) {
        throw new Error(`Item not found: ${itemInput.itemId}`);
      }

      if (!menuItem.isAvailable) {
        throw new Error(`Item not available: ${menuItem.name}`);
      }

      const customizationTotal = (itemInput.customizations || []).reduce(
        (sum, c) => sum + c.priceModifier,
        0
      );

      const itemSubtotal = (menuItem.price + customizationTotal) * itemInput.quantity;

      orderItems.push({
        itemId: itemInput.itemId,
        name: menuItem.name,
        quantity: itemInput.quantity,
        unitPrice: menuItem.price,
        customizations: itemInput.customizations,
        specialInstructions: itemInput.specialInstructions,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    // Calculate totals
    const taxAmount = Math.round(subtotal * this.taxRate);
    const deliveryFee = input.orderType === 'delivery' ? 50 : 0; // Default delivery fee
    const packagingFee = input.orderType !== 'dine_in' ? 20 : 0;
    const totalAmount = subtotal + taxAmount + deliveryFee + packagingFee;

    const orderId = generateOrderId();
    const orderNumber = generateOrderNumber();

    const order = new Order({
      orderId,
      orderNumber,
      restaurantId: input.restaurantId,
      branchId: input.branchId,
      userId: input.userId,
      orderType: input.orderType,
      status: 'pending',
      items: orderItems,
      itemCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      taxAmount,
      taxRate: this.taxRate * 100,
      deliveryFee,
      packagingFee,
      discountAmount: 0,
      totalAmount,
      currency: 'INR',
      paymentStatus: 'pending',
      tableId: input.tableId,
      guestCount: input.guestCount,
      deliveryAddress: input.deliveryAddress,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      specialInstructions: input.specialInstructions,
      orderedAt: new Date(),
      source: 'app',
    });

    await order.save();
    log('Order created', { orderId, orderNumber, restaurantId: input.restaurantId });

    // Emit event to REZ Mind
    this.emitOrderEvent('order_created', order);

    // Send WhatsApp notification (async, non-blocking)
    this.sendOrderWhatsAppNotification(order).catch((err) => {
      log('Failed to send WhatsApp notification', { error: err.message });
    });

    return order;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<IOrder | null> {
    return Order.findOne({ orderId });
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
    return Order.findOne({ orderNumber });
  }

  /**
   * Get orders with filters
   */
  async getOrders(filters: OrderFilters, limit = 50, offset = 0): Promise<IOrder[]> {
    const query: unknown = {};

    if (filters.restaurantId) query.restaurantId = filters.restaurantId;
    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.orderType) query.orderType = filters.orderType;
    if (filters.status && filters.status.length > 0) query.status = { $in: filters.status };

    if (filters.fromDate || filters.toDate) {
      query.orderedAt = {};
      if (filters.fromDate) query.orderedAt.$gte = filters.fromDate;
      if (filters.toDate) query.orderedAt.$lte = filters.toDate;
    }

    return Order.find(query)
      .sort({ orderedAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, input: UpdateOrderInput): Promise<IOrder | null> {
    const order = await Order.findOne({ orderId });
    if (!order) return null;

    if (input.status) {
      order.status = input.status;

      // Set timestamps
      switch (input.status) {
        case 'confirmed':
          order.confirmedAt = new Date();
          break;
        case 'preparing':
          order.preparingAt = new Date();
          break;
        case 'ready':
          order.readyAt = new Date();
          break;
        case 'served':
          order.servedAt = new Date();
          break;
        case 'completed':
          order.completedAt = new Date();
          break;
        case 'cancelled':
          order.cancelledAt = new Date();
          order.cancellationReason = input.cancellationReason;
          break;
      }
    }

    if (input.specialInstructions) {
      order.specialInstructions = input.specialInstructions;
    }

    await order.save();
    log('Order updated', { orderId, status: input.status });

    // Emit event to REZ Mind
    this.emitOrderEvent(`order_${input.status || 'updated'}`, order);

    // Send WhatsApp notification for status changes (async, non-blocking)
    if (input.status) {
      this.sendOrderStatusWhatsAppNotification(order, input.status).catch((err) => {
        log('Failed to send order status WhatsApp notification', { error: err.message });
      });
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
    return this.updateOrder(orderId, { status });
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<IOrder | null> {
    const order = await Order.findOne({ orderId });

    if (!order) return null;

    if (['completed', 'cancelled'].includes(order.status)) {
      throw new Error('Order cannot be cancelled');
    }

    return this.updateOrder(orderId, { status: 'cancelled', cancellationReason: reason });
  }

  /**
   * Get orders for user
   */
  async getUserOrders(userId: string, limit = 20): Promise<IOrder[]> {
    return Order.find({ userId })
      .sort({ orderedAt: -1 })
      .limit(limit);
  }

  /**
   * Get active orders for branch
   */
  async getActiveOrders(branchId: string): Promise<IOrder[]> {
    return Order.find({
      branchId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
    }).sort({ orderedAt: 1 });
  }

  /**
   * Get order statistics
   */
  async getOrderStats(branchId: string, date: Date): Promise<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      branchId,
      orderedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length
          : 0,
    };
  }

  /**
   * Emit order event to REZ Mind
   */
  private async emitOrderEvent(eventType: string, order: IOrder): Promise<void> {
    try {
      await axios.post(
        `${REZ_MIND_URL}/v1/events`,
        {
          eventType,
          source: 'restaurant',
          userId: order.userId,
          data: {
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            restaurantId: order.restaurantId,
            branchId: order.branchId,
            orderType: order.orderType,
            status: order.status,
            totalAmount: order.totalAmount,
            itemCount: order.itemCount,
          },
          timestamp: new Date(),
        },
        { timeout: 3000 }
      );
    } catch (error) {
      log('Failed to emit order event to REZ Mind', { error });
    }
  }

  /**
   * Get AI recommendations for user
   */
  async getRecommendations(
    userId: string,
    restaurantId: string
  ): Promise<string[]> {
    try {
      const response = await axios.post(
        `${REZ_MIND_URL}/v1/recommendations/order-items`,
        { userId, restaurantId },
        { timeout: 5000 }
      );

      return response.data.recommendations || [];
    } catch (error) {
      log('Failed to get recommendations from REZ Mind', { error });
      return [];
    }
  }

  // =========================================================================
  // WhatsApp Notification Methods
  // =========================================================================

  /**
   * Send WhatsApp notification for new order
   */
  private async sendOrderWhatsAppNotification(order: IOrder): Promise<void> {
    const whatsAppService = await getWhatsAppService();
    if (!whatsAppService) {
      log('WhatsApp service not available for order confirmation');
      return;
    }

    // Check if customer has WhatsApp notifications enabled
    // This would typically come from customer preferences in CRM service
    const restaurantOrder = this.transformOrderForWhatsApp(order);
    const result = await whatsAppService.sendOrderConfirmation(restaurantOrder);

    if (result.success) {
      log('WhatsApp confirmation sent', { orderId: order.orderId, messageId: result.messageId });
    } else {
      log('WhatsApp confirmation failed', { orderId: order.orderId, error: result.error });
    }
  }

  /**
   * Send WhatsApp notification for order status change
   */
  private async sendOrderStatusWhatsAppNotification(order: IOrder, newStatus: string): Promise<void> {
    const whatsAppService = await getWhatsAppService();
    if (!whatsAppService) {
      log('WhatsApp service not available for order status update');
      return;
    }

    // Map order status to WhatsApp notification
    const notifyStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!notifyStatuses.includes(newStatus)) {
      return;
    }

    const restaurantOrder = this.transformOrderForWhatsApp(order);
    const previousStatus = this.getPreviousStatus(newStatus);

    const result = await whatsAppService.sendOrderStatusUpdate(
      restaurantOrder,
      previousStatus,
      newStatus as any
    );

    if (result.success) {
      log('WhatsApp status update sent', {
        orderId: order.orderId,
        status: newStatus,
        messageId: result.messageId,
      });
    } else {
      log('WhatsApp status update failed', { orderId: order.orderId, status: newStatus, error: result.error });
    }
  }

  /**
   * Transform IOrder to RestaurantOrder for WhatsApp service
   */
  private transformOrderForWhatsApp(order: IOrder): import('./RestaurantWhatsAppService').RestaurantOrder {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerName: order.customerName || 'Valued Customer',
      customerPhone: order.customerPhone,
      restaurantName: 'Your Restaurant', // Would come from restaurant service
      branchName: undefined,
      orderType: order.orderType,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations?.map((c) => c.name),
      })),
      itemCount: order.itemCount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      estimatedReadyTime: undefined,
      createdAt: order.orderedAt,
    };
  }

  /**
   * Get previous status for notification context
   */
  private getPreviousStatus(currentStatus: string): 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' {
    const statusFlow: Record<string, string> = {
      confirmed: 'pending',
      preparing: 'confirmed',
      ready: 'preparing',
      out_for_delivery: 'ready',
      delivered: 'out_for_delivery',
      cancelled: 'confirmed',
    };
    return (statusFlow[currentStatus] || 'pending') as any;
  }
}

export const orderService = new OrderService();
