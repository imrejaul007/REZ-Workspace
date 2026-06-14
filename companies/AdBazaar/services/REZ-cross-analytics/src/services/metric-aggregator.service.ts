import { v4 as uuidv4 } from 'uuid';
import {
  Platform,
  UnifiedMetrics,
  AggregatedMetrics,
  EngagementMetrics,
  TwitterMetrics,
  InstagramMetrics,
  LinkedInMetrics,
  TikTokMetrics,
  FacebookMetrics,
  YouTubeMetrics,
  DateRange,
} from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricAggregator');

export class MetricAggregatorService {
  /**
   * Normalize raw platform metrics to unified format
   */
  normalizeTwitterMetrics(raw: TwitterMetrics[], timestamp: Date): UnifiedMetrics[] {
    return raw.map((m) => ({
      platform: 'twitter' as Platform,
      contentId: m.tweetId,
      timestamp,
      impressions: m.impressions,
      reach: m.impressions, // Twitter doesn't provide separate reach
      engagements: m.engagements,
      likes: m.likes,
      comments: m.replies,
      shares: m.retweets,
      clicks: m.urlClicks + m.profileClicks,
    }));
  }

  normalizeInstagramMetrics(raw: InstagramMetrics[], timestamp: Date): UnifiedMetrics[] {
    return raw.map((m) => ({
      platform: 'instagram' as Platform,
      contentId: m.mediaId,
      timestamp,
      impressions: m.impressions,
      reach: m.reach,
      engagements: m.likes + m.comments + m.saves + m.shares,
      likes: m.likes,
      comments: m.comments,
      shares: m.shares,
      clicks: m.websiteClicks,
      customMetrics: {
        saves: m.saves,
        profileVisits: m.profileVisits,
      },
    }));
  }

  normalizeLinkedInMetrics(raw: LinkedInMetrics[], timestamp: Date): UnifiedMetrics[] {
    return raw.map((m) => ({
      platform: 'linkedin' as Platform,
      contentId: m.postId,
      timestamp,
      impressions: m.impressions,
      reach: m.impressions,
      engagements: Math.round(m.impressions * m.engagementRate),
      likes: m.likes,
      comments: m.comments,
      shares: m.shares,
      clicks: m.clicks,
    }));
  }

  normalizeTikTokMetrics(raw: TikTokMetrics[], timestamp: Date): UnifiedMetrics[] {
    return raw.map((m) => ({
      platform: 'tiktok' as Platform,
      contentId: m.videoId,
      timestamp,
      impressions: m.views,
      reach: m.views,
      engagements: m.likes + m.comments + m.shares,
      likes: m.likes,
      comments: m.comments,
      shares: m.shares,
      clicks: m.profileViews,
      customMetrics: {
        watchTime: m.watchTime,
        averageWatchTime: m.averageWatchTime,
      },
    }));
  }

  normalizeFacebookMetrics(raw: FacebookMetrics[], timestamp: Date): UnifiedMetrics[] {
    return raw.map((m) => ({
      platform: 'facebook' as Platform,
      contentId: m.postId,
      timestamp,
      impressions: m.impressions,
      reach: m.reach,
      engagements: m.reactions + m.comments + m.shares,
      likes: m.reactions,
      comments: m.comments,
      shares: m.shares,
      clicks: m.clicks,
    }));
  }

  normalizeYouTubeMetrics(raw: YouTubeMetrics[], timestamp: Date): UnifiedMetrics[] {
    return raw.map((m) => ({
      platform: 'youtube' as Platform,
      contentId: m.videoId,
      timestamp,
      impressions: m.views,
      reach: m.views,
      engagements: m.likes + m.comments + m.shares,
      likes: m.likes,
      comments: m.comments,
      shares: m.shares,
      clicks: m.subscribersGained,
      customMetrics: {
        watchTime: m.watchTime,
        subscribersGained: m.subscribersGained,
        subscribersLost: m.subscribersLost,
      },
    }));
  }

  /**
   * Aggregate metrics by platform
   */
  aggregateByPlatform(metrics: UnifiedMetrics[]): AggregatedMetrics[] {
    const platformMap = new Map<Platform, UnifiedMetrics[]>();

    // Group by platform
    metrics.forEach((m) => {
      const existing = platformMap.get(m.platform) || [];
      existing.push(m);
      platformMap.set(m.platform, existing);
    });

    // Calculate aggregated metrics per platform
    const aggregated: AggregatedMetrics[] = [];

    platformMap.forEach((platformMetrics, platform) => {
      const totalImpressions = platformMetrics.reduce((sum, m) => sum + m.impressions, 0);
      const totalReach = platformMetrics.reduce((sum, m) => sum + m.reach, 0);
      const totalEngagements = platformMetrics.reduce((sum, m) => sum + m.engagements, 0);
      const totalLikes = platformMetrics.reduce((sum, m) => sum + m.likes, 0);
      const totalComments = platformMetrics.reduce((sum, m) => sum + m.comments, 0);
      const totalShares = platformMetrics.reduce((sum, m) => sum + m.shares, 0);
      const totalClicks = platformMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const postCount = platformMetrics.length;

      aggregated.push({
        platform,
        totalImpressions,
        totalReach,
        totalEngagements,
        totalLikes,
        totalComments,
        totalShares,
        totalClicks,
        engagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
        averageImpressionsPerPost: postCount > 0 ? totalImpressions / postCount : 0,
        postCount,
      });
    });

    return aggregated;
  }

  /**
   * Calculate engagement metrics for a set of metrics
   */
  calculateEngagementMetrics(metrics: UnifiedMetrics[]): EngagementMetrics {
    if (metrics.length === 0) {
      return {
        engagementRate: 0,
        likeRate: 0,
        commentRate: 0,
        shareRate: 0,
        clickRate: 0,
      };
    }

    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        likes: acc.likes + m.likes,
        comments: acc.comments + m.comments,
        shares: acc.shares + m.shares,
        clicks: acc.clicks + m.clicks,
      }),
      { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
    );

    const engagementRate = totals.impressions > 0 ? (totals.likes + totals.comments + totals.shares + totals.clicks) / totals.impressions * 100 : 0;

    return {
      engagementRate,
      likeRate: totals.impressions > 0 ? (totals.likes / totals.impressions) * 100 : 0,
      commentRate: totals.impressions > 0 ? (totals.comments / totals.impressions) * 100 : 0,
      shareRate: totals.impressions > 0 ? (totals.shares / totals.impressions) * 100 : 0,
      clickRate: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    };
  }

  /**
   * Aggregate metrics across all platforms for a date range
   */
  aggregateCrossPlatform(metrics: UnifiedMetrics[]): {
    totalImpressions: number;
    totalReach: number;
    totalEngagements: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
    engagementRate: number;
  } {
    if (metrics.length === 0) {
      return {
        totalImpressions: 0,
        totalReach: 0,
        totalEngagements: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalClicks: 0,
        engagementRate: 0,
      };
    }

    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        reach: acc.reach + m.reach,
        engagements: acc.engagements + m.engagements,
        likes: acc.likes + m.likes,
        comments: acc.comments + m.comments,
        shares: acc.shares + m.shares,
        clicks: acc.clicks + m.clicks,
      }),
      { impressions: 0, reach: 0, engagements: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
    );

    return {
      totalImpressions: totals.impressions,
      totalReach: totals.reach,
      totalEngagements: totals.engagements,
      totalLikes: totals.likes,
      totalComments: totals.comments,
      totalShares: totals.shares,
      totalClicks: totals.clicks,
      engagementRate: totals.impressions > 0 ? (totals.engagements / totals.impressions) * 100 : 0,
    };
  }

  /**
   * Group metrics by time period
   */
  groupByTimePeriod(
    metrics: UnifiedMetrics[],
    period: 'day' | 'week' | 'month' | 'hour'
  ): Map<string, UnifiedMetrics[]> {
    const grouped = new Map<string, UnifiedMetrics[]>();

    metrics.forEach((m) => {
      const key = this.getTimeKey(m.timestamp, period);
      const existing = grouped.get(key) || [];
      existing.push(m);
      grouped.set(key, existing);
    });

    return grouped;
  }

  private getTimeKey(date: Date, period: 'day' | 'week' | 'month' | 'hour'): string {
    const d = new Date(date);
    switch (period) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}`;
      case 'day':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      case 'week':
        const weekNum = this.getWeekNumber(d);
        return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Merge metrics from multiple sources for the same content
   */
  mergeDuplicateMetrics(metrics: UnifiedMetrics[]): UnifiedMetrics[] {
    const contentMap = new Map<string, UnifiedMetrics[]>();

    // Group by contentId + platform
    metrics.forEach((m) => {
      const key = `${m.platform}-${m.contentId}`;
      const existing = contentMap.get(key) || [];
      existing.push(m);
      contentMap.set(key, existing);
    });

    // Merge duplicates by summing
    const merged: UnifiedMetrics[] = [];
    contentMap.forEach((duplicates) => {
      if (duplicates.length === 1) {
        merged.push(duplicates[0]);
      } else {
        // Keep the first, add values from others
        const base = { ...duplicates[0] };
        duplicates.slice(1).forEach((d) => {
          base.impressions += d.impressions;
          base.reach += d.reach;
          base.engagements += d.engagements;
          base.likes += d.likes;
          base.comments += d.comments;
          base.shares += d.shares;
          base.clicks += d.clicks;
        });
        merged.push(base);
      }
    });

    return merged;
  }

  /**
   * Filter metrics by date range
   */
  filterByDateRange(metrics: UnifiedMetrics[], dateRange: DateRange): UnifiedMetrics[] {
    return metrics.filter((m) => {
      const timestamp = new Date(m.timestamp).getTime();
      return (
        timestamp >= new Date(dateRange.start).getTime() &&
        timestamp <= new Date(dateRange.end).getTime()
      );
    });
  }

  /**
   * Filter metrics by platforms
   */
  filterByPlatforms(metrics: UnifiedMetrics[], platforms: Platform[]): UnifiedMetrics[] {
    if (platforms.length === 0) return metrics;
    return metrics.filter((m) => platforms.includes(m.platform));
  }

  /**
   * Get top performing content across all platforms
   */
  getTopPerforming(
    metrics: UnifiedMetrics[],
    metric: 'impressions' | 'engagements' | 'likes' | 'comments' | 'shares',
    limit: number = 10
  ): UnifiedMetrics[] {
    return [...metrics]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }
}

export const metricAggregatorService = new MetricAggregatorService();
export default metricAggregatorService;
