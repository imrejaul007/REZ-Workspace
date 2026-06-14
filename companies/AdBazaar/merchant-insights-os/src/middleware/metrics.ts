import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import logger from '../config/logger.js';
import config from '../config/index.js';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const insightGenerationDuration = new client.Histogram({
  name: 'insight_generation_duration_seconds',
  help: 'Duration of insight generation operations',
  labelNames: ['insight_type'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const insightGenerationTotal = new client.Counter({
  name: 'insight_generation_total',
  help: 'Total number of insights generated',
  labelNames: ['insight_type', 'status'],
  registers: [register],
});

export const merchantInsightsCache = new client.Gauge({
  name: 'merchant_insights_cache_size',
  help: 'Number of cached merchant insights',
  registers: [register],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const databaseOperationDuration = new client.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

/**
 * Metrics middleware - tracks request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Track active connections
  activeConnections.inc();

  // On response finish, record metrics
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    activeConnections.dec();
  });

  next();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end('Error generating metrics');
  }
};

/**
 * Health check endpoint handler
 */
export const healthCheckHandler = (_req: Request, res: Response): void => {
  const uptime = process.uptime();

  res.json({
    status: 'ok',
    service: 'merchant-insights-os',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(uptime),
  });
};

/**
 * Record insight generation metrics
 */
export const recordInsightGeneration(
  insightType: string,
  status: 'success' | 'error',
  duration: number
): void {
  insightGenerationDuration.observe({ insight_type: insightType }, duration);
  insightGenerationTotal.inc({ insight_type: insightType, status });
}

/**
 * Record database operation metrics
 */
export const recordDatabaseOperation(
  operation: string,
  collection: string,
  duration: number
): void {
  databaseOperationDuration.observe({ operation, collection }, duration);
}

/**
 * Helper to time operations
 */
export const timeOperation = async <T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    recordDatabaseOperation(operation, collection, (Date.now() - start) / 1000);
    return result;
  } catch (error) {
    recordDatabaseOperation(operation, collection, (Date.now() - start) / 1000);
    throw error;
  }
};