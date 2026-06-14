import { DealAnalytics, IDealAnalytics, IDealAnalyticsDocument } from '../models/DealAnalytics';
import { Deal } from '../models/Deal';
import { logger } from '../utils/logger';

interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
}

interface AggregatedAnalytics {
  dealId: string;
  impressions: {
    total: number;
    viewable: number;
    viewabilityRate: number;
  };
  clicks: {
    total: number;
    clickThroughRate: number;
  };
  spend: {
    total: number;
    currency: string;
  };
  performance: {
    cpm: number;
    cpc: number;
  };
  pacing: {
    percentComplete: number;
  };
  inventory: {
    fillRate: number;
    bidRate: number;
  };
}

export const analyticsService = {
  async getDealAnalytics(dealId: string, startDate?: string, endDate?: string): Promise<{
    aggregated: AggregatedAnalytics;
    daily: IDealAnalyticsDocument[];
  }> {
    const match: Record<string, any> = { dealId };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = startDate;
      if (endDate) match.date.$lte = endDate;
    }

    const daily = await DealAnalytics.find(match).sort({ date: 1 });

    if (daily.length === 0) {
      return {
        aggregated: {
          dealId,
          impressions: { total: 0, viewable: 0, viewabilityRate: 0 },
          clicks: { total: 0, clickThroughRate: 0 },
          spend: { total: 0, currency: 'USD' },
          performance: { cpm: 0, cpc: 0 },
          pacing: { percentComplete: 0 },
          inventory: { fillRate: 0, bidRate: 0 },
        },
        daily: [],
      };
    }

    const aggregated = await DealAnalytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$dealId',
          totalImpressions: { $sum: '$impressions.total' },
          totalViewable: { $sum: '$impressions.viewable' },
          totalMeasurable: { $sum: '$impressions.measurable' },
          totalClicks: { $sum: '$clicks.total' },
          totalSpend: { $sum: '$spend.total' },
          totalInventory: { $sum: '$inventory.total' },
          totalFilled: { $sum: '$inventory.filled' },
          totalBidRequests: { $sum: '$inventory.bidRequests' },
          totalBids: { $sum: '$inventory.bids' },
        },
      },
    ]);

    const agg = aggregated[0] || {};
    const totalImpressions = agg.totalImpressions || 0;
    const totalViewable = agg.totalViewable || 0;
    const totalMeasurable = agg.totalMeasurable || 0;
    const totalClicks = agg.totalClicks || 0;
    const totalSpend = agg.totalSpend || 0;
    const totalBidRequests = agg.totalBidRequests || 0;
    const totalBids = agg.totalBids || 0;

    return {
      aggregated: {
        dealId,
        impressions: {
          total: totalImpressions,
          viewable: totalViewable,
          viewabilityRate: totalMeasurable > 0 ? (totalViewable / totalMeasurable) * 100 : 0,
        },
        clicks: {
          total: totalClicks,
          clickThroughRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        },
        spend: {
          total: totalSpend,
          currency: 'USD',
        },
        performance: {
          cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
          cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        },
        pacing: {
          percentComplete: 0,
        },
        inventory: {
          fillRate: totalBidRequests > 0 ? (totalBids / totalBidRequests) * 100 : 0,
          bidRate: totalBidRequests > 0 ? (totalBids / totalBidRequests) * 100 : 0,
        },
      },
      daily,
    };
  },

  async recordDailyAnalytics(
    dealId: string,
    data: Partial<IDealAnalytics>
  ): Promise<IDealAnalyticsDocument> {
    const today = new Date().toISOString().split('T')[0];

    const existing = await DealAnalytics.findOne({ dealId, date: today });

    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      logger.debug('Daily analytics updated', { dealId, date: today });
      return existing;
    }

    const analytics = new DealAnalytics({
      dealId,
      date: today,
      impressions: data.impressions || { total: 0, measurable: 0, viewable: 0, viewabilityRate: 0 },
      clicks: data.clicks || { total: 0, viewThrough: 0, clickThroughRate: 0 },
      spend: data.spend || { total: 0, daily: 0, remaining: 0, currency: 'USD' },
      pacing: data.pacing || { daily: 0, weekly: 0, monthly: 0, target: 0, actual: 0, variance: 0, percentComplete: 0 },
      performance: data.performance || { cpm: 0, cpc: 0, cpa: 0, roas: 0, conversionRate: 0 },
      inventory: data.inventory || { total: 0, filled: 0, fillRate: 0, bidRequests: 0, bids: 0, bidRate: 0 },
      errors: data.errors || { noFill: 0, timeout: 0, invalid: 0, rateLimit: 0 },
      metadata: data.metadata,
    });

    await analytics.save();
    logger.debug('Daily analytics recorded', { dealId, date: today });
    return analytics;
  },

  async updateAnalytics(
    dealId: string,
    date: string,
    data: Partial<IDealAnalytics>
  ): Promise<IDealAnalyticsDocument | null> {
    return DealAnalytics.findOneAndUpdate(
      { dealId, date },
      { $set: data },
      { new: true, upsert: true }
    );
  },

  async incrementImpressions(dealId: string, date: string, count: number = 1): Promise<void> {
    const today = date || new Date().toISOString().split('T')[0];
    await DealAnalytics.findOneAndUpdate(
      { dealId, date: today },
      { $inc: { 'impressions.total': count } },
      { upsert: true, new: true }
    );
  },

  async incrementClicks(dealId: string, date: string, count: number = 1): Promise<void> {
    const today = date || new Date().toISOString().split('T')[0];
    await DealAnalytics.findOneAndUpdate(
      { dealId, date: today },
      { $inc: { 'clicks.total': count } },
      { upsert: true, new: true }
    );
  },

  async addSpend(dealId: string, date: string, amount: number): Promise<void> {
    const today = date || new Date().toISOString().split('T')[0];
    await DealAnalytics.findOneAndUpdate(
      { dealId, date: today },
      {
        $inc: { 'spend.total': amount, 'spend.daily': amount, 'spend.remaining': -amount },
      },
      { upsert: true, new: true }
    );
  },

  async getAnalyticsByDateRange(
    dealId: string,
    startDate: string,
    endDate: string
  ): Promise<IDealAnalyticsDocument[]> {
    return DealAnalytics.find({
      dealId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });
  },

  async getTopPerformingDeals(
    limit: number = 10,
    sortBy: 'cpm' | 'cpc' | 'impressions' = 'cpm'
  ): Promise<IDealAnalyticsDocument[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0];

    const pipeline: any[] = [
      { $match: { date } },
      {
        $group: {
          _id: '$dealId',
          totalImpressions: { $sum: '$impressions.total' },
          totalSpend: { $sum: '$spend.total' },
          avgCPM: { $avg: '$performance.cpm' },
          avgCPC: { $avg: '$performance.cpc' },
        },
      },
    ];

    if (sortBy === 'cpm') {
      pipeline.push({ $sort: { avgCPM: -1 } });
    } else if (sortBy === 'cpc') {
      pipeline.push({ $sort: { avgCPC: -1 } });
    } else {
      pipeline.push({ $sort: { totalImpressions: -1 } });
    }

    pipeline.push({ $limit: limit });

    const results = await DealAnalytics.aggregate(pipeline);
    const dealIds = results.map((r) => r._id);

    return DealAnalytics.find({ dealId: { $in: dealIds }, date }).sort({ date: -1 });
  },

  async getDealPerformanceSummary(dealId: string): Promise<{
    lifetime: AggregatedAnalytics;
    last7Days: AggregatedAnalytics;
    last30Days: AggregatedAnalytics;
  }> {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [lifetime, last7, last30] = await Promise.all([
      this.getDealAnalytics(dealId),
      this.getDealAnalytics(dealId, '1970-01-01', today),
      this.getDealAnalytics(dealId, last30Days, today),
      this.getDealAnalytics(dealId, last7Days, today),
    ]);

    return {
      lifetime: lifetime.aggregated,
      last7Days: last7.aggregated,
      last30Days: last30.aggregated,
    };
  },

  async cleanupOldAnalytics(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const result = await DealAnalytics.deleteMany({ date: { $lt: cutoff } });
    logger.info('Old analytics cleaned up', { cutoff, deleted: result.deletedCount });
    return result.deletedCount;
  },
};