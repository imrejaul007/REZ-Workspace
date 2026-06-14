import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// HTTP request metrics
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

// Business metrics
export const testsCreated = new Counter({
  name: 'tests_created_total',
  help: 'Total number of tests created',
  registers: [register],
});

export const testsStarted = new Counter({
  name: 'tests_started_total',
  help: 'Total number of tests started',
  registers: [register],
});

export const activeTests = new Gauge({
  name: 'active_tests',
  help: 'Number of currently active tests',
  registers: [register],
});

export const variantImpressions = new Counter({
  name: 'variant_impressions_total',
  help: 'Total number of variant impressions',
  labelNames: ['test_id', 'variant_id'],
  registers: [register],
});

export const variantConversions = new Counter({
  name: 'variant_conversions_total',
  help: 'Total number of variant conversions',
  labelNames: ['test_id', 'variant_id'],
  registers: [register],
});

export const testDuration = new Histogram({
  name: 'test_duration_seconds',
  help: 'Duration of tests in seconds',
  labelNames: ['test_id'],
  buckets: [3600, 7200, 14400, 28800, 86400, 604800], // 1h, 2h, 4h, 8h, 24h, 7d
  registers: [register],
});

export { register };
