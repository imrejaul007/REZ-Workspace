import { VideoAnalytics, IVideoAnalyticsDocument, Video } from '../models';
import { logger } from '../utils/logger';
import { recordVideoView, recordEngagement, watchTimeTotal } from '../utils/metrics';
import mongoose from 'mongoose';

export interface ViewAnalytics {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Array<{
    date: string;
    views: number;
    uniqueViews: number;
  }>;
  viewsBySource: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  geoBreakdown: Record<string, number>;
}

export interface EngagementMetrics {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  engagementRate: number;
  engagementByDate: Array<{
    date: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

export class AnalyticsService {
  /**
   * Get view analytics for a video
   */
  async getViewAnalytics(
    videoId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ViewAnalytics> {
    logger.info('Getting view analytics', { videoId });

    const matchStage: Record<string, any> = { videoId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    const aggregation = await VideoAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalUniqueViews: { $sum: '$uniqueViews' },
          deviceBreakdown: { $mergeObjects: '$deviceBreakdown' },
          geoBreakdown: { $mergeObjects: '$geoBreakdown' },
        },
      },
    ]);

    const dateAggregation = await VideoAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          views: { $sum: '$views' },
          uniqueViews: { $sum: '$uniqueViews' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = aggregation[0] || {
      totalViews: 0,
      totalUniqueViews: 0,
      deviceBreakdown: {},
      geoBreakdown: {},
    };

    return {
      totalViews: result.totalViews,
      uniqueViews: result.totalUniqueViews,
      viewsByDate: dateAggregation.map((d) => ({
        date: d._id,
        views: d.views,
        uniqueViews: d.uniqueViews,
      })),
      viewsBySource: {}, // Would need source field in schema
      deviceBreakdown: result.deviceBreakdown || {},
      geoBreakdown: result.geoBreakdown || {},
    };
  }

  /**
   * Get engagement metrics for a video
   */
  async getEngagementMetrics(
    videoId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EngagementMetrics> {
    logger.info('Getting engagement metrics', { videoId });

    const matchStage: Record<string, any> = { videoId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    const aggregation = await VideoAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$engagement.likes' },
          totalComments: { $sum: '$engagement.comments' },
          totalShares: { $sum: '$engagement.shares' },
          totalSaves: { $sum: '$engagement.saves' },
          totalViews: { $sum: '$views' },
        },
      },
    ]);

    const dateAggregation = await VideoAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          likes: { $sum: '$engagement.likes' },
          comments: { $sum: '$engagement.comments' },
          shares: { $sum: '$engagement.shares' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = aggregation[0] || {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalViews: 0,
    };

    const totalEngagement =
      result.totalLikes + result.totalComments + result.totalShares + result.totalSaves;
    const engagementRate = result.totalViews > 0 ? (totalEngagement / result.totalViews) * 100 : 0;

    return {
      totalLikes: result.totalLikes,
      totalComments: result.totalComments,
      totalShares: result.totalShares,
      totalSaves: result.totalSaves,
      engagementRate,
      engagementByDate: dateAggregation.map((d) => ({
        date: d._id,
        likes: d.likes,
        comments: d.comments,
        shares: d.shares,
      })),
    };
  }

  /**
   * Record a video view
   */
  async recordView(
    videoId: string,
    data: {
      views?: number;
      uniqueViews?: number;
      source?: string;
      device?: string;
      geo?: string;
      watchTime?: number;
      campaignId?: string;
    }
  ): Promise<void> {
    logger.debug('Recording video view', { videoId, source: data.source });

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    await VideoAnalytics.findOneAndUpdate(
      { videoId, date },
      {
        $inc: {
          views: data.views || 1,
          uniqueViews: data.uniqueViews || 1,
          'watchTime.total': data.watchTime || 0,
        },
        $set: {
          campaignId: data.campaignId,
        },
        $setOnInsert: {
          videoId,
          date,
          'ctr.impressions': 0,
          'ctr.clicks': 0,
          'engagement.likes': 0,
          'engagement.comments': 0,
          'engagement.shares': 0,
          'engagement.saves': 0,
        },
      },
      { upsert: true, new: true }
    );

    recordVideoView(videoId, data.source || 'direct');

    if (data.watchTime) {
      watchTimeTotal.inc({ videoId }, data.watchTime);
    }
  }

  /**
   * Record engagement action
   */
  async recordEngagementAction(
    videoId: string,
    type: 'like' | 'comment' | 'share' | 'save'
  ): Promise<void> {
    logger.debug('Recording engagement', { videoId, type });

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const engagementField = `engagement.${type}s`;
    await VideoAnalytics.findOneAndUpdate(
      { videoId, date },
      {
        $inc: { [engagementField]: 1 },
      },
      { upsert: true }
    );

    recordEngagement(type, videoId);
  }

  /**
   * Get video analytics summary
   */
  async getVideoAnalyticsSummary(videoId: string): Promise<{
    views: number;
    uniqueViews: number;
    totalWatchTime: number;
    avgWatchTime: number;
    completionRate: number;
    engagement: { likes: number; comments: number; shares: number; saves: number };
    ctr: { impressions: number; clicks: number; rate: number };
    retention: { average: number };
  }> {
    logger.info('Getting video analytics summary', { videoId });

    const aggregation = await VideoAnalytics.aggregate([
      { $match: { videoId } },
      {
        $group: {
          _id: null,
          views: { $sum: '$views' },
          uniqueViews: { $sum: '$uniqueViews' },
          totalWatchTime: { $sum: '$watchTime.total' },
          avgWatchTime: { $avg: '$watchTime.average' },
          avgCompletionRate: { $avg: '$watchTime.completionRate' },
          likes: { $sum: '$engagement.likes' },
          comments: { $sum: '$engagement.comments' },
          shares: { $sum: '$engagement.shares' },
          saves: { $sum: '$engagement.saves' },
          impressions: { $sum: '$ctr.impressions' },
          clicks: { $sum: '$ctr.clicks' },
          avgRetention: { $avg: '$retention.average' },
        },
      },
    ]);

    const result = aggregation[0] || {
      views: 0,
      uniqueViews: 0,
      totalWatchTime: 0,
      avgWatchTime: 0,
      avgCompletionRate: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      impressions: 0,
      clicks: 0,
      avgRetention: 0,
    };

    return {
      views: result.views,
      uniqueViews: result.uniqueViews,
      totalWatchTime: result.totalWatchTime,
      avgWatchTime: result.avgWatchTime,
      completionRate: result.avgCompletionRate,
      engagement: {
        likes: result.likes,
        comments: result.comments,
        shares: result.shares,
        saves: result.saves,
      },
      ctr: {
        impressions: result.impressions,
        clicks: result.clicks,
        rate: result.impressions > 0 ? (result.clicks / result.impressions) * 100 : 0,
      },
      retention: {
        average: result.avgRetention,
      },
    };
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    totalViews: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalWatchTime: number;
    engagement: { likes: number; comments: number; shares: number };
    dailyData: Array<{
      date: string;
      views: number;
      impressions: number;
      clicks: number;
      spend: number;
    }>;
  }> {
    logger.info('Getting campaign analytics', { campaignId });

    const aggregation = await VideoAnalytics.aggregate([
      { $match: { campaignId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          views: { $sum: '$views' },
          impressions: { $sum: '$ctr.impressions' },
          clicks: { $sum: '$ctr.clicks' },
          watchTime: { $sum: '$watchTime.total' },
          likes: { $sum: '$engagement.likes' },
          comments: { $sum: '$engagement.comments' },
          shares: { $sum: '$engagement.shares' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = aggregation.reduce(
      (acc, day) => ({
        views: acc.views + day.views,
        impressions: acc.impressions + day.impressions,
        clicks: acc.clicks + day.clicks,
        watchTime: acc.watchTime + day.watchTime,
        likes: acc.likes + day.likes,
        comments: acc.comments + day.comments,
        shares: acc.shares + day.shares,
      }),
      { views: 0, impressions: 0, clicks: 0, watchTime: 0, likes: 0, comments: 0, shares: 0 }
    );

    return {
      totalViews: totals.views,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      totalWatchTime: totals.watchTime,
      engagement: {
        likes: totals.likes,
        comments: totals.comments,
        shares: totals.shares,
      },
      dailyData: aggregation.map((d) => ({
        date: d._id,
        views: d.views,
        impressions: d.impressions,
        clicks: d.clicks,
        spend: 0, // Would be calculated from budget
      })),
    };
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(date?: Date): Promise<{
    totalVideos: number;
    totalViews: number;
    totalWatchTime: number;
    avgEngagementRate: number;
    topVideos: Array<{
      videoId: string;
      title: string;
      views: number;
    }>;
  }> {
    logger.info('Getting platform analytics');

    const matchStage: Record<string, any> = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const [analyticsAgg, videoCount] = await Promise.all([
      VideoAnalytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$videoId',
            views: { $sum: '$views' },
            watchTime: { $sum: '$watchTime.total' },
            likes: { $sum: '$engagement.likes' },
            comments: { $sum: '$engagement.comments' },
            shares: { $sum: '$engagement.shares' },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
      Video.countDocuments({ status: 'active' }),
    ]);

    const totals = analyticsAgg.reduce(
      (acc, v) => ({
        views: acc.views + v.views,
        watchTime: acc.watchTime + v.watchTime,
        engagement: acc.engagement + v.likes + v.comments + v.shares,
      }),
      { views: 0, watchTime: 0, engagement: 0 }
    );

    // Get video titles
    const videoIds = analyticsAgg.map((a) => new mongoose.Types.ObjectId(a._id));
    const videos = await Video.find({ _id: { $in: videoIds } }).select('title');
    const videoTitleMap = new Map(videos.map((v) => [v._id.toString(), v.title]));

    return {
      totalVideos: videoCount,
      totalViews: totals.views,
      totalWatchTime: totals.watchTime,
      avgEngagementRate: totals.views > 0 ? (totals.engagement / totals.views) * 100 : 0,
      topVideos: analyticsAgg.map((v) => ({
        videoId: v._id,
        title: videoTitleMap.get(v._id) || 'Unknown',
        views: v.views,
      })),
    };
  }

  /**
   * Get retention analysis
   */
  async getRetentionAnalysis(videoId: string): Promise<{
    averageRetention: number;
    dropOffPoints: number[];
    retentionByPercentile: Array<{
      percentile: number;
      retention: number;
    }>;
  }> {
    logger.info('Getting retention analysis', { videoId });

    const aggregation = await VideoAnalytics.aggregate([
      { $match: { videoId } },
      {
        $group: {
          _id: null,
          avgRetention: { $avg: '$retention.average' },
          allDropOffPoints: { $push: '$retention.dropOffPoints' },
        },
      },
    ]);

    const result = aggregation[0] || { avgRetention: 0, allDropOffPoints: [] };

    // Flatten and count drop-off points
    const dropOffCounts: Record<number, number> = {};
    result.allDropOffPoints.forEach((points: number[]) => {
      points.forEach((p) => {
        dropOffCounts[p] = (dropOffCounts[p] || 0) + 1;
      });
    });

    // Sort by frequency
    const dropOffPoints = Object.entries(dropOffCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([point]) => parseInt(point));

    // Calculate retention by percentile (simulated)
    const retentionByPercentile = [25, 50, 75, 90, 100].map((p) => ({
      percentile: p,
      retention: Math.max(0, result.avgRetention * (1 - p / 200)),
    }));

    return {
      averageRetention: result.avgRetention,
      dropOffPoints,
      retentionByPercentile,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;