/**
 * Aggregation Service
 * Aggregates merchant data into anonymized insights
 */

import { MerchantData } from '../models/MerchantData';
import { AggregatedMetrics } from '../models/AggregatedData';
import { logger } from '../config/logger';
import {
  aggregateNumbers,
  anonymizePeakHours,
  anonymizeCategoryDistribution,
  isAggregationSafe,
  anonymizeAverage
} from '../utils/anonymize';
import { getRedis } from '../config/redis';

export interface MerchantMetricsInput {
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

export class AggregationService {
  private redis = getRedis();

  async initialize(): Promise<void> {
    logger.info('Initializing Aggregation Service');

    // Create indexes
    await this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await MerchantData.createIndexes();
      await AggregatedMetrics.createIndexes();
      logger.info('Database indexes created');
    } catch (error) {
      logger.error('Failed to create indexes', { error: (error as Error).message });
    }
  }

  /**
   * Register or update merchant data for aggregation
   */
  async upsertMerchantData(input: MerchantMetricsInput): Promise<void> {
    const { merchantId, dailyMetrics, ...locationData } = input;

    // Check consent
    const existing = await MerchantData.findOne({ merchantId });
    if (existing && !existing.dataSharingConsent) {
      logger.debug('Merchant opted out of data sharing', { merchantId });
      return;
    }

    // Update or create
    await MerchantData.findOneAndUpdate(
      { merchantId },
      {
        $set: {
          ...locationData,
          dailyMetrics: dailyMetrics.slice(-30), // Keep last 30 days
          lastAggregatedAt: null, // Force re-aggregation
          updatedAt: new Date()
        },
        $setOnInsert: {
          dataSharingConsent: true,
          consentGivenAt: new Date(),
          aggregationVersion: 1
        }
      },
      { upsert: true }
    );

    logger.debug('Merchant data updated', { merchantId });
  }

  /**
   * Revoke data sharing consent
   */
  async revokeConsent(merchantId: string): Promise<void> {
    await MerchantData.findOneAndUpdate(
      { merchantId },
      {
        $set: {
          dataSharingConsent: false,
          consentRevokedAt: new Date()
        }
      }
    );

    logger.info('Merchant consent revoked', { merchantId });
  }

  /**
   * Aggregate data for a specific locality and industry
   */
  async aggregateLocality(
    locality: string,
    industry: string,
    category?: string
  ): Promise<void> {
    const query: unknown = {
      locality,
      dataSharingConsent: true
    };

    if (category) {
      query.category = category;
    }

    const merchants = await MerchantData.find(query);
    const merchantCount = merchants.length;

    if (!isAggregationSafe(merchantCount, 3)) {
      logger.debug('Not enough merchants for aggregation', { locality, merchantCount });
      return;
    }

    // Aggregate metrics
    const last30Days = this.getLast30Days();
    const recentMetrics = merchants.map(m =>
      m.dailyMetrics.filter(d => d.date >= last30Days)
    ).flat();

    // Order values
    const orderValues = recentMetrics.map(m => m.avgOrderValue).filter(v => v > 0);
    const orderAggregates = aggregateNumbers(orderValues);

    // Orders per day
    const ordersPerDay = recentMetrics.reduce((sum, m) => sum + m.orders, 0) / 30;

    // Revenue
    const totalRevenue = recentMetrics.reduce((sum, m) => sum + m.revenue, 0);

    // Peak hours
    const peakHours = anonymizePeakHours(
      merchants.map(m => {
        const recent = m.dailyMetrics.filter(d => d.date >= last30Days);
        return recent.length > 0
          ? recent.reduce((acc, d) => [...acc, ...(d.peakHours || [])], [] as number[])
          : [];
      }),
      Math.max(2, Math.floor(merchantCount * 0.2))
    );

    // Repeat rates
    const repeatRates = recentMetrics
      .filter(m => m.customers > 0)
      .map(m => m.repeatCustomers / m.customers);
    const avgRepeatRate = anonymizeAverage(repeatRates);

    // Growth calculations (compare to previous 30 days)
    const previous30Days = new Date(last30Days);
    previous30Days.setDate(previous30Days.getDate() - 30);

    const currentOrders = recentMetrics.reduce((sum, m) => sum + m.orders, 0);
    const previousMetrics = merchants.map(m =>
      m.dailyMetrics.filter(d => d.date >= previous30Days && d.date < last30Days)
    ).flat();
    const previousOrders = previousMetrics.reduce((sum, m) => sum + m.orders, 0);

    const orderGrowth30d = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

    const currentRevenue = recentMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const previousRevenue = previousMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const revenueGrowth30d = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const merchant of merchants) {
      categoryCounts[merchant.category] = (categoryCounts[merchant.category] || 0) + 1;
    }
    const topCategories = anonymizeCategoryDistribution(categoryCounts, 2);

    // Create or update aggregated metrics
    const aggregatedData = {
      locality,
      pincode: merchants[0].pincode,
      city: merchants[0].city,
      state: merchants[0].state,
      country: 'India',
      industry: industry as unknown,
      category: category || 'all',
      merchantCount,
      avgOrderValue: orderAggregates.avg || 0,
      avgOrdersPerDay: Math.round(ordersPerDay / merchantCount),
      avgOrdersPerMerchant: Math.round(currentOrders / merchantCount),
      totalOrders30d: currentOrders,
      totalRevenue30d: currentRevenue,
      peakHours,
      peakDays: this.calculatePeakDays(recentMetrics),
      topCategories,
      avgRetentionRate: avgRepeatRate || 0,
      avgRepeatRate: avgRepeatRate || 0,
      orderGrowth30d: Math.round(orderGrowth30d * 10) / 10,
      revenueGrowth30d: Math.round(revenueGrowth30d * 10) / 10,
      merchantGrowth30d: 0, // TODO: Calculate from historical data
      avgCustomerAge: 0, // TODO: Calculate from customer data
      avgOrdersPerCustomer: 0, // TODO: Calculate from customer data
      periodStart: last30Days,
      periodEnd: new Date(),
      updatedAt: new Date()
    };

    await AggregatedMetrics.findOneAndUpdate(
      {
        locality,
        industry: industry as unknown,
        category: category || 'all'
      },
      { $set: aggregatedData },
      { upsert: true }
    );

    // Mark merchants as aggregated
    await MerchantData.updateMany(
      { merchantId: { $in: merchants.map(m => m.merchantId) } },
      { $set: { lastAggregatedAt: new Date() } }
    );

    // Cache the result
    await this.cacheAggregatedData(locality, industry, aggregatedData);

    logger.info('Aggregation completed', {
      locality,
      industry,
      merchantCount,
      totalOrders: currentOrders
    });
  }

  /**
   * Run full aggregation for all localities
   */
  async runFullAggregation(): Promise<void> {
    logger.info('Starting full aggregation');

    // Get all unique locality-industry combinations
    const combinations = await MerchantData.aggregate([
      { $match: { dataSharingConsent: true } },
      {
        $group: {
          _id: {
            locality: '$locality',
            industry: '$industry',
            category: '$category'
          },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 3 } } }
    ]);

    logger.info('Found aggregation combinations', { count: combinations.length });

    for (const combo of combinations) {
      await this.aggregateLocality(
        combo._id.locality,
        combo._id.industry,
        combo._id.category
      );
    }

    logger.info('Full aggregation completed');
  }

  /**
   * Get aggregated metrics for a locality
   */
  async getLocalityMetrics(
    locality: string,
    industry: string,
    category?: string
  ): Promise<unknown> {
    const cacheKey = `metrics:${locality}:${industry}:${category || 'all'}`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const industryValue = industry as 'restaurant' | 'hotel' | 'salon' | 'fitness' | 'healthcare';
    const metrics = await AggregatedMetrics.findOne({
      locality,
      industry: industryValue,
      category: category || 'all'
    } as unknown);

    if (metrics) {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(metrics)); // Cache 1 hour
    }

    return metrics;
  }

  private async cacheAggregatedData(
    locality: string,
    industry: string,
    data: unknown
  ): Promise<void> {
    const cacheKey = `metrics:${locality}:${industry}:${data.category}`;
    await this.redis.setex(cacheKey, 3600, JSON.stringify(data));
  }

  private getLast30Days(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private calculatePeakDays(metrics: unknown[]): number[] {
    // Group by day of week and find peaks
    const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const m of metrics) {
      const dayOfWeek = new Date(m.date).getDay();
      dayTotals[dayOfWeek] += m.orders;
    }

    const avg = dayTotals.reduce((a, b) => a + b, 0) / 7;
    const peakDays: number[] = [];

    dayTotals.forEach((total, day) => {
      if (total > avg * 1.2) {
        peakDays.push(day);
      }
    });

    return peakDays.sort((a, b) => a - b);
  }
}
