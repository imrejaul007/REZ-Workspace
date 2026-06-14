import { Router, Response } from 'express';
import { RedditSubreddit } from '../models';
import { redditApi } from '../services/redditApi';
import { asyncHandler, AuthenticatedRequest, addSubredditSchema, subredditQuerySchema } from '../middleware';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/subreddits
 * List tracked subreddits
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 50, skip = 0, search } = subredditQuerySchema.parse(req.query);

    let query = {};
    if (search) {
      query = { subredditName: { $regex: search, $options: 'i' } };
    }

    const [subreddits, total] = await Promise.all([
      RedditSubreddit.find(query)
        .sort({ members: -1 })
        .skip(skip)
        .limit(limit),
      RedditSubreddit.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        subreddits,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + subreddits.length < total,
        },
      },
    });
  })
);

/**
 * POST /api/subreddits
 * Add a subreddit to track
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = addSubredditSchema.parse(req.body);

    // Check if already exists
    const existing = await RedditSubreddit.findOne({ subredditName: name });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Subreddit already tracked',
        code: 'DUPLICATE',
      });
      return;
    }

    try {
      // Fetch subreddit info from Reddit
      const subredditInfo = await redditApi.getSubredditInfo(name);

      const subreddit = await RedditSubreddit.create({
        subredditName: subredditInfo.display_name.toLowerCase(),
        displayName: subredditInfo.title,
        members: subredditInfo.subscribers,
        online: subredditInfo.accounts_active || 0,
        category: subredditInfo.subreddit_type,
        description: subredditInfo.public_description || null,
        icon: subredditInfo.icon_img || null,
        banner: subredditInfo.banner_img || null,
        nsfw: subredditInfo.over18,
        quarantined: subredditInfo.quarantine,
        lang: subredditInfo.lang,
        rules: [],
      });

      logger.info('Subreddit added', {
        name: subreddit.subredditName,
        members: subreddit.members,
      });

      res.status(201).json({
        success: true,
        data: {
          subreddit,
        },
      });
    } catch (error: any) {
      if (error.message.includes('Not found') || error.message.includes('404')) {
        res.status(404).json({
          success: false,
          error: 'Subreddit not found on Reddit',
          code: 'SUBREDDIT_NOT_FOUND',
        });
        return;
      }
      throw error;
    }
  })
);

/**
 * GET /api/subreddits/:name
 * Get subreddit details
 */
router.get(
  '/:name',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.params;

    const subreddit = await RedditSubreddit.findOne({
      subredditName: name.toLowerCase(),
    });

    if (!subreddit) {
      res.status(404).json({
        success: false,
        error: 'Subreddit not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Optionally refresh data from Reddit
    try {
      const subredditInfo = await redditApi.getSubredditInfo(name);

      subreddit.members = subredditInfo.subscribers;
      subreddit.online = subredditInfo.accounts_active || 0;
      await subreddit.save();
    } catch (error) {
      // Continue with cached data if refresh fails
      logger.warn('Failed to refresh subreddit data', { name });
    }

    res.json({
      success: true,
      data: {
        subreddit,
      },
    });
  })
);

/**
 * DELETE /api/subreddits/:name
 * Remove subreddit from tracking
 */
router.delete(
  '/:name',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.params;

    const subreddit = await RedditSubreddit.findOneAndDelete({
      subredditName: name.toLowerCase(),
    });

    if (!subreddit) {
      res.status(404).json({
        success: false,
        error: 'Subreddit not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    logger.info('Subreddit removed', { name: subreddit.subredditName });

    res.json({
      success: true,
      data: {
        message: 'Subreddit removed from tracking',
        name: subreddit.subredditName,
      },
    });
  })
);

/**
 * GET /api/subreddits/search
 * Search for subreddits on Reddit
 */
router.get(
  '/search/query',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'MISSING_QUERY',
      });
      return;
    }

    try {
      const results = await redditApi.searchSubreddits(q, Number(limit));

      res.json({
        success: true,
        data: {
          results,
          count: results.length,
        },
      });
    } catch (error) {
      logger.error('Subreddit search failed', { error, query: q });
      res.status(500).json({
        success: false,
        error: 'Search failed',
        code: 'SEARCH_ERROR',
      });
    }
  })
);

export default router;