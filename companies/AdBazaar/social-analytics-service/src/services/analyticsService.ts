import { Analytics, IAnalytics, Platform, IPlatform, PostAnalytics, IPostAnalytics } from '../models';
import { createChildLogger } from '../utils/logger';
import { analyticsQueriesTotal, postsAnalyzedTotal } from '../utils/metrics';

const logger = createChildLogger('AnalyticsService');

export interface OverviewMetrics {
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalPosts: number;
  topPlatform: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface PlatformMetrics {
  platform: string;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  postsCount: number;
}

export class AnalyticsService {
  async getOverview(userId: string, dateRange?: { start: Date; end: Date }): Promise<OverviewMetrics> {
    logger.info('Getting analytics overview', { userId });
    analyticsQueriesTotal.inc({ type: 'overview' });

    const query: Record<string, unknown> = { userId };
    if (dateRange) {
      query.date = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const analytics = await Analytics.find(query);

    if (analytics.length === 0) {
      return {
        totalImpressions: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        totalPosts: 0,
        topPlatform: 'N/A',
        trend: 'stable',
        trendPercent: 0
      };
    }

    const totals = analytics.reduce(
      (acc, a) => ({
        impressions: acc.impressions + (a.metrics.impressions || 0),
        reach: acc.reach + (a.metrics.reach || 0),
        engagement:
          acc.engagement +
          (a.metrics.likes || 0) +
          (a.metrics.comments || 0) +
          (a.metrics.shares || 0)
      }),
      { impressions: 0, reach: 0, engagement: 0 }
    );

    const avgEngagementRate =
      analytics.reduce((sum, a) => sum + a.metrics.engagementRate, 0) / analytics.length;

    const platformCounts: Record<string, number> = {};
    analytics.forEach(a => {
      platformCounts[a.platform] = (platformCounts[a.platform] || 0) + a.metrics.impressions;
    });

    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalImpressions: totals.impressions,
      totalReach: totals.reach,
      totalEngagement: totals.engagement,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      totalPosts: analytics.length,
      topPlatform,
      trend: 'stable',
      trendPercent: 0
    };
  }

  async getPlatformAnalytics(
    userId: string,
    platform: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<PlatformMetrics> {
    logger.info('Getting platform analytics', { userId, platform });
    analyticsQueriesTotal.inc({ type: 'platform' });

    const query: Record<string, unknown> = { userId, platform };
    if (dateRange) {
      query.date = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const analytics = await Analytics.find(query);

    if (analytics.length === 0) {
      return {
        platform,
        impressions: 0,
        reach: 0,
        engagement: 0,
        engagementRate: 0,
        postsCount: 0
      };
    }

    const totals = analytics.reduce(
      (acc, a) => ({
        impressions: acc.impressions + a.metrics.impressions,
        reach: acc.reach + a.metrics.reach,
        engagement: acc.engagement + a.metrics.likes + a.metrics.comments + a.metrics.shares
      }),
      { impressions: 0, reach: 0, engagement: 0 }
    );

    const avgEngagementRate =
      analytics.reduce((sum, a) => sum + a.metrics.engagementRate, 0) / analytics.length;

    return {
      platform,
      impressions: totals.impressions,
      reach: totals.reach,
      engagement: totals.engagement,
      engagementRate: Math.round(avgEngagementRate * 100) / 100,
      postsCount: analytics.length
    };
  }

  async getTimeSeriesData(
    userId: string,
    dateRange: { start: Date; end: Date },
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<{ date: string; metrics: Record<string, number> }[]> {
    const analytics = await Analytics.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    }).sort({ date: 1 });

    const grouped: Record<string, { impressions: number; reach: number; engagement: number }> = {};

    analytics.forEach(a => {
      let key: string;
      const date = new Date(a.date);

      if (granularity === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { impressions: 0, reach: 0, engagement: 0 };
      }

      grouped[key].impressions += a.metrics.impressions;
      grouped[key].reach += a.metrics.reach;
      grouped[key].engagement += a.metrics.likes + a.metrics.comments + a.metrics.shares;
    });

    return Object.entries(grouped).map(([date, metrics]) => ({ date, metrics }));
  }

  async comparePlatforms(
    userId: string,
    platforms: string[],
    dateRange?: { start: Date; end: Date }
  ): Promise<PlatformMetrics[]> {
    logger.info('Comparing platforms', { userId, platforms });
    analyticsQueriesTotal.inc({ type: 'compare' });

    const results: PlatformMetrics[] = [];
    for (const platform of platforms) {
      const metrics = await this.getPlatformAnalytics(userId, platform, dateRange);
      results.push(metrics);
    }

    return results;
  }

  async getTopPosts(userId: string, limit: number = 10): Promise<IPostAnalytics[]> {
    logger.info('Getting top posts', { userId });
    return PostAnalytics.find({ userId })
      .sort({ 'metrics.engagementRate': -1 })
      .limit(limit);
  }

  async recordPostAnalytics(data: {
    userId: string;
    platform: string;
    externalPostId: string;
    content: string;
    publishedAt: Date;
    metrics: Record<string, number>;
  }): Promise<IPostAnalytics> {
    const engagement =
      (data.metrics.likes || 0) + (data.metrics.comments || 0) + (data.metrics.shares || 0);
    const reach = data.metrics.reach || data.metrics.impressions || 1;
    const engagementRate = (engagement / reach) * 100;

    const post = new PostAnalytics({
      userId: data.userId,
      platform: data.platform,
      externalPostId: data.externalPostId,
      content: data.content,
      publishedAt: data.publishedAt,
      metrics: {
        ...data.metrics,
        engagementRate
      }
    });

    await post.save();
    postsAnalyzedTotal.inc({ platform: data.platform });

    return post;
  }
}

export const analyticsService = new AnalyticsService();