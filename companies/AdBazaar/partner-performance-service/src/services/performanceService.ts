import { v4 as uuidv4 } from 'uuid';
import { Performance, IPerformance } from '../models/Performance';
import logger from 'utils/logger.js';

export interface PerformanceData {
  partnerId: string;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  totalSpend: number;
}

class PerformanceService {
  /**
   * Calculate and store performance metrics
   */
  async calculatePerformance(
    partnerId: string,
    data: PerformanceData,
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<IPerformance> {
    const performanceId = `perf-${uuidv4().slice(0, 12)}`;

    // Calculate period dates
    const now = new Date();
    const period = this.getPeriodDates(periodType, now);

    // Get previous period data
    const previousPeriod = this.getPreviousPeriodDates(periodType, now);

    // Calculate metrics
    const ctr = data.clicks > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const conversionRate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
    const avgOrderValue = data.conversions > 0 ? data.revenue / data.conversions : 0;
    const roi = data.totalSpend > 0 ? ((data.revenue - data.totalSpend) / data.totalSpend) * 100 : 0;

    // Get previous period performance for comparison
    const previousPerformance = await Performance.findOne({
      partnerId,
      'period.type': periodType,
      'period.start': { $gte: previousPeriod.start, $lt: previousPeriod.end },
    });

    // Calculate percent changes
    const percentChange = {
      revenue: previousPerformance?.metrics.revenue
        ? ((data.revenue - previousPerformance.metrics.revenue) / previousPerformance.metrics.revenue) * 100
        : 0,
      conversions: previousPerformance?.metrics.conversions
        ? ((data.conversions - previousPerformance.metrics.conversions) / previousPerformance.metrics.conversions) * 100
        : 0,
      clicks: previousPerformance?.metrics.clicks
        ? ((data.clicks - previousPerformance.metrics.clicks) / previousPerformance.metrics.clicks) * 100
        : 0,
      ctr: 0,
      conversionRate: 0,
    };

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore({
      revenue: data.revenue,
      conversionRate,
      ctr,
      roi,
    });

    const performance = new Performance({
      performanceId,
      partnerId,
      period: {
        start: period.start,
        end: period.end,
        type: periodType,
      },
      metrics: {
        revenue: data.revenue,
        conversions: data.conversions,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr,
        conversionRate,
        avgOrderValue,
        totalSpend: data.totalSpend,
        roi,
      },
      comparison: {
        previousPeriod: {
          revenue: previousPerformance?.metrics.revenue || 0,
          conversions: previousPerformance?.metrics.conversions || 0,
          clicks: previousPerformance?.metrics.clicks || 0,
        },
        percentChange,
      },
      rankings: {
        tier: this.getTierFromScore(performanceScore),
        categoryRank: 0,
        overallRank: 0,
        performanceScore,
      },
      trends: [],
    });

    await performance.save();
    logger.info('Performance calculated', { performanceId, partnerId, performanceScore });

    return performance;
  }

  /**
   * Get period dates
   */
  private getPeriodDates(
    periodType: string,
    date: Date
  ): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);

    switch (periodType) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(date.getDate() - date.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(quarter * 3 + 3);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11);
        end.setDate(31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Get previous period dates
   */
  private getPreviousPeriodDates(
    periodType: string,
    date: Date
  ): { start: Date; end: Date } {
    const period = this.getPeriodDates(periodType, date);
    const prevStart = new Date(period.start);
    const prevEnd = new Date(period.end);

    switch (periodType) {
      case 'daily':
        prevStart.setDate(prevStart.getDate() - 1);
        prevEnd.setDate(prevEnd.getDate() - 1);
        break;
      case 'weekly':
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd.setDate(prevEnd.getDate() - 7);
        break;
      case 'monthly':
        prevStart.setMonth(prevStart.getMonth() - 1);
        prevEnd.setMonth(prevEnd.getMonth() - 1);
        break;
      case 'quarterly':
        prevStart.setMonth(prevStart.getMonth() - 3);
        prevEnd.setMonth(prevEnd.getMonth() - 3);
        break;
      case 'yearly':
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        prevEnd.setFullYear(prevEnd.getFullYear() - 1);
        break;
    }

    return { start: prevStart, end: prevEnd };
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(data: {
    revenue: number;
    conversionRate: number;
    ctr: number;
    roi: number;
  }): number {
    // Weighted scoring (0-100)
    const revenueScore = Math.min(data.revenue / 10000, 1) * 30; // 30% weight
    const conversionScore = Math.min(data.conversionRate / 10, 1) * 25; // 25% weight
    const ctrScore = Math.min(data.ctr / 5, 1) * 25; // 25% weight
    const roiScore = Math.min(Math.max(data.roi + 100, 0) / 200, 1) * 20; // 20% weight

    return Math.round(revenueScore + conversionScore + ctrScore + roiScore);
  }

  /**
   * Get tier from score
   */
  private getTierFromScore(score: number): string {
    if (score >= 80) return 'platinum';
    if (score >= 60) return 'gold';
    if (score >= 40) return 'silver';
    return 'bronze';
  }

  /**
   * Get performance by partner
   */
  async getPerformance(
    partnerId: string,
    periodType?: string,
    limit: number = 12
  ): Promise<IPerformance[]> {
    const query: Record<string, unknown> = { partnerId };
    if (periodType) query['period.type'] = periodType;

    return Performance.find(query)
      .sort({ 'period.start': -1 })
      .limit(limit);
  }

  /**
   * Get performance by ID
   */
  async getPerformanceById(performanceId: string): Promise<IPerformance | null> {
    return Performance.findOne({ performanceId });
  }

  /**
   * Get aggregate performance for partner
   */
  async getAggregatePerformance(
    partnerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalConversions: number;
    totalClicks: number;
    avgCtr: number;
    avgConversionRate: number;
    avgRoi: number;
  }> {
    const results = await Performance.aggregate([
      {
        $match: {
          partnerId,
          'period.start': { $gte: startDate },
          'period.end': { $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$metrics.revenue' },
          totalConversions: { $sum: '$metrics.conversions' },
          totalClicks: { $sum: '$metrics.clicks' },
          totalImpressions: { $sum: '$metrics.impressions' },
          avgCtr: { $avg: '$metrics.ctr' },
          avgConversionRate: { $avg: '$metrics.conversionRate' },
          avgRoi: { $avg: '$metrics.roi' },
        },
      },
    ]);

    if (results.length === 0) {
      return {
        totalRevenue: 0,
        totalConversions: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgConversionRate: 0,
        avgRoi: 0,
      };
    }

    return {
      totalRevenue: results[0].totalRevenue,
      totalConversions: results[0].totalConversions,
      totalClicks: results[0].totalClicks,
      avgCtr: results[0].avgCtr || 0,
      avgConversionRate: results[0].avgConversionRate || 0,
      avgRoi: results[0].avgRoi || 0,
    };
  }
}

export const performanceService = new PerformanceService();
export default performanceService;