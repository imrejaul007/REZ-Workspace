import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisService, rabtulService } from '../services';
import { logger } from 'utils/logger.js';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    mongodb: 'up' | 'down';
    redis: 'up' | 'down';
    rabtul_wallet: 'up' | 'down';
    rabtul_payment: 'up' | 'down';
  };
  checks: {
    database: boolean;
    cache: boolean;
    external: boolean;
  };
}

let startTime = Date.now();

export function updateStartTime(): void {
  startTime = Date.now();
}

// GET /health - Basic health check
router.get('/', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    service: 'ecosystem-transaction-hub',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// GET /health/detailed - Detailed health check
router.get('/detailed', async (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  // Check MongoDB
  const mongoStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';

  // Check Redis
  const redisStatus = redisService.isAvailable() ? 'up' : 'down';

  // Check RABTUL services
  let rabtulWalletStatus: 'up' | 'down' = 'down';
  let rabtulPaymentStatus: 'up' | 'down' = 'down';

  try {
    const healthOk = await rabtulService.checkHealth();
    if (healthOk) {
      rabtulWalletStatus = 'up';
      rabtulPaymentStatus = 'up';
    }
  } catch {
    logger.warn('RABTUL health check failed');
  }

  const checks = {
    database: mongoStatus === 'up',
    cache: redisStatus === 'up',
    external: rabtulWalletStatus === 'up' && rabtulPaymentStatus === 'up',
  };

  const allHealthy = checks.database && checks.cache && checks.external;
  const allDown = !checks.database && !checks.cache && !checks.external;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (allHealthy) {
    overallStatus = 'healthy';
  } else if (allDown || !checks.database) {
    overallStatus = 'unhealthy';
  } else {
    overallStatus = 'degraded';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
      rabtul_wallet: rabtulWalletStatus,
      rabtul_payment: rabtulPaymentStatus,
    },
    checks,
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
  res.status(httpStatus).json(healthStatus);
});

// GET /health/ready - Readiness check (for k8s)
router.get('/ready', (_req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;

  if (mongoReady) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Database not connected' });
  }
});

// GET /health/live - Liveness check (for k8s)
router.get('/live', (_req: Request, res: Response) => {
  res.json({ alive: true });
});

export default router;
export { updateStartTime };