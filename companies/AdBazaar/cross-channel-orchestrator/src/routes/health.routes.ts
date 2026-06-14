import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware';
import { redisService, isRedisConnected } from '../services/redis.service';
import { config } from '../config';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  checks: {
    mongodb: { status: string; latency?: number; error?: string };
    redis: { status: string; connected: boolean };
    channels: Record<string, { healthy: boolean; latency?: number }>;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * GET /health
 * Basic health check
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const mongoConnected = mongoose.connection.readyState === 1;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      service: 'cross-channel-orchestrator',
      version: '1.0.0',
      checks: {
        mongodb: mongoConnected ? 'connected' : 'disconnected',
        redis: isRedisConnected() ? 'connected' : 'disconnected',
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
    const startTime = Date.now();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Check MongoDB
    let mongoStatus = 'unhealthy';
    let mongoLatency: number | undefined;

    try {
      const mongoStart = Date.now();
      await mongoose.connection.db?.admin().ping();
      mongoLatency = Date.now() - mongoStart;
      mongoStatus = 'healthy';
    } catch (error) {
      mongoStatus = 'unhealthy';
    }

    // Check Redis
    const redisConnected = isRedisConnected();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!mongoStatus || !redisConnected) {
      status = 'unhealthy';
    } else if (mongoLatency && mongoLatency > 1000) {
      status = 'degraded';
    }

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      service: 'cross-channel-orchestrator',
      version: '1.0.0',
      checks: {
        mongodb: {
          status: mongoStatus,
          latency: mongoLatency,
        },
        redis: {
          status: redisConnected ? 'connected' : 'disconnected',
          connected: redisConnected,
        },
        channels: {},
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
    };

    const responseTime = Date.now() - startTime;

    res.set('X-Response-Time', `${responseTime}ms`);
    res.status(status === 'unhealthy' ? 503 : 200).json(health);
  })
);

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get(
  '/live',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    const mongoConnected = mongoose.connection.readyState === 1;

    if (!mongoConnected) {
      res.status(503).json({
        status: 'not_ready',
        reason: 'MongoDB not connected',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;