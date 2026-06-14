import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics for MMM service

// Request counters
export const httpRequestsTotal = new Counter({
  name: 'mmm_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// Request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'mmm_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Model training metrics
export const modelTrainingTotal = new Counter({
  name: 'mmm_model_training_total',
  help: 'Total number of model training runs',
  labelNames: ['status'],
  registers: [register]
});

export const modelTrainingDuration = new Histogram({
  name: 'mmm_model_training_duration_seconds',
  help: 'Duration of model training in seconds',
  buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800],
  registers: [register]
});

// Model metrics
export const modelRSquared = new Gauge({
  name: 'mmm_model_r_squared',
  help: 'R-squared value of trained models',
  labelNames: ['model_id'],
  registers: [register]
});

export const activeModelsGauge = new Gauge({
  name: 'mmm_active_models',
  help: 'Number of active MMM models',
  registers: [register]
});

// Channel metrics
export const channelSpendGauge = new Gauge({
  name: 'mmm_channel_spend_total',
  help: 'Total spend across all channels',
  registers: [register]
});

// Attribution metrics
export const attributionRequestsTotal = new Counter({
  name: 'mmm_attribution_requests_total',
  help: 'Total number of attribution requests',
  registers: [register]
});

// Optimization metrics
export const optimizationRequestsTotal = new Counter({
  name: 'mmm_optimization_requests_total',
  help: 'Total number of optimization requests',
  registers: [register]
});

// Scenario metrics
export const scenarioRequestsTotal = new Counter({
  name: 'mmm_scenario_requests_total',
  help: 'Total number of scenario requests',
  registers: [register]
});

// Database metrics
export const dbOperationDuration = new Histogram({
  name: 'mmm_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

// Redis metrics
export const cacheHitTotal = new Counter({
  name: 'mmm_cache_hit_total',
  help: 'Total number of cache hits',
  registers: [register]
});

export const cacheMissTotal = new Counter({
  name: 'mmm_cache_miss_total',
  help: 'Total number of cache misses',
  registers: [register]
});

export default {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  modelTrainingTotal,
  modelTrainingDuration,
  modelRSquared,
  activeModelsGauge,
  channelSpendGauge,
  attributionRequestsTotal,
  optimizationRequestsTotal,
  scenarioRequestsTotal,
  dbOperationDuration,
  cacheHitTotal,
  cacheMissTotal
};