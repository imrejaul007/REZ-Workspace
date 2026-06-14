import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
 registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const audienceTwinCreated = new client.Counter({
  name: 'audience_twin_created_total',
  help: 'Total number of audience twins created',
  labelNames: ['category'],
  registers: [register],
});

export const audienceTwinSize = new client.Gauge({
  name: 'audience_twin_size',
  help: 'Size of audience twins (number of members)',
  labelNames: ['category'],
  registers: [register],
});

export const predictionRequests = new client.Counter({
  name: 'prediction_requests_total',
  help: 'Total number of prediction requests',
  labelNames: ['action'],
  registers: [register],
});

export const hojaiTwinRequests = new client.Counter({
  name: 'hojai_twin_requests_total',
  help: 'Total number of requests to HOJAI twin service',
  labelNames: ['endpoint', 'status'],
  registers: [register],
});

export const hojaiTwinLatency = new client.Histogram({
  name: 'hojai_twin_request_duration_seconds',
  help: 'Duration of HOJAI twin service requests',
  labelNames: ['endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const qualityScoreGauge = new client.Gauge({
  name: 'audience_twin_quality_score',
  help: 'Quality score of audience twins',
  labelNames: ['category'],
  registers: [register],
});

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
};

export const metricsEndpoint = async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export default metricsMiddleware;