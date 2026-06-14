import { Request, Response, NextFunction } from 'express';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { config } from '../config/index.js';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register, prefix: config.metrics.prefix });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: `${config.metrics.prefix}http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: `${config.metrics.prefix}http_request_duration_seconds`,
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const inviteTotal = new Counter({
  name: `${config.metrics.prefix}invites_total`,
  help: 'Total number of invites created',
  labelNames: ['deal_type'],
  registers: [register],
});

const inviteAcceptedTotal = new Counter({
  name: `${config.metrics.prefix}invites_accepted_total`,
  help: 'Total number of invites accepted',
  labelNames: ['deal_type'],
  registers: [register],
});

const inviteDeclinedTotal = new Counter({
  name: `${config.metrics.prefix}invites_declined_total`,
  help: 'Total number of invites declined',
  labelNames: ['deal_type'],
  registers: [register],
});

const inviteExpiredTotal = new Counter({
  name: `${config.metrics.prefix}invites_expired_total`,
  help: 'Total number of invites expired',
  registers: [register],
});

const activeInvitesGauge = new Gauge({
  name: `${config.metrics.prefix}active_invites`,
  help: 'Number of active (pending) invites',
  labelNames: ['deal_type'],
  registers: [register],
});

const dealsTotal = new Gauge({
  name: `${config.metrics.prefix}deals_total`,
  help: 'Total number of accepted deals',
  labelNames: ['deal_type'],
  registers: [register],
});

/**
 * Metrics collection middleware
 */
export function metricsMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;

    const path = normalizePath(_req.path);
    const labels = {
      method: _req.method,
      path,
      status: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
}

/**
 * Normalize path to avoid high cardinality
 */
function normalizePath(path: string): string {
  // Replace dynamic segments with placeholders
  return path
    .replace(/\/[a-f0-9-]{36}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-zA-Z0-9]{8,}/g, '/:id');
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
}

/**
 * Get Prometheus registry
 */
export function getRegistry(): Registry {
  return register;
}

/**
 * Record invite created
 */
export function recordInviteCreated(dealType: string): void {
  inviteTotal.labels(dealType).inc();
  activeInvitesGauge.labels(dealType).inc();
}

/**
 * Record invite accepted
 */
export function recordInviteAccepted(dealType: string): void {
  inviteAcceptedTotal.labels(dealType).inc();
  activeInvitesGauge.labels(dealType).dec();
  dealsTotal.labels(dealType).inc();
}

/**
 * Record invite declined
 */
export function recordInviteDeclined(dealType: string): void {
  inviteDeclinedTotal.labels(dealType).inc();
  activeInvitesGauge.labels(dealType).dec();
}

/**
 * Record invite expired
 */
export function recordInviteExpired(): void {
  inviteExpiredTotal.inc();
}

/**
 * Update deals gauge
 */
export function updateDealsGauge(dealType: string, count: number): void {
  dealsTotal.labels(dealType).set(count);
}

/**
 * Update active invites gauge
 */
export function updateActiveInvitesGauge(dealType: string, count: number): void {
  activeInvitesGauge.labels(dealType).set(count);
}