import { PerformanceMetric } from '../models';
import { getCache, setCache } from '../utils/redis';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  metrics: Array<{
    date: Date;
    metricType: string;
    retailerId: string;
    retailerName: string;
    value: number;
    previousValue?: number;
    change?: number;
    changePercentage?: number;
    source: string;
  }>;
  summary: {
    totalImpressions: number;
    totalConversions: number;
    totalEngagement: number;
    averageRoi: number;
    averageReach: number;
  };
  comparison: {
    currentPeriod: {
      impressions: number;
      conversions: number;
      engagement: number;
    };
    previousPeriod: {
      impressions: number;
      conversions: number;
      engagement: number;
    };
    changes: {
      impressions: number;
      conversions: number;
      engagement: number;
    };
  };
}

export interface PerformanceBySource {
  source: 'dooh' | 'digital' | 'physical' | 'mixed';
  impressions: number;
  conversions: number;
  engagement: number;
  roi: number;
}

export interface PerformanceByHour {
  hour: number;
  impressions: number;
  conversions: number;
  engagement: number;
}

export class PerformanceService {
  private logger = logger.child({ service: 'PerformanceService' });

  async getMetrics(params: {
    retailerId?: string;
    campaignId?: string;
    metricType?: string;
    source?: string;
    dateRange?: { start: Date; end: Date };
    granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    limit?: number;
  }): Promise<PerformanceMetrics> {
    const cacheKey = `performance:metrics:${JSON.stringify(params)}`;
    const cached = await getCache<PerformanceMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const query: Record<string, unknown> = {};
    if (params.retailerId) query.retailerId = params.retailerId;
    if (params.campaignId) query.campaignId = params.campaignId;
    if (params.metricType) query.metricType = params.metricType;
    if (params.source) query.source = params.source;
    if (params.dateRange) {
      query.date = { $gte: params.dateRange.start, $lte: params.dateRange.end };
    }

    const data = await PerformanceMetric.find(query)
      .sort({ date: -1 })
      .limit(params.limit || 500);

    const metrics = data.map((item) => ({
      date: item.date,
      metricType: item.metricType,
      retailerId: item.retailerId,
      retailerName: item.retailerName,
      value: item.metrics.value,
      previousValue: item.metrics.previousValue,
      change: item.metrics.change,
      changePercentage: item.metrics.changePercentage,
      source: item.source,
    }));

    const impressions = data
      .filter((d) => d.metricType === 'impression')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const conversions = data
      .filter((d) => d.metricType === 'conversion')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const engagement = data
      .filter((d) => d.metricType === 'engagement')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const roiData = data.filter((d) => d.metricType === 'roi');
    const reachData = data.filter((d) => d.metricType === 'reach');

    const averageRoi = roiData.length > 0
      ? roiData.reduce((sum, d) => sum + d.metrics.value, 0) / roiData.length
      : 0;
    const averageReach = reachData.length > 0
      ? reachData.reduce((sum, d) => sum + d.metrics.value, 0) / reachData.length
      : 0;

    const midPoint = Math.floor(data.length / 2);
    const currentPeriodData = data.slice(0, midPoint);
    const previousPeriodData = data.slice(midPoint);

    const currentImpressions = currentPeriodData
      .filter((d) => d.metricType === 'impression')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const previousImpressions = previousPeriodData
      .filter((d) => d.metricType === 'impression')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const currentConversions = currentPeriodData
      .filter((d) => d.metricType === 'conversion')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const previousConversions = previousPeriodData
      .filter((d) => d.metricType === 'conversion')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const currentEngagement = currentPeriodData
      .filter((d) => d.metricType === 'engagement')
      .reduce((sum, d) => sum + d.metrics.value, 0);
    const previousEngagement = previousPeriodData
      .filter((d) => d.metricType === 'engagement')
      .reduce((sum, d) => sum + d.metrics.value, 0);

    const result: PerformanceMetrics = {
      metrics,
      summary: {
        totalImpressions: impressions,
        totalConversions: conversions,
        totalEngagement: engagement,
        averageRoi,
        averageReach,
      },
      comparison: {
        currentPeriod: {
          impressions: currentImpressions,
          conversions: currentConversions,
          engagement: currentEngagement,
        },
        previousPeriod: {
          impressions: previousImpressions,
          conversions: previousConversions,
          engagement: previousEngagement,
        },
        changes: {
          impressions: previousImpressions > 0
            ? ((currentImpressions - previousImpressions) / previousImpressions) * 100
            : 0,
          conversions: previousConversions > 0
            ? ((currentConversions - previousConversions) / previousConversions) * 100
            : 0,
          engagement: previousEngagement > 0
            ? ((currentEngagement - previousEngagement) / previousEngagement) * 100
            : 0,
        },
      },
    };

    await setCache(cacheKey, result, 300);
    return result;
  }

  async getBySource(dateRange?: { start: Date; end: Date }): Promise<PerformanceBySource[]> {
    const query: Record<string, unknown> = {};
    if (dateRange) {
      query.date = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const data = await PerformanceMetric.find(query);

    const sourceMap = new Map<string, {
      source: 'dooh' | 'digital' | 'physical' | 'mixed';
      impressions: number;
      conversions: number;
      engagement: number;
    }>();

    data.forEach((item) => {
      if (!sourceMap.has(item.source)) {
        sourceMap.set(item.source, {
          source: item.source,
          impressions: 0,
          conversions: 0,
          engagement: 0,
        });
      }
      const source = sourceMap.get(item.source)!;
      if (item.metricType === 'impression') source.impressions += item.metrics.value;
      if (item.metricType === 'conversion') source.conversions += item.metrics.value;
      if (item.metricType === 'engagement') source.engagement += item.metrics.value;
    });

    return Array.from(sourceMap.values()).map((s) => ({
      ...s,
      roi: s.conversions > 0 && s.impressions > 0
        ? (s.conversions * 50) / s.impressions * 1000
        : 0,
    }));
  }

  async getHourlyBreakdown(
    retailerId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<PerformanceByHour[]> {
    const data = await PerformanceMetric.find({
      retailerId,
      date: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const hourlyMap = new Map<number, {
      hour: number;
      impressions: number;
      conversions: number;
      engagement: number;
    }>();

    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { hour: i, impressions: 0, conversions: 0, engagement: 0 });
    }

    data.forEach((item) => {
      const hour = new Date(item.date).getHours();
      const hourData = hourlyMap.get(hour)!;
      if (item.metricType === 'impression') hourData.impressions += item.metrics.value;
      if (item.metricType === 'conversion') hourData.conversions += item.metrics.value;
      if (item.metricType === 'engagement') hourData.engagement += item.metrics.value;
    });

    return Array.from(hourlyMap.values());
  }

  async createMetric(data: Partial<PerformanceMetric>): Promise<PerformanceMetric> {
    const metric = new PerformanceMetric({
      ...data,
      date: data.date || new Date(),
    });
    return metric.save();
  }
}

export const performanceService = new PerformanceService();