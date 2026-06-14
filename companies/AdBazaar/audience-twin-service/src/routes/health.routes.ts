import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { hojaiTwinService } from '../services';
import logger from '../config/logger';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    mongodb: {
      status: 'up' | 'down';
      latency?: number;
    };
    redis: {
      status: 'up' | 'down';
    };
    hojaiTwin: {
      status: 'up' | 'down';
      latency?: number;
    };
  };
  version: string;
}

let startTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  const mongoStart = Date.now();
  let mongoStatus: 'up' | 'down' = 'down';
  let mongoLatency: number | undefined;

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db?.admin().ping();
      mongoStatus = 'up';
      mongoLatency = Date.now() - mongoStart;
    }
  } catch {
    mongoStatus = 'down';
    mongoLatency = Date.now() - mongoStart;
  }

  let hojaiStatus: 'up' | 'down' = 'down';
  let hojaiLatency: number | undefined;

  try {
    const hojaiStart = Date.now();
    const hojaiHealthy = await hojaiTwinService.healthCheck();
    if (hojaiHealthy) {
      hojaiStatus = 'up';
      hojaiLatency = Date.now() - hojaiStart;
    }
  } catch (error) {
    logger.warn('HOJAI twin health check failed:', error);
  }

  // Determine overall status
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

  if (mongoStatus === 'down') {
    status = 'unhealthy';
  } else if (hojaiStatus === 'down') {
    status = 'degraded';
  }

  const health: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {
      mongodb: {
        status: mongoStatus,
        latency: mongoLatency,
      },
      redis: {
        status: 'up', // Redis status is checked at startup
      },
      hojaiTwin: {
        status: hojaiStatus,
        latency: hojaiLatency,
      },
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  const httpStatus = status === 'unhealthy' ? 503 : 200;
  res.status(httpStatus).json(health);
});

// Liveness probe
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

// Readiness probe
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ status: 'not ready', reason: 'MongoDB not connected' });
      return;
    }

    // Optionally check HOJAI
    const hojaiHealthy = await hojaiTwinService.healthCheck();
    if (!hojaiHealthy) {
      res.status(503).json({ status: 'not ready', reason: 'HOJAI twin service unavailable' });
      return;
    }

    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'Health check failed' });
  }
});

export default router;