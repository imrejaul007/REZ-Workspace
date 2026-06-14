import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections gauge
export const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Twin-specific metrics
export const twinOperationsTotal = new client.Counter({
  name: 'twin_operations_total',
  help: 'Total number of twin operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const twinPredictionDuration = new client.Histogram({
  name: 'twin_prediction_duration_seconds',
  help: 'Duration of twin prediction operations',
  labelNames: ['scenario'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const twinCacheHits = new client.Counter({
  name: 'twin_cache_hits_total',
  help: 'Total number of twin cache hits',
  registers: [register],
});

export const twinCacheMisses = new client.Counter({
  name: 'twin_cache_misses_total',
  help: 'Total number of twin cache misses',
  registers: [register],
});

export const activeTwinsGauge = new client.Gauge({
  name: 'active_twins_count',
  help: 'Number of active user twins',
  registers: [register],
});

// Error metrics
export const errorsTotal = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'service'],
  registers: [register],
});

/**
 * Metrics collection middleware
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    // Normalize route to avoid high cardinality
    const normalizedRoute = normalizeRoute(route);

    httpRequestDuration
      .labels(req.method, normalizedRoute, res.statusCode.toString())
      .observe(duration);

    httpRequestTotal
      .labels(req.method, normalizedRoute, res.statusCode.toString())
      .inc();

    activeConnections.dec();
  });

  next();
};

/**
 * Normalize route to reduce cardinality
 */
const normalizeRoute = (route: string): string => {
  // Replace IDs with placeholders
  return route
    .replace(/\/[\w-]{24,}/g, '/:id')  // MongoDB ObjectIDs
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')  // UUIDs
    .replace(/\/[0-9]+/g, '/:numeric');  // Numeric IDs
};

/**
 * Metrics endpoint handler
 */
export const getMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

/**
 * Health check endpoint handler
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      mongodb: 'connected',
      redis: 'connected',
    },
  });
};

/**
 * Increment twin operation counter
 */
export const recordTwinOperation = (operation: string, status: 'success' | 'error'): void => {
  twinOperationsTotal.labels(operation, status).inc();
};

/**
 * Record prediction duration
 */
export const recordPredictionDuration = (scenario: string, durationMs: number): void => {
  twinPredictionDuration.labels(scenario || 'default').observe(durationMs / 1000);
};

/**
 * Record cache hit
 */
export const recordCacheHit = (): void => {
  twinCacheHits.inc();
};

/**
 * Record cache miss
 */
export const recordCacheMiss = (): void => {
  twinCacheMisses.inc();
};

/**
 * Record error
 */
export const recordError = (type: string, service: string = 'user-twin-service'): void => {
  errorsTotal.labels(type, service).inc();
};

export default {
  metricsMiddleware,
  getMetrics,
  getHealth,
  register,
};