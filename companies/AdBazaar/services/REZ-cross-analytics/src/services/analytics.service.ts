import {
  Platform,
  UnifiedMetrics,
  CrossPlatformSummary,
  DashboardData,
  DateRange,
  ROIMetrics,
  EngagementMetrics,
  TwitterMetrics,
  InstagramMetrics,
  LinkedInMetrics,
  TikTokMetrics,
  FacebookMetrics,
  YouTubeMetrics,
} from '../types';
import { metricAggregatorService } from './metric-aggregator.service';
import { attributionService } from './attribution.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('AnalyticsService');

// Mock data storage - in production, this would be connected to actual platform APIs
class MockDataStore {
  private data: UnifiedMetrics[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'youtube'];
    const now = new Date();

    // Generate 30 days of mock data
    for (let day = 0; day < 30; day++) {
      platforms.forEach((platform) => {
        const numPosts = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < numPosts; i++) {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

          this.data.push(this.generateMockMetrics(platform, timestamp, `${platform}-${day}-${i}`));
        }
      });
    }
  }

  private generateMockMetrics(platform: Platform, timestamp: Date, contentId: string): UnifiedMetrics {
    const baseImpressions = Math.floor(Math.random() * 10000) + 1000;

    return {
      platform,
      contentId,
      timestamp,
      impressions: baseImpressions,
      reach: Math.floor(baseImpressions * (0.7 + Math.random() * 0.3)),
      engagements: Math.floor(baseImpressions * (0.02 + Math.random() * 0.08)),
      likes: Math.floor(baseImpressions * (0.01 + Math.random() * 0.04)),
      comments: Math.floor(baseImpressions * (0.001 + Math.random() * 0.01)),
      shares: Math.floor(baseImpressions * (0.005 + Math.random() * 0.02)),
      clicks: Math.floor(baseImpressions * (0.005 + Math.random() * 0.02)),
    };
  }

  getAll(): UnifiedMetrics[] {
    return this.data;
  }

  getByDateRange(start: Date, end: Date): UnifiedMetrics[] {
    return this.data.filter((m) => {
      const t = new Date(m.timestamp).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }

  getByPlatforms(platforms: Platform[]): UnifiedMetrics[] {
    return this.data.filter((m) => platforms.includes(m.platform));
  }
}

const mockDataStore = new MockDataStore();

export class AnalyticsService {
  /**
   * Fetch metrics from all platforms for a date range
   */
  async fetchMetrics(dateRange: DateRange, platforms?: Platform[]): Promise<UnifiedMetrics[]> {
    const startTime = Date.now();
    let metrics = mockDataStore.getByDateRange(dateRange.start, dateRange.end);

    if (platforms && platforms.length > 0) {
      metrics = metrics.filter((m) => platforms.includes(m.platform));
    }

    const duration = Date.now() - startTime;
    logger.logMetricsFetch(platforms?.join(',') || 'all', metrics.length, duration);

    return metrics;
  }

  /**
   * Fetch metrics from a specific platform
   */
  async fetchPlatformMetrics(
    platform: Platform,
    dateRange: DateRange
  ): Promise<UnifiedMetrics[]> {
    const allMetrics = await this.fetchMetrics(dateRange);
    return allMetrics.filter((m) => m.platform === platform);
  }

  /**
   * Get cross-platform summary for dashboard
   */
  async getDashboardSummary(dateRange: DateRange): Promise<CrossPlatformSummary> {
    const metrics = await this.fetchMetrics(dateRange);
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const totals = metricAggregatorService.aggregateCrossPlatform(metrics);

    // Find top platform
    let topPlatform: Platform = 'twitter';
    let maxEngagements = 0;

    aggregated.forEach((agg) => {
      if (agg.totalEngagements > maxEngagements) {
        maxEngagements = agg.totalEngagements;
        topPlatform = agg.platform;
      }
    });

    return {
      date: new Date().toISOString().split('T')[0],
      platforms: Array.from(new Set(metrics.map((m) => m.platform))),
      totalImpressions: totals.totalImpressions,
      totalReach: totals.totalReach,
      totalEngagements: totals.totalEngagements,
      overallEngagementRate: totals.engagementRate,
      topPlatform,
      platformBreakdown: aggregated.map((agg) => ({
        platform: agg.platform,
        impressions: agg.totalImpressions,
        reach: agg.totalReach,
        engagements: agg.totalEngagements,
        engagementRate: agg.engagementRate,
      })),
    };
  }

  /**
   * Get full dashboard data
   */
  async getDashboardData(dateRange: DateRange): Promise<DashboardData> {
    const metrics = await this.fetchMetrics(dateRange);
    const summary = await this.getDashboardSummary(dateRange);

    // Get recent posts
    const recentPosts = [...metrics].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 20);

    // Get top performing content
    const topPerforming = metricAggregatorService.getTopPerforming(metrics, 'engagements', 10);

    return {
      overview: summary,
      recentPosts,
      topPerforming: topPerforming.map((m) => ({
        platform: m.platform,
        contentId: m.contentId,
        metric: 'engagements',
        value: m.engagements,
      })),
      notifications: [],
      realTimeMetrics: {
        activeUsers: Math.floor(Math.random() * 1000) + 100,
        currentImpressions: Math.floor(Math.random() * 5000),
        currentEngagements: Math.floor(Math.random() * 500),
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Calculate engagement metrics
   */
  async getEngagementMetrics(dateRange: DateRange, platforms?: Platform[]): Promise<EngagementMetrics> {
    const metrics = await this.fetchMetrics(dateRange, platforms);
    return metricAggregatorService.calculateEngagementMetrics(metrics);
  }

  /**
   * Get ROI metrics
   */
  async getROIMetrics(dateRange: DateRange, platforms?: Platform[]): Promise<ROIMetrics[]> {
    const metrics = await this.fetchMetrics(dateRange, platforms);
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);

    // Mock ROI calculation - in production, ad spend data would be needed
    return aggregated.map((agg) => ({
      platform: agg.platform,
      spend: Math.random() * 10000 + 1000,
      revenue: Math.random() * 50000 + 5000,
      impressions: agg.totalImpressions,
      conversions: Math.floor(agg.totalEngagements * 0.05),
      cpa: Math.random() * 50 + 10,
      roas: Math.random() * 5 + 1,
      ctr: Math.random() * 3 + 0.5,
    }));
  }

  /**
   * Get aggregated metrics by platform
   */
  async getAggregatedMetrics(dateRange: DateRange, platforms?: Platform[]) {
    const metrics = await this.fetchMetrics(dateRange, platforms);
    return metricAggregatorService.aggregateByPlatform(metrics);
  }

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesData(
    dateRange: DateRange,
    granularity: 'hour' | 'day' | 'week' | 'month',
    metric: 'impressions' | 'engagements' | 'likes' | 'comments' | 'shares',
    platforms?: Platform[]
  ): Promise<{ date: string; platform: Platform; value: number }[]> {
    const metrics = await this.fetchMetrics(dateRange, platforms);
    const grouped = metricAggregatorService.groupByTimePeriod(metrics, granularity);

    const result: { date: string; platform: Platform; value: number }[] = [];

    grouped.forEach((periodMetrics, date) => {
      const platformGroups = new Map<Platform, UnifiedMetrics[]>();
      periodMetrics.forEach((m) => {
        const existing = platformGroups.get(m.platform) || [];
        existing.push(m);
        platformGroups.set(m.platform, existing);
      });

      platformGroups.forEach((pMetrics, platform) => {
        const total = pMetrics.reduce((sum, m) => sum + m[metric], 0);
        result.push({ date, platform, value: total });
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Compare performance across date ranges
   */
  async comparePeriods(
    currentRange: DateRange,
    previousRange: DateRange,
    platforms?: Platform[]
  ): Promise<{
    current: CrossPlatformSummary;
    previous: CrossPlatformSummary;
    changes: {
      metric: string;
      change: number;
      percentageChange: number;
    }[];
  }> {
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.fetchMetrics(currentRange, platforms),
      this.fetchMetrics(previousRange, platforms),
    ]);

    const current = await this.getDashboardSummary(currentRange);
    const previous = await this.getDashboardSummary(previousRange);

    const changes = [
      {
        metric: 'impressions',
        change: current.totalImpressions - previous.totalImpressions,
        percentageChange: previous.totalImpressions > 0
          ? ((current.totalImpressions - previous.totalImpressions) / previous.totalImpressions) * 100
          : 0,
      },
      {
        metric: 'engagements',
        change: current.totalEngagements - previous.totalEngagements,
        percentageChange: previous.totalEngagements > 0
          ? ((current.totalEngagements - previous.totalEngagements) / previous.totalEngagements) * 100
          : 0,
      },
      {
        metric: 'reach',
        change: current.totalReach - previous.totalReach,
        percentageChange: previous.totalReach > 0
          ? ((current.totalReach - previous.totalReach) / previous.totalReach) * 100
          : 0,
      },
      {
        metric: 'engagementRate',
        change: current.overallEngagementRate - previous.overallEngagementRate,
        percentageChange: previous.overallEngagementRate > 0
          ? ((current.overallEngagementRate - previous.overallEngagementRate) / previous.overallEngagementRate) * 100
          : 0,
      },
    ];

    return { current, previous, changes };
  }

  /**
   * Get content performance rankings
   */
  async getContentRankings(
    dateRange: DateRange,
    sortBy: 'impressions' | 'engagements' | 'engagementRate',
    limit: number = 20
  ): Promise<UnifiedMetrics[]> {
    const metrics = await this.fetchMetrics(dateRange);

    // Add engagement rate to each metric for sorting
    const metricsWithRate = metrics.map((m) => ({
      ...m,
      engagementRate: m.impressions > 0 ? (m.engagements / m.impressions) * 100 : 0,
    }));

    return metricsWithRate
      .sort((a, b) => {
        if (sortBy === 'engagementRate') {
          return b.engagementRate - a.engagementRate;
        }
        return b[sortBy] - a[sortBy];
      })
      .slice(0, limit);
  }

  /**
   * Fetch raw metrics from specific platforms (for integration with real APIs)
   */
  async fetchRawMetrics(platform: Platform, dateRange: DateRange): Promise<unknown[]> {
    // In production, this would call actual platform APIs
    // For now, return mock data
    const unifiedMetrics = await this.fetchPlatformMetrics(platform, dateRange);
    return unifiedMetrics;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
