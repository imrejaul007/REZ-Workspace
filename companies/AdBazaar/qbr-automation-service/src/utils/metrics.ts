/**
 * QBR Automation Service - Prometheus Metrics
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'qbr_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: 'qbr_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

const qbrCompletionCounter = new client.Counter({
  name: 'qbr_service_completions_total',
  help: 'Total QBR completions',
  labelNames: ['status'],
});
register.registerMetric(qbrCompletionCounter);

const reportGenerationDuration = new client.Histogram({
  name: 'qbr_service_report_generation_seconds',
  help: 'Time to generate QBR reports',
  buckets: [1, 5, 10, 30, 60, 120, 300],
});
register.registerMetric(reportGenerationDuration);

const scheduledQbrsGauge = new client.Gauge({
  name: 'qbr_service_scheduled_qbrs',
  help: 'Number of scheduled QBRs',
  labelNames: ['quarter', 'status'],
});
register.registerMetric(scheduledQbrsGauge);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });

  next();
}

export async function metricsEndpoint(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
}

export { register, httpRequestDuration, httpRequestsTotal, qbrCompletionCounter, reportGenerationDuration, scheduledQbrsGauge };