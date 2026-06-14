import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { HealthStatus, ApiResponse } from '../types';
import { config } from '../config';
import logger from '../config/logger';

const router = Router();

const startTime = Date.now();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB
    const mongoHealthy = mongoose.connection.readyState === 1;

    // Check external services (simplified)
    const customerGraphHealthy = await checkServiceHealth(
      `${config.customerGraph.url}/health`
    );

    const identityCloudHealthy = await checkServiceHealth(
      `${config.identityCloud.url}/health`
    );

    const hojaiAIHealthy = await checkServiceHealth(
      `${config.hojai.apiUrl}/health`
    );

    const allHealthy = mongoHealthy; // MongoDB is required, others are optional

    const healthStatus: HealthStatus = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: '1.0.0',
      services: {
        mongodb: mongoHealthy,
        customerGraph: customerGraphHealthy,
        identityCloud: identityCloudHealthy,
        hojaiAI: hojaiAIHealthy,
      },
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: '1.0.0',
      services: {
        mongodb: false,
        customerGraph: false,
        identityCloud: false,
        hojaiAI: false,
      },
    });
  }
});

/**
 * GET /health/live
 * Liveness probe - is the process alive?
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Readiness probe - is the service ready to accept traffic?
 */
router.get('/ready', (_req: Request, res: Response) => {
  const mongoHealthy = mongoose.connection.readyState === 1;

  if (mongoHealthy) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'MongoDB not connected',
    });
  }
});

/**
 * Helper to check service health
 */
async function checkServiceHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      timeout: 3000,
    } as RequestInit);
    return response.ok;
  } catch {
    return false;
  }
}

export default router;