/**
 * Order Service Client for Analytics V2
 * Provides typed access to the order service API
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
export interface Order {
  _id: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderQueryParams {
  merchantId?: string;
  storeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface RevenueData {
  orderId: string;
  merchantId: string;
  storeId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  items: Order['items'];
  createdAt: Date;
}

export class OrderClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ORDER_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
        'x-internal-service': 'rez-analytics-v2',
      },
    });
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  /**
   * Get orders with filters
   */
  async getOrders(params: OrderQueryParams): Promise<Order[]> {
    const response = await this.client.get('/orders', { params });
    return response.data.orders || response.data;
  }

  /**
   * Get orders for revenue analytics
   */
  async getOrdersForRevenue(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueData[]> {
    const response = await this.client.get('/orders/analytics/revenue', {
      params: {
        merchantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    const orders: Order[] = response.data.orders || response.data;

    return orders.map((order) => ({
      orderId: order.orderId || order._id,
      merchantId: order.merchantId,
      storeId: order.storeId,
      amount: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items,
      createdAt: new Date(order.createdAt),
    }));
  }

  /**
   * Get completed orders for a period
   */
  async getCompletedOrders(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Order[]> {
    return this.getOrders({
      merchantId,
      status: 'delivered',
      startDate,
      endDate,
    });
  }

  /**
   * Get order statistics for a period
   */
  async getOrderStats(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    byStatus: Record<string, number>;
    byPaymentMethod: Record<string, { count: number; revenue: number }>;
  }> {
    const orders = await this.getOrders({
      merchantId,
      startDate,
      endDate,
      limit: 1000,
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      averageOrderValue: 0,
      byStatus: {} as Record<string, number>,
      byPaymentMethod: {} as Record<string, { count: number; revenue: number }>,
    };

    for (const order of orders) {
      stats.totalRevenue += order.total;

      // Count by status
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;

      // Count by payment method
      if (!stats.byPaymentMethod[order.paymentMethod]) {
        stats.byPaymentMethod[order.paymentMethod] = { count: 0, revenue: 0 };
      }
      stats.byPaymentMethod[order.paymentMethod].count += 1;
      stats.byPaymentMethod[order.paymentMethod].revenue += order.total;
    }

    stats.averageOrderValue = stats.totalOrders > 0
      ? stats.totalRevenue / stats.totalOrders
      : 0;

    return stats;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok' || response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Singleton instance
let orderClient: OrderClient | null = null;

export function getOrderClient(): OrderClient {
  if (!orderClient) {
    orderClient = new OrderClient();
  }
  return orderClient;
}

export default OrderClient;
