import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for geo-experiment-service

// Request counter
export const httpRequestsTotal = new Counter({
  name: 'geo_experiment_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// Request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'geo_experiment_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register]
});

// Active experiments gauge
export const activeExperiments = new Gauge({
  name: 'geo_experiment_active_experiments',
  help: 'Number of active experiments',
  registers: [register]
});

// Markets per experiment gauge
export const marketsPerExperiment = new Gauge({
  name: 'geo_experiment_markets_total',
  help: 'Total number of markets across all experiments',
  labelNames: ['type'], // treatment or control
  registers: [register]
});

// Experiment results histogram
export const experimentLift = new Histogram({
  name: 'geo_experiment_lift_percent',
  help: 'Experiment lift percentage',
  labelNames: ['status'],
  buckets: [-50, -30, -10, 0, 10, 20, 30, 50, 100],
  registers: [register]
});

// Database operation duration
export const dbOperationDuration = new Histogram({
  name: 'geo_experiment_db_operation_duration_seconds',
  help: 'Database operation duration in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
});

// Redis operation duration
export const redisOperationDuration = new Histogram({
  name: 'geo_experiment_redis_operation_duration_seconds',
  help: 'Redis operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05],
  registers: [register]
});

// Error counter
export const errorsTotal = new Counter({
  name: 'geo_experiment_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint'],
  registers: [register]
});

// Confidence level histogram
export const confidenceLevel = new Histogram({
  name: 'geo_experiment_confidence_level',
  help: 'Experiment confidence level',
  buckets: [0.8, 0.85, 0.9, 0.95, 0.99],
  registers: [register]
});

// Helper function to track request metrics
export const trackRequest = (
  method: string,
  route: string,
  status: number,
  duration: number
) => {
  httpRequestsTotal.inc({ method, route, status: Math.floor(status / 100) * 100 });
  httpRequestDuration.observe({ method, route, status: Math.floor(status / 100) * 100 }, duration);
};

// Helper function to track DB operations
export const trackDbOperation = (operation: string, collection: string, duration: number) => {
  dbOperationDuration.observe({ operation, collection }, duration);
};

// Helper function to track Redis operations
export const trackRedisOperation = (operation: string, duration: number) => {
  redisOperationDuration.observe({ operation }, duration);
};

export default {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeExperiments,
  marketsPerExperiment,
  experimentLift,
  dbOperationDuration,
  redisOperationDuration,
  errorsTotal,
  confidenceLevel,
  trackRequest,
  trackDbOperation,
  trackRedisOperation
};