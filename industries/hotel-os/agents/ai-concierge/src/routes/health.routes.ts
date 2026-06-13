/**
 * AI Concierge Agent - Health Routes
 * Health check and service status endpoints
 */

import { Router, Request, Response } from 'express';
import { GuestMemoryClient } from '../services';
import { asyncHandler } from '../utils';
import { logger } from '../utils/logger';

export const createHealthRoutes = (guestMemoryClient?: GuestMemoryClient) => {
  const router = Router();

  /**
   * GET /health
   * Basic health check
   */
  router.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: process.env.SERVICE_NAME || 'ai-concierge',
      version: process.env.SERVICE_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /health/ready
   * Readiness check (includes dependencies)
   */
  router.get('/ready', asyncHandler(async (_req: Request, res: Response) => {
    const checks: Record<string, { status: string; latency?: number }> = {};

    // Check Guest Memory if client is provided
    if (guestMemoryClient) {
      const start = Date.now();
      const guestMemoryHealthy = await guestMemoryClient.healthCheck();
      checks.guest_memory = {
        status: guestMemoryHealthy ? 'healthy' : 'unhealthy',
        latency: Date.now() - start,
      };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  }));

  /**
   * GET /health/live
   * Liveness check
   */
  router.get('/live', (_req: Request, res: Response) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};