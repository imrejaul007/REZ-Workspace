// Cross-Merchant View Service - Aggregated Analytics Service (MongoDB-backed)
// Single pane of glass across all merchants

import axios, { AxiosInstance } from 'axios';
import { MerchantSummary, AggregatedMetric } from '../models';
import { logger } from '../utils/logger';

interface MerchantSummaryData {
  merchantId: string;
  name: string;
  tier: 'basic' | 'pro' | 'enterprise';
  activeAgents: number;
  totalConversations: number;
  avgSatisfaction: number;
  lastActivity: Date;
}

interface CrossMerchantMetrics {
  totalMerchants: number;
  totalConversations: number;
  totalAgents: number;
  avgSatisfaction: number;
  totalRevenue: number;
  period: { start: Date; end: Date };
}

interface AggregatedTrend {
  date: string;
  conversations: number;
  satisfaction: number;
  revenue: number;
}

export class AggregatedAnalyticsService {
  private merchantAnalyticsClient: AxiosInstance;

  constructor() {
    const baseURL = process.env.MERCHANT_ANALYTICS_URL || 'http://localhost:4010';
    this.merchantAnalyticsClient = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async getMerchantSummary(merchantId: string): Promise<MerchantSummaryData | null> {
    // Try MongoDB first
    const cached = await MerchantSummary.findOne({ merchantId });
    if (cached) {
      return {
        merchantId: cached.merchantId,
        name: cached.name,
        tier: cached.tier,
        activeAgents: cached.activeAgents,
        totalConversations: cached.totalConversations,
        avgSatisfaction: cached.avgSatisfaction,
        lastActivity: cached.lastActivity,
      };
    }

    // Fetch from merchant analytics service
    try {
      const response = await this.merchantAnalyticsClient.get(`/merchants/${merchantId}/summary`);
      const data = response.data;

      // Cache in MongoDB
      await MerchantSummary.findOneAndUpdate(
        { merchantId },
        {
          merchantId,
          name: data.name || `Merchant ${merchantId.slice(0, 8)}`,
          slug: data.slug || merchantId,
          tier: data.tier || 'basic',
          activeAgents: data.activeAgents || 0,
          totalConversations: data.totalConversations || 0,
          avgSatisfaction: data.avgSatisfaction || 0,
          totalRevenue: data.totalRevenue || 0,
          lastActivity: new Date(),
        },
        { upsert: true }
      );

      return {
        merchantId,
        name: data.name || `Merchant ${merchantId.slice(0, 8)}`,
        tier: data.tier || 'basic',
        activeAgents: data.activeAgents || 0,
        totalConversations: data.totalConversations || 0,
        avgSatisfaction: data.avgSatisfaction || 0,
        lastActivity: new Date(),
      };
    } catch (error) {
      logger.warn(`[AggregatedAnalytics] Failed to fetch merchant ${merchantId}`, error);
      return null;
    }
  }

  async getAllMerchantSummaries(): Promise<MerchantSummaryData[]> {
    // Refresh cache if older than 5 minutes
    const oldestAllowed = new Date(Date.now() - 5 * 60 * 1000);

    const summaries = await MerchantSummary.find({
      updatedAt: { $lt: oldestAllowed },
    });

    if (summaries.length > 0) {
      // Trigger async refresh
      this.refreshCache().catch(err => logger.error('[AggregatedAnalytics] Refresh failed', err));
    }

    // Return cached data
    const cached = await MerchantSummary.find().sort({ lastActivity: -1 });
    return cached.map(c => ({
      merchantId: c.merchantId,
      name: c.name,
      tier: c.tier,
      activeAgents: c.activeAgents,
      totalConversations: c.totalConversations,
      avgSatisfaction: c.avgSatisfaction,
      lastActivity: c.lastActivity,
    }));
  }

  async getCrossMerchantMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<CrossMerchantMetrics> {
    // Get from aggregated metrics collection
    const metrics = await AggregatedMetric.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: '$totalConversations' },
          totalSatisfaction: { $avg: '$totalSatisfaction' },
          totalRevenue: { $sum: '$totalRevenue' },
          uniqueCustomers: { $sum: '$uniqueCustomers' },
          merchantCount: { $sum: { $size: '$merchantBreakdown' } },
        },
      },
    ]);

    const merchantCount = await MerchantSummary.countDocuments();
    const agentSum = await MerchantSummary.aggregate([
      { $group: { _id: null, total: { $sum: '$activeAgents' } } },
    ]);

    const data = metrics[0] || {
      totalConversations: 0,
      totalSatisfaction: 0,
      totalRevenue: 0,
      uniqueCustomers: 0,
      merchantCount: 0,
    };

    return {
      totalMerchants: merchantCount,
      totalConversations: data.totalConversations,
      totalAgents: agentSum[0]?.total || 0,
      avgSatisfaction: data.totalSatisfaction || 0,
      totalRevenue: data.totalRevenue || 0,
      period: { start: startDate, end: endDate },
    };
  }

  async getAggregatedTrends(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<AggregatedTrend[]> {
    // Build date format based on granularity
    let dateFormat: string;
    switch (granularity) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'week':
        dateFormat = '%Y-W%v';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const trends = await AggregatedMetric.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$date' } },
          },
          conversations: { $sum: '$totalConversations' },
          satisfaction: { $avg: '$totalSatisfaction' },
          revenue: { $sum: '$totalRevenue' },
        },
      },
      { $sort: { '_id.date': 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          conversations: 1,
          satisfaction: { $round: ['$satisfaction', 2] },
          revenue: 1,
        },
      },
    ]);

    return trends;
  }

  async getTopMerchants(
    metric: 'conversations' | 'satisfaction' | 'revenue',
    limit: number = 10
  ): Promise<MerchantSummaryData[]> {
    let sortField: string;
    switch (metric) {
      case 'conversations':
        sortField = 'totalConversations';
        break;
      case 'satisfaction':
        sortField = 'avgSatisfaction';
        break;
      case 'revenue':
        sortField = 'totalRevenue';
        break;
    }

    const top = await MerchantSummary.find()
      .sort({ [sortField]: -1 })
      .limit(limit);

    return top.map(c => ({
      merchantId: c.merchantId,
      name: c.name,
      tier: c.tier,
      activeAgents: c.activeAgents,
      totalConversations: c.totalConversations,
      avgSatisfaction: c.avgSatisfaction,
      lastActivity: c.lastActivity,
    }));
  }

  async getMerchantComparison(
    merchantIds: string[]
  ): Promise<Record<string, MerchantSummaryData>> {
    const merchants = await MerchantSummary.find({
      merchantId: { $in: merchantIds },
    });

    const result: Record<string, MerchantSummaryData> = {};
    for (const m of merchants) {
      result[m.merchantId] = {
        merchantId: m.merchantId,
        name: m.name,
        tier: m.tier,
        activeAgents: m.activeAgents,
        totalConversations: m.totalConversations,
        avgSatisfaction: m.avgSatisfaction,
        lastActivity: m.lastActivity,
      };
    }

    return result;
  }

  private async refreshCache(): Promise<void> {
    logger.info('[AggregatedAnalytics] Refreshing merchant cache from upstream services');

    try {
      const response = await this.merchantAnalyticsClient.get('/merchants/all/summaries');
      const summaries = response.data || [];

      for (const s of summaries) {
        await MerchantSummary.findOneAndUpdate(
          { merchantId: s.merchantId },
          {
            merchantId: s.merchantId,
            name: s.name,
            slug: s.slug || s.merchantId,
            tier: s.tier || 'basic',
            industry: s.industry || 'general',
            activeAgents: s.activeAgents || 0,
            totalConversations: s.totalConversations || 0,
            avgSatisfaction: s.avgSatisfaction || 0,
            totalRevenue: s.totalRevenue || 0,
            lastActivity: new Date(),
          },
          { upsert: true }
        );
      }

      logger.info(`[AggregatedAnalytics] Refreshed ${summaries.length} merchants`);
    } catch (error) {
      logger.error('[AggregatedAnalytics] Cache refresh failed', error);
    }
  }
}

export const aggregatedAnalyticsService = new AggregatedAnalyticsService();
export default aggregatedAnalyticsService;
