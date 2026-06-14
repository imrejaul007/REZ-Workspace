import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { revenueService, publisherService } from '../services/index.js';
import { internalServiceAuth } from '../middleware/index.js';
import { logger, recordError, revenueTotal, impressionsTotal, ecpmGauge } from '../utils/index.js';

const router = Router();

// Validation schemas
const recordRevenueSchema = z.object({
  inventoryId: z.string().optional(),
  placementId: z.string().optional(),
  date: z.string().datetime().or(z.date()),
  impressions: z.number().int().min(0),
  bids: z.number().int().min(0).optional(),
  wins: z.number().int().min(0).optional(),
  revenue: z.number().min(0),
  cost: z.number().min(0).optional(),
  adType: z.string(),
  dealType: z.enum(['open', 'preferred', 'private', 'programmatic']).optional(),
  country: z.string().optional(),
  device: z.enum(['desktop', 'mobile', 'tablet', 'CTV']).optional(),
  viewableImpressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional()
});

// Routes with internal service auth
router.use(internalServiceAuth);

/**
 * POST /api/publishers/:publisherId/revenue
 * Record revenue data
 */
router.post('/publishers/:publisherId/revenue', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const data = recordRevenueSchema.parse(req.body);

    // Verify publisher exists
    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    const revenue = await revenueService.record({
      publisherId,
      ...data,
      date: new Date(data.date as string)
    });

    // Update metrics
    revenueTotal.inc({ publisher_id: publisherId, currency: publisher.settings.currency }, data.revenue);
    impressionsTotal.inc({ publisher_id: publisherId, ad_type: data.adType }, data.impressions);

    logger.info('Revenue recorded', { publisherId, amount: data.revenue });
    res.status(201).json({
      success: true,
      data: revenue
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
      return;
    }

    logger.error('Failed to record revenue', { error });
    recordError('record_revenue', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to record revenue'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/revenue
 * Get revenue summary
 */
router.get('/publishers/:publisherId/revenue', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { startDate, endDate } = req.query;

    const summary = await revenueService.getSummary(
      publisherId,
      startDate as string,
      endDate as string
    );

    // Update metrics
    ecpmGauge.set({ publisher_id: publisherId, ad_type: 'all' }, summary.avgEcpm);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Failed to get revenue', { error });
    recordError('get_revenue', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get revenue'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/revenue/timeseries
 * Get revenue time series
 */
router.get('/publishers/:publisherId/revenue/timeseries', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'startDate and endDate are required'
      });
      return;
    }

    const timeseries = await revenueService.getTimeSeries(
      publisherId,
      startDate as string,
      endDate as string,
      groupBy as 'day' | 'hour'
    );

    res.json({
      success: true,
      data: timeseries
    });
  } catch (error) {
    logger.error('Failed to get revenue timeseries', { error });
    recordError('get_revenue_timeseries', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get revenue timeseries'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/revenue/breakdown
 * Get revenue breakdown by dimension
 */
router.get('/publishers/:publisherId/revenue/breakdown', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { dimension = 'adType', startDate, endDate } = req.query;

    const breakdown = await revenueService.getBreakdown(
      publisherId,
      dimension as 'adType' | 'country' | 'device' | 'dealType',
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    logger.error('Failed to get revenue breakdown', { error });
    recordError('get_revenue_breakdown', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get revenue breakdown'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/revenue/top-inventory
 * Get top performing inventory
 */
router.get('/publishers/:publisherId/revenue/top-inventory', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { startDate, endDate, limit = '10' } = req.query;

    const topInventory = await revenueService.getTopInventory(
      publisherId,
      startDate as string,
      endDate as string,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: topInventory
    });
  } catch (error) {
    logger.error('Failed to get top inventory', { error });
    recordError('get_top_inventory', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get top inventory'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/revenue/hourly-patterns
 * Get hourly revenue patterns
 */
router.get('/publishers/:publisherId/revenue/hourly-patterns', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { startDate, endDate } = req.query;

    const patterns = await revenueService.getHourlyPatterns(
      publisherId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    logger.error('Failed to get hourly patterns', { error });
    recordError('get_hourly_patterns', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get hourly patterns'
    });
  }
});

export default router;