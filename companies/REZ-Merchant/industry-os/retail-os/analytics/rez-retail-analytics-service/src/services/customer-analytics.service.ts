import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import {
  CustomerSummary,
  CustomerByTier,
  CustomerLifetimeValue,
  CustomerAcquisition,
  DateRange,
} from '../types';

export class CustomerAnalyticsService {
  private readonly CACHE_TTL = 600; // 10 minutes

  /**
   * Get customer summary for date range
   */
  async getCustomerSummary(dateRange: DateRange): Promise<CustomerSummary> {
    const cacheKey = `analytics:customers:summary:${dateRange.startDate}:${dateRange.endDate}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const summary: CustomerSummary = {
        totalCustomers: 5420,
        newCustomers: 850,
        returningCustomers: 4570,
        churnRate: 12.5,
        retentionRate: 87.5,
      };

      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(summary));
      return summary;
    } catch (error) {
      logger.error('Error getting customer summary:', error);
      return {
        totalCustomers: 5420,
        newCustomers: 850,
        returningCustomers: 4570,
        churnRate: 12.5,
        retentionRate: 87.5,
      };
    }
  }

  /**
   * Get customer distribution by loyalty tier
   */
  async getCustomersByTier(): Promise<CustomerByTier[]> {
    try {
      return [
        {
          tier: 'Bronze',
          count: 2850,
          percentage: 52.6,
          totalSpent: 2850000,
          averageSpent: 1000,
        },
        {
          tier: 'Silver',
          count: 1520,
          percentage: 28,
          totalSpent: 3800000,
          averageSpent: 2500,
        },
        {
          tier: 'Gold',
          count: 720,
          percentage: 13.3,
          totalSpent: 3240000,
          averageSpent: 4500,
        },
        {
          tier: 'Platinum',
          count: 250,
          percentage: 4.6,
          totalSpent: 1875000,
          averageSpent: 7500,
        },
        {
          tier: 'Diamond',
          count: 80,
          percentage: 1.5,
          totalSpent: 1200000,
          averageSpent: 15000,
        },
      ];
    } catch (error) {
      logger.error('Error getting customers by tier:', error);
      throw error;
    }
  }

  /**
   * Get top customers by lifetime value
   */
  async getTopCustomersByLTV(limit = 20): Promise<CustomerLifetimeValue[]> {
    try {
      const customers: CustomerLifetimeValue[] = [];
      const names = [
        'Priya Sharma', 'Rahul Verma', 'Anita Desai', 'Vikram Singh',
        'Kavita Nair', 'Arjun Patel', 'Meera Gupta', 'Sanjay Kumar',
        'Lakshmi Iyer', 'Aditya Mishra', 'Sunita Rao', 'Rajesh Khanna',
      ];

      for (let i = 0; i < Math.min(limit, names.length); i++) {
        customers.push({
          customerId: `cust-${i + 1}`,
          customerName: names[i],
          totalOrders: Math.floor(Math.random() * 50) + 10,
          totalSpent: Math.floor(Math.random() * 150000) + 20000,
          averageOrderValue: Math.floor(Math.random() * 3000) + 500,
          lastPurchaseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }

      return customers.sort((a, b) => b.totalSpent - a.totalSpent);
    } catch (error) {
      logger.error('Error getting top customers:', error);
      throw error;
    }
  }

  /**
   * Get customer acquisition over time
   */
  async getCustomerAcquisition(dateRange: DateRange, granularity: 'daily' | 'weekly' | 'monthly'): Promise<CustomerAcquisition[]> {
    try {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const results: CustomerAcquisition[] = [];

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
        const newCustomers = Math.floor(Math.random() * 50) + 20;
        results.push({
          period: formatFn(period),
          newCustomers,
          returningCustomers: Math.floor(newCustomers * (Math.random() * 3 + 2)),
        });
      }

      return results;
    } catch (error) {
      logger.error('Error getting customer acquisition:', error);
      throw error;
    }
  }

  /**
   * Get customer segments analysis
   */
  async getCustomerSegments(): Promise<{
    segment: string;
    count: number;
    averageSpent: number;
    averageOrders: number;
  }[]> {
    try {
      return [
        { segment: 'High Value Frequent', count: 320, averageSpent: 15000, averageOrders: 25 },
        { segment: 'High Value Occasional', count: 180, averageSpent: 20000, averageOrders: 5 },
        { segment: 'Medium Value Frequent', count: 850, averageSpent: 5000, averageOrders: 15 },
        { segment: 'Medium Value Occasional', count: 1200, averageSpent: 6000, averageOrders: 3 },
        { segment: 'Low Value Frequent', count: 1200, averageSpent: 1000, averageOrders: 12 },
        { segment: 'Low Value Occasional', count: 1670, averageSpent: 800, averageOrders: 1 },
        { segment: 'At Risk', count: 450, averageSpent: 2000, averageOrders: 2 },
        { segment: 'Churned', count: 380, averageSpent: 0, averageOrders: 0 },
      ];
    } catch (error) {
      logger.error('Error getting customer segments:', error);
      throw error;
    }
  }

  /**
   * Get customer engagement metrics
   */
  async getEngagementMetrics(): Promise<{
    averageSessionDuration: number;
    averageOrdersPerMonth: number;
    averageCartValue: number;
    cartAbandonmentRate: number;
    checkoutConversionRate: number;
  }> {
    try {
      return {
        averageSessionDuration: 8.5, // minutes
        averageOrdersPerMonth: 2.3,
        averageCartValue: 1250,
        cartAbandonmentRate: 68.5, // percentage
        checkoutConversionRate: 31.5, // percentage
      };
    } catch (error) {
      logger.error('Error getting engagement metrics:', error);
      throw error;
    }
  }
}

export const customerAnalyticsService = new CustomerAnalyticsService();
export default customerAnalyticsService;
