import { Router, Response } from 'express';
import { RedditSubreddit } from '../models';
import { analyticsService } from '../services/analytics';
import { asyncHandler, AuthenticatedRequest, analyticsQuerySchema } from '../middleware';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/analytics
 * Get overall analytics
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.accountId;

    if (!accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    try {
      const [dashboard, postsAnalytics] = await Promise.all([
        analyticsService.getDashboardSummary(accountId),
        analyticsService.getPostAnalytics(accountId),
      ]);

      res.json({
        success: true,
        data: {
          dashboard,
          posts: postsAnalytics,
        },
      });
    } catch (error) {
      logger.error('Failed to get analytics', { error });
      throw error;
    }
  })
);

/**
 * GET /api/analytics/subreddit
 * Get analytics for a specific subreddit
 */
router.get(
  '/subreddit',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subreddit, days = 30 } = analyticsQuerySchema.parse(req.query);

    if (!subreddit) {
      res.status(400).json({
        success: false,
        error: 'Subreddit is required',
        code: 'MISSING_SUBREDDIT',
      });
      return;
    }

    try {
      const analytics = await analyticsService.getSubredditAnalytics(subreddit, days);

      res.json({
        success: true,
        data: {
          analytics,
        },
      });
    } catch (error) {
      logger.error('Failed to get subreddit analytics', { error, subreddit });
      throw error;
    }
  })
);

/**
 * GET /api/analytics/trending
 * Get trending posts from tracked subreddits
 */
router.get(
  '/trending',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 10 } = req.query;

    try {
      // Get all tracked subreddits
      const subreddits = await RedditSubreddit.find({}).select('subredditName');

      if (subreddits.length === 0) {
        res.json({
          success: true,
          data: {
            trending: [],
            message: 'No subreddits tracked',
          },
        });
        return;
      }

      const subredditNames = subreddits.map((s) => s.subredditName);
      const trending = await analyticsService.getTrendingPosts(
        subredditNames,
        Number(limit)
      );

      res.json({
        success: true,
        data: {
          trending,
          count: trending.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get trending posts', { error });
      throw error;
    }
  })
);

/**
 * GET /api/analytics/subreddits
 * Get analytics summary for all tracked subreddits
 */
router.get(
  '/subreddits',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { days = 30 } = req.query;

    try {
      const subreddits = await RedditSubreddit.find({}).sort({ members: -1 });

      const analyticsPromises = subreddits.map(async (subreddit) => {
        try {
          const analytics = await analyticsService.getSubredditAnalytics(
            subreddit.subredditName,
            Number(days)
          );
          return {
            subreddit: subreddit.subredditName,
            displayName: subreddit.displayName,
            members: subreddit.members,
            ...analytics,
          };
        } catch (error) {
          return {
            subreddit: subreddit.subredditName,
            displayName: subreddit.displayName,
            members: subreddit.members,
            totalPosts: 0,
            totalEngagement: 0,
            averageScore: 0,
            averageComments: 0,
            error: 'Failed to fetch analytics',
          };
        }
      });

      const results = await Promise.all(analyticsPromises);

      // Sort by total engagement
      results.sort((a, b) => (b as any).totalEngagement - (a as any).totalEngagement);

      res.json({
        success: true,
        data: {
          subreddits: results,
          totalSubreddits: results.length,
          period: `${days} days`,
        },
      });
    } catch (error) {
      logger.error('Failed to get subreddits analytics', { error });
      throw error;
    }
  })
);

/**
 * GET /api/analytics/engagement
 * Get engagement metrics over time
 */
router.get(
  '/engagement',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { days = 30 } = req.query;

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    try {
      const postsAnalytics = await analyticsService.getPostAnalytics(req.accountId);

      res.json({
        success: true,
        data: {
          engagement: postsAnalytics.engagementByDay,
          totalPosts: postsAnalytics.publishedPosts,
          totalEngagement: postsAnalytics.totalEngagement,
          averageScore: postsAnalytics.averageScore,
        },
      });
    } catch (error) {
      logger.error('Failed to get engagement analytics', { error });
      throw error;
    }
  })
);

export default router;