/**
 * Health Check Middleware
 *
 * Provides standardized health check endpoints for all RABTUL services.
 * Includes readiness and liveness probes for Kubernetes.
 *
 * USAGE:
 * ```typescript
 * import { healthCheckRouter, createHealthChecker } from './health-check';
 *
 * const health = createHealthChecker('rez-auth-service');
 * health.addCheck('mongodb', async () => {
 *   await mongoose.connection.db.admin().ping();
 * });
 * health.addCheck('redis', async () => {
 *   await redis.ping();
 * });
 *
 * app.use('/health', healthCheckRouter(health));
 * ```
 */

import { Router, Request, Response } from 'express';

// ============================================
// TYPES
// ============================================

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: CheckResult[];
}

export interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthChecker {
  addCheck(name: string, check: HealthCheckFn, options?: CheckOptions): void;
  getHealth(): Promise<HealthCheckResult>;
  getLiveness(): LivenessResult;
}

export type HealthCheckFn = () => Promise<void> | void;
export type ReadinessCheckFn = () => Promise<boolean> | boolean;

export interface CheckOptions {
  timeout?: number; // ms
  critical?: boolean; // If false, won't affect overall status
}

export interface LivenessResult {
  status: 'ok';
  timestamp: string;
}

export interface ReadinessResult {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: CheckResult[];
}

// ============================================
// HEALTH CHECKER IMPLEMENTATION
// ============================================

export function createHealthChecker(
  serviceName: string,
  version: string = process.env.npm_package_version || '1.0.0'
): HealthChecker {
  const checks: Map<string, { fn: HealthCheckFn; options: CheckOptions }> = new Map();
  const startTime = Date.now();

  return {
    addCheck(name: string, fn: HealthCheckFn, options: CheckOptions = {}): void {
      checks.set(name, { fn, options });
    },

    async getHealth(): Promise<HealthCheckResult> {
      const checkResults: CheckResult[] = [];
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

      for (const [name, { fn, options }] of checks.entries()) {
        const start = Date.now();
        let status: CheckResult['status'] = 'pass';
        let message: string | undefined;

        try {
          const timeout = options.timeout || 5000;
          await Promise.race([
            Promise.resolve(fn()),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
          ]);
        } catch (error) {
          if (options.critical !== false) {
            status = 'fail';
            overallStatus = 'unhealthy';
            message = error instanceof Error ? error.message : 'Check failed';
          } else {
            status = 'warn';
            if (overallStatus === 'healthy') {
              overallStatus = 'degraded';
            }
            message = error instanceof Error ? error.message : 'Check degraded';
          }
        }

        checkResults.push({
          name,
          status,
          latency: Date.now() - start,
          message,
        });
      }

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        service: serviceName,
        version,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks: checkResults,
      };
    },

    getLiveness(): LivenessResult {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    },
  };
}

// ============================================
// EXPRESS ROUTER
// ============================================

export function healthCheckRouter(health: HealthChecker): Router {
  const router = Router();

  // Liveness probe - is the process alive?
  // Returns 200 if the service is running
  router.get('/live', (_req: Request, res: Response) => {
    const liveness = health.getLiveness();
    res.status(liveness.status === 'ok' ? 200 : 503).json(liveness);
  });

  // Readiness probe - is the service ready to accept traffic?
  // Returns 200 if all critical dependencies are healthy
  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      const healthResult = await health.getHealth();

      if (healthResult.status === 'unhealthy') {
        return res.status(503).json(healthResult);
      }

      res.status(200).json({
        status: 'ready',
        timestamp: healthResult.timestamp,
        service: healthResult.service,
        checks: healthResult.checks,
      } as ReadinessResult);
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      });
    }
  });

  // Full health check - detailed status of all components
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const healthResult = await health.getHealth();
      res.status(healthResult.status === 'unhealthy' ? 503 : 200).json(healthResult);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        service: 'unknown',
        version: 'unknown',
        uptime: 0,
        checks: [],
        error: error instanceof Error ? error.message : 'Health check failed',
      });
    }
  });

  // Aliases
  router.get('/health', router.route('/')[0]);
  router.get('/healthz', router.route('/')[0]);

  return router;
}

// ============================================
// COMMON CHECKS
// ============================================

export interface CommonChecksOptions {
  mongoose: typeof import('mongoose');
  redis?: import('ioredis').default;
  mongoUri?: string;
  redisUrl?: string;
}

export function addCommonChecks(
  health: HealthChecker,
  options: CommonChecksOptions
): void {
  // MongoDB check
  health.addCheck('mongodb', async () => {
    if (!options.mongoose.connection.readyState) {
      throw new Error('MongoDB not connected');
    }
    await options.mongoose.connection.db!.admin().ping();
  }, { critical: true });

  // Redis check
  if (options.redis) {
    health.addCheck('redis', async () => {
      const result = await options.redis!.ping();
      if (result !== 'PONG') {
        throw new Error(`Redis ping failed: ${result}`);
      }
    }, { critical: true });
  }
}

// ============================================
// KUBERNETES PROBES
// ============================================

/**
 * Generate Kubernetes probe configuration
 */
export function getKubernetesProbes(): {
  livenessProbe: Record<string, unknown>;
  readinessProbe: Record<string, unknown>;
} {
  return {
    livenessProbe: {
      httpGet: {
        path: '/health/live',
        port: process.env.PORT || 3000,
      },
      initialDelaySeconds: 10,
      periodSeconds: 15,
      timeoutSeconds: 5,
      failureThreshold: 3,
    },
    readinessProbe: {
      httpGet: {
        path: '/health/ready',
        port: process.env.PORT || 3000,
      },
      initialDelaySeconds: 5,
      periodSeconds: 10,
      timeoutSeconds: 3,
      failureThreshold: 3,
    },
  };
}

export default {
  createHealthChecker,
  healthCheckRouter,
  addCommonChecks,
  getKubernetesProbes,
};
