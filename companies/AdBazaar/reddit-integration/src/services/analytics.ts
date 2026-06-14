import { RedditPost } from '../models/RedditPost';
import { RedditComment } from '../models/RedditComment';
import { RedditSubreddit } from '../models/RedditSubreddit';
import { ScheduledPost } from '../models/ScheduledPost';
import { redditApi } from './redditApi';
import { logger } from '../config/logger';

export interface SubredditAnalytics {
  subreddit: string;
  totalPosts: number;
  totalEngagement: number;
  averageScore: number;
  averageComments: number;
  bestPerformingPost: {
    title: string;
    score: number;
    comments: number;
    postedAt: Date;
  } | null;
  engagementTrend: {
    date: string;
    engagement: number;
  }[];
  topPosts: {
    title: string;
    score: number;
    comments: number;
    postedAt: Date;
  }[];
}

export interface TrendingPost {
  subreddit: string;
  title: string;
  score: number;
  comments: number;
  url: string;
  postedAt: Date;
}

export interface PostAnalytics {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  totalEngagement: number;
  averageScore: number;
  totalComments: number;
  engagementByDay: {
    date: string;
    posts: number;
    engagement: number;
  }[];
}

class AnalyticsService {
  /**
   * Get analytics for a specific subreddit
   */
  async getSubredditAnalytics(
    subreddit: string,
    days: number = 30
  ): Promise<SubredditAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all posts from the subreddit
      const posts = await RedditPost.find({
        subreddit: subreddit.toLowerCase(),
        postedAt: { $gte: startDate },
      }).sort({ postedAt: -1 });

      // Calculate metrics
      const totalPosts = posts.length;
      const totalEngagement = posts.reduce(
        (sum, post) => sum + post.metrics.score + post.metrics.comments,
        0
      );
      const averageScore =
        totalPosts > 0
          ? posts.reduce((sum, post) => sum + post.metrics.score, 0) / totalPosts
          : 0;
      const averageComments =
        totalPosts > 0
          ? posts.reduce((sum, post) => sum + post.metrics.comments, 0) / totalPosts
          : 0;

      // Find best performing post
      const bestPerformingPost =
        posts.length > 0
          ? posts.reduce((best, post) =>
              post.metrics.score > best.metrics.score ? post : best
            )
          : null;

      // Calculate engagement trend by day
      const engagementByDay: Map<string, { engagement: number; count: number }> =
        new Map();

      posts.forEach((post) => {
        const dateKey = post.postedAt!.toISOString().split('T')[0];
        const existing = engagementByDay.get(dateKey) || { engagement: 0, count: 0 };
        engagementByDay.set(dateKey, {
          engagement: existing.engagement + post.metrics.score + post.metrics.comments,
          count: existing.count + 1,
        });
      });

      const engagementTrend = Array.from(engagementByDay.entries())
        .map(([date, data]) => ({
          date,
          engagement: data.engagement,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top posts
      const topPosts = posts
        .sort((a, b) => b.metrics.score - a.metrics.score)
        .slice(0, 10)
        .map((post) => ({
          title: post.title,
          score: post.metrics.score,
          comments: post.metrics.comments,
          postedAt: post.postedAt!,
        }));

      return {
        subreddit,
        totalPosts,
        totalEngagement,
        averageScore: Math.round(averageScore),
        averageComments: Math.round(averageComments),
        bestPerformingPost: bestPerformingPost
          ? {
              title: bestPerformingPost.title,
              score: bestPerformingPost.metrics.score,
              comments: bestPerformingPost.metrics.comments,
              postedAt: bestPerformingPost.postedAt!,
            }
          : null,
        engagementTrend,
        topPosts,
      };
    } catch (error) {
      logger.error('Failed to get subreddit analytics', { error, subreddit });
      throw error;
    }
  }

  /**
   * Get trending posts from tracked subreddits
   */
  async getTrendingPosts(
    subreddits: string[],
    limit: number = 10
  ): Promise<TrendingPost[]> {
    try {
      const trending: TrendingPost[] = [];

      for (const subreddit of subreddits) {
        try {
          const posts = await redditApi.getSubredditPosts(subreddit, 'hot', limit);

          for (const post of posts) {
            trending.push({
              subreddit,
              title: post.title,
              score: post.score,
              comments: post.num_comments,
              url: post.permalink,
              postedAt: new Date(post.created_utc * 1000),
            });
          }
        } catch (error) {
          logger.warn(`Failed to fetch trending from r/${subreddit}`, { error });
        }
      }

      return trending
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get trending posts', { error });
      throw error;
    }
  }

  /**
   * Get overall post analytics for an account
   */
  async getPostAnalytics(accountId: string): Promise<PostAnalytics> {
    try {
      // Get all posts
      const allPosts = await RedditPost.find({ accountId });
      const publishedPosts = allPosts.filter((p) => p.postedAt !== null);
      const scheduledPosts = allPosts.filter((p) => p.scheduledFor !== null && p.postedAt === null);

      // Calculate metrics
      const totalEngagement = publishedPosts.reduce(
        (sum, post) => sum + post.metrics.score + post.metrics.comments,
        0
      );
      const averageScore =
        publishedPosts.length > 0
          ? publishedPosts.reduce((sum, post) => sum + post.metrics.score, 0) /
            publishedPosts.length
          : 0;

      // Get all comments
      const comments = await RedditComment.find({ accountId, postedAt: { $ne: null } });

      // Calculate engagement by day
      const engagementByDay: Map<string, { engagement: number; count: number }> =
        new Map();

      publishedPosts.forEach((post) => {
        const dateKey = post.postedAt!.toISOString().split('T')[0];
        const existing = engagementByDay.get(dateKey) || { engagement: 0, count: 0 };
        engagementByDay.set(dateKey, {
          engagement: existing.engagement + post.metrics.score + post.metrics.comments,
          count: existing.count + 1,
        });
      });

      const engagementTrend = Array.from(engagementByDay.entries())
        .map(([date, data]) => ({
          date,
          posts: data.count,
          engagement: data.engagement,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      return {
        totalPosts: allPosts.length,
        publishedPosts: publishedPosts.length,
        scheduledPosts: scheduledPosts.length,
        totalEngagement,
        averageScore: Math.round(averageScore),
        totalComments: comments.length,
        engagementByDay: engagementTrend,
      };
    } catch (error) {
      logger.error('Failed to get post analytics', { error, accountId });
      throw error;
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(accountId: string): Promise<{
    totalPosts: number;
    totalComments: number;
    totalScheduled: number;
    totalSubreddits: number;
    topSubreddit: string | null;
    recentEngagement: number;
  }> {
    try {
      const [posts, comments, scheduled, subreddits] = await Promise.all([
        RedditPost.countDocuments({ accountId, postedAt: { $ne: null } }),
        RedditComment.countDocuments({ accountId, postedAt: { $ne: null } }),
        ScheduledPost.countDocuments({ accountId, status: 'pending' }),
        RedditSubreddit.countDocuments(),
      ]);

      // Get top performing subreddit
      const topSubredditAgg = await RedditPost.aggregate([
        { $match: { accountId: accountId, postedAt: { $ne: null } } },
        { $group: { _id: '$subreddit', totalScore: { $sum: '$metrics.score' } } },
        { $sort: { totalScore: -1 } },
        { $limit: 1 },
      ]);

      // Get recent engagement (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentPosts = await RedditPost.find({
        accountId,
        postedAt: { $gte: sevenDaysAgo },
      });

      const recentEngagement = recentPosts.reduce(
        (sum, post) => sum + post.metrics.score + post.metrics.comments,
        0
      );

      return {
        totalPosts: posts,
        totalComments: comments,
        totalScheduled: scheduled,
        totalSubreddits: subreddits,
        topSubreddit: topSubredditAgg[0]?._id || null,
        recentEngagement,
      };
    } catch (error) {
      logger.error('Failed to get dashboard summary', { error, accountId });
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;