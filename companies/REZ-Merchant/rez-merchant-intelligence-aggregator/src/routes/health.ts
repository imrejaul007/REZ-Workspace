/**
 * Health Routes
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-merchant-intelligence-aggregator',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready
 * Readiness check with dependencies
 */
router.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, unknown> = {};

  // MongoDB
  try {
    const conn = mongoose.connection;
    if (conn.readyState === 1) {
      checks.mongodb = { status: 'healthy' };
    } else {
      checks.mongodb = { status: 'unhealthy', error: 'Not connected' };
    }
  } catch (error) {
    checks.mongodb = { status: 'unhealthy', error: error.message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

export default router;
