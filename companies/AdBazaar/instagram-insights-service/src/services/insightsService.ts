import {
  AccountInsights,
  IAccountInsights,
  ContentInsights,
  IContentInsights,
  AudienceInsights,
  IAudienceInsights,
  StoryInsights,
  IStoryInsights,
  ReelsInsights,
  IReelsInsights,
  HashtagInsights,
  IHashtagInsights,
} from '../models';
import { InstagramApiService, getInstagramApiService } from './instagramApi';
import { getInstagramConfig } from '../config/app';
import { createChildLogger } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';

const logger = createChildLogger('insights-service');

// Date range interface
export interface DateRange {
  startDate?: Date;
  endDate?: Date;
  days?: number;
}

// Dashboard summary interface
export interface DashboardSummary {
  accountId: string;
  period: string;
  followers: {
    total: number;
    change: number;
    changePercentage: number;
  };
  engagement: {
    total: number;
    rate: number;
  };
  reach: {
    total: number;
    change: number;
  };
  impressions: {
    total: number;
    change: number;
  };
  topPosts: {
    contentId: string;
    caption?: string;
    reach: number;
    engagementRate: number;
  }[];
  audienceInsights: {
    topLocations: { city: string; percentage: number }[];
    genderSplit: { male: number; female: number };
    topAgeRange: string;
  };
  bestPostingTimes: {
    day: string;
    hour: number;
  }[];
  generatedAt: Date;
}

// Best posting times result
export interface BestPostingTimes {
  byDay: { day: string; score: number }[];
  byHour: { hour: number; score: number }[];
  optimalSlots: { day: string; hour: number; engagementScore: number }[];
}

// Engagement metrics
export interface EngagementMetrics {
  totalEngagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  avgEngagementRate: number;
}

// Export format options
export type ExportFormat = 'json' | 'csv' | 'xlsx';

// Export request
export interface ExportRequest {
  type: 'account' | 'content' | 'audience' | 'stories' | 'reels' | 'hashtags';
  format: ExportFormat;
  dateRange?: DateRange;
  contentIds?: string[];
  hashtags?: string[];
}

export class InsightsService {
  private instagramApi: InstagramApiService;
  private accountId: string;

  constructor() {
    this.instagramApi = getInstagramApiService();
    this.accountId = getInstagramConfig().businessAccountId;
  }

  // Account Insights
  async getAccountInsights(
    period: 'day' | 'week' | 'days_28' = 'days_28'
  ): Promise<IAccountInsights> {
    try {
      // Try to fetch from Instagram API
      const insights = await this.instagramApi.getAccountInsights(period);
      const followerInsights = await this.instagramApi.getFollowerInsights(period);

      // Calculate follower change
      let followerChange = 0;
      let changePercentage = 0;
      if (followerInsights.data && followerInsights.data.length > 0) {
        const values = followerInsights.data[0].values;
        if (values.length >= 2) {
          const current = values[values.length - 1].value;
          const previous = values[values.length - 2].value;
          followerChange = current - previous;
          changePercentage = previous > 0 ? (followerChange / previous) * 100 : 0;
        }
      }

      // Create or update account insights document
      const accountInsightsData = {
        accountId: this.accountId,
        date: new Date(),
        followers: {
          total: insights.follower_count,
          change: followerChange,
          changePercentage,
          byGender: { male: 0, female: 0 },
          byAge: {},
          byLocation: {},
        },
        reach: insights.reach,
        impressions: insights.impressions,
        profileViews: insights.profile_views,
        websiteClicks: insights.website_cta_clicks,
        emailContacts: insights.email_contacts,
        engagement: insights.reach > 0 ? (insights.impressions / insights.reach) * 100 : 0,
        engagementRate: insights.reach > 0 ? (insights.impressions / insights.reach) * 100 : 0,
        impressionsVsReach: insights.reach > 0 ? insights.impressions / insights.reach : 0,
        metadata: {
          fetchedAt: new Date(),
          source: 'instagram_api',
        },
      };

      const savedInsights = await AccountInsights.findOneAndUpdate(
        {
          accountId: this.accountId,
          date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        accountInsightsData,
        { upsert: true, new: true }
      );

      return savedInsights;
    } catch (error) {
      logger.error('Error fetching account insights', { error });
      throw error;
    }
  }

  async getCachedAccountInsights(dateRange?: DateRange): Promise<IAccountInsights[]> {
    const query: Record<string, unknown> = { accountId: this.accountId };

    if (dateRange?.startDate && dateRange?.endDate) {
      query.date = { $gte: dateRange.startDate, $lte: dateRange.endDate };
    } else if (dateRange?.days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange.days);
      query.date = { $gte: startDate };
    }

    return AccountInsights.find(query).sort({ date: -1 }).limit(90).exec();
  }

  // Content Insights
  async getContentInsightsById(contentId: string): Promise<IContentInsights> {
    try {
      // Fetch from Instagram API
      const content = await this.instagramApi.getContentInsights(contentId);

      // Calculate engagement rate
      const totalEngagement =
        (content.likes || 0) +
        (content.comments || 0) +
        (content.saves || 0) +
        (content.shares || 0);
      const reach = (content as any).reach || 0;
      const engagementRate = reach > 0 ? (totalEngagement / reach) * 100 : 0;

      const contentInsightsData = {
        contentId,
        accountId: this.accountId,
        date: new Date(),
        mediaType: content.media_type as any,
        caption: content.caption,
        permalink: content.permalink,
        mediaUrl: content.media_url,
        thumbnailUrl: content.thumbnail_url,
        timestamp: new Date(content.timestamp),
        username: content.username,
        likes: (content as any).likes || 0,
        comments: (content as any).comments || 0,
        saves: (content as any).saved || 0,
        shares: (content as any).shares || 0,
        reach: (content as any).reach || 0,
        impressions: (content as any).impressions || 0,
        engagementRate,
        views: (content as any).views || 0,
        watchTime: (content as any).watch_time || 0,
        averageWatchTime: (content as any).average_watch_time || 0,
        metadata: {
          fetchedAt: new Date(),
          source: 'instagram_api',
        },
      };

      const savedInsights = await ContentInsights.findOneAndUpdate(
        { contentId, date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        contentInsightsData,
        { upsert: true, new: true }
      );

      return savedInsights;
    } catch (error) {
      logger.error('Error fetching content insights', { contentId, error });
      throw error;
    }
  }

  async getAllContentInsights(
    limit: number = 50,
    mediaType?: string
  ): Promise<IContentInsights[]> {
    const query: Record<string, unknown> = { accountId: this.accountId };

    if (mediaType) {
      query.mediaType = mediaType;
    }

    return ContentInsights.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .exec();
  }

  async syncContentInsights(limit: number = 25): Promise<IContentInsights[]> {
    try {
      const media = await this.instagramApi.getMedia(limit);
      const insightsPromises = media.map((m) => this.getContentInsightsById(m.id));
      return Promise.all(insightsPromises);
    } catch (error) {
      logger.error('Error syncing content insights', { error });
      throw error;
    }
  }

  // Audience Insights
  async getAudienceInsights(): Promise<IAudienceInsights> {
    try {
      const audienceData = await this.instagramApi.getAudienceInsights();
      const onlineFollowers = await this.instagramApi.getOnlineFollowers();

      // Process audience demographics
      const ageRanges = Object.entries(audienceData.followers?.age || {}).map(
        ([range, value]) => ({
          range,
          male: (audienceData.followers?.gender?.male || 0) * (value / 100),
          female: (audienceData.followers?.gender?.female || 0) * (value / 100),
        })
      );

      // Process locations
      const topLocations = Object.entries(audienceData.followers?.country || {})
        .map(([country, percentage]) => ({
          city: country,
          country,
          percentage,
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 20);

      // Process active hours
      const activeHours = Object.entries(onlineFollowers?.day_parts || {}).map(
        ([hour, percentage]) => ({
          hour: parseInt(hour, 10),
          percentage,
        })
      );

      // Process active days
      const activeDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        .map((day) => ({
          day,
          percentage: 100 / 7, // Distribute evenly if not available
        }));

      const audienceInsightsData = {
        accountId: this.accountId,
        date: new Date(),
        topLocations,
        ageRanges,
        genderSplit: {
          male: audienceData.followers?.gender?.male || 0,
          female: audienceData.followers?.gender?.female || 0,
        },
        activeHours,
        activeDays,
        followerGrowth: [],
        audienceCountry: topLocations.map((l) => ({
          country: l.country || l.city,
          percentage: l.percentage,
        })),
        audienceAge: ageRanges.map((a) => ({
          ageRange: a.range,
          male: a.male,
          female: a.female,
          percentage: 0,
        })),
        metadata: {
          fetchedAt: new Date(),
          source: 'instagram_api',
        },
      };

      const savedInsights = await AudienceInsights.findOneAndUpdate(
        {
          accountId: this.accountId,
          date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        audienceInsightsData,
        { upsert: true, new: true }
      );

      return savedInsights;
    } catch (error) {
      logger.error('Error fetching audience insights', { error });
      throw error;
    }
  }

  async getActiveTimes(): Promise<{ hours: number[]; days: string[] }> {
    const peakData = await AudienceInsights.getPeakActiveHours(this.accountId);
    return {
      hours: peakData.peakHours,
      days: peakData.peakDays,
    };
  }

  // Stories Insights
  async getStoryInsights(): Promise<IStoryInsights[]> {
    try {
      const stories = await this.instagramApi.getStories(25);
      const storyInsightsPromises = stories.map(async (story) => {
        const insights = await this.instagramApi.getStoryInsights(story.id);
        const storyData = {
          storyId: story.id,
          accountId: this.accountId,
          date: new Date(),
          timestamp: new Date(story.timestamp),
          mediaType: story.media_type,
          impressions: insights.impressions,
          reach: insights.reach,
          replies: insights.replies,
          exits: insights.exits,
          forwardTaps: insights.taps_forward,
          backTaps: insights.taps_back,
          engagementRate:
            insights.reach > 0
              ? ((insights.replies + insights.exits) / insights.reach) * 100
              : 0,
          metadata: {
            fetchedAt: new Date(),
            source: 'instagram_api',
          },
        };

        return StoryInsights.findOneAndUpdate(
          { storyId: story.id, date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          storyData,
          { upsert: true, new: true }
        );
      });

      return Promise.all(storyInsightsPromises);
    } catch (error) {
      logger.error('Error fetching story insights', { error });
      throw error;
    }
  }

  // Reels Insights
  async getReelsInsights(): Promise<IReelsInsights[]> {
    try {
      const reels = await this.instagramApi.getReels(50);
      const reelsInsightsPromises = reels.map(async (reel) => {
        const insights = await this.instagramApi.getReelsInsights(reel.id);
        const reelsData = {
          reelsId: reel.id,
          accountId: this.accountId,
          date: new Date(),
          timestamp: new Date(reel.timestamp),
          caption: reel.caption,
          permalink: reel.permalink,
          mediaUrl: reel.media_url,
          thumbnailUrl: reel.thumbnail_url,
          plays: insights.plays,
          views: insights.views,
          likes: insights.likes,
          comments: insights.comments,
          shares: insights.shares,
          saves: insights.saves,
          reach: insights.reach,
          impressions: insights.reach * 2, // Estimate if not available
          engagementRate:
            insights.reach > 0
              ? ((insights.likes + insights.comments + insights.shares + insights.saves) /
                  insights.reach) *
                100
              : 0,
          watchTime: insights.watch_time,
          averageWatchTime: insights.avg_watch_time,
          metadata: {
            fetchedAt: new Date(),
            source: 'instagram_api',
          },
        };

        return ReelsInsights.findOneAndUpdate(
          { reelsId: reel.id, date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          reelsData,
          { upsert: true, new: true }
        );
      });

      return Promise.all(reelsInsightsPromises);
    } catch (error) {
      logger.error('Error fetching reels insights', { error });
      throw error;
    }
  }

  // Hashtag Insights
  async getHashtagInsights(hashtag: string): Promise<IHashtagInsights> {
    try {
      const hashtagData = await this.instagramApi.getHashtagInsights(hashtag);

      const hashtagInsightsData = {
        hashtagId: hashtagData.hashtag_id,
        hashtag: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
        accountId: this.accountId,
        date: new Date(),
        postsUsingHashtag: hashtagData.media_count,
        reachFromHashtag: 0,
        impressionsFromHashtag: 0,
        metadata: {
          fetchedAt: new Date(),
          source: 'instagram_api',
        },
      };

      const savedInsights = await HashtagInsights.findOneAndUpdate(
        { hashtagId: hashtagData.hashtag_id, accountId: this.accountId },
        hashtagInsightsData,
        { upsert: true, new: true }
      );

      return savedInsights;
    } catch (error) {
      logger.error('Error fetching hashtag insights', { hashtag, error });
      throw error;
    }
  }

  async getTopHashtags(limit: number = 20): Promise<IHashtagInsights[]> {
    return HashtagInsights.find({ accountId: this.accountId })
      .sort({ reachFromHashtag: -1 })
      .limit(limit)
      .exec();
  }

  // Best Posting Times
  async getBestPostingTimes(): Promise<BestPostingTimes> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all content from the last 30 days
    const contentInsights = await ContentInsights.find({
      accountId: this.accountId,
      date: { $gte: thirtyDaysAgo },
    }).exec();

    // Analyze engagement by day and hour
    const dayScores: { [key: string]: number } = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };
    const hourScores: { [key: number]: number } = {};

    contentInsights.forEach((content) => {
      const date = new Date(content.date);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();

      dayScores[day] += content.engagementRate;
      hourScores[hour] = (hourScores[hour] || 0) + content.engagementRate;
    });

    const byDay = Object.entries(dayScores)
      .map(([day, score]) => ({ day, score }))
      .sort((a, b) => b.score - a.score);

    const byHour = Object.entries(hourScores)
      .map(([hour, score]) => ({ hour: parseInt(hour, 10), score }))
      .sort((a, b) => b.score - a.score);

    // Generate optimal slots (top 5)
    const optimalSlots: { day: string; hour: number; engagementScore: number }[] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < Math.min(5, byHour.length); i++) {
      const hour = byHour[i].hour;
      const topDay = byDay[0]?.day || 'Monday';
      optimalSlots.push({
        day: topDay,
        hour,
        engagementScore: byHour[i].score,
      });
    }

    return { byDay, byHour, optimalSlots };
  }

  // Dashboard Summary
  async getDashboardSummary(days: number = 7): Promise<DashboardSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [accountInsights, contentInsights, audienceInsights] = await Promise.all([
      AccountInsights.find({
        accountId: this.accountId,
        date: { $gte: startDate },
      })
        .sort({ date: -1 })
        .exec(),
      ContentInsights.find({
        accountId: this.accountId,
        date: { $gte: startDate },
      })
        .sort({ engagementRate: -1 })
        .limit(10)
        .exec(),
      AudienceInsights.findLatest(this.accountId),
    ]);

    if (!accountInsights.length) {
      throw ApiError.notFound('No insights data available');
    }

    // Calculate totals
    const latestInsights = accountInsights[0];
    const previousInsights = accountInsights[accountInsights.length - 1];

    const totalReach = accountInsights.reduce((sum, i) => sum + i.reach, 0);
    const totalImpressions = accountInsights.reduce((sum, i) => sum + i.impressions, 0);
    const previousReach = previousInsights?.reach || latestInsights.reach;
    const previousImpressions = previousInsights?.impressions || latestInsights.impressions;

    const totalEngagement = contentInsights.reduce(
      (sum, c) => sum + c.likes + c.comments + c.saves + c.shares,
      0
    );

    // Get best posting times
    const bestTimes = await this.getBestPostingTimes();

    return {
      accountId: this.accountId,
      period: `Last ${days} days`,
      followers: {
        total: latestInsights.followers.total,
        change: latestInsights.followers.change,
        changePercentage: latestInsights.followers.changePercentage || 0,
      },
      engagement: {
        total: totalEngagement,
        rate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
      },
      reach: {
        total: totalReach,
        change: previousReach > 0 ? ((totalReach - previousReach) / previousReach) * 100 : 0,
      },
      impressions: {
        total: totalImpressions,
        change:
          previousImpressions > 0
            ? ((totalImpressions - previousImpressions) / previousImpressions) * 100
            : 0,
      },
      topPosts: contentInsights.slice(0, 5).map((c) => ({
        contentId: c.contentId,
        caption: c.caption,
        reach: c.reach,
        engagementRate: c.engagementRate,
      })),
      audienceInsights: {
        topLocations: audienceInsights?.topLocations.slice(0, 5) || [],
        genderSplit: audienceInsights?.genderSplit || { male: 0, female: 0 },
        topAgeRange: audienceInsights?.ageRanges[0]?.range || 'Unknown',
      },
      bestPostingTimes: bestTimes.optimalSlots.map((s) => ({ day: s.day, hour: s.hour })),
      generatedAt: new Date(),
    };
  }

  // Export functionality
  async exportInsights(request: ExportRequest): Promise<Record<string, unknown>> {
    const { type, format, dateRange, contentIds, hashtags } = request;

    let data: Record<string, unknown>[] = [];

    switch (type) {
      case 'account':
        const accountData = await this.getCachedAccountInsights(dateRange);
        data = accountData.map((d) => ({
          accountId: d.accountId,
          date: d.date,
          followers: d.followers.total,
          reach: d.reach,
          impressions: d.impressions,
          engagementRate: d.engagementRate,
        }));
        break;

      case 'content':
        if (contentIds?.length) {
          const contentData = await Promise.all(
            contentIds.map((id) => this.getContentInsightsById(id))
          );
          data = contentData.map((d) => ({
            contentId: d.contentId,
            date: d.date,
            mediaType: d.mediaType,
            likes: d.likes,
            comments: d.comments,
            saves: d.saves,
            shares: d.shares,
            reach: d.reach,
            engagementRate: d.engagementRate,
          }));
        }
        break;

      case 'audience':
        const audience = await AudienceInsights.find({
          accountId: this.accountId,
        })
          .sort({ date: -1 })
          .limit(1)
          .exec();
        data = audience;
        break;

      case 'stories':
        data = await StoryInsights.find({
          accountId: this.accountId,
        })
          .sort({ date: -1 })
          .limit(100)
          .exec();
        break;

      case 'reels':
        data = await ReelsInsights.find({
          accountId: this.accountId,
        })
          .sort({ date: -1 })
          .limit(100)
          .exec();
        break;

      case 'hashtags':
        if (hashtags?.length) {
          const hashtagData = await Promise.all(
            hashtags.map((h) => this.getHashtagInsights(h))
          );
          data = hashtagData;
        }
        break;
    }

    // Format response based on requested format
    if (format === 'csv') {
      // Return CSV string
      if (data.length === 0) return { data: [], csv: '' };
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      return { data: data, csv: [headers, ...rows].join('\n') };
    }

    return { data, format };
  }
}

// Singleton instance
let insightsServiceInstance: InsightsService | null = null;

export const getInsightsService = (): InsightsService => {
  if (!insightsServiceInstance) {
    insightsServiceInstance = new InsightsService();
  }
  return insightsServiceInstance;
};

export default InsightsService;
