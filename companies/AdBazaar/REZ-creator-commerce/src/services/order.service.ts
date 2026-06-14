import { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { Order, Product, Creator, Analytics } from '../models';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import config from '../config';
import {
  IOrder,
  IOrderDocument,
  CreateOrderDTO,
  UpdateOrderDTO,
  PaginatedResponse,
  OrderStatus,
} from '../types';

class OrderService {
  /**
   * Create a new order
   */
  async create(data: CreateOrderDTO): Promise<IOrderDocument> {
    // Validate product exists and has inventory
    const product = await Product.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.status !== 'active') {
      throw new Error('Product is not available for purchase');
    }

    const quantity = data.quantity || 1;
    if (product.inventory < quantity) {
      throw new Error('Insufficient inventory');
    }

    // Calculate amounts using Decimal.js for precision
    const amount = new Decimal(product.price).times(quantity).toNumber();
    const commissionAmount = new Decimal(amount)
      .times(product.commission)
      .dividedBy(100)
      .toNumber();
    const netEarnings = amount - commissionAmount;

    // Generate order number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split('-')[0].toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Create order
    const order = new Order({
      orderNumber,
      creatorId: product.creatorId,
      productId: product._id,
      customerId: data.customerId,
      status: OrderStatus.PENDING,
      amount,
      commissionRate: product.commission,
      commissionAmount,
      netEarnings,
      quantity,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
    });

    await order.save();

    // Decrement product inventory
    await Product.findByIdAndUpdate(product._id, {
      $inc: { inventory: -quantity, soldCount: quantity },
    });

    // Update creator stats
    await Creator.findByIdAndUpdate(product.creatorId, {
      $inc: {
        totalOrders: 1,
        totalEarnings: netEarnings,
        pendingPayout: netEarnings,
      },
    });

    // Update daily analytics
    await this.updateCreatorDailyAnalytics(product.creatorId.toString(), netEarnings, 1, product._id.toString());

    // Invalidate caches
    await Promise.all([
      cacheService.invalidateCreatorCache(product.creatorId.toString()),
      cacheService.invalidateProductCache(product._id.toString()),
    ]);

    logger.info(`Order created: ${order._id} for product: ${product._id}`);

    return order;
  }

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<IOrderDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Try cache first
    const cached = await cacheService.get<IOrderDocument>(cacheService.keys.order(id));
    if (cached) {
      return cached;
    }

    const order = await Order.findById(id).populate('productId').populate('creatorId');
    if (order) {
      await cacheService.set(cacheService.keys.order(id), order, config.cache.ttl);
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber: string): Promise<IOrderDocument | null> {
    return Order.findByOrderNumber(orderNumber).populate('productId').populate('creatorId');
  }

  /**
   * Get orders by creator
   */
  async getByCreator(
    creatorId: string,
    params: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
    } = {}
  ): Promise<PaginatedResponse<IOrderDocument>> {
    const { page = 1, limit = config.pagination.defaultLimit, status } = params;

    const query: Record<string, unknown> = { creatorId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Order.countDocuments(query),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get orders by customer
   */
  async getByCustomer(
    customerId: string,
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<IOrderDocument>> {
    const { page = 1, limit = config.pagination.defaultLimit } = params;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customerId })
        .populate('productId')
        .populate('creatorId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, config.pagination.maxLimit)),
      Order.countDocuments({ customerId }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, data: UpdateOrderDTO): Promise<IOrderDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const order = await Order.findById(id);
    if (!order) {
      return null;
    }

    const oldStatus = order.status;
    const newStatus = data.status;

    // Validate status transitions
    this.validateStatusTransition(oldStatus, newStatus);

    // Update order
    const updateData: Record<string, unknown> = { status: newStatus };
    if (data.notes) {
      updateData.notes = data.notes;
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('productId').populate('creatorId');

    if (updatedOrder) {
      // Handle status-specific logic
      if (newStatus === OrderStatus.CANCELLED) {
        // Refund inventory
        await Product.findByIdAndUpdate(order.productId, {
          $inc: { inventory: order.quantity, soldCount: -order.quantity },
        });

        // Reverse creator stats
        await Creator.findByIdAndUpdate(order.creatorId, {
          $inc: {
            totalOrders: -1,
            totalEarnings: -order.netEarnings,
            pendingPayout: -order.netEarnings,
          },
        });
      }

      await Promise.all([
        cacheService.invalidateOrderCache(id),
        cacheService.invalidateCreatorCache(order.creatorId.toString()),
        cacheService.invalidateProductCache(order.productId.toString()),
      ]);

      logger.info(`Order ${id} status updated: ${oldStatus} -> ${newStatus}`);
    }

    return updatedOrder;
  }

  /**
   * Process order (pending -> processing)
   */
  async processOrder(id: string): Promise<IOrderDocument | null> {
    return this.updateStatus(id, { status: OrderStatus.PROCESSING });
  }

  /**
   * Complete order (processing -> completed)
   */
  async completeOrder(id: string): Promise<IOrderDocument | null> {
    return this.updateStatus(id, { status: OrderStatus.COMPLETED });
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, reason?: string): Promise<IOrderDocument | null> {
    return this.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      notes: reason,
    });
  }

  /**
   * Refund order
   */
  async refundOrder(id: string, reason?: string): Promise<IOrderDocument | null> {
    const order = await Order.findById(id);
    if (!order) {
      return null;
    }

    // Refund inventory
    await Product.findByIdAndUpdate(order.productId, {
      $inc: { inventory: order.quantity, soldCount: -order.quantity },
    });

    // Reverse creator stats
    await Creator.findByIdAndUpdate(order.creatorId, {
      $inc: {
        totalEarnings: -order.netEarnings,
        pendingPayout: -order.netEarnings,
      },
    });

    return this.updateStatus(id, {
      status: OrderStatus.REFUNDED,
      notes: reason,
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(from: OrderStatus, to: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid status transition: ${from} -> ${to}`);
    }
  }

  /**
   * Update creator's daily analytics
   */
  private async updateCreatorDailyAnalytics(
    creatorId: string,
    earnings: number,
    orderCount: number,
    productId: string
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingAnalytics = await Analytics.findOne({
        creatorId,
        date: today,
      });

      if (existingAnalytics) {
        // Update existing analytics
        existingAnalytics.totalEarnings += earnings;
        existingAnalytics.totalOrders += orderCount;

        // Update top products
        const productIndex = existingAnalytics.topProducts.findIndex(
          (p) => p.productId.toString() === productId
        );
        if (productIndex >= 0) {
          existingAnalytics.topProducts[productIndex].count += orderCount;
        } else {
          existingAnalytics.topProducts.push({
            productId: new Types.ObjectId(productId),
            count: orderCount,
          });
        }

        // Update earnings by day
        const todayEntry = existingAnalytics.earningsByDay.find(
          (e) => e.date.toDateString() === today.toDateString()
        );
        if (todayEntry) {
          todayEntry.amount += earnings;
          todayEntry.orders += orderCount;
        } else {
          existingAnalytics.earningsByDay.push({
            date: today,
            amount: earnings,
            orders: orderCount,
          });
        }

        await existingAnalytics.save();
      } else {
        // Create new analytics entry
        await Analytics.create({
          creatorId,
          date: today,
          totalEarnings: earnings,
          totalOrders: orderCount,
          topProducts: [
            {
              productId: new Types.ObjectId(productId),
              count: orderCount,
            },
          ],
          earningsByDay: [
            {
              date: today,
              amount: earnings,
              orders: orderCount,
            },
          ],
        });
      }
    } catch (error) {
      logger.error('Error updating creator daily analytics:', error);
    }
  }

  /**
   * Get creator order stats
   */
  async getCreatorStats(creatorId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalCommission: number;
    netEarnings: number;
  }> {
    const stats = await Order.aggregate([
      { $match: { creatorId: new Types.ObjectId(creatorId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalNetEarnings: { $sum: '$netEarnings' },
        },
      },
    ]);

    const result = {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      refundedOrders: 0,
      totalRevenue: 0,
      totalCommission: 0,
      netEarnings: 0,
    };

    stats.forEach((stat) => {
      const status = stat._id as OrderStatus;
      result.totalOrders += stat.count;
      result.totalRevenue += stat.totalAmount;
      result.totalCommission += stat.totalCommission;
      result.netEarnings += stat.totalNetEarnings;

      switch (status) {
        case OrderStatus.PENDING:
          result.pendingOrders = stat.count;
          break;
        case OrderStatus.PROCESSING:
          result.processingOrders = stat.count;
          break;
        case OrderStatus.COMPLETED:
          result.completedOrders = stat.count;
          break;
        case OrderStatus.CANCELLED:
          result.cancelledOrders = stat.count;
          break;
        case OrderStatus.REFUNDED:
          result.refundedOrders = stat.count;
          break;
      }
    });

    return result;
  }
}

export const orderService = new OrderService();
export default orderService;
