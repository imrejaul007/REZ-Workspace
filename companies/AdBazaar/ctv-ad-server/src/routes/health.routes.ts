import { Router, Request, Response } from 'express';
import { databaseService } from '../services/index.js';
import { redisService } from '../services/index.js';
import { asyncHandler } from '../middleware/index.js';
import { getMetrics, getContentType } from '../middleware/metrics.middleware.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  const mongoHealthy = databaseService.isHealthy();
  const redisHealthy = redisService.isHealthy();

  const isHealthy = mongoHealthy; // Redis is optional

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
    },
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * GET /health/live
 * Liveness probe (always returns 200 if service is running)
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Readiness probe (returns 200 if service is ready to accept traffic)
 */
router.get('/ready', (_req: Request, res: Response) => {
  const mongoHealthy = databaseService.isHealthy();

  if (mongoHealthy) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      reason: 'MongoDB not connected',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await getMetrics();
  res.set('Content-Type', getContentType());
  res.send(metrics);
}));

export default router;