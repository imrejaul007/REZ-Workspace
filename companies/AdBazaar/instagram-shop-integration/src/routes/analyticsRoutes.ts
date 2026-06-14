import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services';
import { authMiddleware } from '../middleware';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productId: z.string().optional(),
  period: z.enum(['day', 'week', 'days_28']).optional().default('days_28'),
});

/**
 * GET /api/analytics
 * Get shop performance analytics
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const query = analyticsQuerySchema.parse(req.query);

    const filters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      productId: query.productId,
    };

    const analytics = await analyticsService.getShopAnalytics(
      filters,
      query.period as 'day' | 'week' | 'days_28'
    );

    res.json({
      success: true,
      data: analytics,
      period: query.period,
    });
  } catch (error) {
    logger.error('Failed to get shop analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get shop analytics',
    });
  }
});

/**
 * GET /api/analytics/daily
 * Get daily analytics
 */
router.get('/daily', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
      return;
    }

    const analytics = await analyticsService.getAnalyticsByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get daily analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get daily analytics',
    });
  }
});

/**
 * GET /api/analytics/products/:productId
 * Get product-specific analytics
 */
router.get('/products/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getProductAnalytics(req.params.productId);

    res.json({
      success: true,
      data: {
        productId: req.params.productId,
        ...analytics,
      },
    });
  } catch (error) {
    logger.error('Failed to get product analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: req.params.productId,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get product analytics',
    });
  }
});

/**
 * POST /api/analytics/record
 * Record daily analytics (internal use)
 */
router.post('/record', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const analytics = await analyticsService.recordDailyAnalytics(
      date ? new Date(date) : new Date()
    );

    res.json({
      success: true,
      data: analytics,
      message: 'Daily analytics recorded',
    });
  } catch (error) {
    logger.error('Failed to record daily analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to record daily analytics',
    });
  }
});

export default router;