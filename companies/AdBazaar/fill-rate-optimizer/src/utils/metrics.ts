import client from 'prom-client';

// Create a registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'fill_rate_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Fill rate metrics
export const fillRateGauge = new client.Gauge({
  name: 'fill_rate_current',
  help: 'Current fill rate percentage',
  labelNames: ['inventory_id']
});

export const fillRateHistogram = new client.Histogram({
  name: 'fill_rate_distribution',
  help: 'Fill rate distribution',
  labelNames: ['inventory_id'],
  buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
});

export const impressionsCounter = new client.Counter({
  name: 'fill_rate_impressions_total',
  help: 'Total number of impressions',
  labelNames: ['inventory_id', 'status']
});

export const fillRateTrend = new client.Gauge({
  name: 'fill_rate_trend',
  help: 'Fill rate trend (positive/negative change)',
  labelNames: ['inventory_id']
});

// Optimization metrics
export const optimizationCounter = new client.Counter({
  name: 'fill_rate_optimizations_total',
  help: 'Total number of optimizations applied',
  labelNames: ['type', 'inventory_id', 'result']
});

export const alertCounter = new client.Counter({
  name: 'fill_rate_alerts_total',
  help: 'Total number of fill rate alerts triggered',
  labelNames: ['inventory_id', 'condition']
});

// Forecast metrics
export const forecastAccuracy = new client.Gauge({
  name: 'fill_rate_forecast_accuracy',
  help: 'Forecast accuracy percentage',
  labelNames: ['model']
});

// Register all metrics
register.registerMetric(fillRateGauge);
register.registerMetric(fillRateHistogram);
register.registerMetric(impressionsCounter);
register.registerMetric(fillRateTrend);
register.registerMetric(optimizationCounter);
register.registerMetric(alertCounter);
register.registerMetric(forecastAccuracy);
register.registerMetric(httpRequestDuration);

// Metrics object for export
export const metrics = {
  register,
  fillRateGauge,
  fillRateHistogram,
  impressionsCounter,
  fillRateTrend,
  optimizationCounter,
  alertCounter,
  forecastAccuracy,
  httpRequestDuration
};

export default metrics;