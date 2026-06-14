import { ShopOrder, IShopOrder, OrderStatus } from '../models';
import { instagramApiService } from './instagramApiService';
import logger from '../utils/logger';

export interface CreateOrderInput {
  productId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  notes?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  productId?: string;
  startDate?: Date;
  endDate?: Date;
}

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<IShopOrder> {
    try {
      const order = new ShopOrder({
        productId: input.productId,
        userId: input.userId,
        quantity: input.quantity,
        totalAmount: input.totalAmount,
        shippingAddress: {
          ...input.shippingAddress,
          country: input.shippingAddress.country || 'India',
        },
        status: 'pending',
        notes: input.notes,
      });

      await order.save();

      // Create order in Instagram if product is synced
      try {
        const orderId = await instagramApiService.createCheckoutOrder({
          productId: input.productId,
          quantity: input.quantity,
          userId: input.userId,
          shippingAddress: {
            ...input.shippingAddress,
            country: input.shippingAddress.country || 'India',
          },
        });

        if (orderId) {
          order.instagramOrderId = orderId;
          await order.save();
        }
      } catch (instagramError) {
        logger.warn('Failed to create Instagram order, local order still created', {
          error: instagramError instanceof Error ? instagramError.message : 'Unknown error',
          orderId: order.id,
        });
      }

      logger.info('Order created', { orderId: order.id });
      return order;
    } catch (error) {
      logger.error('Failed to create order', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<IShopOrder | null> {
    return ShopOrder.findById(orderId).populate('productId').exec();
  }

  /**
   * Get order by Instagram order ID
   */
  async getOrderByInstagramId(instagramOrderId: string): Promise<IShopOrder | null> {
    return ShopOrder.findOne({ instagramOrderId }).exec();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    updates: UpdateOrderStatusInput
  ): Promise<IShopOrder | null> {
    try {
      const order = await ShopOrder.findById(orderId).exec();
      if (!order) {
        return null;
      }

      // Update local order
      order.status = updates.status;
      if (updates.trackingNumber) {
        order.trackingNumber = updates.trackingNumber;
      }
      if (updates.notes) {
        order.notes = updates.notes;
      }

      // Set timestamp based on status
      switch (updates.status) {
        case 'confirmed':
          order.confirmedAt = new Date();
          break;
        case 'shipped':
          order.shippedAt = new Date();
          break;
        case 'delivered':
          order.deliveredAt = new Date();
          break;
        case 'cancelled':
          order.cancelledAt = new Date();
          break;
      }

      // Sync to Instagram
      if (order.instagramOrderId) {
        try {
          const instagramStatus = this.mapStatusToInstagram(updates.status);
          await instagramApiService.updateOrderStatus(order.instagramOrderId, instagramStatus);
        } catch (instagramError) {
          logger.warn('Failed to update Instagram order status', {
            error: instagramError instanceof Error ? instagramError.message : 'Unknown error',
            orderId,
            instagramOrderId: order.instagramOrderId,
          });
        }
      }

      await order.save();
      logger.info('Order status updated', { orderId, status: updates.status });
      return order;
    } catch (error) {
      logger.error('Failed to update order status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      });
      throw error;
    }
  }

  /**
   * List orders with filtering and pagination
   */
  async listOrders(
    filters: OrderFilters,
    options: { page?: number; limit?: number; sort?: string }
  ): Promise<{ orders: IShopOrder[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const query: Record<string, unknown> = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.productId) query.productId = filters.productId;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
    }

    const total = await ShopOrder.countDocuments(query).exec();
    const orders = await ShopOrder.find(query)
      .populate('productId')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUser(userId: string): Promise<IShopOrder[]> {
    return ShopOrder.find({ userId })
      .populate('productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get order statistics
   */
  async getOrderStats(userId?: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const match: Record<string, unknown> = userId ? { userId } : {};

    const stats = await ShopOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const result = {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };

    for (const stat of stats) {
      result.totalOrders += stat.count;
      result.totalRevenue += stat.revenue;

      switch (stat._id) {
        case 'pending':
          result.pendingOrders = stat.count;
          break;
        case 'delivered':
          result.completedOrders = stat.count;
          break;
        case 'cancelled':
          result.cancelledOrders = stat.count;
          break;
      }
    }

    result.averageOrderValue =
      result.totalOrders > 0 ? result.totalRevenue / result.totalOrders : 0;

    return result;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<IShopOrder | null> {
    return this.updateOrderStatus(orderId, {
      status: 'cancelled',
      notes: reason,
    });
  }

  /**
   * Map internal status to Instagram order status
   */
  private mapStatusToInstagram(status: OrderStatus): 'confirmed' | 'shipped' | 'cancelled' {
    switch (status) {
      case 'confirmed':
        return 'confirmed';
      case 'shipped':
        return 'shipped';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'confirmed';
    }
  }

  /**
   * Handle webhook update from Instagram
   */
  async handleInstagramWebhook(orderId: string, newStatus: string): Promise<void> {
    const statusMap: Record<string, OrderStatus> = {
      initiated: 'pending',
      created: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      refunded: 'cancelled',
    };

    const internalStatus = statusMap[newStatus.toLowerCase()];
    if (internalStatus) {
      await this.updateOrderStatus(orderId, { status: internalStatus });
    }
  }
}

export const orderService = new OrderService();
export default orderService;