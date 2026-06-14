/**
 * Health Check Middleware for AdBazaar Services
 * Usage: import { healthCheckMiddleware } from '../shared/health-middleware';
 */

import { Request, Response } from 'express';

export interface HealthCheckConfig {
  serviceName: string;
  version?: string;
  checks?: () => Promise<{ name: string; status: 'up' | 'down' }[]>;
}

export function createHealthMiddleware(config: HealthCheckConfig) {
  const { serviceName, version = '1.0.0', checks } = config;

  return async (req: Request, res: Response) => {
    // Liveness probe
    if (req.path === '/healthz') {
      res.status(200).json({ status: 'ok' });
      return;
    }

    // Readiness probe
    const healthCheck = {
      status: 'healthy',
      service: serviceName,
      version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    if (checks) {
      try {
        const results = await checks();
        const hasDown = results.some(r => r.status === 'down');
        healthCheck.status = hasDown ? 'unhealthy' : 'healthy';
        (healthCheck as Record<string, unknown>).checks = results;
      } catch {
        healthCheck.status = 'unhealthy';
      }
    }

    res.status(healthCheck.status === 'healthy' ? 200 : 503).json(healthCheck);
  };
}
