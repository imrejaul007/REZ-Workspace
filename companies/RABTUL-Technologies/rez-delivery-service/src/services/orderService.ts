import { v4 as uuidv4 } from 'uuid';
import DeliveryOrder, { IDeliveryOrder } from '../models/DeliveryOrder';
import aggregatorService from './aggregatorService';
import assignmentService from './assignmentService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

// Order input interfaces
export interface CreateOrderInput {
  source: 'swiggy' | 'zomato' | 'own' | 'website';
  sourceOrderId?: string;
  merchantId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      coordinates?: { lat: number; lng: number };
    };
  };
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  deliveryFee?: number;
  platformFee?: number;
  discount?: number;
  paymentMethod?: 'cash' | 'online' | 'wallet';
  specialInstructions?: string;
}

export interface UpdateStatusInput {
  orderId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  note?: string;
  riderId?: string;
}

class OrderService {
  // Generate unique order ID
  private generateOrderId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split('-')[0].toUpperCase();
    return `RZ${timestamp}${random}`;
  }

  // Calculate estimated delivery time (30-45 mins based on distance)
  // STATISTICAL: non-cryptographic random for mock delivery time simulation
  private calculateEstimatedDelivery(): Date {
    const now = new Date();
    const deliveryMinutes = 30 + Math.floor(Math.random() * 15); // 30-45 mins
    return new Date(now.getTime() + deliveryMinutes * 60 * 1000);
  }

  // Calculate total amount
  private calculateTotalAmount(
    items: CreateOrderInput['items'],
    deliveryFee: number,
    platformFee: number,
    discount: number
  ): number {
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return itemsTotal + deliveryFee + platformFee - discount;
  }

  /**
   * Create a new delivery order
   */
  async createOrder(input: CreateOrderInput): Promise<IDeliveryOrder> {
    try {
      // Validate items
      if (!input.items || input.items.length === 0) {
        throw new AppError('Order must have at least one item', 400);
      }

      // Calculate amounts
      const deliveryFee = input.deliveryFee ?? 0;
      const platformFee = input.platformFee ?? 0;
      const discount = input.discount ?? 0;
      const totalAmount = this.calculateTotalAmount(input.items, deliveryFee, platformFee, discount);

      // Create order
      const order = new DeliveryOrder({
        orderId: this.generateOrderId(),
        source: input.source,
        sourceOrderId: input.sourceOrderId,
        merchantId: input.merchantId,
        customer: {
          ...input.customer,
          address: {
            ...input.customer.address,
            country: input.customer.address.country || 'India'
          }
        },
        items: input.items,
        status: 'pending',
        estimatedDelivery: this.calculateEstimatedDelivery(),
        deliveryFee,
        platformFee,
        discount,
        totalAmount,
        paymentMethod: input.paymentMethod || 'cash',
        paymentStatus: 'pending',
        specialInstructions: input.specialInstructions,
        statusHistory: [{
          status: 'pending',
          timestamp: new Date()
        }]
      });

      await order.save();
      logger.info(`Order created: ${order.orderId}`, { orderId: order.orderId, source: order.source });

      // Sync with aggregator if external source
      if (input.source !== 'own') {
        await aggregatorService.syncOrderToAggregator(order).catch(err => {
          logger.error('Failed to sync order to aggregator', { orderId: order.orderId, error: err.message });
        });
      }

      // Auto-assign rider for ready orders
      if (order.status === 'ready') {
        assignmentService.autoAssignRider(order).catch(err => {
          logger.error('Auto-assignment failed', { orderId: order.orderId, error: err.message });
        });
      }

      return order;
    } catch (error) {
      logger.error('Failed to create order', { error: error.message, input });
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateStatus(input: UpdateStatusInput): Promise<IDeliveryOrder> {
    try {
      const order = await DeliveryOrder.findOne({ orderId: input.orderId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['picked_up', 'cancelled'],
        picked_up: ['delivered'],
        delivered: [],
        cancelled: []
      };

      if (!validTransitions[order.status]?.includes(input.status)) {
        throw new AppError(
          `Invalid status transition from '${order.status}' to '${input.status}'`,
          400
        );
      }

      // Update order
      order.status = input.status;

      if (input.riderId) {
        order.riderId = input.riderId as unknown;
      }

      if (input.note) {
        order.statusHistory.push({
          status: input.status,
          timestamp: new Date(),
          note: input.note
        });
      } else {
        order.statusHistory.push({
          status: input.status,
          timestamp: new Date()
        });
      }

      // Set actual delivery time
      if (input.status === 'delivered') {
        order.actualDelivery = new Date();
        order.paymentStatus = 'paid';
      }

      await order.save();
      logger.info(`Order status updated: ${order.orderId} -> ${input.status}`);

      // Sync with aggregator
      if (order.source !== 'own') {
        await aggregatorService.syncStatusToAggregator(order).catch(err => {
          logger.error('Failed to sync status to aggregator', { orderId: order.orderId, error: err.message });
        });
      }

      // Trigger rider assignment if ready
      if (input.status === 'ready') {
        assignmentService.autoAssignRider(order).catch(err => {
          logger.error('Auto-assignment failed', { orderId: order.orderId, error: err.message });
        });
      }

      return order;
    } catch (error) {
      logger.error('Failed to update order status', { error: error.message, input });
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<IDeliveryOrder | null> {
    return DeliveryOrder.findOne({ orderId })
      .populate('riderId', 'name phone status');
  }

  /**
   * Get order by source order ID
   */
  async getOrderBySourceId(source: string, sourceOrderId: string): Promise<IDeliveryOrder | null> {
    return DeliveryOrder.findOne({ source, sourceOrderId });
  }

  /**
   * Get orders by merchant
   */
  async getOrdersByMerchant(
    merchantId: string,
    options: {
      status?: string;
      limit?: number;
      skip?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ orders: IDeliveryOrder[]; total: number }> {
    const { status, limit = 50, skip = 0, startDate, endDate } = options;

    const query: unknown = { merchantId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [orders, total] = await Promise.all([
      DeliveryOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('riderId', 'name phone'),
      DeliveryOrder.countDocuments(query)
    ]);

    return { orders, total };
  }

  /**
   * Sync order with aggregator (pull latest status)
   */
  async syncWithAggregator(orderId: string): Promise<IDeliveryOrder | null> {
    try {
      const order = await DeliveryOrder.findOne({ orderId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.source === 'own') {
        return order;
      }

      const updatedOrder = await aggregatorService.fetchOrderFromAggregator(order);
      if (updatedOrder) {
        await updatedOrder.save();
        return updatedOrder;
      }

      return order;
    } catch (error) {
      logger.error('Failed to sync with aggregator', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Get tracking information for an order
   */
  async getTracking(orderId: string): Promise<{
    orderId: string;
    status: string;
    estimatedDelivery: Date;
    rider?: { name: string; phone: string };
    currentLocation?: { lat: number; lng: number };
    eta?: Date;
    statusHistory: Array<{ status: string; timestamp: Date; note?: string }>;
  } | null> {
    const order = await DeliveryOrder.findOne({ orderId })
      .select('orderId status estimatedDelivery riderId tracking statusHistory')
      .populate('riderId', 'name phone');

    if (!order) {
      return null;
    }

    return {
      orderId: order.orderId,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      rider: order.riderId ? {
        name: (order.riderId as unknown).name,
        phone: (order.riderId as unknown).phone
      } : undefined,
      currentLocation: order.tracking?.currentLocation?.coordinates ? {
        lat: order.tracking.currentLocation.coordinates[1],
        lng: order.tracking.currentLocation.coordinates[0]
      } : undefined,
      eta: order.tracking?.eta,
      statusHistory: order.statusHistory
    };
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<IDeliveryOrder> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (['picked_up', 'delivered', 'cancelled'].includes(order.status)) {
      throw new AppError(`Cannot cancel order in '${order.status}' status`, 400);
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled by system'
    });

    await order.save();
    logger.info(`Order cancelled: ${orderId}`, { reason });

    // Sync cancellation to aggregator
    if (order.source !== 'own') {
      await aggregatorService.syncCancellationToAggregator(order).catch(err => {
        logger.error('Failed to sync cancellation to aggregator', { orderId: order.orderId, error: err.message });
      });
    }

    return order;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(merchantId?: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    picked_up: number;
    delivered: number;
    cancelled: number;
    averageDeliveryTime: number;
    totalRevenue: number;
  }> {
    const query: unknown = {};
    if (merchantId) query.merchantId = merchantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const orders = await DeliveryOrder.find(query);

    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      picked_up: 0,
      delivered: 0,
      cancelled: 0,
      averageDeliveryTime: 0,
      totalRevenue: 0
    };

    let deliveryTimes: number[] = [];

    orders.forEach(order => {
      stats[order.status as keyof typeof stats]++;
      if (order.status === 'delivered') {
        stats.totalRevenue += order.totalAmount;
        if (order.actualDelivery && order.createdAt) {
          deliveryTimes.push(
            (order.actualDelivery.getTime() - order.createdAt.getTime()) / (1000 * 60)
          );
        }
      }
    });

    if (deliveryTimes.length > 0) {
      stats.averageDeliveryTime = Math.round(
        deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      );
    }

    return stats;
  }
}

export default new OrderService();
