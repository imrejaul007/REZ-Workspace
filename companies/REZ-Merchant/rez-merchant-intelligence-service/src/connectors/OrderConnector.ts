import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  category?: string;
}

interface OrderSummary {
  total: number;
  completed: number;
  cancelled: number;
  refunded: number;
  pending: number;
  totalRevenue: number;
}

interface CustomerOrderStats {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
}

export class OrderConnector {
  private client: AxiosInstance;
  private cache: Map<string, { data; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = axios.create({
      baseURL: config.services.order,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Fetch orders for a merchant
   */
  async getMerchantOrders(
    merchantId: string,
    options: { startDate?: string; endDate?: string; status?: string; limit?: number } = {}
  ): Promise<Order[]> {
    const cacheKey = `orders:${merchantId}:${JSON.stringify(options)}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const response = await this.client.get(`/merchants/${merchantId}/orders`, {
        params: options,
      });

      const orders = response.data.data || [];
      this.setCache(cacheKey, orders);
      return orders;
    } catch (error) {
      logger.error(`Failed to fetch orders for merchant ${merchantId}`, error);
      return this.getMockOrders(merchantId);
    }
  }

  /**
   * Get order summary for a merchant
   */
  async getOrderSummary(merchantId: string): Promise<OrderSummary> {
    const orders = await this.getMerchantOrders(merchantId);

    const summary: OrderSummary = {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      refunded: orders.filter(o => o.status === 'refunded').length,
      pending: orders.filter(o => o.status === 'pending').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    return summary;
  }

  /**
   * Get daily order statistics
   */
  async getDailyOrderStats(merchantId: string, days: number = 30): Promise<unknown[]> {
    const orders = await this.getMerchantOrders(merchantId);
    const dailyMap = new Map<string, { orderCount: number; revenue: number }>();

    // Initialize all days
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { orderCount: 0, revenue: 0 });
    }

    // Aggregate orders
    orders.forEach(order => {
      const dateStr = order.createdAt.split('T')[0];
      if (dailyMap.has(dateStr)) {
        const current = dailyMap.get(dateStr)!;
        current.orderCount++;
        if (order.status === 'completed') {
          current.revenue += order.totalAmount;
        }
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get popular items from orders
   */
  async getPopularItems(merchantId: string, limit: number = 20): Promise<unknown[]> {
    const orders = await this.getMerchantOrders(merchantId);
    const itemMap = new Map<string, unknown>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemMap.get(item.itemId);
        if (existing) {
          existing.orderCount++;
          existing.revenue += item.price * item.quantity;
        } else {
          itemMap.set(item.itemId, {
            itemId: item.itemId,
            itemName: item.itemName,
            category: item.category || 'Uncategorized',
            orderCount: 1,
            revenue: item.price * item.quantity,
          });
        }
      });
    });

    const items = Array.from(itemMap.values());
    const totalOrders = items.reduce((sum, i) => sum + i.orderCount, 0);

    return items
      .map(item => ({
        ...item,
        percentageOfTotal: totalOrders > 0 ? (item.orderCount / totalOrders) * 100 : 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, limit);
  }

  /**
   * Get customer order statistics
   */
  async getCustomerStats(merchantId: string): Promise<CustomerOrderStats[]> {
    const orders = await this.getMerchantOrders(merchantId);
    const customerMap = new Map<string, CustomerOrderStats>();

    orders.forEach(order => {
      if (order.status !== 'completed') return;

      const existing = customerMap.get(order.customerId);
      if (existing) {
        existing.totalOrders++;
        existing.totalSpent += order.totalAmount;
        existing.averageOrderValue = existing.totalSpent / existing.totalOrders;
        if (order.completedAt && order.completedAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.completedAt;
        }
      } else {
        customerMap.set(order.customerId, {
          customerId: order.customerId,
          totalOrders: 1,
          totalSpent: order.totalAmount,
          averageOrderValue: order.totalAmount,
          lastOrderDate: order.completedAt || order.createdAt,
        });
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  /**
   * Get peak hours/days analysis
   */
  async getPeakHoursAnalysis(merchantId: string): Promise<unknown> {
    const orders = await this.getMerchantOrders(merchantId);

    const hourlyMap = new Map<number, { count: number; revenue: number }>();
    const dailyMap = new Map<number, { count: number; revenue: number }>();

    // Initialize maps
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { count: 0, revenue: 0 });
    }
    for (let d = 0; d < 7; d++) {
      dailyMap.set(d, { count: 0, revenue: 0 });
    }

    // Aggregate
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const hour = date.getHours();
      const day = date.getDay();

      const hourData = hourlyMap.get(hour)!;
      hourData.count++;
      if (order.status === 'completed') hourData.revenue += order.totalAmount;

      const dayData = dailyMap.get(day)!;
      dayData.count++;
      if (order.status === 'completed') dayData.revenue += order.totalAmount;
    });

    const hourlyDistribution = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      orderCount: data.count,
      revenue: data.revenue,
      averageOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    }));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyDistribution = Array.from(dailyMap.entries()).map(([day, data]) => ({
      dayOfWeek: day,
      dayName: dayNames[day],
      orderCount: data.count,
      revenue: data.revenue,
      averageOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    }));

    return { hourlyDistribution, dailyDistribution };
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get mock orders for development
   */
  private getMockOrders(merchantId: string): Order[] {
    const orders: Order[] = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      orders.push({
        id: `order-${i}`,
        merchantId,
        customerId: `customer-${Math.floor(Math.random() * 50)}`,
        items: [
          {
            itemId: `item-${Math.floor(Math.random() * 10)}`,
            itemName: `Product ${Math.floor(Math.random() * 10)}`,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: Math.floor(Math.random() * 50) + 10,
            category: ['Food', 'Beverage', 'Dessert', 'Merchandise'][Math.floor(Math.random() * 4)],
          },
        ],
        totalAmount: Math.floor(Math.random() * 100) + 20,
        status: ['completed', 'completed', 'completed', 'cancelled', 'refunded'][Math.floor(Math.random() * 5)],
        createdAt: date.toISOString(),
        completedAt: date.toISOString(),
      });
    }

    return orders;
  }
}

export const orderConnector = new OrderConnector();
export default orderConnector;
