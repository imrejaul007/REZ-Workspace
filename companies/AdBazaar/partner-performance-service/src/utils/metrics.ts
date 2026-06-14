import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';

const register = new Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'partner_performance_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'partner_performance_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const reportsGenerated = new Counter({
  name: 'partner_performance_reports_generated_total',
  help: 'Total reports generated',
  labelNames: ['type', 'status'],
  registers: [register],
});

const metricsRecorded = new Counter({
  name: 'partner_performance_metrics_recorded_total',
  help: 'Total metrics recorded',
  labelNames: ['type'],
  registers: [register],
});

const avgPerformanceScore = new Gauge({
  name: 'partner_performance_avg_score',
  help: 'Average partner performance score',
  registers: [register],
});

function normalizePath(path: string): string {
  return path
    .replace(/\/api\/performance\/[^/]+/, '/api/performance/:partnerId')
    .replace(/\/api\/reports\/[^/]+/, '/api/reports/:id')
    .replace(/\/api\/metrics\/[^/]+/, '/api/metrics/:id');
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  if (req.path === '/metrics') { next(); return; }

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const normalizedPath = normalizePath(req.path);
    httpRequestsTotal.inc({ method: req.method, path: normalizedPath, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: normalizedPath, status: res.statusCode }, duration);
  });
  next();
}

export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error generating metrics');
  }
}

export function recordReport(type: string, status: string): void {
  reportsGenerated.inc({ type, status });
}

export function recordMetric(type: string): void {
  metricsRecorded.inc({ type });
}

export function setAvgScore(score: number): void {
  avgPerformanceScore.set(score);
}

export { register };