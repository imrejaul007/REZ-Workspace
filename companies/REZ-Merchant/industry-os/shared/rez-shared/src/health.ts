import { Request, Response } from 'express';
import { isDatabaseConnected } from './database';

export interface HealthCheckOptions {
  serviceName: string;
  version?: string;
  port?: number;
  checks?: () => Promise<Record<string, string | boolean>>;
}

/**
 * Create standardized health check endpoint
 */
export function createHealthCheck(options: HealthCheckOptions) {
  const { serviceName, version = '1.0.0', port, checks } = options;

  return async (req: Request, res: Response) => {
    try {
      const dbStatus = isDatabaseConnected() ? 'connected' : 'disconnected';

      const healthStatus: Record<string, any> = {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        service: serviceName,
        version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      if (port) {
        healthStatus.port = port;
      }

      // Add custom checks
      if (checks) {
        healthStatus.checks = await checks();
      }

      // Add database status
      healthStatus.database = dbStatus;

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: serviceName,
        version,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * Liveness probe - always returns 200 if service is running
 */
export function createLivenessProbe() {
  return (req: Request, res: Response) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Readiness probe - checks if service is ready to receive traffic
 */
export function createReadinessProbe(options: Omit<HealthCheckOptions, 'serviceName'>) {
  const { checks } = options;

  return async (req: Request, res: Response) => {
    try {
      const dbReady = isDatabaseConnected();

      if (!dbReady) {
        return res.status(503).json({
          status: 'not_ready',
          reason: 'Database not connected',
          timestamp: new Date().toISOString(),
        });
      }

      // Run custom checks
      if (checks) {
        const customChecks = await checks();
        const failedChecks = Object.entries(customChecks)
          .filter(([, status]) => status !== 'ok' && status !== true)
          .map(([name]) => name);

        if (failedChecks.length > 0) {
          return res.status(503).json({
            status: 'not_ready',
            failedChecks,
            timestamp: new Date().toISOString(),
          });
        }
      }

      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export default { createHealthCheck, createLivenessProbe, createReadinessProbe };
