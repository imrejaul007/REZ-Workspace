import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config/index.js';

// Create a custom registry
export const metricsRegistry = new Registry();

// Collect default metrics (CPU, memory, etc.)
if (config.metrics.enabled) {
  collectDefaultMetrics({ register: metricsRegistry });
}

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [metricsRegistry],
});

export const apartmentsTotal = new Gauge({
  name: 'apartments_total',
  help: 'Total number of apartments',
  registers: [metricsRegistry],
});

export const apartmentsActive = new Gauge({
  name: 'apartments_active',
  help: 'Number of active apartments',
  registers: [metricsRegistry],
});

export const totalResidents = new Gauge({
  name: 'total_residents',
  help: 'Total estimated residents across all apartments',
  registers: [metricsRegistry],
});

export const targetingConfigsActive = new Gauge({
  name: 'targeting_configs_active',
  help: 'Number of active targeting configurations',
  registers: [metricsRegistry],
});

export const buzzLocalSyncStatus = new Gauge({
  name: 'buzzlocal_sync_status',
  help: 'BuzzLocal sync status (0=idle, 1=syncing, 2=success, 3=error)',
  registers: [metricsRegistry],
});

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [metricsRegistry],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [metricsRegistry],
});

// Middleware to track request metrics
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    if (!config.metrics.enabled) return;

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e9; // Convert to seconds

    // Normalize path to avoid high cardinality
    const normalizedPath = normalizePath(req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path: normalizedPath,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path: normalizedPath,
        status: res.statusCode.toString(),
      },
      duration
    );
  });

  next();
};

// Normalize paths to avoid cardinality explosion
function normalizePath(path: string): string {
  return path
    .replace(/\/api\/apartments\/[A-Z0-9-]+/g, '/api/apartments/:id')
    .replace(/\/api\/apartments\/[A-Z0-9-]+\/target/g, '/api/apartments/:id/target')
    .replace(/\/api\/apartments\/[A-Z0-9-]+\/residents/g, '/api/apartments/:id/residents');
}

// Metrics endpoint handler
export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
};

// Update apartment metrics
export const updateApartmentMetrics = async (
  total: number,
  active: number,
  residents: number
): Promise<void> => {
  if (!config.metrics.enabled) return;
  apartmentsTotal.set(total);
  apartmentsActive.set(active);
  totalResidents.set(residents);
};