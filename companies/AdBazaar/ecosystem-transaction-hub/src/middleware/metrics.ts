import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import config from '../config';

const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: `${config.metrics.prefix}_http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: `${config.metrics.prefix}_http_request_duration_seconds`,
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const transactionsTotal = new Counter({
  name: `${config.metrics.prefix}_transactions_total`,
  help: 'Total number of transactions',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const transactionsAmount = new Histogram({
  name: `${config.metrics.prefix}_transactions_amount`,
  help: 'Transaction amounts',
  labelNames: ['type', 'currency'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000],
  registers: [register],
});

export const activeTransactions = new Gauge({
  name: `${config.metrics.prefix}_active_transactions`,
  help: 'Number of active transactions',
  labelNames: ['status'],
  registers: [register],
});

export const paymentProcessingDuration = new Histogram({
  name: `${config.metrics.prefix}_payment_processing_duration_seconds`,
  help: 'Payment processing duration in seconds',
  labelNames: ['payment_method', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const cacheHits = new Counter({
  name: `${config.metrics.prefix}_cache_hits_total`,
  help: 'Total number of cache hits',
  registers: [register],
});

export const cacheMisses = new Counter({
  name: `${config.metrics.prefix}_cache_misses_total`,
  help: 'Total number of cache misses',
  registers: [register],
});

export const externalApiCalls = new Counter({
  name: `${config.metrics.prefix}_external_api_calls_total`,
  help: 'Total number of external API calls',
  labelNames: ['service', 'status'],
  registers: [register],
});

// Metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode.toString(),
      },
      duration
    );
  });

  next();
}

// Metrics endpoint handler
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
}

export { register };
export default register;