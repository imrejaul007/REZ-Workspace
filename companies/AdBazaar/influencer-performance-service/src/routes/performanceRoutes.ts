import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { performanceService } from '../services/performanceService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const recordPerformanceSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  deliverableId: z.string().optional(),
  platform: z.string(),
  contentType: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
  contentUrl: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  metrics: z.object({
    reach: z.number().optional(),
    impressions: z.number().optional(),
    views: z.number().optional(),
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    saves: z.number().optional(),
    clicks: z.number().optional()
  }).optional(),
  attribution: z.object({
    source: z.enum(['promo_code', 'utm', 'pixel', 'direct', 'organic']).optional(),
    conversions: z.number().optional(),
    revenue: z.number().optional()
  }).optional()
});

const calculateROISchema = z.object({
  investment: z.object({
    fee: z.number(),
    productCost: z.number().optional(),
    otherCosts: z.number().optional()
  })
});

// GET /api/performance/:influencerId - Get influencer performance
router.get('/:influencerId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, platform, contentType, period } = req.query;
    const performance = await performanceService.getInfluencerPerformance(req.params.influencerId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      platform: platform as string,
      contentType: contentType as string,
      period: period as string
    });
    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// POST /api/performance - Record performance
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = recordPerformanceSchema.parse(req.body);
    const performance = await performanceService.recordPerformance({
      ...validatedData,
      publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined
    } as any);
    logger.info('Performance recorded via API', { userId: req.userId });
    res.status(201).json(performance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/performance/campaign/:campaignId - Get campaign performance
router.get('/campaign/:campaignId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performance = await performanceService.getCampaignPerformance(req.params.campaignId);
    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/dashboard - Get performance dashboard
router.get('/dashboard', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, campaignIds, startDate, endDate } = req.query;
    const dashboard = await performanceService.getDashboard({
      brandId: brandId as string,
      campaignIds: campaignIds ? (campaignIds as string).split(',') : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/roi - Get ROI report
router.get('/roi', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { influencerId, campaignId } = req.query;
    const report = await performanceService.getROIReport(
      influencerId as string,
      campaignId as string
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// POST /api/performance/:influencerId/roi - Calculate ROI
router.post('/:influencerId/roi', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId, investment } = req.body;
    const validatedData = calculateROISchema.parse({ investment });
    const roi = await performanceService.calculateROI(
      req.params.influencerId,
      campaignId,
      validatedData.investment
    );
    logger.info('ROI calculated via API', { influencerId: req.params.influencerId, campaignId });
    res.json(roi);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

export { router as performanceRoutes };