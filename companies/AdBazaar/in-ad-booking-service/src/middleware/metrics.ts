/**
 * Prometheus metrics middleware
 */

import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry
export const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const bookingCreatedTotal = new promClient.Counter({
  name: 'booking_created_total',
  help: 'Total number of bookings created',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const bookingStatusTotal = new promClient.Counter({
  name: 'booking_status_total',
  help: 'Total number of booking status changes',
  labelNames: ['status'],
  registers: [register],
});

export const activeBookingsGauge = new promClient.Gauge({
  name: 'active_bookings',
  help: 'Number of active bookings',
  labelNames: ['status'],
  registers: [register],
});

// Metrics endpoint middleware
export function metricsMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = _req.route?.path || _req.path;
    const labels = {
      method: _req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
}

// Metrics endpoint handler
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
}