import { DashboardConfig, IDashboardConfig } from '../models';
import { cacheGet, cacheSet, cacheDelete } from '../utils/cache';
import { dashboardQueriesTotal, dashboardQueryDuration } from '../utils/metrics';
import logger from '../utils/logger';

const serviceLogger = logger.child({ service: 'dashboardService' });

export interface DashboardData {
  config: IDashboardConfig;
  summary: {
    totalRevenue: number;
    totalImpressions: number;
    avgCtr: number;
    avgEcpm: number;
    fillRate: number;
 };
  quickStats: {
    today: any;
    yesterday: any;
    last7Days: any;
    last30Days: any;
  };
  topAdUnits: any[];
  recentAlerts: any[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export class DashboardService {
  /**
   * Get complete dashboard data for a publisher
   */
  async getDashboard(publisherId: string, dateRange?: DateRange): Promise<DashboardData> {
    const startTime = Date.now();
    const cacheKey = `dashboard:${publisherId}:${dateRange?.start?.toISOString() || 'default'}`;

    // Check cache
    const cached = await cacheGet<DashboardData>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ type: 'dashboard', publisher_id: publisherId });
      return cached;
    }

    try {
      // Get dashboard config
      const config = await DashboardConfig.getOrCreateDefault(publisherId);

      // Calculate date ranges
      const ranges = this.calculateDateRanges(dateRange);

      // Get summary data
      const summary = await this.getSummary(publisherId, ranges.last30Days);

      // Get quick stats
      const quickStats = await this.getQuickStats(publisherId, ranges);

      // Get top ad units
      const topAdUnits = await this.getTopAdUnits(publisherId, ranges.last30Days);

      // Get recent alerts
      const recentAlerts = await this.getRecentAlerts(publisherId);

      const dashboardData: DashboardData = {
        config,
        summary,
        quickStats,
        topAdUnits,
        recentAlerts
      };

      // Cache for 5 minutes
      await cacheSet(cacheKey, dashboardData, 300);
      dashboardQueriesTotal.inc({ type: 'dashboard', publisher_id: publisherId });
      dashboardQueryDuration.observe({ type: 'dashboard' }, (Date.now() - startTime) / 1000);

      return dashboardData;
    } catch (error) {
      serviceLogger.error('Error getting dashboard data', {
        publisherId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get dashboard configuration
   */
  async getConfig(publisherId: string): Promise<IDashboardConfig> {
    return DashboardConfig.getOrCreateDefault(publisherId);
  }

  /**
   * Update dashboard configuration
   */
  async updateConfig(publisherId: string, updates: Partial<IDashboardConfig>): Promise<IDashboardConfig> {
    const config = await DashboardConfig.findOneAndUpdate(
      { publisherId, isDefault: true },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!config) {
      throw new Error('Dashboard configuration not found');
    }

    // Invalidate cache
    await cacheDelete(`dashboard:${publisherId}:*`);

    return config;
  }

  /**
   * Update widget configuration
   */
  async updateWidget(
    publisherId: string,
    widgetId: string,
    updates: Partial<any>
  ): Promise<IDashboardConfig> {
    const config = await DashboardConfig.findOneAndUpdate(
      { publisherId, isDefault: true, 'widgets.id': widgetId },
      {
        $set: {
          'widgets.$.title': updates.title,
          'widgets.$.size': updates.size,
          'widgets.$.position': updates.position,
          'widgets.$.config': updates.config
        }
      },
      { new: true }
    );

    if (!config) {
      throw new Error('Widget not found');
    }

    return config;
  }

  /**
   * Add a new widget
   */
  async addWidget(publisherId: string, widget: any): Promise<IDashboardConfig> {
    const config = await DashboardConfig.findOneAndUpdate(
      { publisherId, isDefault: true },
      { $push: { widgets: widget } },
      { new: true }
    );

    if (!config) {
      throw new Error('Dashboard configuration not found');
    }

    return config;
  }

  /**
   * Remove a widget
   */
  async removeWidget(publisherId: string, widgetId: string): Promise<IDashboardConfig> {
    const config = await DashboardConfig.findOneAndUpdate(
      { publisherId, isDefault: true },
      { $pull: { widgets: { id: widgetId } } },
      { new: true }
    );

    if (!config) {
      throw new Error('Dashboard configuration not found');
    }

    return config;
  }

  /**
   * Calculate date ranges for various periods
   */
  private calculateDateRanges(customRange?: DateRange): {
    today: DateRange;
    yesterday: DateRange;
    last7Days: DateRange;
    last30Days: DateRange;
    last90Days: DateRange;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const last90Days = new Date(today);
    last90Days.setDate(last90Days.getDate() - 90);

    return {
      today: customRange || { start: today, end: now },
      yesterday: { start: yesterday, end: today },
      last7Days: { start: last7Days, end: now },
      last30Days: { start: last30Days, end: now },
      last90Days: { start: last90Days, end: now }
    };
  }

  /**
   * Get summary metrics
   */
  private async getSummary(publisherId: string, range: DateRange): Promise<DashboardData['summary']> {
    // This would typically aggregate from RevenueAnalytics and PerformanceMetric
    // For now, return mock data structure
    return {
      totalRevenue: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgEcpm: 0,
      fillRate: 0
    };
  }

  /**
   * Get quick stats for various periods
   */
  private async getQuickStats(publisherId: string, ranges: any): Promise<DashboardData['quickStats']> {
    return {
      today: { revenue: 0, impressions: 0, ctr: 0 },
      yesterday: { revenue: 0, impressions: 0, ctr: 0 },
      last7Days: { revenue: 0, impressions: 0, ctr: 0 },
      last30Days: { revenue: 0, impressions: 0, ctr: 0 }
    };
  }

  /**
   * Get top performing ad units
   */
  private async getTopAdUnits(publisherId: string, range: DateRange): Promise<any[]> {
    return [];
  }

  /**
   * Get recent alerts
   */
  private async getRecentAlerts(publisherId: string): Promise<any[]> {
    return [];
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;