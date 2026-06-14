/**
 * Health Check System
 *
 * Provides comprehensive health checks for services including:
 * - Database connectivity
 * - Cache connectivity
 * - External service dependencies
 * - Custom health checks
 *
 * @module @adbazaar/shared-utils/health
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createLogger } from './logger';

const logger = createLogger('health-check');

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, HealthCheckStatus>;
}

export interface HealthCheckStatus {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckStatus>;
}

const healthChecks: Map<string, HealthCheck> = new Map();

/**
 * Register a health check
 */
export function registerHealthCheck(check: HealthCheck): void {
  healthChecks.set(check.name, check);
  logger.info(`Registered health check: ${check.name}`);
}

/**
 * MongoDB health check
 */
export function createMongoHealthCheck(): HealthCheck {
  return {
    name: 'mongodb',
    check: async (): Promise<HealthCheckStatus> => {
      const start = Date.now();
      try {
        if (mongoose.connection.readyState !== 1) {
          return { status: 'down', latencyMs: Date.now() - start, error: 'Not connected' };
        }

        await mongoose.connection.db?.admin().ping();
        return { status: 'up', latencyMs: Date.now() - start };
      } catch (error) {
        return {
          status: 'down',
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}

/**
 * Redis health check
 */
export function createRedisHealthCheck(getRedis: () => { ping: () => Promise<unknown> }): HealthCheck {
  return {
    name: 'redis',
    check: async (): Promise<HealthCheckStatus> => {
      const start = Date.now();
      try {
        const redis = getRedis();
        if (redis.status !== 'ready') {
          return { status: 'down', latencyMs: Date.now() - start, error: 'Not ready' };
        }
        await redis.ping();
        return { status: 'up', latencyMs: Date.now() - start };
      } catch (error) {
        return {
          status: 'down',
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}

/**
 * HTTP service health check
 */
export function createHttpHealthCheck(name: string, url: string): HealthCheck {
  return {
    name,
    check: async (): Promise<HealthCheckStatus> => {
      const start = Date.now();
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          return { status: 'up', latencyMs: Date.now() - start };
        }

        return {
          status: 'degraded',
          latencyMs: Date.now() - start,
          error: `HTTP ${response.status}`
        };
      } catch (error) {
        return {
          status: 'down',
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Connection failed'
        };
      }
    }
  };
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<HealthCheckResult> {
  const checks: Record<string, HealthCheckStatus> = {};
  let hasDown = false;
  let hasDegraded = false;

  for (const [name, check] of healthChecks.entries()) {
    try {
      checks[name] = await check.check();
      if (checks[name].status === 'down') hasDown = true;
      if (checks[name].status === 'degraded') hasDegraded = true;
    } catch (error) {
      checks[name] = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Check failed'
      };
      hasDown = true;
    }
  }

  return {
    status: hasDown ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
    service: process.env.SERVICE_NAME || 'adbazaar-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    checks,
  };
}

/**
 * Express middleware for health endpoints
 */
export function healthCheckMiddleware() {
  return async (req: Request, res: Response) => {
    // Simple liveness probe
    if (req.path === '/healthz') {
      res.status(200).json({ status: 'ok' });
      return;
    }

    // Detailed health check
    const result = await runHealthChecks();
    const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(result);
  };
}

/**
 * Prometheus metrics endpoint
 */
export function metricsMiddleware(register: {
  metrics: () => Promise<string>;
  contentType: string;
}) {
  return async (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end();
    }
  };
}

export default {
  registerHealthCheck,
  createMongoHealthCheck,
  createRedisHealthCheck,
  createHttpHealthCheck,
  runHealthChecks,
  healthCheckMiddleware,
  metricsMiddleware,
};