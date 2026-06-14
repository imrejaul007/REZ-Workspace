import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisService } from '../services/index.js';
import { metricsHandler } from '../middleware/index.js';

const router = Router();

// Health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'apartment-targeting-service',
    version: '1.0.0',
    checks: {
      mongodb: 'unknown',
      redis: 'unknown',
    },
  };

  // Check MongoDB
  try {
    health.checks.mongodb = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  } catch {
    health.checks.mongodb = 'unhealthy';
  }

  // Check Redis
  try {
    health.checks.redis = redisService.isReady() ? 'healthy' : 'unhealthy';
  } catch {
    health.checks.redis = 'unhealthy';
  }

  // Set overall status
  const allHealthy = Object.values(health.checks).every((c) => c === 'healthy');
  health.status = allHealthy ? 'ok' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

// Readiness probe
router.get('/ready', async (_req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = redisService.isReady();

  if (mongoReady && redisReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({
      status: 'not ready',
      mongodb: mongoReady ? 'ready' : 'not ready',
      redis: redisReady ? 'ready' : 'not ready',
    });
  }
});

// Prometheus metrics endpoint
router.get('/metrics', metricsHandler);

export default router;