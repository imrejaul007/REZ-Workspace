import { PortalAnalytics, IPortalAnalytics, IPortalMetrics } from '../models';
import { logger } from 'utils/logger.js';

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
  campaignId?: string;
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface DashboardData {
  summary: IPortalMetrics;
  trends: {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  }[];
  topCampaigns: {
    campaignId: string;
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    roas: number;
  }[];
  topLocations: {
    country: string;
    region?: string;
    city?: string;
    impressions: number;
    clicks: number;
    percentage: number;
  }[];
  deviceBreakdown: {
    type: 'desktop' | 'mobile' | 'tablet';
    impressions: number;
    clicks: number;
    percentage: number;
  }[];
  clientPerformance: {
    clientId: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  }[];
}

export class AnalyticsService {
  /**
   * Get analytics for a portal
   */
  async getPortalAnalytics(
    portalId: string,
    filter: AnalyticsFilter = {}
  ): Promise<IPortalAnalytics[]> {
    const query: Record<string, unknown> = { portalId };

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) (query.date as Record<string, Date>).$gte = filter.startDate;
      if (filter.endDate) (query.date as Record<string, Date>).$lte = filter.endDate;
    }

    if (filter.clientId) {
      query['clientMetrics.clientId'] = filter.clientId;
    }

    if (filter.campaignId) {
      query['campaigns.campaignId'] = filter.campaignId;
    }

    const sortOrder = filter.granularity === 'hourly' ? { date: 1 } : { date: -1 };

    return PortalAnalytics.find(query).sort(sortOrder);
  }

  /**
   * Get dashboard data for a portal
   */
  async getDashboardData(portalId: string, days: number = 30): Promise<DashboardData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    logger.info('Fetching dashboard data', { portalId, days });

    // Get all analytics in date range
    const analytics = await PortalAnalytics.find({
      portalId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Calculate summary metrics
    const summary = this.calculateSummaryMetrics(analytics);

    // Get trends
    const trends = analytics.map((a) => ({
      date: a.date.toISOString().split('T')[0],
      impressions: a.metrics.impressions,
      clicks: a.metrics.clicks,
      conversions: a.metrics.conversions,
      spend: a.metrics.spend,
      revenue: a.metrics.revenue,
    }));

    // Get top campaigns
    const campaignMap = new Map<
      string,
      { name: string; impressions: number; clicks: number; conversions: number; spend: number }
    >();
    analytics.forEach((a) => {
      a.campaigns.forEach((c) => {
        const existing = campaignMap.get(c.campaignId);
        if (existing) {
          existing.impressions += c.impressions;
          existing.clicks += c.clicks;
          existing.conversions += c.conversions;
          existing.spend += c.spend;
        } else {
          campaignMap.set(c.campaignId, {
            name: c.name,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            spend: c.spend,
          });
        }
      });
    });

    const topCampaigns = Array.from(campaignMap.entries())
      .map(([campaignId, data]) => ({
        campaignId,
        name: data.name,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        spend: data.spend,
        roas: data.spend > 0 ? data.conversions / data.spend : 0,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    // Get top locations
    const locationMap = new Map<string, { region?: string; city?: string; impressions: number; clicks: number }>();
    analytics.forEach((a) => {
      a.topLocations.forEach((l) => {
        const key = `${l.country}${l.region || ''}${l.city || ''}`;
        const existing = locationMap.get(key);
        if (existing) {
          existing.impressions += l.impressions;
          existing.clicks += l.clicks;
        } else {
          locationMap.set(key, {
            region: l.region,
            city: l.city,
            impressions: l.impressions,
            clicks: l.clicks,
          });
        }
      });
    });

    const totalImpressions = summary.impressions || 1;
    const topLocations = Array.from(locationMap.entries())
      .map(([key, data]) => ({
        country: key.split(data.region || '')[0] || key,
        region: data.region,
        city: data.city,
        impressions: data.impressions,
        clicks: data.clicks,
        percentage: (data.impressions / totalImpressions) * 100,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    // Get device breakdown
    const deviceMap = new Map<string, { impressions: number; clicks: number }>();
    analytics.forEach((a) => {
      a.topDevices.forEach((d) => {
        const existing = deviceMap.get(d.type);
        if (existing) {
          existing.impressions += d.impressions;
          existing.clicks += d.clicks;
        } else {
          deviceMap.set(d.type, { impressions: d.impressions, clicks: d.clicks });
        }
      });
    });

    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([type, data]) => ({
        type: type as 'desktop' | 'mobile' | 'tablet',
        impressions: data.impressions,
        clicks: data.clicks,
        percentage: (data.impressions / totalImpressions) * 100,
      }))
      .sort((a, b) => b.impressions - a.impressions);

    // Get client performance
    const clientMap = new Map<string, { impressions: number; clicks: number; conversions: number; spend: number; revenue: number }>();
    analytics.forEach((a) => {
      a.clientMetrics.forEach((c) => {
        const existing = clientMap.get(c.clientId);
        if (existing) {
          existing.impressions += c.impressions;
          existing.clicks += c.clicks;
          existing.conversions += c.conversions;
          existing.spend += c.spend;
          existing.revenue += c.revenue;
        } else {
          clientMap.set(c.clientId, {
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            spend: c.spend,
            revenue: c.revenue,
          });
        }
      });
    });

    const clientPerformance = Array.from(clientMap.entries())
      .map(([clientId, data]) => ({
        clientId,
        ...data,
      }))
      .sort((a, b) => b.spend - a.spend);

    return {
      summary,
      trends,
      topCampaigns,
      topLocations,
      deviceBreakdown,
      clientPerformance,
    };
  }

  /**
   * Record analytics for a portal
   */
  async recordAnalytics(portalId: string, data: Partial<IPortalAnalytics>): Promise<IPortalAnalytics> {
    logger.info('Recording analytics', { portalId });

    const analytics = new PortalAnalytics({
      portalId,
      date: data.date || new Date(),
      metrics: data.metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
      },
      clientMetrics: data.clientMetrics || [],
      campaigns: data.campaigns || [],
      topLocations: data.topLocations || [],
      topDevices: data.topDevices || [],
      metadata: {
        generatedAt: new Date(),
        dataSource: 'ad-server',
        completeness: 100,
      },
    });

    await analytics.save();
    return analytics;
  }

  /**
   * Get aggregated metrics for date range
   */
  async getAggregatedMetrics(
    portalId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IPortalMetrics> {
    return PortalAnalytics.aggregateMetrics(portalId, startDate, endDate);
  }

  /**
   * Get real-time metrics (last 24 hours)
   */
  async getRealtimeMetrics(portalId: string): Promise<IPortalMetrics & { lastUpdated: Date }> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await PortalAnalytics.aggregate([
      {
        $match: {
          portalId,
          date: { $gte: last24h },
        },
      },
      {
        $group: {
          _id: null,
          impressions: { $sum: '$metrics.impressions' },
          clicks: { $sum: '$metrics.clicks' },
          conversions: { $sum: '$metrics.conversions' },
          spend: { $sum: '$metrics.spend' },
          revenue: { $sum: '$metrics.revenue' },
        },
      },
    ]);

    const metrics = result[0] || {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    };

    // Calculate derived metrics
    if (metrics.impressions > 0) {
      metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
      metrics.cpm = (metrics.spend / metrics.impressions) * 1000;
    }
    if (metrics.clicks > 0) {
      metrics.cpc = metrics.spend / metrics.clicks;
    }
    if (metrics.spend > 0) {
      metrics.roas = metrics.revenue / metrics.spend;
    }

    return {
      ...metrics,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get comparison metrics (current period vs previous period)
   */
  async getComparisonMetrics(
    portalId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<{
    current: IPortalMetrics;
    previous: IPortalMetrics;
    change: IPortalMetrics & {
      impressionsChange: number;
      clicksChange: number;
      conversionsChange: number;
      spendChange: number;
      revenueChange: number;
    };
  }> {
    const [current, previous] = await Promise.all([
      PortalAnalytics.aggregateMetrics(portalId, currentStart, currentEnd),
      PortalAnalytics.aggregateMetrics(portalId, previousStart, previousEnd),
    ]);

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      change: {
        ...current,
        impressionsChange: calculateChange(current.impressions, previous.impressions),
        clicksChange: calculateChange(current.clicks, previous.clicks),
        conversionsChange: calculateChange(current.conversions, previous.conversions),
        spendChange: calculateChange(current.spend, previous.spend),
        revenueChange: calculateChange(current.revenue, previous.revenue),
      },
    };
  }

  /**
   * Calculate summary metrics from analytics array
   */
  private calculateSummaryMetrics(analytics: IPortalAnalytics[]): IPortalMetrics {
    const summary: IPortalMetrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      roas: 0,
    };

    analytics.forEach((a) => {
      summary.impressions += a.metrics.impressions;
      summary.clicks += a.metrics.clicks;
      summary.conversions += a.metrics.conversions;
      summary.spend += a.metrics.spend;
      summary.revenue += a.metrics.revenue;
    });

    if (summary.impressions > 0) {
      summary.ctr = (summary.clicks / summary.impressions) * 100;
      summary.cpm = (summary.spend / summary.impressions) * 1000;
    }
    if (summary.clicks > 0) {
      summary.cpc = summary.spend / summary.clicks;
    }
    if (summary.spend > 0) {
      summary.roas = summary.revenue / summary.spend;
    }

    return summary;
  }
}

export const analyticsService = new AnalyticsService();