// ================================================
// REZ Atlas Score - Health Check Routes
// ================================================

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';

const router = Router();

// ================================================
// Health Check Response Types
// ================================================
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  environment: string;
}

interface DetailedHealth {
  status: HealthStatus;
  checks: {
    mongodb: { status: string; latency?: number; error?: string };
    redis: { status: string; latency?: number; error?: string };
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
}

// ================================================
// Basic Health Check (/health)
// ================================================
router.get('/health', (req: Request, res: Response) => {
  const uptime = process.uptime();

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    service: process.env.SERVICE_NAME || 'REZ-atlas-score',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(health);
});

// ================================================
// Liveness Probe (/health/live)
// ================================================
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// ================================================
// Readiness Probe (/health/ready)
// ================================================
router.get('/health/ready', async (req: res) => {
  const checks: DetailedHealth['checks'] = {
    mongodb: { status: 'unknown' },
    redis: { status: 'unknown' },
  };

  let allHealthy = true;

  // Check MongoDB
  try {
    const start = Date.now();
    const mongoStatus = mongoose.connection.readyState;
    const latency = Date.now() - start;

    if (mongoStatus === 1) {
      checks.mongodb = { status: 'connected', latency };
    } else {
      checks.mongodb = { status: 'disconnected', error: 'MongoDB not connected' };
      allHealthy = false;
    }
  } catch (error) {
    checks.mongodb = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    allHealthy = false;
  }

  // Check Redis
  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    const start = Date.now();
    await redisClient.connect();
    await redisClient.ping();
    const latency = Date.now() - start;

    checks.redis = { status: 'connected', latency };
    await redisClient.quit();
  } catch (error) {
    checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Redis not available',
    };
    allHealthy = false;
  }

  const status = allHealthy ? 'healthy' : 'unhealthy';
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    checks,
  });
});

// ================================================
// Detailed Health Check (/health/detailed)
// ================================================
router.get('/health/detailed', async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const detailed: DetailedHealth = {
    status: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: process.env.SERVICE_NAME || 'REZ-atlas-score',
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    checks: {
      mongodb: { status: 'unknown' },
      redis: { status: 'unknown' },
    },
    metrics: {
      memoryUsage: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpuUsage: cpuUsage.user / 1000000,
    },
  };

  const checkTimeout = (promise: Promise<any>, timeout = 5000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
    ]);

  try {
    await checkTimeout(mongoose.connection.db?.admin().ping());
    detailed.checks.mongodb = { status: 'connected' };
  } catch (error) {
    detailed.checks.mongodb = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed',
    };
    detailed.status.status = 'degraded';
  }

  try {
    const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redisClient.connect();
    await redisClient.ping();
    await redisClient.quit();
    detailed.checks.redis = { status: 'connected' };
  } catch (error) {
    detailed.checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed',
    };
    detailed.status.status = 'degraded';
  }

  res.status(detailed.status.status === 'healthy' ? 200 : 503).json(detailed);
});

// ================================================
// Kubernetes Health Endpoint (/healthz)
// ================================================
router.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// ================================================
// Prometheus Metrics (/metrics)
// ================================================
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { register } = await import('prom-client');

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

export default router;
