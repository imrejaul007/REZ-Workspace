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

export const abandonedCarts = new Counter({
  name: 'abandoned_carts_total',
  help: 'Total number of abandoned carts',
  registers: [register],
});

export const recoveryAttempts = new Counter({
  name: 'recovery_attempts_total',
  help: 'Total number of recovery attempts',
  labelNames: ['channel'],
  registers: [register],
});

export const successfulRecoveries = new Counter({
  name: 'successful_recoveries_total',
  help: 'Total number of successful cart recoveries',
  registers: [register],
});

export const recoveryRate = new Gauge({
  name: 'cart_recovery_rate',
  help: 'Cart recovery rate percentage',
  registers: [register],
});

export { register };