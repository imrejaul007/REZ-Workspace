import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import config from '../config';

// Initialize Prometheus metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new client.Counter({
  name: `${config.metrics.prefix}_http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: `${config.metrics.prefix}_http_request_duration_seconds`,
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register],
});

const sponsoredProductsTotal = new client.Gauge({
  name: `${config.metrics.prefix}_sponsored_products_total`,
  help: 'Total number of sponsored products',
  labelNames: ['status'],
  registers: [register],
});

const activeBidsTotal = new client.Counter({
  name: `${config.metrics.prefix}_active_bids_total`,
  help: 'Total number of active bids placed',
  registers: [register],
});

const bidAmountTotal = new client.Counter({
  name: `${config.metrics.prefix}_bid_amount_total`,
  help: 'Total bid amount in smallest currency unit',
  registers: [register],
});

const impressionsTotal = new client.Counter({
  name: `${config.metrics.prefix}_impressions_total`,
  help: 'Total number of ad impressions',
  labelNames: ['merchant_id'],
  registers: [register],
});

const clicksTotal = new client.Counter({
  name: `${config.metrics.prefix}_clicks_total`,
  help: 'Total number of ad clicks',
  labelNames: ['merchant_id'],
  registers: [register],
});

const ordersTotal = new client.Counter({
  name: `${config.metrics.prefix}_orders_total`,
  help: 'Total number of ad-attributed orders',
  labelNames: ['merchant_id'],
  registers: [register],
});

const revenueTotal = new client.Counter({
  name: `${config.metrics.prefix}_revenue_total`,
  help: 'Total ad-attributed revenue in smallest currency unit',
  labelNames: ['merchant_id'],
  registers: [register],
});

const budgetSpentTotal = new client.Counter({
  name: `${config.metrics.prefix}_budget_spent_total`,
  help: 'Total budget spent in smallest currency unit',
  labelNames: ['merchant_id'],
  registers: [register],
});

// Search latency histogram
const searchLatency = new client.Histogram({
  name: `${config.metrics.prefix}_search_latency_seconds`,
  help: 'Search operation latency in seconds',
  labelNames: ['type'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/**
 * Middleware to track request metrics
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture metrics
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    // Skip metrics endpoint itself
    if (req.path !== '/metrics') {
      httpRequestsTotal.inc({
        method: req.method,
        route: route,
        status_code: res.statusCode,
      });

      httpRequestDuration.observe(
        {
          method: req.method,
          route: route,
          status_code: res.statusCode,
        },
        duration
      );
    }

    return originalEnd.call(this, chunk, encoding, callback);
  } as typeof res.end;

  next();
}

/**
 * Get metrics endpoint handler
 */
export async function getMetrics(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(String(error));
  }
}

/**
 * Update sponsored products gauge
 */
export function updateSponsoredProductsGauge(statusCounts: Record<string, number>): void {
  for (const [status, count] of Object.entries(statusCounts)) {
    sponsoredProductsTotal.set({ status }, count);
  }
}

/**
 * Record a bid event
 */
export function recordBid(amount: number): void {
  activeBidsTotal.inc();
  bidAmountTotal.inc(amount);
}

/**
 * Record impression
 */
export function recordImpression(merchantId: string): void {
  impressionsTotal.inc({ merchant_id: merchantId });
}

/**
 * Record click
 */
export function recordClick(merchantId: string): void {
  clicksTotal.inc({ merchant_id: merchantId });
}

/**
 * Record order
 */
export function recordOrder(merchantId: string, amount: number): void {
  ordersTotal.inc({ merchant_id: merchantId });
  revenueTotal.inc({ merchant_id: merchantId }, amount);
}

/**
 * Record budget spent
 */
export function recordBudgetSpent(merchantId: string, amount: number): void {
  budgetSpentTotal.inc({ merchant_id: merchantId }, amount);
}

/**
 * Record search latency
 */
export function recordSearchLatency(type: string, durationMs: number): void {
  searchLatency.observe({ type }, durationMs / 1000);
}

// Export register for external use
export { register };

export default {
  metricsMiddleware,
  getMetrics,
  updateSponsoredProductsGauge,
  recordBid,
  recordImpression,
  recordClick,
  recordOrder,
  recordBudgetSpent,
  recordSearchLatency,
  register,
};