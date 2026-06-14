/**
 * Customer Health Score Service - Prometheus Metrics
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'health_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: 'health_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

const healthScoreGauge = new client.Gauge({
  name: 'health_service_customer_health_score',
  help: 'Current customer health score',
  labelNames: ['customer_id'],
});
register.registerMetric(healthScoreGauge);

const alertCountGauge = new client.Gauge({
  name: 'health_service_active_alerts',
  help: 'Number of active health alerts',
  labelNames: ['severity', 'customer_id'],
});
register.registerMetric(alertCountGauge);

const calculationDuration = new client.Histogram({
  name: 'health_service_calculation_duration_seconds',
  help: 'Duration of health score calculations',
  labelNames: ['customer_id'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});
register.registerMetric(calculationDuration);

/**
 * Metrics middleware to track request duration
 */
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

/**
 * Metrics endpoint handler
 */
export async function metricsEndpoint(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
}

export { register, httpRequestDuration, httpRequestsTotal, healthScoreGauge, alertCountGauge, calculationDuration };
