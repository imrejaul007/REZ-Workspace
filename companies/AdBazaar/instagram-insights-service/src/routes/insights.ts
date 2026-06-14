import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getInsightsService } from '../services';
import {
  asyncHandler,
  validateRequest,
  ApiError,
  validateApiKey,
} from '../middleware';
import { createChildLogger } from '../config/logger';

const logger = createChildLogger('insights-routes');
const router = Router();

// Validation schemas
const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().min(1).max(90).optional(),
});

const ContentQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS', 'STORY', 'IGTV']).optional(),
});

const HashtagQuerySchema = z.object({
  hashtag: z.string().min(1).startsWith('#').or(z.string().min(1).regex(/^[a-zA-Z0-9_]+$/))),
});

const ExportSchema = z.object({
  type: z.enum(['account', 'content', 'audience', 'stories', 'reels', 'hashtags']),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  days: z.coerce.number().min(1).max(90).optional(),
  contentIds: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
});

const DashboardQuerySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(7),
});

// Apply API key authentication to all routes
router.use(validateApiKey);

// GET /api/insights/account - Account-level insights
router.get(
  '/account',
  validateRequest(DateRangeSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query as { days?: number };

    logger.info('Fetching account insights', { days });

    const insightsService = getInsightsService();
    const dateRange = days ? { days } : undefined;
    const insights = await insightsService.getCachedAccountInsights(dateRange);

    res.json({
      success: true,
      data: insights,
      meta: {
        count: insights.length,
        accountId: insights[0]?.accountId,
      },
    });
  })
);

// POST /api/insights/account/refresh - Refresh account insights from Instagram
router.post(
  '/account/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as 'day' | 'week' | 'days_28') || 'days_28';

    logger.info('Refreshing account insights', { period });

    const insightsService = getInsightsService();
    const insights = await insightsService.getAccountInsights(period);

    res.json({
      success: true,
      data: insights,
      meta: {
        refreshedAt: new Date().toISOString(),
      },
    });
  })
);

// GET /api/insights/content/:id - Single content insights
router.get(
  '/content/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Content ID is required');
    }

    logger.info('Fetching content insights', { contentId: id });

    const insightsService = getInsightsService();
    const insights = await insightsService.getContentInsightsById(id);

    res.json({
      success: true,
      data: insights,
    });
  })
);

// GET /api/insights/content - All content insights
router.get(
  '/content',
  validateRequest(ContentQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, mediaType } = req.query as { limit?: number; mediaType?: string };

    logger.info('Fetching all content insights', { limit, mediaType });

    const insightsService = getInsightsService();
    const insights = await insightsService.getAllContentInsights(limit, mediaType);

    res.json({
      success: true,
      data: insights,
      meta: {
        count: insights.length,
        limit,
        mediaType,
      },
    });
  })
);

// POST /api/insights/content/sync - Sync all content from Instagram
router.post(
  '/content/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 25;

    logger.info('Syncing content insights', { limit });

    const insightsService = getInsightsService();
    const synced = await insightsService.syncContentInsights(limit);

    res.json({
      success: true,
      data: synced,
      meta: {
        syncedCount: synced.length,
        syncedAt: new Date().toISOString(),
      },
    });
  })
);

// GET /api/insights/audience - Audience demographics
router.get(
  '/audience',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching audience insights');

    const insightsService = getInsightsService();
    const insights = await insightsService.getAudienceInsights();

    res.json({
      success: true,
      data: insights,
    });
  })
);

// GET /api/insights/audience/active - Active times
router.get(
  '/audience/active',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching active times');

    const insightsService = getInsightsService();
    const activeTimes = await insightsService.getActiveTimes();

    res.json({
      success: true,
      data: activeTimes,
    });
  })
);

// GET /api/insights/stories - Story insights
router.get(
  '/stories',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching story insights');

    const insightsService = getInsightsService();
    const stories = await insightsService.getStoryInsights();

    res.json({
      success: true,
      data: stories,
      meta: {
        count: stories.length,
      },
    });
  })
);

// GET /api/insights/reels - Reels performance
router.get(
  '/reels',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching reels insights');

    const insightsService = getInsightsService();
    const reels = await insightsService.getReelsInsights();

    res.json({
      success: true,
      data: reels,
      meta: {
        count: reels.length,
      },
    });
  })
);

// GET /api/insights/hashtags - Hashtag performance
router.get(
  '/hashtags',
  validateRequest(HashtagQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const hashtag = req.query.hashtag as string;

    logger.info('Fetching hashtag insights', { hashtag });

    const insightsService = getInsightsService();

    if (hashtag) {
      const insights = await insightsService.getHashtagInsights(hashtag);
      res.json({
        success: true,
        data: insights,
      });
    } else {
      const topHashtags = await insightsService.getTopHashtags(20);
      res.json({
        success: true,
        data: topHashtags,
        meta: {
          count: topHashtags.length,
        },
      });
    }
  })
);

// GET /api/insights/best-times - Optimal posting times
router.get(
  '/best-times',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching best posting times');

    const insightsService = getInsightsService();
    const bestTimes = await insightsService.getBestPostingTimes();

    res.json({
      success: true,
      data: bestTimes,
    });
  })
);

// POST /api/insights/export - Export report
router.post(
  '/export',
  validateRequest(ExportSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const exportRequest = req.body;

    logger.info('Exporting insights', { type: exportRequest.type, format: exportRequest.format });

    const insightsService = getInsightsService();

    const dateRange = exportRequest.days
      ? { days: exportRequest.days }
      : {
          startDate: exportRequest.startDate ? new Date(exportRequest.startDate) : undefined,
          endDate: exportRequest.endDate ? new Date(exportRequest.endDate) : undefined,
        };

    const result = await insightsService.exportInsights({
      type: exportRequest.type,
      format: exportRequest.format,
      dateRange,
      contentIds: exportRequest.contentIds,
      hashtags: exportRequest.hashtags,
    });

    if (exportRequest.format === 'csv' && 'csv' in result) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="insights-${exportRequest.type}.csv"`);
      res.send(result.csv);
    } else {
      res.json({
        success: true,
        data: result,
        meta: {
          exportedAt: new Date().toISOString(),
          format: exportRequest.format,
        },
      });
    }
  })
);

// GET /api/insights/dashboard - Dashboard summary
router.get(
  '/dashboard',
  validateRequest(DashboardQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query as { days?: number };

    logger.info('Fetching dashboard summary', { days });

    const insightsService = getInsightsService();
    const summary = await insightsService.getDashboardSummary(days || 7);

    res.json({
      success: true,
      data: summary,
    });
  })
);

export default router;