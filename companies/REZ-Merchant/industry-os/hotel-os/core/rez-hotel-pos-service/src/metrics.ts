import { Request, Response } from 'express';
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const transactionTotal = new client.Counter({
  name: 'pos_transactions_total',
  help: 'Total number of POS transactions',
  labelNames: ['outlet_type', 'type', 'status'],
});

export const transactionAmountTotal = new client.Counter({
  name: 'pos_transaction_amount_total',
  help: 'Total amount of POS transactions',
  labelNames: ['outlet_type', 'currency'],
  registers: [register],
});

export const folioTotal = new client.Counter({
  name: 'pos_folios_total',
  help: 'Total number of folios created',
  labelNames: ['status'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(transactionTotal);
register.registerMetric(folioTotal);

export function metricsMiddleware(req: Request, _res: Response, next: () => void): void {
  const start = process.hrtime.bigint();

  activeConnections.inc();

  req.on('close', () => {
    activeConnections.dec();
  });

  next();

  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1e9;

  const route = req.route?.path || req.path || 'unknown';
  const labels = {
    method: req.method,
    route,
    status_code: 200,
  };

  httpRequestDuration.observe(labels, duration);
  httpRequestTotal.inc(labels);
}

export function getMetricsHandler(_req: Request, res: Response): void {
  res.set('Content-Type', register.contentType);
  register.metrics().then((metrics) => {
    res.end(metrics);
  });
}

export { register };
