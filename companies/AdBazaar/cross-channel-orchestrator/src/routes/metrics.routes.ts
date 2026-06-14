import { Router, Request, Response } from 'express';
import { metricsService } from '../services/metrics.service';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', metricsService.getContentType());
    res.send(metrics);
  })
);

/**
 * GET /metrics/values
 * Get current metric values as JSON
 */
router.get(
  '/values',
  asyncHandler(async (_req: Request, res: Response) => {
    const values = await metricsService.getMetricValues();
    res.json({
      success: true,
      data: values,
    });
  })
);

export default router;