import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service.js';
import { targetingService } from '../services/targeting.service.js';
import logger from '../config/logger.js';

const router = Router();

// Validation schemas
const CreateAnalyticsSchema = z.object({
  eventId: z.string(),
  impressions: z.number().min(0).optional(),
  ticketSales: z.number().min(0).optional(),
  viewership: z.number().min(0).optional(),
  adRevenue: z.number().optional(),
  engagement: z.object({
    social: z.number().min(0).optional(),
    streaming: z.number().min(0).optional(),
    tv: z.number().min(0).optional()
  }).optional(),
  demographics: z.object({
    ageGroups: z.record(z.string(), z.number()).optional(),
    genderSplit: z.record(z.string(), z.number()).optional(),
    regions: z.record(z.string(), z.number()).optional()
  }).optional(),
  peakMoments: z.array(z.object({
    timestamp: z.string().datetime(),
    description: z.string(),
    engagement: z.number()
  })).optional(),
  merchantImpact: z.object({
    nearbyRestaurants: z.number().optional(),
    nearbyHotels: z.number().optional(),
    nearbyRetail: z.number().optional(),
    transportUsage: z.number().optional()
  }).optional()
});

// GET /api/analytics - List all analytics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, sport } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;

    const result = await analyticsService.getAllAnalytics(pageNum, limitNum);

    res.json({
      success: true,
      data: result.analytics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Failed to list analytics', { error });
    res.status(500).json({ success: false, error: 'Failed to list analytics' });
  }
});

// POST /api/analytics - Create or update analytics
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAnalyticsSchema.parse(req.body);
    const analytics = await analyticsService.createOrUpdateAnalytics(validatedData);

    res.status(201).json({
      success: true,
      data: analytics,
      message: 'Analytics created/updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to create analytics', { error });
      res.status(500).json({ success: false, error: 'Failed to create analytics' });
    }
  }
});

// GET /api/analytics/footfall/:eventId - Get footfall prediction
router.get('/footfall/:eventId', async (req: Request, res: Response) => {
  try {
    const prediction = await analyticsService.predictFootfall(req.params.eventId);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    logger.error('Failed to get footfall prediction', { eventId: req.params.eventId, error });
    res.status(500).json({ success: false, error: 'Failed to get footfall prediction' });
  }
});

// GET /api/analytics/performance/:eventId - Get event performance
router.get('/performance/:eventId', async (req: Request, res: Response) => {
  try {
    const performance = await analyticsService.getEventPerformance(req.params.eventId);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Failed to get event performance', { eventId: req.params.eventId, error });
    res.status(500).json({ success: false, error: 'Failed to get event performance' });
  }
});

// GET /api/analytics/top-performers - Get top performing events
router.get('/top-performers', async (req: Request, res: Response) => {
  try {
    const { sport, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 10;

    const events = await analyticsService.getTopPerformingEvents(sport as string, limitNum);

    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    logger.error('Failed to get top performers', { error });
    res.status(500).json({ success: false, error: 'Failed to get top performers' });
  }
});

// GET /api/analytics/audience-segments/:eventId - Get audience segments
router.get('/audience-segments/:eventId', async (req: Request, res: Response) => {
  try {
    const segments = await targetingService.getAudienceSegments(req.params.eventId);

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    logger.error('Failed to get audience segments', { eventId: req.params.eventId, error });
    res.status(500).json({ success: false, error: 'Failed to get audience segments' });
  }
});

// GET /api/analytics/nearby-merchants/:eventId - Get nearby merchants
router.get('/nearby-merchants/:eventId', async (req: Request, res: Response) => {
  try {
    const { radiusKm } = req.query;
    const radius = radiusKm ? parseFloat(radiusKm as string) : 5;

    const merchants = await targetingService.getNearbyMerchants(req.params.eventId, radius);

    res.json({
      success: true,
      data: merchants,
      count: merchants.length,
      radiusKm: radius
    });
  } catch (error) {
    logger.error('Failed to get nearby merchants', { eventId: req.params.eventId, error });
    res.status(500).json({ success: false, error: 'Failed to get nearby merchants' });
  }
});

export default router;