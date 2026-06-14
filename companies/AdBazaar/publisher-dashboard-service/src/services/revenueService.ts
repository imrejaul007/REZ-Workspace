import { RevenueAnalytics } from '../models';
import { cacheGet, cacheSet } from '../utils/cache';
import { dashboardQueriesTotal, dashboardQueryDuration, revenueTotal } from '../utils/metrics';
import logger from '../utils/logger';

const serviceLogger = logger.child({ service: 'revenueService' });

export interface RevenueSummary {
  total: number;
  byFormat: {
    display: number;
    video: number;
    native: number;
    richMedia: number;
  };
  byPeriod: Array<{
    date: string;
    revenue: number;
    impressions: number;
    ecpm: number;
  }>;
  trends: {
    dayOverDay: number;
    weekOverWeek: number;
    monthOverMonth: number;
  };
}

export interface RevenueByCountry {
  country: string;
  revenue: number;
  impressions: number;
  ecpm: number;
  percentage: number;
}

export interface RevenueByDevice {
  deviceType: string;
  revenue: number;
  impressions: number;
  ecpm: number;
  percentage: number;
}

export class RevenueService {
  /**
   * Get revenue analytics for a publisher
   */
  async getRevenueAnalytics(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<RevenueSummary> {
    const startTime = Date.now();
    const cacheKey = `revenue:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}:${groupBy}`;

    // Check cache
    const cached = await cacheGet<RevenueSummary>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ type: 'revenue', publisher_id: publisherId });
      return cached;
    }

    try {
      // Aggregate revenue data
      const aggregation = await RevenueAnalytics.aggregateByDateRange(
        publisherId,
        startDate,
        endDate,
        groupBy
      );

      // Calculate totals
      const total = aggregation.reduce((sum, item) => sum + item.totalRevenue, 0);

      // Calculate by format
      const byFormat = {
        display: aggregation.reduce((sum, item) => sum + item.displayRevenue, 0),
        video: aggregation.reduce((sum, item) => sum + item.videoRevenue, 0),
        native: aggregation.reduce((sum, item) => sum + item.nativeRevenue, 0),
        richMedia: aggregation.reduce((sum, item) => sum + item.richMediaRevenue, 0)
      };

      // Calculate trends
      const trends = await this.calculateTrends(publisherId, startDate, endDate);

      const revenueSummary: RevenueSummary = {
        total,
        byFormat,
        byPeriod: aggregation.map(item => ({
          date: item._id.date,
          revenue: item.totalRevenue,
          impressions: item.totalImpressions,
          ecpm: item.avgEcpm || 0
        })),
        trends
      };

      // Cache for 10 minutes
      await cacheSet(cacheKey, revenueSummary, 600);
      dashboardQueriesTotal.inc({ type: 'revenue', publisher_id: publisherId });
      dashboardQueryDuration.observe({ type: 'revenue' }, (Date.now() - startTime) / 1000);
      revenueTotal.set({ publisher_id: publisherId, currency: 'USD' }, total);

      return revenueSummary;
    } catch (error) {
      serviceLogger.error('Error getting revenue analytics', {
        publisherId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get revenue by ad format
   */
  async getRevenueByFormat(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    display: { revenue: number; impressions: number; ecpm: number };
    video: { revenue: number; impressions: number; ecpm: number };
    native: { revenue: number; impressions: number; ecpm: number };
    richMedia: { revenue: number; impressions: number; ecpm: number };
  }> {
    const cacheKey = `revenue-format:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await RevenueAnalytics.getRevenueByFormat(publisherId, startDate, endDate);

    const formatData = {
      display: {
        revenue: result.display || 0,
        impressions: result.displayImpressions || 0,
        ecpm: result.displayImpressions > 0 ? (result.display / result.displayImpressions) * 1000 : 0
      },
      video: {
        revenue: result.video || 0,
        impressions: result.videoImpressions || 0,
        ecpm: result.videoImpressions > 0 ? (result.video / result.videoImpressions) * 1000 : 0
      },
      native: {
        revenue: result.native || 0,
        impressions: result.nativeImpressions || 0,
        ecpm: result.nativeImpressions > 0 ? (result.native / result.nativeImpressions) * 1000 : 0
      },
      richMedia: {
        revenue: result.richMedia || 0,
        impressions: result.richMediaImpressions || 0,
        ecpm: result.richMediaImpressions > 0 ? (result.richMedia / result.richMediaImpressions) * 1000 : 0
      }
    };

    await cacheSet(cacheKey, formatData, 600);
    return formatData;
  }

  /**
   * Get revenue by country
   */
  async getRevenueByCountry(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<RevenueByCountry[]> {
    const cacheKey = `revenue-country:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}:${limit}`;

    const cached = await cacheGet<RevenueByCountry[]>(cacheKey);
    if (cached) return cached;

    const result = await RevenueAnalytics.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$metadata.country',
          revenue: { $sum: '$revenue.total' },
          impressions: { $sum: '$impressions.total' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);

    const totalRevenue = result.reduce((sum, item) => sum + item.revenue, 0);

    const countryData: RevenueByCountry[] = result.map(item => ({
      country: item._id || 'Unknown',
      revenue: item.revenue,
      impressions: item.impressions,
      ecpm: item.impressions > 0 ? (item.revenue / item.impressions) * 1000 : 0,
      percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
    }));

    await cacheSet(cacheKey, countryData, 600);
    return countryData;
  }

  /**
   * Get revenue by device type
   */
  async getRevenueByDevice(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueByDevice[]> {
    const cacheKey = `revenue-device:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet<RevenueByDevice[]>(cacheKey);
    if (cached) return cached;

    const result = await RevenueAnalytics.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$metadata.deviceType',
          revenue: { $sum: '$revenue.total' },
          impressions: { $sum: '$impressions.total' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = result.reduce((sum, item) => sum + item.revenue, 0);

    const deviceData: RevenueByDevice[] = result.map(item => ({
      deviceType: item._id || 'unknown',
      revenue: item.revenue,
      impressions: item.impressions,
      ecpm: item.impressions > 0 ? (item.revenue / item.impressions) * 1000 : 0,
      percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
    }));

    await cacheSet(cacheKey, deviceData, 600);
    return deviceData;
  }

  /**
   * Get hourly revenue patterns
   */
  async getHourlyPatterns(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ hour: number; revenue: number; impressions: number; ecpm: number }>> {
    const cacheKey = `revenue-hourly:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await RevenueAnalytics.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$hourOfDay',
          revenue: { $sum: '$revenue.total' },
          impressions: { $sum: '$impressions.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const hourlyData = result.map(item => ({
      hour: item._id,
      revenue: item.revenue,
      impressions: item.impressions,
      ecpm: item.impressions > 0 ? (item.revenue / item.impressions) * 1000 : 0
    }));

    // Fill in missing hours
    const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
      const existing = hourlyData.find(h => h.hour === i);
      return existing || { hour: i, revenue: 0, impressions: 0, ecpm: 0 };
    });

    await cacheSet(cacheKey, fullHourlyData, 600);
    return fullHourlyData;
  }

  /**
   * Get day of week patterns
   */
  async getDayOfWeekPatterns(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ dayOfWeek: number; dayName: string; revenue: number; impressions: number; ecpm: number }>> {
    const cacheKey = `revenue-dow:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await RevenueAnalytics.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          revenue: { $sum: '$revenue.total' },
          impressions: { $sum: '$impressions.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dowData = result.map(item => ({
      dayOfWeek: item._id,
      dayName: dayNames[item._id] || 'Unknown',
      revenue: item.revenue,
      impressions: item.impressions,
      ecpm: item.impressions > 0 ? (item.revenue / item.impressions) * 1000 : 0
    }));

    // Fill in missing days
    const fullDowData = Array.from({ length: 7 }, (_, i) => {
      const existing = dowData.find(d => d.dayOfWeek === i);
      return existing || { dayOfWeek: i, dayName: dayNames[i], revenue: 0, impressions: 0, ecpm: 0 };
    });

    await cacheSet(cacheKey, fullDowData, 600);
    return fullDowData;
  }

  /**
   * Calculate revenue trends
   */
  private async calculateTrends(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ dayOverDay: number; weekOverWeek: number; monthOverMonth: number }> {
    const now = new Date();
    const dayAgo = new Date(now);
    dayAgo.setDate(dayAgo.getDate() - 1);
    const dayAgoStart = new Date(dayAgo.setHours(0, 0, 0, 0));
    const dayAgoEnd = new Date(dayAgo.setHours(23, 59, 59, 999));

    const twoDaysAgoStart = new Date(dayAgo);
    twoDaysAgoStart.setDate(twoDaysAgoStart.getDate() - 1);

    const weekAgoStart = new Date(now);
    weekAgoStart.setDate(weekAgoStart.getDate() - 7);
    const weekAgoEnd = new Date(weekAgoStart);
    weekAgoEnd.setDate(weekAgoEnd.getDate() - 1);

    const twoWeeksAgoStart = new Date(weekAgoStart);
    twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7);

    const monthAgoStart = new Date(now);
    monthAgoStart.setMonth(monthAgoStart.getMonth() - 1);
    const monthAgoEnd = new Date(monthAgoStart);
    monthAgoEnd.setDate(monthAgoEnd.getDate() - 1);

    const twoMonthsAgoStart = new Date(monthAgoStart);
    twoMonthsAgoStart.setMonth(twoMonthsAgoStart.getMonth() - 1);

    const [
      todayRevenue,
      yesterdayRevenue,
      lastWeekRevenue,
      weekAgoRevenue,
      lastMonthRevenue,
      monthAgoRevenue
    ] = await Promise.all([
      this.getTotalRevenue(publisherId, dayAgoStart, dayAgoEnd),
      this.getTotalRevenue(publisherId, twoDaysAgoStart, dayAgoStart),
      this.getTotalRevenue(publisherId, weekAgoStart, weekAgoEnd),
      this.getTotalRevenue(publisherId, twoWeeksAgoStart, weekAgoStart),
      this.getTotalRevenue(publisherId, monthAgoStart, monthAgoEnd),
      this.getTotalRevenue(publisherId, twoMonthsAgoStart, monthAgoStart)
    ]);

    return {
      dayOverDay: this.calculateChangePercent(yesterdayRevenue, todayRevenue),
      weekOverWeek: this.calculateChangePercent(weekAgoRevenue, lastWeekRevenue),
      monthOverMonth: this.calculateChangePercent(monthAgoRevenue, lastMonthRevenue)
    };
  }

  private async getTotalRevenue(publisherId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await RevenueAnalytics.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$revenue.total' }
        }
      }
    ]);
    return result[0]?.total || 0;
  }

  private calculateChangePercent(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

export const revenueService = new RevenueService();
export default revenueService;