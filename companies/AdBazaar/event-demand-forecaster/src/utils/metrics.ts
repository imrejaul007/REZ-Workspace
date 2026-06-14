import client from 'prom-client';

// Initialize Prometheus registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'event_demand_forecaster_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});
register.registerMetric(httpRequestDuration);

// Forecast requests counter
export const forecastRequestsTotal = new client.Counter({
  name: 'event_demand_forecaster_requests_total',
  help: 'Total number of forecast requests',
  labelNames: ['type', 'status']
});
register.registerMetric(forecastRequestsTotal);

// Forecast accuracy gauge
export const forecastAccuracyGauge = new client.Gauge({
  name: 'event_demand_forecaster_accuracy',
  help: 'Current forecast accuracy percentage',
  labelNames: ['event_category', 'location']
});
register.registerMetric(forecastAccuracyGauge);

// Prediction value gauge
export const predictionGauge = new client.Gauge({
  name: 'event_demand_forecaster_predictions',
  help: 'Current predicted demand values',
  labelNames: ['event_id', 'category']
});
register.registerMetric(predictionGauge);

// Cache hit/miss counter
export const cacheOperations = new client.Counter({
  name: 'event_demand_forecaster_cache_operations_total',
  help: 'Cache operations (hits/misses)',
  labelNames: ['operation', 'result']
});
register.registerMetric(cacheOperations);

// Calibration counter
export const calibrationCounter = new client.Counter({
  name: 'event_demand_forecaster_calibrations_total',
  help: 'Total number of forecast calibrations',
  labelNames: ['event_id', 'status']
});
register.registerMetric(calibrationCounter);

// Active forecasts gauge
export const activeForecastsGauge = new client.Gauge({
  name: 'event_demand_forecaster_active_forecasts',
  help: 'Number of active forecasts',
  labelNames: ['category', 'location']
});
register.registerMetric(activeForecastsGauge);

// Database operation duration
export const dbOperationDuration = new client.Histogram({
  name: 'event_demand_forecaster_db_operation_duration_seconds',
  help: 'Duration of database operations',
  labelNames: ['operation', 'collection']
});
register.registerMetric(dbOperationDuration);

// External API call duration
export const externalApiDuration = new client.Histogram({
  name: 'event_demand_forecaster_external_api_duration_seconds',
  help: 'Duration of external API calls',
  labelNames: ['service', 'endpoint', 'status']
});
register.registerMetric(externalApiDuration);

// Export metrics
export const metrics = {
  register,
  httpRequestDuration,
  forecastRequestsTotal,
  forecastAccuracyGauge,
  predictionGauge,
  cacheOperations,
  calibrationCounter,
  activeForecastsGauge,
  dbOperationDuration,
  externalApiDuration
};

export default metrics;