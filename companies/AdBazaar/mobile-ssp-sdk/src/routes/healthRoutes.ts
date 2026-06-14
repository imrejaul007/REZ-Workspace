import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/index.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      status: 'ok',
      service: 'mobile-ssp-sdk',
      port: process.env.PORT || 4851,
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoStatus,
      },
    });
  })
);

/**
 * GET /health/detailed
 * Detailed health check with all dependencies
 */
router.get(
  '/detailed',
  asyncHandler(async (_req: Request, res: Response) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const mongoHost = mongoose.connection.host || 'unknown';

    res.json({
      status: 'ok',
      service: 'mobile-ssp-sdk',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        mongodb: {
          status: mongoStatus,
          host: mongoHost,
          name: mongoose.connection.name || 'mobile-ssp-sdk',
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    });
  })
);

/**
 * GET /health/ready
 * Readiness check
 */
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    const mongoReady = mongoose.connection.readyState === 1;

    if (!mongoReady) {
      res.status(503).json({
        status: 'not ready',
        ready: false,
        reason: 'MongoDB not connected',
      });
      return;
    }

    res.json({
      status: 'ready',
      ready: true,
    });
  })
);

/**
 * GET /health/live
 * Liveness check
 */
router.get(
  '/live',
  (_req: Request, res: Response) => {
    res.json({
      status: 'alive',
      alive: true,
    });
  }
);

export default router;