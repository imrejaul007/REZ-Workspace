/**
 * Prometheus Metrics Middleware
 * Exposes metrics endpoint and tracks HTTP request metrics
 *
 * Usage:
 *   import { metricsMiddleware, metricsRouter } from './middleware/metrics';
 *   app.use(metricsMiddleware);
 *   app.use('/metrics', metricsRouter);
 */

import { Router, Request, Response, NextFunction } from 'express';

// Metric storage (in-memory for simplicity)
// In production, use Redis for shared state across instances
const httpRequestsTotal = new Map<string, number>();
const httpRequestDurations = new Map<string, number[]>();

/**
 * Record an HTTP request
 */
export function recordRequest(method: string, path: string, status: number, durationMs: number): void {
  const key = `${method}:${normalizePath(path)}:${Math.floor(status / 100) * 100}`; // Group by status class
  httpRequestsTotal.set(key, (httpRequestsTotal.get(key) || 0) + 1);

  // Store duration for percentile calculation
  const durations = httpRequestDurations.get(key) || [];
  durations.push(durationMs);
  if (durations.length > 1000) durations.shift();
  httpRequestDurations.set(key, durations);
}

/**
 * Calculate percentile from sorted array
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Normalize paths to prevent high cardinality
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/[a-f0-9]{24}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-zA-Z0-9_-]{36}/g, '/:uuid');
}

/**
 * Express middleware to track request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    recordRequest(req.method, req.path, res.statusCode, duration);
  });

  next();
}

/**
 * Format metrics in Prometheus exposition format
 */
export function formatPrometheusMetrics(): string {
  const lines: string[] = [];
  const now = Math.floor(Date.now() / 1000);

  lines.push('# HELP http_requests_total Total HTTP requests by method, path, status');
  lines.push('# TYPE http_requests_total counter');

  for (const [key, count] of httpRequestsTotal) {
    const [method, path, status] = key.split(':');
    lines.push(`http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
  }

  lines.push('');
  lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
  lines.push('# TYPE http_request_duration_seconds histogram');

  for (const [key, durations] of httpRequestDurations) {
    if (durations.length === 0) continue;

    const [method, path, status] = key.split(':');

    for (const p of [50, 90, 95, 99]) {
      const value = percentile(durations, p) / 1000;
      lines.push(`http_request_duration_seconds{quantile="${p / 100}",method="${method}",path="${path}",status="${status}"} ${value}`);
    }

    const sum = durations.reduce((a, b) => a + b, 0) / 1000;
    lines.push(`http_request_duration_seconds_sum{method="${method}",path="${path}",status="${status}"} ${sum}`);
    lines.push(`http_request_duration_seconds_count{method="${method}",path="${path}",status="${status}"} ${durations.length}`);
  }

  // Service-level metrics
  lines.push('');
  lines.push('# HELP merchant_service_up Whether the service is up');
  lines.push('# TYPE merchant_service_up gauge');
  lines.push('merchant_service_up 1');

  lines.push('');
  lines.push(`# HELP process_start_time_seconds Start time of the process`);
  lines.push(`# TYPE process_start_time_seconds gauge`);
  lines.push(`process_start_time_seconds ${now}`);

  return lines.join('\n') + '\n';
}

/**
 * Create metrics router for /metrics endpoint
 */
export function createMetricsRouter(): Router {
  const router = Router();

  router.get('/metrics', (_req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(formatPrometheusMetrics());
  });

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'merchant-service' });
  });

  return router;
}

// Default router instance
export const metricsRouter = createMetricsRouter();
