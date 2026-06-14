/**
 * Monitoring Routes
 */

import { Router, Request, Response } from 'express';
import { monitoringService } from '../services/monitoringService';

const router = Router();

/**
 * GET /api/v1/monitoring/metrics
 * Get comprehensive monitoring metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v1/monitoring/health-score
 * Get health score (0-100)
 */
router.get('/health-score', async (req: Request, res: Response) => {
  try {
    const score = await monitoringService.getHealthScore();
    const status = score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy';

    res.json({
      success: true,
      data: {
        score,
        status,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v1/monitoring/alerts
 * Get active alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.json({
      success: true,
      data: metrics.alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
