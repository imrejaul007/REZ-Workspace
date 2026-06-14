import { Request, Response, NextFunction } from 'express';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import config from '../config/index.js';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register, prefix: config.metrics.prefix });

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: `${config.metrics.prefix}http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDurationSeconds = new Histogram({
  name: `${config.metrics.prefix}http_request_duration_seconds`,
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: `${config.metrics.prefix}active_connections`,
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Place metrics
export const placesTotal = new Gauge({
  name: `${config.metrics.prefix}places_total`,
  help: 'Total number of places in database',
  labelNames: ['type', 'status'],
  registers: [register],
});

// Cache hit/miss counter
export const cacheOperations = new Counter({
  name: `${config.metrics.prefix}cache_operations_total`,
  help: 'Total cache operations',
  labelNames: ['operation', 'result'],
  registers: [register],
});

// Search metrics
export const searchQueriesTotal = new Counter({
  name: `${config.metrics.prefix}search_queries_total`,
  help: 'Total search queries',
  labelNames: ['type'],
  registers: [register],
});

// Audience estimation metrics
export const audienceEstimatesTotal = new Counter({
  name: `${config.metrics.prefix}audience_estimates_total`,
  help: 'Total audience estimates generated',
  registers: [register],
});

/**
 * Metrics collection middleware
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = normalizePath(req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status_code: res.statusCode.toString(),
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        path,
        status_code: res.statusCode.toString(),
      },
      duration
    );

    activeConnections.dec();
  });

  next();
}

/**
 * Normalize path to avoid high cardinality
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/api\/places\/[a-zA-Z0-9-]+/g, '/api/places/:id')
    .replace(/\/[0-9a-f]{24}/g, '/:objectId');
}

/**
 * Get metrics endpoint handler
 */
export async function getMetrics(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
}

/**
 * Get registry for health checks
 */
export function getRegistry(): Registry {
  return register;
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  register.resetMetrics();
}

/**
 * Update place metrics
 */
export async function updatePlaceMetrics(
  typeCounts: Record<string, number>,
  statusCounts: Record<string, number>
): Promise<void> {
  // Reset existing place metrics
  placesTotal.reset();

  // Set new values
  for (const [type, count] of Object.entries(typeCounts)) {
    placesTotal.set({ type, status: 'all' }, count);
  }

  for (const [status, count] of Object.entries(statusCounts)) {
    placesTotal.set({ type: 'all', status }, count);
  }
}

export default {
  metricsMiddleware,
  getMetrics,
  getRegistry,
  resetMetrics,
  updatePlaceMetrics,
};