/**
 * Churn Prediction Service - Prometheus Metrics
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'churn_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: 'churn_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

const churnRiskGauge = new client.Gauge({
  name: 'churn_service_risk_score',
  help: 'Customer churn risk score',
  labelNames: ['customer_id', 'risk_level'],
});
register.registerMetric(churnRiskGauge);

const predictionsCounter = new client.Counter({
  name: 'churn_service_predictions_total',
  help: 'Total churn predictions made',
  labelNames: ['risk_level'],
});
register.registerMetric(predictionsCounter);

const predictionConfidence = new client.Histogram({
  name: 'churn_service_prediction_confidence',
  help: 'Confidence of churn predictions',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
});
register.registerMetric(predictionConfidence);

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

export { register, httpRequestDuration, httpRequestsTotal, churnRiskGauge, predictionsCounter, predictionConfidence };