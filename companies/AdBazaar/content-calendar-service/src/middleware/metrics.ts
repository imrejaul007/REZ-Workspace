import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';
import { config } from '../config/index.js';
import { logRequest } from '../utils/logger.js';

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const calendarEventsTotal = new promClient.Gauge({
  name: 'calendar_events_total',
  help: 'Total number of calendar events',
  labelNames: ['status'],
});

export const calendarApiDuration = new promClient.Histogram({
  name: 'calendar_api_duration_seconds',
  help: 'Duration of calendar API calls in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(calendarEventsTotal);
register.registerMetric(calendarApiDuration);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
    logRequest(req, res, Date.now() - startTime);
  });

  next();
}

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export { register as prometheusRegister };
