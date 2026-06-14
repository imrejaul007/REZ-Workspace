import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for the service
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const authenticityChecksTotal = new client.Counter({
  name: 'authenticity_checks_total',
  help: 'Total number of authenticity checks performed',
  labelNames: ['platform', 'risk_level'],
  registers: [register],
});

export const authenticityCheckDuration = new client.Histogram({
  name: 'authenticity_check_duration_seconds',
  help: 'Duration of authenticity checks in seconds',
  labelNames: ['platform'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const activeAlertsGauge = new client.Gauge({
  name: 'active_alerts_total',
  help: 'Current number of active alerts',
  registers: [register],
});

export const influencerProfilesGauge = new client.Gauge({
  name: 'influencer_profiles_total',
  help: 'Current number of tracked influencer profiles',
  labelNames: ['platform'],
  registers: [register],
});

export const batchChecksSize = new client.Histogram({
  name: 'batch_checks_size',
  help: 'Size of batch authenticity checks',
  buckets: [1, 5, 10, 25, 50, 100],
  registers: [register],
});