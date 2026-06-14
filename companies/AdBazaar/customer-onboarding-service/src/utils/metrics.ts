/**
 * Customer Onboarding Service - Prometheus Metrics
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'onboarding_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: 'onboarding_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

const onboardingProgressGauge = new client.Gauge({
  name: 'onboarding_service_progress',
  help: 'Current onboarding progress percentage',
  labelNames: ['customer_id', 'onboarding_id'],
});
register.registerMetric(onboardingProgressGauge);

const onboardingCompletionCounter = new client.Counter({
  name: 'onboarding_service_completions_total',
  help: 'Total number of onboarding completions',
  labelNames: ['status'],
});
register.registerMetric(onboardingCompletionCounter);

const taskCompletionHistogram = new client.Histogram({
  name: 'onboarding_service_task_completion_seconds',
  help: 'Time to complete onboarding tasks',
  labelNames: ['task_category'],
  buckets: [60, 300, 600, 1800, 3600, 7200],
});
register.registerMetric(taskCompletionHistogram);

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

export { register, httpRequestDuration, httpRequestsTotal, onboardingProgressGauge, onboardingCompletionCounter, taskCompletionHistogram };