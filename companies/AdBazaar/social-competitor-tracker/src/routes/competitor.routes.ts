import { Router, Request, Response } from 'express';
import { competitorService } from '../services/competitor.service.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { validateCompetitorInput, validateUpdateInput } from '../models/index.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * GET /api/competitors
 * List all competitors with optional filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { industry, priority, tags, search, page, limit } = req.query;

    const result = await competitorService.listCompetitors({
      industry: industry as string,
      priority: priority as 'low' | 'medium' | 'high' | undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: {
        competitors: result.competitors,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit),
        },
      },
    });
  })
);

/**
 * POST /api/competitors
 * Add a new competitor
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = validateCompetitorInput(req.body);
    if (!validation.success) {
      throw new AppError('Invalid competitor data', 400);
    }

    const competitor = await competitorService.createCompetitor({
      ...validation.data,
      addedBy: req.userId || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: { competitor },
      message: 'Competitor added successfully',
    });
  })
);

/**
 * GET /api/competitors/compare
 * Compare competitors with self
 */
router.get(
  '/compare',
  asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.query;

    if (!ids) {
      throw new AppError('Competitor IDs required', 400);
    }

    const competitorIds = (ids as string).split(',');
    const { followers, engagementRate, postingFrequency } = req.query;

    const comparison = await competitorService.compareCompetitors(competitorIds, {
      followers: followers ? parseFloat(followers as string) : undefined,
      engagementRate: engagementRate ? parseFloat(engagementRate as string) : undefined,
      postingFrequency: postingFrequency ? parseFloat(postingFrequency as string) : undefined,
    });

    res.json({
      success: true,
      data: { comparison },
    });
  })
);

/**
 * GET /api/competitors/benchmarks
 * Get industry benchmarks
 */
router.get(
  '/benchmarks',
  asyncHandler(async (req: Request, res: Response) => {
    const { industry } = req.query;

    if (!industry) {
      throw new AppError('Industry parameter required', 400);
    }

    const benchmarks = await competitorService.getBenchmarks(industry as string);

    res.json({
      success: true,
      data: { benchmarks },
    });
  })
);

/**
 * GET /api/competitors/alerts
 * Get all competitor alerts
 */
router.get(
  '/alerts',
  asyncHandler(async (req: Request, res: Response) => {
    const { competitorId, unreadOnly, page, limit } = req.query;

    const result = await competitorService.getAlerts({
      competitorId: competitorId as string,
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: {
        alerts: result.alerts,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 20,
          pages: Math.ceil(result.total / (limit ? parseInt(limit as string, 10) : 20)),
        },
      },
    });
  })
);

/**
 * POST /api/competitors/alerts/mark-read
 * Mark alerts as read
 */
router.post(
  '/alerts/mark-read',
  asyncHandler(async (req: Request, res: Response) => {
    const { alertIds } = req.body;

    if (!alertIds || !Array.isArray(alertIds)) {
      throw new AppError('Alert IDs array required', 400);
    }

    const count = await competitorService.markAlertsAsRead(alertIds);

    res.json({
      success: true,
      data: { markedAsRead: count },
      message: `${count} alerts marked as read`,
    });
  })
);

/**
 * GET /api/competitors/:id
 * Get a specific competitor (internal use)
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const competitor = await competitorService.listCompetitors({
      page: 1,
      limit: 1,
    });

    // Just validate the ID exists
    const overview = await competitorService.getCompetitorOverview(id);

    res.json({
      success: true,
      data: { competitor: overview.competitor },
    });
  })
);

/**
 * PATCH /api/competitors/:id
 * Update a competitor
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = validateUpdateInput(req.body);

    if (!validation.success) {
      throw new AppError('Invalid update data', 400);
    }

    const competitor = await competitorService.updateCompetitor(id, validation.data);

    res.json({
      success: true,
      data: { competitor },
      message: 'Competitor updated successfully',
    });
  })
);

/**
 * DELETE /api/competitors/:id
 * Remove a competitor
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await competitorService.deleteCompetitor(id);

    res.json({
      success: true,
      message: 'Competitor removed successfully',
    });
  })
);

/**
 * GET /api/competitors/:id/overview
 * Get competitor overview
 */
router.get(
  '/:id/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const overview = await competitorService.getCompetitorOverview(id);

    res.json({
      success: true,
      data: { overview },
    });
  })
);

/**
 * GET /api/competitors/:id/content
 * Get competitor content
 */
router.get(
  '/:id/content',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { platform, page, limit } = req.query;

    const result = await competitorService.getCompetitorContent(id, {
      platform: platform as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: {
        posts: result.posts,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 20,
          pages: Math.ceil(result.total / (limit ? parseInt(limit as string, 10) : 20)),
        },
      },
    });
  })
);

/**
 * GET /api/competitors/:id/engagement
 * Get engagement metrics
 */
router.get(
  '/:id/engagement',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { platform, days } = req.query;

    const metrics = await competitorService.getCompetitorEngagement(id, {
      platform: platform as string,
      days: days ? parseInt(days as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: { engagement: metrics },
    });
  })
);

/**
 * GET /api/competitors/:id/growth
 * Get follower growth metrics
 */
router.get(
  '/:id/growth',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { platform, days } = req.query;

    const metrics = await competitorService.getCompetitorGrowth(id, {
      platform: platform as string,
      days: days ? parseInt(days as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: { growth: metrics },
    });
  })
);

/**
 * GET /api/competitors/:id/posts
 * Get recent posts
 */
router.get(
  '/:id/posts',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { platform, page, limit, sortBy } = req.query;

    const result = await competitorService.getCompetitorPosts(id, {
      platform: platform as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as 'recent' | 'top' | undefined,
    });

    res.json({
      success: true,
      data: {
        posts: result.posts,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 20,
          pages: Math.ceil(result.total / (limit ? parseInt(limit as string, 10) : 20)),
        },
      },
    });
  })
);

/**
 * POST /api/competitors/:id/sync
 * Force sync competitor data
 */
router.post(
  '/:id/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    logger.info('Manual sync triggered', { competitorId: id, userId: req.userId });

    const result = await competitorService.syncCompetitor(id);

    res.json({
      success: true,
      data: {
        success: result.success,
        syncedPlatforms: result.syncedPlatforms,
        syncedAt: new Date().toISOString(),
      },
      message: `Synced ${result.syncedPlatforms.length} platform(s)`,
    });
  })
);

/**
 * GET /api/competitors/:id/alerts
 * Get competitor-specific alerts
 */
router.get(
  '/:id/alerts',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await competitorService.getAlerts({
      competitorId: id,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: {
        alerts: result.alerts,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 20,
          pages: Math.ceil(result.total / (limit ? parseInt(limit as string, 10) : 20)),
        },
      },
    });
  })
);

export { router as competitorRoutes };
