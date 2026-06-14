/**
 * Intelligence Data Pipeline
 * Syncs merchant data to the Intelligence Aggregator service
 */

import axios from 'axios';
import { Store } from '../models/Store';
import { Order } from '../models/Order';
import { StorePayment } from '../models/StorePayment';
import { logger } from '../config/logger';

const INTELLIGENCE_AGGREGATOR_URL = process.env.INTELLIGENCE_AGGREGATOR_URL || 'http://localhost:4011';

interface MerchantMetricsInput {
  merchantId: string;
  businessName: string;
  locality: string;
  pincode: string;
  city: string;
  state: string;
  industry: 'restaurant' | 'hotel' | 'salon' | 'fitness' | 'healthcare';
  category: string;
  dailyMetrics: {
    date: Date;
    orders: number;
    revenue: number;
    customers: number;
    avgOrderValue: number;
    repeatCustomers: number;
    newCustomers: number;
    peakHours: number[];
  }[];
}

export class IntelligenceDataPipeline {
  private retryCount = 3;
  private retryDelay = 1000;

  /**
   * Sync all merchant data to the aggregator
   */
  async syncAllMerchants(): Promise<{ synced: number; failed: number }> {
    logger.info('[DataPipeline] Starting full sync');

    const merchants = await Store.find({
      isActive: true,
      merchantId: { $exists: true }
    }).select('_id merchantId businessName address city state locality pincode industry category');

    let synced = 0;
    let failed = 0;

    for (const store of merchants) {
      try {
        const metrics = await this.getMerchantMetrics(store);
        if (metrics) {
          await this.syncMerchantMetrics(metrics);
          synced++;
        }
      } catch (error) {
        logger.error('[DataPipeline] Failed to sync merchant', {
          merchantId: store.merchantId,
          error: (error as Error).message
        });
        failed++;
      }
    }

    logger.info('[DataPipeline] Sync completed', { synced, failed });
    return { synced, failed };
  }

  /**
   * Sync a single merchant's metrics
   */
  async syncMerchant(merchantId: string): Promise<boolean> {
    try {
      const store = await Store.findOne({ merchantId });
      if (!store) {
        logger.warn('[DataPipeline] Store not found', { merchantId });
        return false;
      }

      const metrics = await this.getMerchantMetrics(store);
      if (metrics) {
        await this.syncMerchantMetrics(metrics);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[DataPipeline] Failed to sync merchant', { merchantId, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get aggregated metrics for a merchant (last 30 days)
   */
  private async getMerchantMetrics(store): Promise<MerchantMetricsInput | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily metrics
    const dailyMetrics: MerchantMetricsInput['dailyMetrics'] = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Aggregate orders for this day
      const orders = await Order.find({
        store: store._id,
        createdAt: { $gte: date, $lt: nextDate }
      }).select('_id totalAmount userId createdAt');

      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const uniqueCustomers = new Set(orders.map(o => o.userId)).size;

      // Calculate peak hours from order timestamps
      const hourCounts: Record<number, number> = {};
      for (const order of orders) {
        const hour = new Date(order.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      // Get top 3 peak hours
      const peakHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      // Calculate repeat customers (customers with more than 1 order in the period)
      const customerOrderCounts: Record<string, number> = {};
      for (const order of orders) {
        if (order.userId) {
          customerOrderCounts[order.userId] = (customerOrderCounts[order.userId] || 0) + 1;
        }
      }

      const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
      const newCustomers = uniqueCustomers - repeatCustomers;

      dailyMetrics.push({
        date,
        orders: orders.length,
        revenue: totalRevenue,
        customers: uniqueCustomers,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        repeatCustomers,
        newCustomers,
        peakHours
      });
    }

    // Map industry
    let industry: MerchantMetricsInput['industry'] = 'restaurant';
    if (store.industry) {
      if (['hotel', 'salon', 'fitness', 'healthcare'].includes(store.industry)) {
        industry = store.industry as MerchantMetricsInput['industry'];
      }
    }

    return {
      merchantId: store.merchantId?.toString() || store._id.toString(),
      businessName: store.businessName || 'Unknown',
      locality: store.locality || store.address?.locality || 'Unknown',
      pincode: store.pincode || store.address?.pincode || '000000',
      city: store.city || store.address?.city || 'Unknown',
      state: store.state || store.address?.state || 'Unknown',
      industry,
      category: store.category || 'general',
      dailyMetrics
    };
  }

  /**
   * Send metrics to the aggregator service
   */
  private async syncMerchantMetrics(metrics: MerchantMetricsInput): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        await axios.post(
          `${INTELLIGENCE_AGGREGATOR_URL}/internal/aggregate`,
          metrics,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
              'X-Internal-Service': 'merchant-service'
            },
            timeout: 10000
          }
        );
        logger.debug('[DataPipeline] Metrics synced', { merchantId: metrics.merchantId });
        return;
      } catch (error) {
        lastError = error;
        logger.warn('[DataPipeline] Sync attempt failed', {
          merchantId: metrics.merchantId,
          attempt,
          error: error.message
        });

        if (attempt < this.retryCount) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('Failed to sync after retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const intelligenceDataPipeline = new IntelligenceDataPipeline();
