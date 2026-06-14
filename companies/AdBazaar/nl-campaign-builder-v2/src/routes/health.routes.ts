import { Router, Request, Response } from 'express';
import { database } from '../config/database';
import { redis } from '../config/redis';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json({
      status: 'ok',
      service: 'nl-campaign-builder-v2',
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /ready
 * Readiness check (includes dependencies)
 */
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const checks = {
      mongodb: database.isHealthy(),
      redis: redis.isHealthy()
    };

    const isReady = checks.mongodb; // MongoDB is required, Redis is optional

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      service: 'nl-campaign-builder-v2',
      timestamp: new Date().toISOString(),
      checks
    });
  })
);

/**
 * GET /ping
 * Simple ping endpoint
 */
router.get('/ping', (_req: Request, res: Response) => {
  res.json({ pong: true });
});

export default router;