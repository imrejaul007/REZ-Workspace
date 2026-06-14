import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/index.js';
import logger from 'utils/logger.js';
import { httpRequestDuration, httpRequestTotal } from '../utils/metrics.js';

const router = Router();

// Helper for timing and metrics
const withMetrics = (handler: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    try {
      await handler(req, res, next);
    } finally {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      httpRequestDuration.observe(
        { method: req.method, route, status_code: res.statusCode },
        duration
      );
      httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
    }
  };
};

// GET /api/analytics/mrr - Get MRR breakdown
router.get('/mrr', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await analyticsService.getMrrBreakdown();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting MRR breakdown', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/analytics/trends - Get subscription trends
router.get('/trends', withMetrics(async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const interval = (req.query.interval as 'day' | 'week' | 'month') || 'day';

    const result = await analyticsService.getSubscriptionTrends(startDate, endDate, interval);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting subscription trends', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/analytics/forecast - Get revenue forecast
router.get('/forecast', withMetrics(async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const result = await analyticsService.getRevenueForecast(months);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting revenue forecast', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

export default router;