import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

// Create a custom registry
export const metricsRegistry = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// ============================================================================
// Custom Metrics
// ============================================================================

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'ptv_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [metricsRegistry],
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'ptv_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

// Bid request counter
export const bidRequestsTotal = new Counter({
  name: 'ptv_bid_requests_total',
  help: 'Total number of bid requests',
  labelNames: ['status', 'error_type'],
  registers: [metricsRegistry],
});

// Bid response time histogram
export const bidResponseTime = new Histogram({
  name: 'ptv_bid_response_time_seconds',
  help: 'Bid response processing time in seconds',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1],
  registers: [metricsRegistry],
});

// Deal metrics
export const dealsTotal = new Counter({
  name: 'ptv_deals_total',
  help: 'Total number of deals created',
  labelNames: ['type', 'status'],
  registers: [metricsRegistry],
});

export const activeDealsGauge = new Gauge({
  name: 'ptv_active_deals',
  help: 'Number of active deals',
  labelNames: ['type'],
  registers: [metricsRegistry],
});

// Seat metrics
export const seatsTotal = new Counter({
  name: 'ptv_seats_total',
  help: 'Total number of seats created',
  labelNames: ['status'],
  registers: [metricsRegistry],
});

export const activeSeatsGauge = new Gauge({
  name: 'ptv_active_seats',
  help: 'Number of active seats',
  registers: [metricsRegistry],
});

// Floor rules metrics
export const floorRulesTotal = new Counter({
  name: 'ptv_floor_rules_total',
  help: 'Total number of floor rules created',
  labelNames: ['status'],
  registers: [metricsRegistry],
});

// Bid win rate
export const bidWinRate = new Gauge({
  name: 'ptv_bid_win_rate',
  help: 'Bid win rate percentage',
  labelNames: ['deal_type'],
  registers: [metricsRegistry],
});

// Average bid price
export const avgBidPrice = new Gauge({
  name: 'ptv_avg_bid_price',
  help: 'Average bid price in USD',
  registers: [metricsRegistry],
});

// ============================================================================
// Metrics Middleware
// ============================================================================

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path;

    // Skip metrics endpoint itself
    if (path === '/metrics') return;

    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      path: path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path: path,
        status: res.statusCode,
      },
      duration
    );
  });

  next();
}

// ============================================================================
// Metrics Endpoint Handler
// ============================================================================

export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

// ============================================================================
// Metrics Reset (for testing)
// ============================================================================

export function resetMetrics(): void {
  metricsRegistry.resetMetrics();
}