/**
 * Live Data Service
 *
 * Provides live data connections to other REZ services for real-time
 * business intelligence and analytics.
 */

import axios from 'axios';

const ORDER_SERVICE = process.env.REZ_ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com';
const CATALOG_SERVICE = process.env.REZ_CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com';
const MERCHANT_SERVICE = process.env.REZ_MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com';
const EVENT_PLATFORM = process.env.REZ_EVENT_PLATFORM_URL || 'https://REZ-event-platform.onrender.com';

/**
 * Log a merchant event to the Event Platform
 * @param type - Event type (e.g., 'merchant.insight_generated')
 * @param data - Event data payload
 */
async function logMerchantEvent(type: string, data) {
  try {
    await axios.post(`${EVENT_PLATFORM}/api/events`, {
      type,
      data,
      merchantId: data.merchantId,
      timestamp: new Date().toISOString()
    }, { timeout: 3000 });
  } catch (e) {
    console.log('Event log failed:', e.message);
  }
}

export interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  price: number;
  category: string;
  orderCount: number;
  stock: number;
}

export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  totalOrders: number;
  revenueThisWeek: number;
  revenueLastWeek: number;
  totalCustomers: number;
  returningCustomers: number;
  newCustomers: number;
  revenueTarget: number;
  stockoutRate: number;
  lowStockItems: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersByStatus: Record<string, number>;
}

export class LiveDataService {

  /**
   * Fetch merchant orders from the Order Service
   * @param merchantId - The merchant ID
   * @param days - Number of days to look back (default: 7)
   */
  async getMerchantOrders(merchantId: string, days: number = 7): Promise<Order[]> {
    try {
      const response = await fetch(`${ORDER_SERVICE}/orders`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Order service returned ${response.status}`);
      }

      const orders: Order[] = await response.json() as Order[];

      // Filter by merchant and date
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return orders.filter(order =>
        order.merchantId === merchantId &&
        new Date(order.createdAt) > cutoffDate
      );
    } catch (error) {
      console.error('Failed to fetch merchant orders:', error);
      return [];
    }
  }

  /**
   * Fetch merchant products from the Catalog Service
   * @param merchantId - The merchant ID
   */
  async getMerchantProducts(merchantId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${CATALOG_SERVICE}/api/products?merchant=${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Catalog service returned ${response.status}`);
      }

      return await response.json() as unknown as Product[];
    } catch (error) {
      console.error('Failed to fetch merchant products:', error);
      return [];
    }
  }

  /**
   * Fetch merchant profile from the Merchant Service
   * @param merchantId - The merchant ID
   */
  async getMerchantProfile(merchantId: string): Promise<MerchantProfile | null> {
    try {
      const response = await fetch(`${MERCHANT_SERVICE}/api/merchants/${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Merchant service returned ${response.status}`);
      }

      return await response.json() as unknown as MerchantProfile;
    } catch (error) {
      console.error('Failed to fetch merchant profile:', error);
      return null;
    }
  }

  /**
   * Log an insight event to the Event Platform
   * @param merchantId - The merchant ID
   * @param insight - The insight data to log
   */
  async logInsight(merchantId: string, insight): Promise<void> {
    try {
      await fetch(`${EVENT_PLATFORM}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'merchant.insight_generated',
          merchantId,
          data: insight,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to log insight event:', error);
    }
  }

  /**
   * Calculate order analytics for a merchant
   * @param merchantId - The merchant ID
   */
  async getOrderAnalytics(merchantId: string): Promise<OrderAnalytics> {
    const orders = await this.getMerchantOrders(merchantId, 30);

    const totalRevenue = orders.reduce((sum: number, o: Order) => sum + o.total, 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
      ordersByStatus: orders.reduce((acc: Record<string, number>, o: Order) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * Get trending products for a merchant based on order count
   * @param merchantId - The merchant ID
   */
  async getTrendingProducts(merchantId: string): Promise<Product[]> {
    const products = await this.getMerchantProducts(merchantId);

    // Sort by order count in descending order
    return products
      .sort((a: Product, b: Product) => (b.orderCount || 0) - (a.orderCount || 0))
      .slice(0, 10);
  }

  /**
   * Get competitor analysis data
   * @param merchantId - The merchant ID
   */
  async getCompetitors(merchantId: string): Promise<unknown[]> {
    try {
      const response = await fetch(`${MERCHANT_SERVICE}/api/merchants/${merchantId}/competitors`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Merchant service returned ${response.status}`);
      }

      return await response.json() as unknown as unknown[];
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      return [];
    }
  }

  /**
   * Get market trends from the Event Platform
   * @param merchantId - The merchant ID
   */
  async getMarketTrends(merchantId: string): Promise<unknown> {
    try {
      const response = await fetch(`${EVENT_PLATFORM}/api/trends?merchant=${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Event platform returned ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch market trends:', error);
      return { demandIncrease: [], demandDecrease: [], trending: [] };
    }
  }
}

export const liveDataService = new LiveDataService();
export { logMerchantEvent };
