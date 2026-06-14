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

export const experimentsCreated = new Counter({
  name: 'experiments_created_total',
  help: 'Total number of experiments created',
  registers: [register],
});

export const activeExperiments = new Gauge({
  name: 'active_experiments',
  help: 'Number of currently active experiments',
  registers: [register],
});

export const enrollments = new Counter({
  name: 'experiment_enrollments_total',
  help: 'Total number of user enrollments',
  labelNames: ['experiment_id'],
  registers: [register],
});

export const metricsTracked = new Counter({
  name: 'metrics_tracked_total',
  help: 'Total number of metrics tracked',
  labelNames: ['experiment_id', 'metric_name'],
  registers: [register],
});

export { register };