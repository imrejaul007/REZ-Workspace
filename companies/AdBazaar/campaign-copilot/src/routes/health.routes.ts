import { Router } from 'express';
import { register } from '../services/metrics.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'campaign-copilot',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Readiness check endpoint
 */
router.get('/ready', async (_req, res) => {
  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Redis connection
    const redis = await import('../services/cache.service.js');
    let redisStatus = 'disconnected';
    try {
      const client = await redis.getRedisClient();
      await client.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
    }

    const isReady = mongoStatus === 'connected' && redisStatus === 'connected';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      checks: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness check endpoint
 */
router.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
    });
  }
});

export default router;