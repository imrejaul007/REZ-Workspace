import { PerformanceMetric } from '../models';
import { cacheGet, cacheSet } from '../utils/cache';
import { dashboardQueriesTotal, dashboardQueryDuration, impressionsTotal } from '../utils/metrics';
import logger from '../utils/logger';

const serviceLogger = logger.child({ service: 'performanceService' });

export interface PerformanceSummary {
  impressions: {
    total: number;
    viewable: number;
    billable: number;
    viewabilityRate: number;
  };
  clicks: {
    total: number;
    ctr: number;
  };
  fillRate: {
    fillRate: number;
    bidRate: number;
    winningBidRate: number;
  };
  revenue: {
    total: number;
    ecpm: number;
    cpc: number;
  };
  byFormat: {
    display: any;
    video: any;
    native: any;
    richMedia: any;
  };
}

export interface TopPerformer {
  adUnitId: string;
  revenue: number;
  impressions: number;
  ctr: number;
  ecpm: number;
  fillRate: number;
}

export class PerformanceService {
  /**
   * Get performance metrics for a publisher
   */
  async getPerformanceMetrics(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceSummary> {
    const startTime = Date.now();
    const cacheKey = `performance:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    // Check cache
    const cached = await cacheGet<PerformanceSummary>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ type: 'performance', publisher_id: publisherId });
      return cached;
    }

    try {
      // Aggregate performance data
      const result = await PerformanceMetric.aggregate([
        {
          $match: {
            publisherId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalImpressions: { $sum: '$impressions.total' },
            viewableImpressions: { $sum: '$impressions.viewable' },
            billableImpressions: { $sum: '$impressions.billable' },
            totalClicks: { $sum: '$clicks' },
            totalRevenue: { $sum: '$revenue' },
            avgCtr: { $avg: '$ctr' },
            avgFillRate: { $avg: '$fillRate' },
            avgBidRate: { $avg: '$bidRate' },
            avgWinningBidRate: { $avg: '$winningBidRate' },
            avgEcpm: { $avg: '$ecpm' }
          }
        }
      ]);

      const data = result[0] || {
        totalImpressions: 0,
        viewableImpressions: 0,
        billableImpressions: 0,
        totalClicks: 0,
        totalRevenue: 0,
        avgCtr: 0,
        avgFillRate: 0,
        avgBidRate: 0,
        avgWinningBidRate: 0,
        avgEcpm: 0
      };

      // Get by format breakdown
      const byFormat = await this.getPerformanceByFormat(publisherId, startDate, endDate);

      const performanceSummary: PerformanceSummary = {
        impressions: {
          total: data.totalImpressions,
          viewable: data.viewableImpressions,
          billable: data.billableImpressions,
          viewabilityRate: data.totalImpressions > 0
            ? (data.viewableImpressions / data.totalImpressions) * 100
            : 0
        },
        clicks: {
          total: data.totalClicks,
          ctr: data.totalImpressions > 0
            ? (data.totalClicks / data.totalImpressions) * 100
            : 0
        },
        fillRate: {
          fillRate: data.avgFillRate || 0,
          bidRate: data.avgBidRate || 0,
          winningBidRate: data.avgWinningBidRate || 0
        },
        revenue: {
          total: data.totalRevenue,
          ecpm: data.avgEcpm || 0,
          cpc: data.totalClicks > 0 ? data.totalRevenue / data.totalClicks : 0
        },
        byFormat
      };

      // Cache for 5 minutes
      await cacheSet(cacheKey, performanceSummary, 300);
      dashboardQueriesTotal.inc({ type: 'performance', publisher_id: publisherId });
      dashboardQueryDuration.observe({ type: 'performance' }, (Date.now() - startTime) / 1000);
      impressionsTotal.set({ publisher_id: publisherId }, data.totalImpressions);

      return performanceSummary;
    } catch (error) {
      serviceLogger.error('Error getting performance metrics', {
        publisherId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get performance by ad format
   */
  async getPerformanceByFormat(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    const cacheKey = `performance-format:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await PerformanceMetric.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$adFormat',
          impressions: { $sum: '$impressions.total' },
          viewable: { $sum: '$impressions.viewable' },
          clicks: { $sum: '$clicks' },
          revenue: { $sum: '$revenue' },
          avgCtr: { $avg: '$ctr' },
          avgEcpm: { $avg: '$ecpm' },
          avgFillRate: { $avg: '$fillRate' }
        }
      }
    ]);

    const formatData: Record<string, any> = {
      display: { impressions: 0, clicks: 0, revenue: 0, ctr: 0, ecpm: 0, fillRate: 0 },
      video: { impressions: 0, clicks: 0, revenue: 0, ctr: 0, ecpm: 0, fillRate: 0 },
      native: { impressions: 0, clicks: 0, revenue: 0, ctr: 0, ecpm: 0, fillRate: 0 },
      richMedia: { impressions: 0, clicks: 0, revenue: 0, ctr: 0, ecpm: 0, fillRate: 0 }
    };

    result.forEach(item => {
      if (item._id && formatData[item._id]) {
        formatData[item._id] = {
          impressions: item.impressions,
          clicks: item.clicks,
          revenue: item.revenue,
          ctr: item.avgCtr || 0,
          ecpm: item.avgEcpm || 0,
          fillRate: item.avgFillRate || 0
        };
      }
    });

    await cacheSet(cacheKey, formatData, 300);
    return formatData;
  }

  /**
   * Get performance by device type
   */
  async getPerformanceByDevice(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    deviceType: string;
    impressions: number;
    clicks: number;
    revenue: number;
    ctr: number;
    ecpm: number;
    fillRate: number;
    percentage: number;
  }>> {
    const cacheKey = `performance-device:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await PerformanceMetric.getByDeviceType(publisherId, startDate, endDate);

    const totalImpressions = result.reduce((sum, item) => sum + item.totalImpressions, 0);

    const deviceData = result.map(item => ({
      deviceType: item._id,
      impressions: item.totalImpressions,
      clicks: item.totalClicks,
      revenue: item.totalRevenue,
      ctr: item.avgCtr || 0,
      ecpm: item.avgEcpm || 0,
      fillRate: item.avgFillRate || 0,
      percentage: totalImpressions > 0
        ? (item.totalImpressions / totalImpressions) * 100
        : 0
    }));

    await cacheSet(cacheKey, deviceData, 300);
    return deviceData;
  }

  /**
   * Get performance by country
   */
  async getPerformanceByCountry(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<Array<{
    country: string;
    impressions: number;
    clicks: number;
    revenue: number;
    ctr: number;
    ecpm: number;
    fillRate: number;
    percentage: number;
  }>> {
    const cacheKey = `performance-country:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}:${limit}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await PerformanceMetric.getByCountry(publisherId, startDate, endDate, limit);

    const totalImpressions = result.reduce((sum, item) => sum + item.totalImpressions, 0);

    const countryData = result.map(item => ({
      country: item._id,
      impressions: item.totalImpressions,
      clicks: item.totalClicks,
      revenue: item.totalRevenue,
      ctr: item.avgCtr || 0,
      ecpm: item.avgEcpm || 0,
      fillRate: item.avgFillRate || 0,
      percentage: totalImpressions > 0
        ? (item.totalImpressions / totalImpressions) * 100
        : 0
    }));

    await cacheSet(cacheKey, countryData, 300);
    return countryData;
  }

  /**
   * Get top performing ad units
   */
  async getTopAdUnits(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
    sortBy: 'revenue' | 'ctr' | 'ecpm' = 'revenue'
  ): Promise<TopPerformer[]> {
    const cacheKey = `top-adunits:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}:${limit}:${sortBy}`;

    const cached = await cacheGet<TopPerformer[]>(cacheKey);
    if (cached) return cached;

    const result = await PerformanceMetric.getTopPerformers(publisherId, startDate, endDate, limit, sortBy);

    const topPerformers: TopPerformer[] = result.map(item => ({
      adUnitId: item._id,
      revenue: item.totalRevenue,
      impressions: item.totalImpressions,
      ctr: item.effectiveCtr || 0,
      ecpm: item.avgEcpm || 0,
      fillRate: item.avgFillRate || 0
    }));

    await cacheSet(cacheKey, topPerformers, 300);
    return topPerformers;
  }

  /**
   * Get hourly performance patterns
   */
  async getHourlyPatterns(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    hour: number;
    impressions: number;
    clicks: number;
    revenue: number;
    ctr: number;
    ecpm: number;
  }>> {
    const cacheKey = `hourly-patterns:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await PerformanceMetric.getHourlyPerformance(publisherId, startDate, endDate);

    const hourlyData = result.map(item => ({
      hour: item._id,
      impressions: item.totalImpressions,
      clicks: item.totalClicks,
      revenue: item.totalRevenue,
      ctr: item.avgCtr || 0,
      ecpm: item.avgEcpm || 0
    }));

    // Fill in missing hours
    const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
      const existing = hourlyData.find(h => h.hour === i);
      return existing || { hour: i, impressions: 0, clicks: 0, revenue: 0, ctr: 0, ecpm: 0 };
    });

    await cacheSet(cacheKey, fullHourlyData, 300);
    return fullHourlyData;
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    metrics: Array<'impressions' | 'clicks' | 'revenue' | 'ctr' | 'ecpm' | 'fillRate'> = ['impressions', 'clicks', 'revenue']
  ): Promise<Array<{
    date: Date;
    impressions?: number;
    clicks?: number;
    revenue?: number;
    ctr?: number;
    ecpm?: number;
    fillRate?: number;
  }>> {
    const cacheKey = `timeseries:${publisherId}:${startDate.toISOString()}:${endDate.toISOString()}:${metrics.join(',')}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await PerformanceMetric.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          impressions: { $sum: '$impressions.total' },
          clicks: { $sum: '$clicks' },
          revenue: { $sum: '$revenue' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const timeSeries = result.map(item => {
      const entry: any = { date: new Date(item._id) };
      if (metrics.includes('impressions')) entry.impressions = item.impressions;
      if (metrics.includes('clicks')) entry.clicks = item.clicks;
      if (metrics.includes('revenue')) entry.revenue = item.revenue;
      if (metrics.includes('ctr') && item.impressions > 0) {
        entry.ctr = (item.clicks / item.impressions) * 100;
      }
      if (metrics.includes('ecpm') && item.impressions > 0) {
        entry.ecpm = (item.revenue / item.impressions) * 1000;
      }
      return entry;
    });

    await cacheSet(cacheKey, timeSeries, 300);
    return timeSeries;
  }
}

export const performanceService = new PerformanceService();
export default performanceService;