/**
 * Health Routes - Service health and status endpoints
 */

import { Router, Request, Response } from 'express';
import { apiClient } from '../utils/apiClient.js';
import { redisHealthCheck } from '../config/redis.js';
import { env } from '../config/services.js';

const router = Router();

/**
 * GET /health
 * Basic liveness check
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-loyalty-gateway',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

/**
 * GET /health/ready
 * Readiness probe - checks dependencies
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const checks = await Promise.allSettled([
      // Redis check
      redisHealthCheck(),
      // Circuit breaker status
      Promise.resolve({ circuitBreakers: apiClient.getCircuitStatus() }),
    ]);

    const redisResult = checks[0];
    const circuitResult = checks[1];

    const redisHealthy = redisResult.status === 'fulfilled' && redisResult.value.status === 'healthy';
    const circuitBreakers = circuitResult.status === 'fulfilled' ? circuitResult.value.circuitBreakers : {};

    const allHealthy = redisHealthy;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not_ready',
      checks: {
        redis: redisResult.status === 'fulfilled' ? redisResult.value : { status: 'unhealthy' },
        circuitBreakers,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /health/full
 * Full health check with all dependencies
 */
router.get('/full', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Run all checks
    const [redisResult, walletHealth, unifiedHealth, priveHealth] = await Promise.allSettled([
      redisHealthCheck(),
      apiClient.get('wallet', '/health'),
      apiClient.get('unifiedLoyalty', '/health'),
      apiClient.get('prive', '/health'),
    ]);

    const circuitBreakers = apiClient.getCircuitStatus();

    const health = {
      service: 'rez-loyalty-gateway',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        redis: redisResult.status === 'fulfilled' ? redisResult.value : { status: 'unhealthy' },
        wallet: walletHealth.status === 'fulfilled' ? { status: 'healthy' } : { status: 'unhealthy', error: 'Service unavailable' },
        unifiedLoyalty: unifiedHealth.status === 'fulfilled' ? { status: 'healthy' } : { status: 'unhealthy', error: 'Service unavailable' },
        prive: priveHealth.status === 'fulfilled' ? { status: 'healthy' } : { status: 'unhealthy', error: 'Service unavailable' },
      },
      circuitBreakers,
      responseTime: Date.now() - startTime,
    };

    const allHealthy = Object.values(health.checks).every(c => c.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /health/circuit-breakers
 * Get circuit breaker status
 */
router.get('/circuit-breakers', (req: Request, res: Response) => {
  const status = apiClient.getCircuitStatus();

  res.json({
    circuitBreakers: status,
  });
});

export default router;
