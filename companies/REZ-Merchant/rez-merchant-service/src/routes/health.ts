/**
 * Health Check Routes
 *
 * Kubernetes-compatible health endpoints:
 * - /health - Basic liveness
 * - /health/ready - Readiness with dependency checks
 * - /health/live - Liveness probe
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis';

const router = Router();

// ── Health Types ─────────────────────────────────────────────────────────────

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
}

interface DependencyHealth {
  mongodb: { status: 'up' | 'down'; latencyMs?: number; error?: string };
  redis: { status: 'up' | 'down'; latencyMs?: number; error?: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function checkMongoDB(): Promise<DependencyHealth['mongodb']> {
  const start = Date.now();
  try {
    await mongoose.connection.db?.admin().ping();
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

async function checkRedis(): Promise<DependencyHealth['redis']> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /health
 * Basic health check - always returns 200 if server is running
 */
router.get('/', (_req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  };

  res.json(health);
});

/**
 * GET /health/live
 * Kubernetes liveness probe - checks if process is alive
 */
router.get('/live', (_req: Request, res: Response) => {
  const isLive = process.uptime() > 0 && !process.env.SHUTTING_DOWN;

  if (isLive) {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe - checks if service can accept traffic
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const [mongo, redisHealth] = await Promise.all([
    checkMongoDB(),
    checkRedis(),
  ]);

  const dependencies: DependencyHealth = {
    mongodb: mongo,
    redis: redisHealth,
  };

  const allUp = mongo.status === 'up' && redisHealth.status === 'up';
  const anyDown = mongo.status === 'down' || redisHealth.status === 'down';

  const status = allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded';
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    dependencies,
  });
});

/**
 * GET /health/details
 * Detailed health info for debugging
 */
router.get('/details', async (_req: Request, res: Response) => {
  const [mongo, redisHealth] = await Promise.all([
    checkMongoDB(),
    checkRedis(),
  ]);

  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    dependencies: {
      mongodb: mongo,
      redis: redisHealth,
    },
    system: {
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      cpu: {
        user: `${cpuUsage.user}`,
        system: `${cpuUsage.system}`,
      },
    },
    mongoose: {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
  });
});

export default router;
