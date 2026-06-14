import client from 'prom-client';
import { Request, Response } from 'express';

// Create a registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for Data Clean Room Service
const httpRequestDuration = new client.Histogram({
  name: 'data_clean_room_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'data_clean_room_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Business metrics
const dataUploadsTotal = new client.Counter({
  name: 'data_clean_room_uploads_total',
  help: 'Total number of data uploads',
  labelNames: ['brand_id', 'status'],
  registers: [register],
});

const dataUploadsRecords = new client.Histogram({
  name: 'data_clean_room_uploads_records',
  help: 'Number of records per upload',
  labelNames: ['brand_id'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register],
});

const matchJobsTotal = new client.Counter({
  name: 'data_clean_room_match_jobs_total',
  help: 'Total number of match jobs',
  labelNames: ['brand_id', 'match_type', 'status'],
  registers: [register],
});

const matchRate = new client.Gauge({
  name: 'data_clean_room_match_rate',
  help: 'Average match rate percentage',
  labelNames: ['brand_id'],
  registers: [register],
});

const overlapAnalysesTotal = new client.Counter({
  name: 'data_clean_room_overlap_analyses_total',
  help: 'Total number of overlap analyses',
  labelNames: ['brand_id', 'analysis_type'],
  registers: [register],
});

const activationsTotal = new client.Counter({
  name: 'data_clean_room_activations_total',
  help: 'Total number of audience activations',
  labelNames: ['brand_id', 'target', 'status'],
  registers: [register],
});

const recordsActivated = new client.Histogram({
  name: 'data_clean_room_records_activated',
  help: 'Number of records activated per job',
  labelNames: ['brand_id', 'target'],
  buckets: [100, 500, 1000, 5000, 10000, 50000],
  registers: [register],
});

// Privacy metrics
const privacyBudgetConsumed = new client.Gauge({
  name: 'data_clean_room_privacy_budget_consumed',
  help: 'Privacy budget consumed (epsilon)',
  registers: [register],
});

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: () => void): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function getMetrics(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

/**
 * Get metrics registry
 */
export function getMetricsRegistry(): client.Registry {
  return register;
}

// Export individual metrics for use in services
export const metrics = {
  httpRequestDuration,
  httpRequestsTotal,
  dataUploadsTotal,
  dataUploadsRecords,
  matchJobsTotal,
  matchRate,
  overlapAnalysesTotal,
  activationsTotal,
  recordsActivated,
  privacyBudgetConsumed,
};