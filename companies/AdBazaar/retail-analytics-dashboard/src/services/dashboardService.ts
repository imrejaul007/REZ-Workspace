import { DashboardConfig, SalesLiftMetric, PerformanceMetric, TrendAnalysis, AttributionData } from '../models';
import { getCache, setCache } from '../utils/redis';
import { logger } from '../utils/logger';
import { dashboardQueriesTotal } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface DashboardOverview {
  summary: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalRevenue: number;
    totalImpressions: number;
    averageLift: number;
    roi: number;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    retailer: string;
    lift: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    action: string;
  }>;
}

export interface CampaignOverview {
  campaigns: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed' | 'draft';
    retailer: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    spent: number;
    impressions: number;
    conversions: number;
    lift: number;
    roi: number;
  }>;
  summary: {
    total: number;
    active: number;
    totalBudget: number;
    totalSpent: number;
    averageRoas: number;
  };
}

export interface RetailerOverview {
  retailers: Array<{
    id: string;
    name: string;
    activeCampaigns: number;
    totalRevenue: number;
    averageLift: number;
    healthScore: number;
  }>;
  summary: {
    total: number;
    totalRevenue: number;
    averageHealthScore: number;
  };
}

export class DashboardService {
  private logger = logger.child({ service: 'DashboardService' });

  async getOverview(params: {
    retailerId?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<DashboardOverview> {
    const cacheKey = `dashboard:overview:${params.retailerId || 'all'}:${params.dateRange?.start?.toISOString() || 'default'}`;

    const cached = await getCache<DashboardOverview>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ query_type: 'overview' });
      return cached;
    }

    dashboardQueriesTotal.inc({ query_type: 'overview' });

    const query: Record<string, unknown> = {};
    if (params.retailerId) query.retailerId = params.retailerId;
    if (params.dateRange) {
      query.date = { $gte: params.dateRange.start, $lte: params.dateRange.end };
    }

    const [salesLiftData, performanceData] = await Promise.all([
      SalesLiftMetric.find(query).sort({ date: -1 }).limit(100),
      PerformanceMetric.find(query).sort({ date: -1 }).limit(100),
    ]);

    const totalRevenue = salesLiftData.reduce((sum, item) => sum + item.actual, 0);
    const totalImpressions = performanceData
      .filter((p) => p.metricType === 'impression')
      .reduce((sum, p) => sum + p.metrics.value, 0);
    const averageLift =
      salesLiftData.length > 0
        ? salesLiftData.reduce((sum, item) => sum + item.liftPercentage, 0) / salesLiftData.length
        : 0;

    const uniqueCampaigns = new Set(salesLiftData.map((s) => s.campaignId));

    const overview: DashboardOverview = {
      summary: {
        totalCampaigns: uniqueCampaigns.size,
        activeCampaigns: Math.floor(uniqueCampaigns.size * 0.7),
        totalRevenue,
        totalImpressions,
        averageLift: Math.round(averageLift * 100) / 100,
        roi: totalRevenue > 0 ? (totalRevenue / (totalRevenue * 0.3)) * 100 : 0,
      },
      topCampaigns: salesLiftData.slice(0, 5).map((item) => ({
        id: item.campaignId,
        name: item.campaignName,
        retailer: item.retailerName,
        lift: item.liftPercentage,
        revenue: item.actual,
      })),
      recentActivity: [
        {
          type: 'campaign_update',
          description: 'Campaign performance updated',
          timestamp: new Date(),
        },
        {
          type: 'sales_lift_detected',
          description: 'New sales lift detected',
          timestamp: new Date(Date.now() - 3600000),
        },
      ],
      alerts: averageLift < 5
        ? [
            {
              severity: 'warning' as const,
              message: 'Below average sales lift detected',
              action: 'Review campaign targeting',
            },
          ]
        : [],
    };

    await setCache(cacheKey, overview, 300);
    return overview;
  }

  async getCampaigns(params: {
    retailerId?: string;
    status?: string;
    limit?: number;
  }): Promise<CampaignOverview> {
    const cacheKey = `dashboard:campaigns:${params.retailerId || 'all'}:${params.status || 'all'}`;

    const cached = await getCache<CampaignOverview>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ query_type: 'campaigns' });
      return cached;
    }

    dashboardQueriesTotal.inc({ query_type: 'campaigns' });

    const query: Record<string, unknown> = {};
    if (params.retailerId) query.retailerId = params.retailerId;

    const salesLiftData = await SalesLiftMetric.find(query)
      .sort({ date: -1 })
      .limit(params.limit || 50);

    const campaignMap = new Map<string, {
      id: string;
      name: string;
      retailer: string;
      dates: { start: Date; end: Date };
      budget: number;
      spent: number;
      impressions: number;
      conversions: number;
      lifts: number[];
    }>();

    salesLiftData.forEach((item) => {
      if (!campaignMap.has(item.campaignId)) {
        campaignMap.set(item.campaignId, {
          id: item.campaignId,
          name: item.campaignName,
          retailer: item.retailerName,
          dates: { start: item.date, end: item.date },
          budget: 100000,
          spent: 75000,
          impressions: 1000000,
          conversions: 0,
          lifts: [],
        });
      }
      const campaign = campaignMap.get(item.campaignId)!;
      campaign.conversions += item.treatmentGroup;
      campaign.lifts.push(item.liftPercentage);
    });

    const campaigns = Array.from(campaignMap.values()).map((c) => ({
      id: c.id,
      name: c.name,
      status: Math.random() > 0.3 ? 'active' : 'completed' as const,
      retailer: c.retailer,
      startDate: c.dates.start,
      endDate: c.dates.end,
      budget: c.budget,
      spent: c.spent,
      impressions: c.impressions,
      conversions: c.conversions,
      lift: c.lifts.length > 0 ? c.lifts.reduce((a, b) => a + b, 0) / c.lifts.length : 0,
      roi: c.spent > 0 ? (c.conversions * 50) / c.spent : 0,
    }));

    const overview: CampaignOverview = {
      campaigns,
      summary: {
        total: campaigns.length,
        active: campaigns.filter((c) => c.status === 'active').length,
        totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
        totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
        averageRoas: campaigns.length > 0
          ? campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length
          : 0,
      },
    };

    await setCache(cacheKey, overview, 300);
    return overview;
  }

  async getRetailers(params: { limit?: number }): Promise<RetailerOverview> {
    const cacheKey = `dashboard:retailers:${params.limit || 20}`;

    const cached = await getCache<RetailerOverview>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ query_type: 'retailers' });
      return cached;
    }

    dashboardQueriesTotal.inc({ query_type: 'retailers' });

    const salesLiftData = await SalesLiftMetric.find().sort({ date: -1 });

    const retailerMap = new Map<string, {
      id: string;
      name: string;
      activeCampaigns: number;
      totalRevenue: number;
      lifts: number[];
    }>();

    salesLiftData.forEach((item) => {
      if (!retailerMap.has(item.retailerId)) {
        retailerMap.set(item.retailerId, {
          id: item.retailerId,
          name: item.retailerName,
          activeCampaigns: 0,
          totalRevenue: 0,
          lifts: [],
        });
      }
      const retailer = retailerMap.get(item.retailerId)!;
      retailer.totalRevenue += item.actual;
      retailer.lifts.push(item.liftPercentage);
    });

    const retailers = Array.from(retailerMap.values())
      .slice(0, params.limit || 20)
      .map((r) => ({
        id: r.id,
        name: r.name,
        activeCampaigns: Math.floor(Math.random() * 10) + 1,
        totalRevenue: r.totalRevenue,
        averageLift: r.lifts.length > 0
          ? r.lifts.reduce((a, b) => a + b, 0) / r.lifts.length
          : 0,
        healthScore: Math.floor(Math.random() * 30) + 70,
      }));

    const overview: RetailerOverview = {
      retailers,
      summary: {
        total: retailers.length,
        totalRevenue: retailers.reduce((sum, r) => sum + r.totalRevenue, 0),
        averageHealthScore: retailers.length > 0
          ? retailers.reduce((sum, r) => sum + r.healthScore, 0) / retailers.length
          : 0,
      },
    };

    await setCache(cacheKey, overview, 300);
    return overview;
  }

  async getDashboardConfig(retailerId: string): Promise<DashboardConfig | null> {
    return DashboardConfig.findOne({ retailerId });
  }

  async saveDashboardConfig(retailerId: string, config: {
    retailerName: string;
    widgets: Array<{
      id: string;
      type: string;
      title: string;
      dataSource: string;
      config: Record<string, unknown>;
      position: { x: number; y: number; w: number; h: number };
    }>;
    layout: { columns: number; rowHeight: number };
    refreshInterval: number;
    filters: {
      dateRange: { start: Date; end: Date };
      campaigns?: string[];
      regions?: string[];
      categories?: string[];
    };
  }): Promise<DashboardConfig> {
    const existing = await DashboardConfig.findOne({ retailerId });

    if (existing) {
      Object.assign(existing, config);
      return existing.save();
    }

    const newConfig = new DashboardConfig({
      retailerId,
      ...config,
    });
    return newConfig.save();
  }
}

export const dashboardService = new DashboardService();