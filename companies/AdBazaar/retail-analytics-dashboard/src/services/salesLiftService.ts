import { SalesLiftMetric } from '../models';
import { getCache, setCache } from '../utils/redis';
import { logger } from '../utils/logger';
import { salesLiftQueries } from '../utils/metrics';

export interface SalesLiftMetrics {
  metrics: Array<{
    date: Date;
    campaignId: string;
    campaignName: string;
    retailerId: string;
    retailerName: string;
    baseline: number;
    actual: number;
    lift: number;
    liftPercentage: number;
    confidence: number;
    statisticalSignificance: boolean;
  }>;
  summary: {
    averageLift: number;
    totalCampaigns: number;
    significantCampaigns: number;
    averageConfidence: number;
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    metric: string;
    value: number;
  }>;
}

export interface SalesLiftByRetailer {
  retailerId: string;
  retailerName: string;
  totalLift: number;
  campaignCount: number;
  averageConfidence: number;
}

export interface SalesLiftByCategory {
  category: string;
  totalLift: number;
  campaignCount: number;
  averageSales: number;
}

export interface SalesLiftTrend {
  date: Date;
  lift: number;
  confidence: number;
}

export class SalesLiftService {
  private logger = logger.child({ service: 'SalesLiftService' });

  async getMetrics(params: {
    retailerId?: string;
    campaignId?: string;
    category?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  }): Promise<SalesLiftMetrics> {
    salesLiftQueries.inc();

    const cacheKey = `saleslift:metrics:${JSON.stringify(params)}`;
    const cached = await getCache<SalesLiftMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const query: Record<string, unknown> = {};
    if (params.retailerId) query.retailerId = params.retailerId;
    if (params.campaignId) query.campaignId = params.campaignId;
    if (params.category) query.category = params.category;
    if (params.dateRange) {
      query.date = { $gte: params.dateRange.start, $lte: params.dateRange.end };
    }

    const data = await SalesLiftMetric.find(query)
      .sort({ date: -1 })
      .limit(params.limit || 100);

    const metrics = data.map((item) => ({
      date: item.date,
      campaignId: item.campaignId,
      campaignName: item.campaignName,
      retailerId: item.retailerId,
      retailerName: item.retailerName,
      baseline: item.baseline,
      actual: item.actual,
      lift: item.lift,
      liftPercentage: item.liftPercentage,
      confidence: item.confidence,
      statisticalSignificance: item.statisticalSignificance,
    }));

    const significantCampaigns = data.filter((d) => d.statisticalSignificance).length;
    const averageConfidence =
      data.length > 0 ? data.reduce((sum, d) => sum + d.confidence, 0) / data.length : 0;

    const insights: SalesLiftMetrics['insights'] = [];

    if (data.length > 0) {
      const avgLift =
        data.reduce((sum, d) => sum + d.liftPercentage, 0) / data.length;
      insights.push({
        type: avgLift > 10 ? 'positive' : avgLift > 0 ? 'neutral' : 'negative',
        message:
          avgLift > 10
            ? 'Campaigns showing strong sales lift performance'
            : avgLift > 0
            ? 'Campaigns showing moderate sales lift'
            : 'Campaigns need optimization to improve sales lift',
        metric: 'averageLift',
        value: avgLift,
      });

      if (significantCampaigns / data.length > 0.8) {
        insights.push({
          type: 'positive',
          message: 'High statistical significance rate indicates reliable results',
          metric: 'significanceRate',
          value: (significantCampaigns / data.length) * 100,
        });
      }
    }

    const result: SalesLiftMetrics = {
      metrics,
      summary: {
        averageLift:
          data.length > 0
            ? data.reduce((sum, d) => sum + d.liftPercentage, 0) / data.length
            : 0,
        totalCampaigns: new Set(data.map((d) => d.campaignId)).size,
        significantCampaigns,
        averageConfidence,
      },
      insights,
    };

    await setCache(cacheKey, result, 300);
    return result;
  }

  async getByRetailer(dateRange?: { start: Date; end: Date }): Promise<SalesLiftByRetailer[]> {
    const query: Record<string, unknown> = {};
    if (dateRange) {
      query.date = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const data = await SalesLiftMetric.find(query);

    const retailerMap = new Map<string, SalesLiftByRetailer>();

    data.forEach((item) => {
      if (!retailerMap.has(item.retailerId)) {
        retailerMap.set(item.retailerId, {
          retailerId: item.retailerId,
          retailerName: item.retailerName,
          totalLift: 0,
          campaignCount: 0,
          averageConfidence: 0,
        });
      }
      const retailer = retailerMap.get(item.retailerId)!;
      retailer.totalLift += item.liftPercentage;
      retailer.campaignCount++;
      retailer.averageConfidence += item.confidence;
    });

    return Array.from(retailerMap.values()).map((r) => ({
      ...r,
      totalLift: r.totalLift / r.campaignCount,
      averageConfidence: r.averageConfidence / r.campaignCount,
    }));
  }

  async getByCategory(dateRange?: { start: Date; end: Date }): Promise<SalesLiftByCategory[]> {
    const query: Record<string, unknown> = {};
    if (dateRange) {
      query.date = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const data = await SalesLiftMetric.find(query);

    const categoryMap = new Map<string, SalesLiftByCategory>();

    data.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, {
          category: item.category,
          totalLift: 0,
          campaignCount: 0,
          averageSales: 0,
        });
      }
      const category = categoryMap.get(item.category)!;
      category.totalLift += item.liftPercentage;
      category.campaignCount++;
      category.averageSales += item.actual;
    });

    return Array.from(categoryMap.values()).map((c) => ({
      ...c,
      totalLift: c.totalLift / c.campaignCount,
      averageSales: c.averageSales / c.campaignCount,
    }));
  }

  async getTrends(params: {
    campaignId?: string;
    retailerId?: string;
    period: 'daily' | 'weekly' | 'monthly';
  }): Promise<SalesLiftTrend[]> {
    const query: Record<string, unknown> = {};
    if (params.campaignId) query.campaignId = params.campaignId;
    if (params.retailerId) query.retailerId = params.retailerId;

    const data = await SalesLiftMetric.find(query).sort({ date: 1 });

    const groupedData = new Map<string, { lift: number; confidence: number; count: number }>();

    data.forEach((item) => {
      let key: string;
      const date = new Date(item.date);

      if (params.period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (params.period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, { lift: 0, confidence: 0, count: 0 });
      }
      const group = groupedData.get(key)!;
      group.lift += item.liftPercentage;
      group.confidence += item.confidence;
      group.count++;
    });

    return Array.from(groupedData.entries())
      .map(([dateStr, group]) => ({
        date: new Date(dateStr),
        lift: group.lift / group.count,
        confidence: group.confidence / group.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createMetric(data: Partial<SalesLiftMetric>): Promise<SalesLiftMetric> {
    const metric = new SalesLiftMetric({
      ...data,
      date: data.date || new Date(),
    });
    return metric.save();
  }
}

export const salesLiftService = new SalesLiftService();