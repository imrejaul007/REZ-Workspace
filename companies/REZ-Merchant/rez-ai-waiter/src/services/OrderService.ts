import { Order, Restaurant, MenuItem, Customer, IOrder } from '../models/Restaurant';
import { whatsAppService } from './WhatsAppService';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

export class OrderService {
  private static instance: OrderService;

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  async createOrder(data: {
    restaurantId: string;
    customerPhone: string;
    customerName?: string;
    items: { menuItemId: string; quantity: number; notes?: string; customizations?: string[] }[];
    orderType: 'dine-in' | 'takeaway' | 'delivery';
    tableNumber?: string;
    deliveryAddress?: {
      address: string;
      city: string;
      pincode: string;
      landmark?: string;
    };
    notes?: string;
    source?: 'whatsapp' | 'app' | 'pos' | 'call';
  }): Promise<{ success: boolean; order?: IOrder; error?: string }> {
    try {
      // Validate restaurant
      const restaurant = await Restaurant.findById(data.restaurantId);
      if (!restaurant) {
        return { success: false, error: 'Restaurant not found' };
      }

      if (!restaurant.isActive) {
        return { success: false, error: 'Restaurant is currently not accepting orders' };
      }

      // Calculate order items and totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of data.items) {
        const menuItem = await MenuItem.findOne({
          _id: item.menuItemId,
          restaurantId: data.restaurantId,
          available: true,
        });

        if (!menuItem) {
          return { success: false, error: `Menu item ${item.menuItemId} not found or unavailable` };
        }

        orderItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity: item.quantity,
          price: menuItem.price,
          notes: item.notes,
          customizations: item.customizations,
        });

        subtotal += menuItem.price * item.quantity;
      }

      // Calculate tax (5% GST)
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;

      // Calculate estimated ready time
      const maxPrepTime = Math.max(
        ...orderItems.map(() => 15),
        restaurant.avgPreparationTime
      );
      const estimatedReadyTime = new Date(Date.now() + maxPrepTime * 60000);

      // Create order
      const order = await Order.create({
        restaurantId: data.restaurantId,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        items: orderItems,
        subtotal,
        tax,
        total,
        status: 'pending',
        orderType: data.orderType,
        tableNumber: data.tableNumber,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        estimatedReadyTime,
        source: data.source || 'app',
        paymentStatus: 'pending',
        whatsappNotificationSent: false,
      });

      // Update restaurant order count
      await Restaurant.updateOne(
        { _id: data.restaurantId },
        { $inc: { totalOrders: 1 } }
      );

      // Update customer stats
      await Customer.updateOne(
        { phone: data.customerPhone },
        {
          $inc: { orderCount: 1, totalSpent: total },
          $set: { lastOrderAt: new Date() },
        },
        { upsert: true }
      );

      logger.info('Order created', { orderId: order._id, total });

      return { success: true, order };
    } catch (error) {
      logger.error('Failed to create order', { error });
      return { success: false, error: (error as Error).message };
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: IOrder['status']
  ): Promise<{ success: boolean; order?: IOrder; error?: string }> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['delivered'],
        delivered: [],
        cancelled: [],
      };

      if (!validTransitions[order.status]?.includes(status)) {
        return {
          success: false,
          error: `Cannot transition from ${order.status} to ${status}`,
        };
      }

      order.status = status;

      if (status === 'delivered') {
        order.actualReadyTime = new Date();
        order.paymentStatus = 'paid';
      }

      await order.save();

      // Send WhatsApp notification
      if (order.source === 'whatsapp') {
        const sent = await whatsAppService.sendWhatsAppNotification(
          order.customerPhone,
          order._id,
          status
        );
        if (sent) {
          order.whatsappNotificationSent = true;
          await order.save();
        }
      }

      logger.info('Order status updated', { orderId, status });

      return { success: true, order };
    } catch (error) {
      logger.error('Failed to update order status', { error, orderId });
      return { success: false, error: (error as Error).message };
    }
  }

  async getOrder(orderId: string): Promise<{ success: boolean; order?: IOrder; error?: string }> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getOrdersByPhone(
    phone: string,
    limit = 10
  ): Promise<{ success: boolean; orders?: IOrder[]; error?: string }> {
    try {
      const orders = await Order.find({ customerPhone: phone })
        .sort({ createdAt: -1 })
        .limit(limit);
      return { success: true, orders };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getRestaurantOrders(
    restaurantId: string,
    status?: string,
    limit = 50
  ): Promise<{ success: boolean; orders?: IOrder[]; error?: string }> {
    try {
      const query: Record<string, any> = { restaurantId };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
      return { success: true, orders };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'pending' && order.status !== 'confirmed') {
        return {
          success: false,
          error: 'Only pending or confirmed orders can be cancelled',
        };
      }

      order.status = 'cancelled';
      await order.save();

      logger.info('Order cancelled', { orderId });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getOrderStats(restaurantId: string): Promise<{
    success: boolean;
    stats?: {
      totalOrders: number;
      pendingOrders: number;
      todayOrders: number;
      todayRevenue: number;
      avgOrderValue: number;
      ordersByStatus: Record<string, number>;
    };
    error?: string;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [orders, todayOrders, stats] = await Promise.all([
        Order.countDocuments({ restaurantId }),
        Order.countDocuments({
          restaurantId,
          createdAt: { $gte: today },
        }),
        Order.aggregate([
          { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Order.aggregate([
          {
            $match: {
              restaurantId: new mongoose.Types.ObjectId(restaurantId),
              createdAt: { $gte: today },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$total' },
              avgOrderValue: { $avg: '$total' },
            },
          },
        ]),
      ]);

      const ordersByStatus = stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {} as Record<string, number>);

      const todayStats = stats[0] || { totalRevenue: 0, avgOrderValue: 0 };

      return {
        success: true,
        stats: {
          totalOrders: orders,
          pendingOrders: ordersByStatus['pending'] || 0,
          todayOrders,
          todayRevenue: todayStats.totalRevenue,
          avgOrderValue: todayStats.avgOrderValue || 0,
          ordersByStatus,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getRecommendations(customerPhone: string): Promise<string[]> {
    try {
      const orders = await Order.find({
        customerPhone,
        status: 'delivered',
      })
        .sort({ createdAt: -1 })
        .limit(20);

      if (orders.length === 0) {
        return [];
      }

      // Find most ordered items
      const itemFrequency: Record<string, { count: number; menuItemId: string }> = {};

      for (const order of orders) {
        for (const item of order.items) {
          const key = item.name;
          if (!itemFrequency[key]) {
            itemFrequency[key] = { count: 0, menuItemId: item.menuItemId.toString() };
          }
          itemFrequency[key].count += item.quantity;
        }
      }

      // Sort by frequency
      const sortedItems = Object.entries(itemFrequency)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name]) => name);

      return sortedItems;
    } catch (error) {
      logger.error('Failed to get recommendations', { error });
      return [];
    }
  }
}

export const orderService = OrderService.getInstance();
