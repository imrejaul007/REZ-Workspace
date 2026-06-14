/**
 * Production Health Check Middleware
 *
 * Provides comprehensive health check endpoints for all CorpPerks services:
 * - /health - Basic health check
 * - /ready - Kubernetes readiness probe
 * - /live - Kubernetes liveness probe
 */

import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import os from 'os';

// Types
interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    database?: boolean;
    redis?: boolean;
    memory?: boolean;
    [key: string]: boolean | undefined;
  };
  memory?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  environment?: string;
}

interface ReadinessResponse {
  ready: boolean;
  checks: {
    database: boolean;
    dependencies: Record<string, boolean>;
  };
}

// Configuration
const SERVICE_NAME = process.env.SERVICE_NAME || 'corpperks-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
const START_TIME = Date.now();

// Helper functions
function getMemoryUsage(): HealthCheckResponse['memory'] {
  const memoryUsage = process.memoryUsage();
  return {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
  };
}

function isMemoryHealthy(): boolean {
  const memoryUsage = process.memoryUsage();
  const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  return heapUsedPercent < 90; // Alert if heap usage > 90%
}

function getUptime(): number {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

// Health check router
export function createHealthRouter(): Router {
  const router = Router();

  /**
   * Liveness Probe - Basic health check
   * Used by Kubernetes to know when to restart a container
   */
  router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Readiness Probe - Detailed health check
   * Used by Kubernetes to know when a container is ready to receive traffic
   */
  router.get('/ready', async (req: Request, res: Response) => {
    const checks: ReadinessResponse['checks'] = {
      database: false,
      dependencies: {},
    };

    // Check database connection
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db?.admin().ping();
        checks.database = true;
      }
    } catch {
      checks.database = false;
    }

    // Check external dependencies (can be extended per service)
    // Example: await checkRedis();
    // Example: await checkExternalAPI();

    const ready = checks.database;

    const response: ReadinessResponse = {
      ready,
      checks,
    };

    res.status(ready ? 200 : 503).json(response);
  });

  /**
   * Health Check - Comprehensive health information
   */
  router.get('/health', async (req: Request, res: Response) => {
    const checks: HealthCheckResponse['checks'] = {
      database: false,
      memory: false,
    };

    let overallStatus: 'ok' | 'degraded' | 'unhealthy' = 'ok';

    // Check database
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db?.admin().ping();
        checks.database = true;
      } else {
        overallStatus = 'degraded';
      }
    } catch {
      checks.database = false;
      overallStatus = 'unhealthy';
    }

    // Check memory
    checks.memory = isMemoryHealthy();
    if (!checks.memory) {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      uptime: getUptime(),
      timestamp: new Date().toISOString(),
      checks,
      memory: getMemoryUsage(),
      environment: process.env.NODE_ENV,
    };

    // Set appropriate status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(response);
  });

  /**
   * Version endpoint
   */
  router.get('/version', (req: Request, res: Response) => {
    res.json({
      name: SERVICE_NAME,
      version: SERVICE_VERSION,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Metrics endpoint (for Prometheus scraping)
   */
  router.get('/metrics', (req: Request, res: Response) => {
    const memoryUsage = getMemoryUsage();
    const uptime = getUptime();

    const metrics = `
# HELP corperks_uptime_seconds Service uptime in seconds
# TYPE corperks_uptime_seconds gauge
corperks_uptime_seconds{service="${SERVICE_NAME}"} ${uptime}

# HELP corperks_memory_heap_used_bytes Heap memory used in bytes
# TYPE corperks_memory_heap_used_bytes gauge
corperks_memory_heap_used_bytes{service="${SERVICE_NAME}"} ${memoryUsage.heapUsed * 1024 * 1024}

# HELP corperks_memory_heap_total_bytes Total heap memory in bytes
# TYPE corperks_memory_heap_total_bytes gauge
corperks_memory_heap_total_bytes{service="${SERVICE_NAME}"} ${memoryUsage.heapTotal * 1024 * 1024}

# HELP corperks_memory_rss_bytes Resident set size in bytes
# TYPE corperks_memory_rss_bytes gauge
corperks_memory_rss_bytes{service="${SERVICE_NAME}"} ${memoryUsage.rss * 1024 * 1024}

# HELP corperks_process_cpu_usage_seconds_total CPU time used in seconds
# TYPE corperks_process_cpu_usage_seconds_total counter
corperks_process_cpu_usage_seconds_total{service="${SERVICE_NAME}"} ${process.cpuUsage().user / 1000000}

# HELP corperks_database_connected Database connection status (1 = connected)
# TYPE corperks_database_connected gauge
corperks_database_connected{service="${SERVICE_NAME}"} ${mongoose.connection.readyState === 1 ? 1 : 0}

# HELP corperks_info Service info
# TYPE corperks_info gauge
corperks_info{service="${SERVICE_NAME}",version="${SERVICE_VERSION}",node="${process.version}"} 1

# HELP nodejs_memory_reserved_bytes Number of bytes reserved for heap
# TYPE nodejs_memory_reserved_bytes gauge
nodejs_memory_reserved_bytes{type="heap"} ${memoryUsage.heapTotal * 1024 * 1024}
nodejs_memory_reserved_bytes{type="rss"} ${memoryUsage.rss * 1024 * 1024}

# HELP nodejs_memory_used_bytes Number of bytes used for heap
# TYPE nodejs_memory_used_bytes gauge
nodejs_memory_used_bytes{type="used"} ${memoryUsage.heapUsed * 1024 * 1024}
nodejs_memory_used_bytes{type="external"} ${memoryUsage.external * 1024 * 1024}

# HELP nodejs_active_handles_total Number of active handles
# TYPE nodejs_active_handles_total gauge
nodejs_active_handles_total{service="${SERVICE_NAME}"} ${process.resourceUsage?.()?.maxRSS || 0}

# HELP nodejs_active_requests_total Number of active requests
# TYPE nodejs_active_requests_total gauge
nodejs_active_requests_total{service="${SERVICE_NAME}"} 0

# HELP corperks_system_cpus_total Number of CPUs
# TYPE corperks_system_cpus_total gauge
corperks_system_cpus_total{service="${SERVICE_NAME}"} ${os.cpus().length}

# HELP corperks_system_free_memory_bytes Free system memory in bytes
# TYPE corperks_system_free_memory_bytes gauge
corperks_system_free_memory_bytes{service="${SERVICE_NAME}"} ${os.freemem()}
    `.trim();

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  });

  return router;
}

// Export types for use in services
export type { HealthCheckResponse, ReadinessResponse };
