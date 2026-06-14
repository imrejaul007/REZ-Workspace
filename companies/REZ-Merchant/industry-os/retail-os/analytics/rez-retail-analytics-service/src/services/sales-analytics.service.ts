import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import {
  SalesSummary,
  SalesByPeriod,
  SalesByCategory,
  SalesByPaymentMethod,
  HourlySales,
  TopProduct,
  DateRange,
} from '../types';

// Analytics doesn't use its own models, it queries other services' data
// In production, these would be aggregations from POS and Retail services

export class SalesAnalyticsService {
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get sales summary for date range
   */
  async getSalesSummary(dateRange: DateRange, storeId?: string): Promise<SalesSummary> {
    const cacheKey = `analytics:sales:summary:${dateRange.startDate}:${dateRange.endDate}:${storeId || 'all'}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // In production, this would query the Transaction collection
      // Simulating data for demonstration
      const summary: SalesSummary = {
        totalRevenue: 1250000,
        totalOrders: 1520,
        totalItemsSold: 4850,
        averageOrderValue: 822.37,
        averageItemsPerOrder: 3.19,
        totalDiscounts: 45000,
        totalRefunds: 12000,
        netRevenue: 1238000,
      };

      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(summary));
      return summary;
    } catch (error) {
      logger.error('Error getting sales summary:', error);
      return {
        totalRevenue: 1250000,
        totalOrders: 1520,
        totalItemsSold: 4850,
        averageOrderValue: 822.37,
        averageItemsPerOrder: 3.19,
        totalDiscounts: 45000,
        totalRefunds: 12000,
        netRevenue: 1238000,
      };
    }
  }

  /**
   * Get sales by period (daily/weekly/monthly)
   */
  async getSalesByPeriod(
    dateRange: DateRange,
    granularity: 'daily' | 'weekly' | 'monthly',
    storeId?: string
  ): Promise<SalesByPeriod[]> {
    try {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const results: SalesByPeriod[] = [];

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let periods: Date[];
      let formatFn: (d: Date) => string;

      if (granularity === 'daily') {
        periods = Array.from({ length: diffDays + 1 }, (_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          return d;
        });
        formatFn = (d) => d.toISOString().split('T')[0];
      } else if (granularity === 'weekly') {
        const weeks = Math.ceil(diffDays / 7);
        periods = Array.from({ length: weeks }, (_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i * 7);
          return d;
        });
        formatFn = (d) => `Week ${Math.ceil((d.getDate()) / 7)}`;
      } else {
        const months: Record<string, boolean> = {};
        for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
          months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = true;
        }
        periods = Object.keys(months).map(key => new Date(key + '-01'));
        formatFn = (d) => d.toLocaleString('default', { month: 'short', year: 'numeric' });
      }

      for (const period of periods) {
        results.push({
          period: formatFn(period),
          revenue: Math.random() * 100000 + 50000,
          orders: Math.floor(Math.random() * 100) + 50,
          items: Math.floor(Math.random() * 500) + 100,
          averageOrderValue: Math.random() * 500 + 400,
        });
      }

      return results;
    } catch (error) {
      logger.error('Error getting sales by period:', error);
      throw error;
    }
  }

  /**
   * Get sales by category
   */
  async getSalesByCategory(dateRange: DateRange): Promise<SalesByCategory[]> {
    try {
      // Simulated data - in production, this would aggregate from transactions
      return [
        { categoryId: '1', categoryName: 'Electronics', revenue: 450000, orders: 320, percentage: 36 },
        { categoryId: '2', categoryName: 'Clothing', revenue: 280000, orders: 450, percentage: 22.4 },
        { categoryId: '3', categoryName: 'Home & Garden', revenue: 195000, orders: 280, percentage: 15.6 },
        { categoryId: '4', categoryName: 'Food & Beverages', revenue: 150000, orders: 320, percentage: 12 },
        { categoryId: '5', categoryName: 'Sports & Outdoors', revenue: 125000, orders: 150, percentage: 10 },
        { categoryId: '6', categoryName: 'Other', revenue: 50000, orders: 100, percentage: 4 },
      ];
    } catch (error) {
      logger.error('Error getting sales by category:', error);
      throw error;
    }
  }

  /**
   * Get sales by payment method
   */
  async getSalesByPaymentMethod(dateRange: DateRange): Promise<SalesByPaymentMethod[]> {
    try {
      return [
        { method: 'UPI', revenue: 520000, count: 650, percentage: 41.6 },
        { method: 'Card', revenue: 380000, count: 480, percentage: 30.4 },
        { method: 'Cash', revenue: 220000, count: 300, percentage: 17.6 },
        { method: 'Wallet', revenue: 130000, count: 90, percentage: 10.4 },
      ];
    } catch (error) {
      logger.error('Error getting sales by payment method:', error);
      throw error;
    }
  }

  /**
   * Get hourly sales distribution
   */
  async getHourlySales(dateRange: DateRange): Promise<HourlySales[]> {
    try {
      const hours: HourlySales[] = [];
      for (let h = 0; h < 24; h++) {
        // Simulate typical retail hours pattern
        let baseMultiplier = 0.3;
        if (h >= 10 && h <= 13) baseMultiplier = 1.2; // Lunch peak
        if (h >= 17 && h <= 20) baseMultiplier = 1.5; // Evening peak
        if (h >= 21 || h <= 9) baseMultiplier = 0.2; // Late night/early morning

        hours.push({
          hour: h,
          revenue: Math.round(baseMultiplier * 50000 + Math.random() * 10000),
          orders: Math.round(baseMultiplier * 50 + Math.random() * 10),
        });
      }
      return hours;
    } catch (error) {
      logger.error('Error getting hourly sales:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  async getTopProducts(
    dateRange: DateRange,
    limit = 10,
    sortBy: 'revenue' | 'quantity' = 'revenue'
  ): Promise<TopProduct[]> {
    try {
      const products: TopProduct[] = [
        { productId: '1', sku: 'ELEC-001', name: 'Wireless Earbuds', quantity: 450, revenue: 135000, orders: 420 },
        { productId: '2', sku: 'ELEC-002', name: 'Smart Watch Pro', quantity: 280, revenue: 196000, orders: 275 },
        { productId: '3', sku: 'CLTH-001', name: 'Premium T-Shirt', quantity: 890, revenue: 44500, orders: 890 },
        { productId: '4', sku: 'HOME-001', name: 'LED Desk Lamp', quantity: 320, revenue: 64000, orders: 310 },
        { productId: '5', sku: 'ELEC-003', name: 'Portable Charger', quantity: 510, revenue: 76500, orders: 500 },
        { productId: '6', sku: 'FOOD-001', name: 'Organic Coffee Beans', quantity: 680, revenue: 34000, orders: 650 },
        { productId: '7', sku: 'SPRT-001', name: 'Yoga Mat Premium', quantity: 240, revenue: 48000, orders: 235 },
        { productId: '8', sku: 'CLTH-002', name: 'Denim Jacket', quantity: 180, revenue: 72000, orders: 175 },
        { productId: '9', sku: 'HOME-002', name: 'Scented Candles Set', quantity: 390, revenue: 35100, orders: 380 },
        { productId: '10', sku: 'ELEC-004', name: 'Bluetooth Speaker', quantity: 210, revenue: 63000, orders: 205 },
      ];

      return products
        .sort((a, b) => sortBy === 'revenue' ? b.revenue - a.revenue : b.quantity - a.quantity)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting top products:', error);
      throw error;
    }
  }

  /**
   * Get comparison with previous period
   */
  async getPeriodComparison(
    currentRange: DateRange,
    previousRange: DateRange
  ): Promise<{ current: SalesSummary; previous: SalesSummary; change: Record<string, number> }> {
    try {
      const current = await this.getSalesSummary(currentRange);
      const previous = await this.getSalesSummary(previousRange);

      const change: Record<string, number> = {
        revenueChange: ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100,
        ordersChange: ((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100,
        aovChange: ((current.averageOrderValue - previous.averageOrderValue) / previous.averageOrderValue) * 100,
      };

      return { current, previous, change };
    } catch (error) {
      logger.error('Error getting period comparison:', error);
      throw error;
    }
  }
}

export const salesAnalyticsService = new SalesAnalyticsService();
export default salesAnalyticsService;
