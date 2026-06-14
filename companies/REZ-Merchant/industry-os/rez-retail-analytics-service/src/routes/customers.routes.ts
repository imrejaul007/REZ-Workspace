import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { customerAnalyticsService } from '../services/customer-analytics.service';
import { logger } from '../utils/logger';

const router = Router();

const dateRangeQuery = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * GET /api/customers/summary
 * Get customer summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeQuery.parse(req.query);
    const summary = await customerAnalyticsService.getCustomerSummary({ startDate, endDate });
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching customer summary:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/customers/by-tier
 * Get customer distribution by tier
 */
router.get('/by-tier', async (_req: Request, res: Response) => {
  try {
    const tiers = await customerAnalyticsService.getCustomersByTier();
    res.json({ success: true, data: tiers });
  } catch (error) {
    logger.error('Error fetching tiers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/customers/top-ltv
 * Get top customers by lifetime value
 */
router.get('/top-ltv', async (req: Request, res: Response) => {
  try {
    const limit = z.coerce.number().int().positive().default(20).parse(req.query.limit || 20);
    const customers = await customerAnalyticsService.getTopCustomersByLTV(limit);
    res.json({ success: true, data: customers });
  } catch (error) {
    logger.error('Error fetching top customers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/customers/acquisition
 * Get customer acquisition over time
 */
router.get('/acquisition', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, granularity } = z.object({
      ...Object.fromEntries(dateRangeQuery.innerType().shape),
      granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    }).parse(req.query);

    const acquisition = await customerAnalyticsService.getCustomerAcquisition(
      { startDate, endDate },
      granularity
    );
    res.json({ success: true, data: acquisition });
  } catch (error) {
    logger.error('Error fetching acquisition:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/customers/segments
 * Get customer segments analysis
 */
router.get('/segments', async (_req: Request, res: Response) => {
  try {
    const segments = await customerAnalyticsService.getCustomerSegments();
    res.json({ success: true, data: segments });
  } catch (error) {
    logger.error('Error fetching segments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/customers/engagement
 * Get engagement metrics
 */
router.get('/engagement', async (_req: Request, res: Response) => {
  try {
    const metrics = await customerAnalyticsService.getEngagementMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Error fetching engagement:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
