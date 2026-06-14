import { Analytics, PostAnalytics } from '../models';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('DashboardService');

export interface DashboardData {
  overview: {
    totalImpressions: number;
    totalReach: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalPosts: number;
  };
  platforms: {
    platform: string;
    impressions: number;
    reach: number;
    engagement: number;
    engagementRate: number;
    postsCount: number;
  }[];
  topPosts: {
    postId: string;
    content: string;
    platform: string;
    engagement: number;
    engagementRate: number;
  }[];
  trends: {
    date: string;
    impressions: number;
    reach: number;
    engagement: number;
  }[];
  recentActivity: {
    postId: string;
    content: string;
    platform: string;
    publishedAt: Date;
    metrics: Record<string, number>;
  }[];
}

export class DashboardService {
  async getDashboardData(userId: string, days: number = 30): Promise<DashboardData> {
    logger.info('Generating dashboard data', { userId, days });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Overview metrics
    const analytics = await Analytics.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const overview = analytics.reduce(
      (acc, a) => ({
        impressions: acc.impressions + a.metrics.impressions,
        reach: acc.reach + a.metrics.reach,
        engagement:
          acc.engagement + a.metrics.likes + a.metrics.comments + a.metrics.shares,
        rateSum: acc.rateSum + a.metrics.engagementRate,
        count: acc.count + 1
      }),
      { impressions: 0, reach: 0, engagement: 0, rateSum: 0, count: 0 }
    );

    // Platform breakdown
    const platformMap: Record<string, { impressions: number; reach: number; engagement: number; count: number; rateSum: number }> = {};
    analytics.forEach(a => {
      if (!platformMap[a.platform]) {
        platformMap[a.platform] = { impressions: 0, reach: 0, engagement: 0, count: 0, rateSum: 0 };
      }
      platformMap[a.platform].impressions += a.metrics.impressions;
      platformMap[a.platform].reach += a.metrics.reach;
      platformMap[a.platform].engagement += a.metrics.likes + a.metrics.comments + a.metrics.shares;
      platformMap[a.platform].count += 1;
      platformMap[a.platform].rateSum += a.metrics.engagementRate;
    });

    const platforms = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      impressions: data.impressions,
      reach: data.reach,
      engagement: data.engagement,
      engagementRate: data.count > 0 ? Math.round((data.rateSum / data.count) * 100) / 100 : 0,
      postsCount: data.count
    }));

    // Top posts
    const topPostsRaw = await PostAnalytics.find({ userId })
      .sort({ 'metrics.engagementRate': -1 })
      .limit(5);

    const topPosts = topPostsRaw.map(p => ({
      postId: p.externalPostId,
      content: p.content,
      platform: p.platform,
      engagement: p.metrics.likes + p.metrics.comments + p.metrics.shares,
      engagementRate: p.metrics.engagementRate
    }));

    // Trends (last 7 days)
    const trendEnd = new Date();
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - 7);

    const trendsData = await Analytics.find({
      userId,
      date: { $gte: trendStart, $lte: trendEnd }
    }).sort({ date: 1 });

    const trendMap: Record<string, { impressions: number; reach: number; engagement: number }> = {};
    trendsData.forEach(a => {
      const dateKey = new Date(a.date).toISOString().split('T')[0];
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { impressions: 0, reach: 0, engagement: 0 };
      }
      trendMap[dateKey].impressions += a.metrics.impressions;
      trendMap[dateKey].reach += a.metrics.reach;
      trendMap[dateKey].engagement += a.metrics.likes + a.metrics.comments + a.metrics.shares;
    });

    const trends = Object.entries(trendMap).map(([date, metrics]) => ({ date, ...metrics }));

    // Recent activity
    const recentPosts = await PostAnalytics.find({ userId })
      .sort({ publishedAt: -1 })
      .limit(10);

    const recentActivity = recentPosts.map(p => ({
      postId: p.externalPostId,
      content: p.content,
      platform: p.platform,
      publishedAt: p.publishedAt,
      metrics: p.metrics
    }));

    return {
      overview: {
        totalImpressions: overview.impressions,
        totalReach: overview.reach,
        totalEngagement: overview.engagement,
        avgEngagementRate: overview.count > 0 ? Math.round((overview.rateSum / overview.count) * 100) / 100 : 0,
        totalPosts: overview.count
      },
      platforms,
      topPosts,
      trends,
      recentActivity
    };
  }
}

export const dashboardService = new DashboardService();