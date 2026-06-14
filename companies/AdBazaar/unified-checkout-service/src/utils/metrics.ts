import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const checkoutsCreated = new Counter({
  name: 'checkouts_created_total',
  help: 'Total number of checkouts created',
  registers: [register],
});

export const checkoutsCompleted = new Counter({
  name: 'checkouts_completed_total',
  help: 'Total number of checkouts completed',
  registers: [register],
});

export const checkoutAbandons = new Counter({
  name: 'checkouts_abandoned_total',
  help: 'Total number of checkouts abandoned',
  registers: [register],
});

export const checkoutValue = new Counter({
  name: 'checkout_value_total',
  help: 'Total value of completed checkouts',
  labelNames: ['currency'],
  registers: [register],
});

export { register };