/**
 * REZ Revenue AI - Database Service
 * Provides database access to all services
 */

import mongoose, { Model, Document } from 'mongoose';
import {
  MerchantConfig,
  PricingHistory,
  BenchmarkScore,
  Campaign,
  CustomerSegment,
  RevenuePlan,
  CashbackTransaction,
  IMerchantConfig,
  IPricingHistory,
  IBenchmarkScore,
  ICampaign,
  ICustomerSegment,
  IRevenuePlan,
  ICashbackTransaction,
} from './schemas';

// ============================================================
// DATABASE SERVICE
// ============================================================

class DatabaseService {
  private connected = false;
  private uri: string;

  constructor(uri?: string) {
    this.uri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-revenue-ai';
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await mongoose.connect(this.uri);
      this.connected = true;
      console.log('✅ MongoDB connected:', this.uri);
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await mongoose.disconnect();
    this.connected = false;
    console.log('MongoDB disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ============================================================
  // MERCHANT CONFIG
  // ============================================================

  async getMerchantConfig(merchantId: string): Promise<IMerchantConfig | null> {
    return MerchantConfig.findOne({ merchantId });
  }

  async createMerchantConfig(data: Partial<IMerchantConfig>): Promise<IMerchantConfig> {
    const config = new MerchantConfig(data);
    return config.save();
  }

  async updateMerchantConfig(merchantId: string, data: Partial<IMerchantConfig>): Promise<IMerchantConfig | null> {
    return MerchantConfig.findOneAndUpdate({ merchantId }, data, { new: true });
  }

  // ============================================================
  // PRICING HISTORY
  // ============================================================

  async recordPricing(data: Partial<IPricingHistory>): Promise<IPricingHistory> {
    const record = new PricingHistory(data);
    return record.save();
  }

  async getPricingHistory(
    merchantId: string,
    options: { entityId?: string; limit?: number; startDate?: Date; endDate?: Date }
  ): Promise<IPricingHistory[]> {
    const query: Record<string, unknown> = { merchantId };

    if (options.entityId) query.entityId = options.entityId;
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) (query.createdAt as any).$gte = options.startDate;
      if (options.endDate) (query.createdAt as any).$lte = options.endDate;
    }

    return PricingHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100);
  }

  async getPricingStats(merchantId: string, period: 'day' | 'week' | 'month') {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await PricingHistory.aggregate([
      { $match: { merchantId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalAdjustments: { $sum: '$adjustment' },
          avgAdjustment: { $avg: '$adjustment' },
          maxAdjustment: { $max: '$adjustment' },
          minAdjustment: { $min: '$adjustment' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' },
        },
      },
    ]);

    return stats[0] || { totalAdjustments: 0, avgAdjustment: 0, count: 0, totalRevenue: 0 };
  }

  // ============================================================
  // BENCHMARK SCORES
  // ============================================================

  async recordBenchmark(data: Partial<IBenchmarkScore>): Promise<IBenchmarkScore> {
    const record = new BenchmarkScore(data);
    return record.save();
  }

  async getLatestBenchmark(merchantId: string): Promise<IBenchmarkScore | null> {
    return BenchmarkScore.findOne({ merchantId }).sort({ calculatedAt: -1 });
  }

  async getBenchmarkHistory(merchantId: string, limit: number = 12): Promise<IBenchmarkScore[]> {
    return BenchmarkScore.find({ merchantId })
      .sort({ calculatedAt: -1 })
      .limit(limit);
  }

  async getBenchmarkTrend(merchantId: string): Promise<{ trend: string; change: number }> {
    const history = await this.getBenchmarkHistory(merchantId, 4);

    if (history.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const latest = history[0].overallScore;
    const previous = history[1].overallScore;
    const change = latest - previous;

    return {
      trend: change > 2 ? 'increasing' : change < -2 ? 'decreasing' : 'stable',
      change,
    };
  }

  // ============================================================
  // CAMPAIGNS
  // ============================================================

  async createCampaign(data: Partial<ICampaign>): Promise<ICampaign> {
    const campaign = new Campaign(data);
    return campaign.save();
  }

  async getCampaign(campaignId: string): Promise<ICampaign | null> {
    return Campaign.findOne({ campaignId });
  }

  async getMerchantCampaigns(merchantId: string, status?: string): Promise<ICampaign[]> {
    const query: Record<string, unknown> = { merchantId };
    if (status) query.status = status;
    return Campaign.find(query).sort({ createdAt: -1 });
  }

  async updateCampaignStats(campaignId: string, stats: Partial<ICampaign['stats']>): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { campaignId },
      { $set: { stats, ...(stats.converted ? { status: 'completed' } : {}) },
      { new: true }
    );
  }

  // ============================================================
  // CUSTOMER SEGMENTS
  // ============================================================

  async saveSegments(merchantId: string, segments: Partial<ICustomerSegment>[]): Promise<void> {
    await CustomerSegment.deleteMany({ merchantId });
    if (segments.length > 0) {
      await CustomerSegment.insertMany(segments.map(s => ({ ...s, merchantId })));
    }
  }

  async getSegments(merchantId: string): Promise<ICustomerSegment[]> {
    return CustomerSegment.find({ merchantId });
  }

  async getSegmentSummary(merchantId: string): Promise<{ id: string; name: string; count: number; percentage: number }[]> {
    const segments = await CustomerSegment.find({ merchantId });
    return segments.map(s => ({
      id: s.segment.id,
      name: s.segment.name,
      count: s.count,
      percentage: s.percentage,
    }));
  }

  // ============================================================
  // REVENUE PLANS
  // ============================================================

  async createRevenuePlan(data: Partial<IRevenuePlan>): Promise<IRevenuePlan> {
    const plan = new RevenuePlan(data);
    return plan.save();
  }

  async getActiveRevenuePlan(merchantId: string): Promise<IRevenuePlan | null> {
    return RevenuePlan.findOne({ merchantId, status: 'active' });
  }

  async updateRecommendationStatus(
    planId: string,
    recommendationId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<IRevenuePlan | null> {
    return RevenuePlan.findOneAndUpdate(
      { planId, 'recommendations.id': recommendationId },
      { $set: { 'recommendations.$.status': status } },
      { new: true }
    );
  }

  // ============================================================
  // CASHBACK TRANSACTIONS
  // ============================================================

  async recordCashback(data: Partial<ICashbackTransaction>): Promise<ICashbackTransaction> {
    const transaction = new CashbackTransaction(data);
    return transaction.save();
  }

  async getCashbackHistory(merchantId: string, limit: number = 50): Promise<ICashbackTransaction[]> {
    return CashbackTransaction.find({ merchantId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getCashbackStats(merchantId: string, period: 'day' | 'week' | 'month'): Promise<{ total: number; count: number; avg: number }> {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await CashbackTransaction.aggregate([
      { $match: { merchantId, createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        },
      },
    ]);

    return stats[0] || { total: 0, count: 0, avg: 0 };
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

export default DatabaseService;
