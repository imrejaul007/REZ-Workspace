/**
 * LEDGERAI - Health Check Routes
 * System health monitoring endpoints
 */

import { Router, Request, Response } from 'express';
import { getHealthStatus, getDetailedHealth, isReady, isAlive } from '../utils/health';
import { authenticate } from '../middleware/auth';
import logger from '../middleware/logger';

const router = Router();

// ============================================
// GET /health - Basic liveness check
// ============================================
router.get('/health', (req: Request, res: Response) => {
  const isServerAlive = isAlive();

  if (!isServerAlive) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LEDGERAI',
    version: '1.0.0'
  });
});

// ============================================
// GET /ready - Readiness check
// ============================================
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const ready = await isReady();

    if (!ready) {
      res.status(503).json({
        success: false,
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Server is not ready to accept traffic'
      });
      return;
    }

    res.json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Server is ready to accept traffic'
    });
  } catch (error) {
    logger.error('Readiness check error', { error });
    res.status(503).json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// GET /api/health - Basic health (authenticated)
// ============================================
router.get('/api/health', authenticate, (req: Request, res: Response) => {
  const status = getHealthStatus();
  res.json({
    success: true,
    ...status
  });
});

// ============================================
// GET /api/health/detailed - Detailed health (admin only)
// ============================================
router.get('/api/health/detailed', authenticate, async (req: Request, res: Response) => {
  try {
    const health = await getDetailedHealth();

    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      ...health
    });
  } catch (error) {
    logger.error('Detailed health check error', { error });
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// ============================================
// GET /api/health/ping - Simple ping endpoint
// ============================================
router.get('/api/health/ping', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    latency: Date.now()
  });
});

export default router;