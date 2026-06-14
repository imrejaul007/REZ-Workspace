import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { metricService } from '../services/metricService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const recordMetricSchema = z.object({
  partnerId: z.string().min(1),
  type: z.enum(['revenue', 'conversion', 'engagement', 'roi', 'satisfaction']),
  name: z.string().min(1),
  value: z.number(),
  period: z.enum(['realtime', 'daily', 'weekly', 'monthly']).optional().default('daily'),
  benchmarks: z.object({
    industry: z.number().optional(),
    top25: z.number().optional(),
    top10: z.number().optional(),
  }).optional(),
  breakdown: z.record(z.number()).optional(),
});

/**
 * POST /api/metrics
 * Record a new metric
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = recordMetricSchema.parse(req.body);
    const metric = await metricService.recordMetric(input);

    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to record metric' });
  }
});

/**
 * GET /api/metrics/:id
 * Get metric by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const metric = await metricService.getMetric(req.params.id);

    if (!metric) {
      res.status(404).json({ success: false, error: 'Metric not found' });
      return;
    }

    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch metric' });
  }
});

/**
 * GET /api/metrics/partner/:partnerId/latest
 * Get latest metrics for partner
 */
router.get('/partner/:partnerId/latest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const metrics = await metricService.getLatestMetrics(req.params.partnerId);

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/metrics/partner/:partnerId/history
 * Get metric history
 */
router.get('/partner/:partnerId/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, period = 'daily', startDate, endDate } = req.query;

    if (!type || !startDate || !endDate) {
      res.status(400).json({ success: false, error: 'type, startDate, and endDate required' });
      return;
    }

    const history = await metricService.getMetricHistory(
      req.params.partnerId,
      type as any,
      period as any,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/metrics/partner/:partnerId/benchmark/:type
 * Get benchmark comparison
 */
router.get('/partner/:partnerId/benchmark/:type', authMiddleware, async (req: Request, res: Response) => {
  try {
    const comparison = await metricService.getBenchmarkComparison(
      req.params.partnerId,
      req.params.type as any
    );

    if (!comparison) {
      res.status(404).json({ success: false, error: 'Metric not found' });
      return;
    }

    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch benchmark' });
  }
});

/**
 * GET /api/metrics/partner/:partnerId/aggregate
 * Get aggregate metrics
 */
router.get('/partner/:partnerId/aggregate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const aggregate = await metricService.getAggregateMetrics(req.params.partnerId);

    res.json({ success: true, data: aggregate });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch aggregate' });
  }
});

export default router;