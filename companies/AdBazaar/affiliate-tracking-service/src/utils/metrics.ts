import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request metrics
const httpRequestsTotal = new Counter({
  name: 'affiliate_tracking_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'affiliate_tracking_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Business metrics
const affiliatesTotal = new Gauge({
  name: 'affiliate_tracking_affiliates_total',
  help: 'Total number of affiliates',
  labelNames: ['status'],
  registers: [register],
});

const conversionsTotal = new Counter({
  name: 'affiliate_tracking_conversions_total',
  help: 'Total number of conversions',
  labelNames: ['type', 'status'],
  registers: [register],
});

const commissionTotal = new Counter({
  name: 'affiliate_tracking_commission_total',
  help: 'Total commission amount',
  labelNames: ['currency'],
  registers: [register],
});

const commissionPending = new Gauge({
  name: 'affiliate_tracking_commission_pending',
  help: 'Pending commission amount',
  labelNames: ['currency'],
  registers: [register],
});

const payoutsTotal = new Counter({
  name: 'affiliate_tracking_payouts_total',
  help: 'Total payout amount',
  labelNames: ['currency', 'status'],
  registers: [register],
});

// Conversion rate histogram
const conversionRate = new Histogram({
  name: 'affiliate_tracking_conversion_rate',
  help: 'Conversion rate distribution',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

/**
 * Normalize path to avoid high cardinality
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/api\/affiliates\/[^/]+/, '/api/affiliates/:id')
    .replace(/\/api\/conversions\/[^/]+/, '/api/conversions/:id')
    .replace(/\/api\/commissions\/[^/]+/, '/api/commissions/:id')
    .replace(/\/api\/payouts\/[^/]+/, '/api/payouts/:id');
}

/**
 * Metrics middleware - tracks request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    next();
    return;
  }

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const normalizedPath = normalizePath(req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path: normalizedPath,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path: normalizedPath,
        status: res.statusCode,
      },
      duration
    );
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error generating metrics');
  }
}

// Helper functions to record business metrics
export function recordAffiliate(status: string): void {
  affiliatesTotal.inc({ status });
}

export function recordConversion(type: string, status: string): void {
  conversionsTotal.inc({ type, status });
}

export function recordCommission(amount: number, currency: string = 'INR'): void {
  commissionTotal.inc({ currency }, amount);
}

export function setPendingCommission(amount: number, currency: string = 'INR'): void {
  commissionPending.set({ currency }, amount);
}

export function recordPayout(amount: number, currency: string, status: string): void {
  payoutsTotal.inc({ currency, status }, amount);
}

export function recordConversionRate(rate: number): void {
  conversionRate.observe(rate);
}

export { register };