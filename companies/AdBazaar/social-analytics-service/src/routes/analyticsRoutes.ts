import { Router, Response } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('AnalyticsRoutes');
const router = Router();

const dateRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional()
});

const recordPostSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']),
  externalPostId: z.string(),
  content: z.string(),
  publishedAt: z.string().datetime(),
  metrics: z.object({
    impressions: z.number().optional(),
    reach: z.number().optional(),
    clicks: z.number().optional(),
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    saves: z.number().optional(),
    videoViews: z.number().optional(),
    watchTime: z.number().optional()
  })
});

// Get analytics overview
router.get('/overview', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { start, end } = req.query;
    const dateRange = start && end ? { start: new Date(start as string), end: new Date(end as string) } : undefined;

    const overview = await analyticsService.getOverview(req.userId!, dateRange);
    res.json(overview);
  } catch (error) {
    logger.error('Error getting overview', { error });
    res.status(500).json({ error: 'Failed to get overview' });
  }
});

// Get platform analytics
router.get('/:platform', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const { start, end } = req.query;
    const dateRange = start && end ? { start: new Date(start as string), end: new Date(end as string) } : undefined;

    const analytics = await analyticsService.getPlatformAnalytics(req.userId!, platform, dateRange);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting platform analytics', { error });
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
});

// Compare platforms
router.get('/compare/platforms', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platforms, start, end } = req.query;
    const platformList = (platforms as string || '').split(',');
    const dateRange = start && end ? { start: new Date(start as string), end: new Date(end as string) } : undefined;

    if (platformList.length === 0) {
      res.status(400).json({ error: 'Platforms are required' });
      return;
    }

    const comparison = await analyticsService.comparePlatforms(req.userId!, platformList, dateRange);
    res.json(comparison);
  } catch (error) {
    logger.error('Error comparing platforms', { error });
    res.status(500).json({ error: 'Failed to compare platforms' });
  }
});

// Get time series data
router.get('/timeseries/:granularity', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { granularity } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      res.status(400).json({ error: 'start and end dates are required' });
      return;
    }

    const data = await analyticsService.getTimeSeriesData(
      req.userId!,
      { start: new Date(start as string), end: new Date(end as string) },
      granularity as 'day' | 'week' | 'month'
    );
    res.json(data);
  } catch (error) {
    logger.error('Error getting time series', { error });
    res.status(500).json({ error: 'Failed to get time series' });
  }
});

// Get top posts
router.get('/posts/top', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await analyticsService.getTopPosts(req.userId!, limit);
    res.json(posts);
  } catch (error) {
    logger.error('Error getting top posts', { error });
    res.status(500).json({ error: 'Failed to get top posts' });
  }
});

// Record post analytics
router.post('/record', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = recordPostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const post = await analyticsService.recordPostAnalytics({
      userId: req.userId!,
      ...validation.data,
      publishedAt: new Date(validation.data.publishedAt)
    });

    res.status(201).json(post);
  } catch (error) {
    logger.error('Error recording post analytics', { error });
    res.status(500).json({ error: 'Failed to record post analytics' });
  }
});

export default router;