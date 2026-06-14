import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const metadataOperationsTotal = new client.Counter({
  name: 'metadata_operations_total',
  help: 'Total metadata operations',
  labelNames: ['operation', 'status']
});

export const taxonomyEntriesGauge = new client.Gauge({
  name: 'taxonomy_entries_total',
  help: 'Total taxonomy entries',
  labelNames: ['type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(metadataOperationsTotal);
register.registerMetric(taxonomyEntriesGauge);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });
  next();
};

export const metricsRoute = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

export const recordMetadataOperation = (operation: string, status: string) => {
  metadataOperationsTotal.labels(operation, status).inc();
};

export { register };