import { Competitor, ICompetitor, Platform, Priority } from '../models/index.js';
import { CompetitorSnapshot, ICompetitorSnapshot } from '../models/index.js';
import { CompetitorPost, ICompetitorPost } from '../models/index.js';
import { BenchmarkData, CompetitorAlert, IBenchmarkData } from '../models/index.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/error.middleware.js';
import mongoose from 'mongoose';

export interface CreateCompetitorInput {
  name: string;
  industry: string;
  platforms: Array<{
    platform: Platform;
    handle: string;
    accountId?: string;
  }>;
  tags?: string[];
  priority?: Priority;
  addedBy: string;
}

export interface UpdateCompetitorInput {
  name?: string;
  industry?: string;
  platforms?: Array<{
    platform: Platform;
    handle: string;
    accountId?: string;
  }>;
  tags?: string[];
  priority?: Priority;
}

export interface CompetitorOverview {
  competitor: ICompetitor;
  platforms: Array<{
    platform: string;
    latestSnapshot?: ICompetitorSnapshot;
    recentPosts: ICompetitorPost[];
  }>;
  totalFollowers: number;
  avgEngagementRate: number;
  topPerformingPost?: ICompetitorPost;
}

export interface EngagementMetrics {
  platform: string;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementRate: number;
  totalPosts: number;
  engagementTrend: 'up' | 'down' | 'stable';
  comparisonToBenchmark?: number;
}

export interface GrowthMetrics {
  platform: string;
  followerGrowth: number;
  growthRate: number;
  startFollowers: number;
  endFollowers: number;
  postingFrequency: number;
  frequencyTrend: 'up' | 'down' | 'stable';
}

export interface ComparisonResult {
  ownMetrics: {
    followers?: number;
    avgEngagementRate?: number;
    postingFrequency?: number;
  };
  competitors: Array<{
    id: string;
    name: string;
    followers?: number;
    engagementRate?: number;
    postingFrequency?: number;
  }>;
  insights: string[];
}

export class CompetitorService {
  /**
   * List all competitors with optional filters
   */
  async listCompetitors(filters?: {
    industry?: string;
    priority?: Priority;
    tags?: string[];
    search?: string;
 page?: number;
    limit?: number;
  }): Promise<{ competitors: ICompetitor[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filters?.industry) query.industry = filters.industry;
    if (filters?.priority) query.priority = filters.priority;
    if (filters?.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };
    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    const [competitors, total] = await Promise.all([
      Competitor.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      Competitor.countDocuments(query),
    ]);

    return { competitors, total, page, limit };
  }

  /**
   * Create a new competitor
   */
  async createCompetitor(input: CreateCompetitorInput): Promise<ICompetitor> {
    const competitor = new Competitor({
      name: input.name,
      industry: input.industry,
      platforms: input.platforms.map((p) => ({
        platform: p.platform,
        handle: p.handle,
        accountId: p.accountId,
        linked: false,
      })),
      tags: input.tags || [],
      priority: input.priority || 'medium',
      addedBy: input.addedBy,
    });

    await competitor.save();
    logger.info('Competitor created', { competitorId: competitor._id, name: competitor.name });

    return competitor;
  }

  /**
   * Update a competitor
   */
  async updateCompetitor(id: string, input: UpdateCompetitorInput): Promise<ICompetitor> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    if (input.name) competitor.name = input.name;
    if (input.industry) competitor.industry = input.industry;
    if (input.platforms) {
      competitor.platforms = input.platforms.map((p) => ({
        platform: p.platform,
        handle: p.handle,
        accountId: p.accountId,
        linked: false,
      }));
    }
    if (input.tags) competitor.tags = input.tags;
    if (input.priority) competitor.priority = input.priority;

    await competitor.save();
    logger.info('Competitor updated', { competitorId: competitor._id });

    return competitor;
  }

  /**
   * Delete a competitor
   */
  async deleteCompetitor(id: string): Promise<void> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    // Delete related data
    await Promise.all([
      Competitor.deleteOne({ _id: id }),
      CompetitorSnapshot.deleteMany({ competitorId: id }),
      CompetitorPost.deleteMany({ competitorId: id }),
      CompetitorAlert.deleteMany({ competitorId: id }),
    ]);

    logger.info('Competitor deleted', { competitorId: id });
  }

  /**
   * Get competitor overview with latest metrics
   */
  async getCompetitorOverview(id: string): Promise<CompetitorOverview> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    const platformData = await Promise.all(
      competitor.platforms.map(async (p) => {
        const latestSnapshot = await CompetitorSnapshot.findLatest(id, p.platform);
        const recentPosts = await CompetitorPost.findByCompetitor(id, p.platform, 5);

        return {
          platform: p.platform,
          latestSnapshot,
          recentPosts,
        };
      })
    );

    // Calculate totals
    let totalFollowers = 0;
    let totalEngagement = 0;
    let engagementCount = 0;
    let topPerformingPost: ICompetitorPost | undefined;

    for (const pd of platformData) {
      if (pd.latestSnapshot) {
        totalFollowers += pd.latestSnapshot.followers;
        totalEngagement += pd.latestSnapshot.engagementRate;
        engagementCount++;
      }

      // Find top performing post
      const topPost = pd.recentPosts.reduce((best, post) => {
        if (!best || post.metrics.engagementRate > best.metrics.engagementRate) {
          return post;
        }
        return best;
      }, undefined as ICompetitorPost | undefined);

      if (topPost && (!topPerformingPost || topPost.metrics.engagementRate > topPerformingPost.metrics.engagementRate)) {
        topPerformingPost = topPost;
      }
    }

    return {
      competitor,
      platforms: platformData,
      totalFollowers,
      avgEngagementRate: engagementCount > 0 ? totalEngagement / engagementCount : 0,
      topPerformingPost,
    };
  }

  /**
   * Get competitor content (posts)
   */
  async getCompetitorContent(
    id: string,
    options?: { platform?: string; page?: number; limit?: number }
  ): Promise<{ posts: ICompetitorPost[]; total: number }> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { competitorId: id };
    if (options?.platform) query.platform = options.platform;

    const [posts, total] = await Promise.all([
      CompetitorPost.find(query).skip(skip).limit(limit).sort({ postedAt: -1 }).exec(),
      CompetitorPost.countDocuments(query),
    ]);

    return { posts, total };
  }

  /**
   * Get competitor engagement metrics
   */
  async getCompetitorEngagement(
    id: string,
    options?: { platform?: string; days?: number }
  ): Promise<EngagementMetrics[]> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    const days = options?.days || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics: EngagementMetrics[] = await Promise.all(
      competitor.platforms.map(async (p) => {
        if (options?.platform && options.platform !== p.platform) {
          return null as unknown as EngagementMetrics;
        }

        const avgMetrics = await CompetitorPost.getAverageMetrics(id, p.platform, days);
        const metricsData = avgMetrics[0] || {
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          avgEngagementRate: 0,
          totalPosts: 0,
        };

        // Calculate trend by comparing two periods
        const firstHalf = await CompetitorPost.getAverageMetrics(
          id,
          p.platform,
          Math.floor(days / 2)
        );
        const secondHalf = await CompetitorPost.getAverageMetrics(
          id,
          p.platform,
          Math.floor(days / 2)
        );

        const firstEngagement = firstHalf[0]?.avgEngagementRate || 0;
        const secondEngagement = secondHalf[0]?.avgEngagementRate || 0;

        let engagementTrend: 'up' | 'down' | 'stable' = 'stable';
        if (secondEngagement > firstEngagement * 1.1) engagementTrend = 'up';
        else if (secondEngagement < firstEngagement * 0.9) engagementTrend = 'down';

        // Get benchmark comparison
        let comparisonToBenchmark: number | undefined;
        const benchmark = await BenchmarkData.findLatest(competitor.industry);
        if (benchmark) {
          comparisonToBenchmark = metricsData.avgEngagementRate - benchmark.metrics.avgEngagementRate;
        }

        return {
          platform: p.platform,
          avgLikes: Math.round(metricsData.avgLikes || 0),
          avgComments: Math.round(metricsData.avgComments || 0),
          avgShares: Math.round(metricsData.avgShares || 0),
          avgEngagementRate: Math.round((metricsData.avgEngagementRate || 0) * 100) / 100,
          totalPosts: metricsData.totalPosts || 0,
          engagementTrend,
          comparisonToBenchmark,
        };
      })
    );

    return metrics.filter((m) => m !== null);
  }

  /**
   * Get competitor growth metrics
   */
  async getCompetitorGrowth(
    id: string,
    options?: { platform?: string; days?: number }
  ): Promise<GrowthMetrics[]> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    const days = options?.days || 30;

    const metrics: GrowthMetrics[] = await Promise.all(
      competitor.platforms.map(async (p) => {
        if (options?.platform && options.platform !== p.platform) {
          return null as unknown as GrowthMetrics;
        }

        const growthData = await CompetitorSnapshot.getGrowthRate(id, p.platform, days);
        const latestSnapshot = await CompetitorSnapshot.findLatest(id, p.platform);

        // Calculate posting frequency trend
        const firstHalf = await CompetitorSnapshot.findByDateRange(
          id,
          p.platform,
          new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          new Date(Date.now() - Math.floor(days / 2) * 24 * 60 * 60 * 1000)
        );
        const secondHalf = await CompetitorSnapshot.findByDateRange(
          id,
          p.platform,
          new Date(Date.now() - Math.floor(days / 2) * 24 * 60 * 60 * 1000),
          new Date()
        );

        const firstFreq = firstHalf.length > 0 ? firstHalf[0].postingFrequency : 0;
        const secondFreq = secondHalf.length > 0 ? secondHalf[0].postingFrequency : 0;

        let frequencyTrend: 'up' | 'down' | 'stable' = 'stable';
        if (secondFreq > firstFreq * 1.1) frequencyTrend = 'up';
        else if (secondFreq < firstFreq * 0.9) frequencyTrend = 'down';

        return {
          platform: p.platform,
          followerGrowth: growthData?.followerGrowth || 0,
          growthRate: growthData?.growthRate || 0,
          startFollowers: growthData?.startFollowers || 0,
          endFollowers: growthData?.endFollowers || 0,
          postingFrequency: latestSnapshot?.postingFrequency || 0,
          frequencyTrend,
        };
      })
    );

    return metrics.filter((m) => m !== null);
  }

  /**
   * Get competitor posts
   */
  async getCompetitorPosts(
    id: string,
    options?: { platform?: string; page?: number; limit?: number; sortBy?: 'recent' | 'top' }
  ): Promise<{ posts: ICompetitorPost[]; total: number }> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { competitorId: id };
    if (options?.platform) query.platform = options.platform;

    let sortQuery: Record<string, 1 | -1> = { postedAt: -1 };
    if (options?.sortBy === 'top') {
      sortQuery = { 'metrics.engagementRate': -1 };
    }

    const [posts, total] = await Promise.all([
      CompetitorPost.find(query).skip(skip).limit(limit).sort(sortQuery).exec(),
      CompetitorPost.countDocuments(query),
    ]);

    return { posts, total };
  }

  /**
   * Force sync competitor data
   */
  async syncCompetitor(id: string): Promise<{ success: boolean; syncedPlatforms: string[] }> {
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    const syncedPlatforms: string[] = [];

    // In a real implementation, this would call external APIs
    // For now, we'll simulate the sync process
    for (const platform of competitor.platforms) {
      try {
        // Update last sync time
        platform.lastSync = new Date();
        platform.linked = true;

        // Create a snapshot (in real implementation, fetch from API)
        const snapshot = new CompetitorSnapshot({
          competitorId: competitor._id,
          platform: platform.platform,
          date: new Date(),
          followers: Math.floor(Math.random() * 1000000),
          following: Math.floor(Math.random() * 1000),
          posts: Math.floor(Math.random() * 5000),
          avgLikes: Math.floor(Math.random() * 10000),
          avgComments: Math.floor(Math.random() * 1000),
          engagementRate: Math.random() * 10,
          postingFrequency: Math.random() * 14,
        });

        await snapshot.save();
        syncedPlatforms.push(platform.platform);

        logger.info('Competitor synced', {
          competitorId: id,
          platform: platform.platform,
        });
      } catch (error) {
        logger.error('Failed to sync platform', {
          competitorId: id,
          platform: platform.platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await competitor.save();

    return { success: true, syncedPlatforms };
  }

  /**
   * Compare competitors
   */
  async compareCompetitors(
    competitorIds: string[],
    ownMetrics?: { followers?: number; engagementRate?: number; postingFrequency?: number }
  ): Promise<ComparisonResult> {
    const competitors = await Competitor.find({ _id: { $in: competitorIds } });

    const comparisonData = await Promise.all(
      competitors.map(async (comp) => {
        const latestSnapshots = await Promise.all(
          comp.platforms.map((p) => CompetitorSnapshot.findLatest(comp._id.toString(), p.platform))
        );

        const totalFollowers = latestSnapshots.reduce((sum, s) => sum + (s?.followers || 0), 0);
        const avgEngagement = latestSnapshots.reduce((sum, s) => sum + (s?.engagementRate || 0), 0) /
          (latestSnapshots.filter((s) => s).length || 1);
        const avgFrequency = latestSnapshots.reduce((sum, s) => sum + (s?.postingFrequency || 0), 0) /
          (latestSnapshots.filter((s) => s).length || 1);

        return {
          id: comp._id.toString(),
          name: comp.name,
          followers: totalFollowers,
          engagementRate: Math.round(avgEngagement * 100) / 100,
          postingFrequency: Math.round(avgFrequency * 10) / 10,
        };
      })
    );

    // Generate insights
    const insights: string[] = [];

    if (ownMetrics?.followers) {
      const avgFollowers = comparisonData.reduce((sum, c) => sum + (c.followers || 0), 0) / comparisonData.length;
      if (ownMetrics.followers > avgFollowers) {
        insights.push(`You have ${Math.round(((ownMetrics.followers - avgFollowers) / avgFollowers) * 100)}% more followers than the average competitor`);
      } else {
        insights.push(`You have ${Math.round(((avgFollowers - ownMetrics.followers) / avgFollowers) * 100)}% fewer followers than the average competitor`);
      }
    }

    if (ownMetrics?.engagementRate) {
      const avgEngagement = comparisonData.reduce((sum, c) => sum + (c.engagementRate || 0), 0) / comparisonData.length;
      if (ownMetrics.engagementRate > avgEngagement) {
        insights.push('Your engagement rate is above the competitor average - great content strategy!');
      } else {
        insights.push('Your engagement rate is below the competitor average - consider reviewing your content strategy');
      }
    }

    // Find best performer
    const bestEngagement = comparisonData.reduce(
      (best, c) => (!best || (c.engagementRate || 0) > (best.engagementRate || 0) ? c : best),
      null as (typeof comparisonData)[0] | null
    );
    if (bestEngagement) {
      insights.push(`${bestEngagement.name} has the highest engagement rate - consider analyzing their content strategy`);
    }

    return {
      ownMetrics,
      competitors: comparisonData,
      insights,
    };
  }

  /**
   * Get industry benchmarks
   */
  async getBenchmarks(industry: string): Promise<IBenchmarkData | null> {
    return BenchmarkData.findLatest(industry);
  }

  /**
   * Get competitor alerts
   */
  async getAlerts(options?: {
    competitorId?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: InstanceType<typeof CompetitorAlert>[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (options?.competitorId) query.competitorId = options.competitorId;
    if (options?.unreadOnly) query.read = false;

    const [alerts, total] = await Promise.all([
      CompetitorAlert.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      CompetitorAlert.countDocuments(query),
    ]);

    return { alerts, total };
  }

  /**
   * Mark alerts as read
   */
  async markAlertsAsRead(alertIds: string[]): Promise<number> {
    const result = await CompetitorAlert.markAsRead(alertIds);
    return result.modifiedCount;
  }
}

export const competitorService = new CompetitorService();
