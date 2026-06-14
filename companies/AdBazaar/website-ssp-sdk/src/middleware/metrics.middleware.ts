import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge } from 'prom-client';
import { config } from '../config/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('MetricsMiddleware');

// Initialize default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register: client.register });

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [client.register],
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [client.register],
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [client.register],
});

// SDK specific metrics
export const sdkImpressionsTotal = new Counter({
  name: 'sdk_impressions_total',
  help: 'Total number of ad impressions tracked',
  labelNames: ['publisher_id', 'placement_id'],
  registers: [client.register],
});

export const sdkClicksTotal = new Counter({
  name: 'sdk_clicks_total',
  help: 'Total number of ad clicks tracked',
  labelNames: ['publisher_id', 'placement_id'],
  registers: [client.register],
});

export const sdkEarningsTotal = new Counter({
  name: 'sdk_earnings_total',
  help: 'Total earnings generated in cents',
  labelNames: ['publisher_id'],
  registers: [client.register],
});

export const publishersTotal = new Gauge({
  name: 'publishers_total',
  help: 'Total number of registered publishers',
  labelNames: ['status'],
  registers: [client.register],
});

export const placementsTotal = new Gauge({
  name: 'placements_total',
  help: 'Total number of ad placements',
  labelNames: ['status'],
  registers: [client.register],
});

// Middleware to track HTTP requests
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!config.metrics.enabled) {
    next();
    return;
  }

  const startTime = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = normalizePath(req.path);

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

    activeConnections.dec();
  });

  next();
}

// Normalize path to avoid high cardinality
function normalizePath(path: string): string {
  return path
    .replace(/\/api\/sdk\/config\/[^/]+/, '/api/sdk/config/:publisherId')
    .replace(/\/api\/sdk\/placement\/[^/]+/, '/api/sdk/placement/:placementId')
    .replace(/\/api\/sdk\/publisher\/[^/]+/, '/api/sdk/publisher/:id');
}

// Endpoint for Prometheus to scrape metrics
export async function getMetrics(): Promise<string> {
  return client.register.metrics();
}

export function getContentType(): string {
  return client.register.contentType;
}