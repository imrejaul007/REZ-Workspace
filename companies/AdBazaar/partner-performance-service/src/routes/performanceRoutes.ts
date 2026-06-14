import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { performanceService } from '../services/performanceService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const calculatePerformanceSchema = z.object({
  partnerId: z.string().min(1),
  revenue: z.number().min(0),
  conversions: z.number().min(0),
  clicks: z.number().min(0),
  impressions: z.number().min(0),
  totalSpend: z.number().min(0),
});

/**
 * GET /api/performance/:partnerId
 * Get partner performance
 */
router.get('/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { periodType, limit = '12' } = req.query;
    const performances = await performanceService.getPerformance(
      req.params.partnerId,
      periodType as string,
      parseInt(limit as string)
    );

    res.json({ success: true, data: performances });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch performance' });
  }
});

/**
 * POST /api/performance/:partnerId/calculate
 * Calculate performance metrics
 */
router.post('/:partnerId/calculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = calculatePerformanceSchema.parse(req.body);
    const { periodType = 'monthly' } = req.body;

    const performance = await performanceService.calculatePerformance(
      req.params.partnerId,
      input,
      periodType
    );

    res.status(201).json({ success: true, data: performance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to calculate performance' });
  }
});

/**
 * GET /api/performance/:partnerId/aggregate
 * Get aggregate performance
 */
router.get('/:partnerId/aggregate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate required' });
      return;
    }

    const aggregate = await performanceService.getAggregatePerformance(
      req.params.partnerId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ success: true, data: aggregate });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch aggregate performance' });
  }
});

/**
 * GET /api/performance/dashboard
 * Get performance dashboard summary
 */
router.get('/dashboard/summary', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        topPerformers: [],
        recentActivity: [],
        averageMetrics: {
          revenue: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/performance/trends
 * Get performance trends
 */
router.get('/trends/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { periodType = 'monthly', limit = '12' } = req.query;

    const performances = await performanceService.getPerformance(
      req.params.partnerId,
      periodType as string,
      parseInt(limit as string)
    );

    const trends = performances.map((p: any) => ({
      date: p.period.start,
      revenue: p.metrics.revenue,
      conversions: p.metrics.conversions,
      ctr: p.metrics.ctr,
      conversionRate: p.metrics.conversionRate,
      roi: p.metrics.roi,
    }));

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trends' });
  }
});

export default router;