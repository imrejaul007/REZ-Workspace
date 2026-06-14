/**
 * NPS Tracking Service - Prometheus Metrics
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'nps_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: 'nps_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

const npsScoreGauge = new client.Gauge({
  name: 'nps_service_score',
  help: 'Current NPS score',
  labelNames: ['customer_id', 'period'],
});
register.registerMetric(npsScoreGauge);

const surveySentCounter = new client.Counter({
  name: 'nps_service_surveys_sent_total',
  help: 'Total surveys sent',
  labelNames: ['type'],
});
register.registerMetric(surveySentCounter);

const surveyResponseCounter = new client.Counter({
  name: 'nps_service_surveys_responded_total',
  help: 'Total survey responses',
  labelNames: ['score_category'],
});
register.registerMetric(surveyResponseCounter);

const surveyResponseTime = new client.Histogram({
  name: 'nps_service_response_time_seconds',
  help: 'Time to respond to surveys',
  buckets: [3600, 7200, 14400, 28800, 43200, 86400, 172800, 259200, 604800],
});
register.registerMetric(surveyResponseTime);

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

export { register, httpRequestDuration, httpRequestsTotal, npsScoreGauge, surveySentCounter, surveyResponseCounter, surveyResponseTime };