import client from 'prom-client';

// Initialize Prometheus client
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for yield platform

// HTTP request metrics
export const httpRequestDuration = new client.Histogram({
  name: 'yield_platform_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new client.Counter({
  name: 'yield_platform_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Yield metrics
export const yieldRevenue = new client.Counter({
  name: 'yield_platform_revenue_total',
  help: 'Total revenue generated',
  labelNames: ['inventory_type', 'strategy']
});

export const yieldEcpm = new client.Gauge({
  name: 'yield_platform_ecpm_current',
  help: 'Current eCPM value',
  labelNames: ['inventory_type']
});

export const yieldFillRate = new client.Gauge({
  name: 'yield_platform_fill_rate_current',
  help: 'Current fill rate percentage',
  labelNames: ['inventory_type']
});

export const yieldImpressions = new client.Counter({
  name: 'yield_platform_impressions_total',
  help: 'Total impressions processed',
  labelNames: ['inventory_type', 'demand_source']
});

// Optimization metrics
export const optimizationAttempts = new client.Counter({
  name: 'yield_platform_optimization_attempts_total',
  help: 'Total optimization attempts',
  labelNames: ['strategy', 'outcome']
});

export const optimizationDuration = new client.Histogram({
  name: 'yield_platform_optimization_duration_seconds',
  help: 'Duration of optimization runs',
  labelNames: ['strategy'],
  buckets: [1, 5, 10, 30, 60, 120]
});

// Forecast metrics
export const forecastAccuracy = new client.Gauge({
  name: 'yield_platform_forecast_accuracy',
  help: 'Forecast accuracy percentage',
  labelNames: ['horizon']
});

// Recommendation metrics
export const recommendationsGenerated = new client.Counter({
  name: 'yield_platform_recommendations_total',
  help: 'Total recommendations generated',
  labelNames: ['type', 'priority']
});

// Backtest metrics
export const backtestRuns = new client.Counter({
  name: 'yield_platform_backtest_runs_total',
  help: 'Total backtest runs',
  labelNames: ['strategy', 'status']
});

export const backtestDuration = new client.Histogram({
  name: 'yield_platform_backtest_duration_seconds',
  help: 'Duration of backtest runs',
  labelNames: ['strategy'],
  buckets: [10, 30, 60, 120, 300, 600]
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(yieldRevenue);
register.registerMetric(yieldEcpm);
register.registerMetric(yieldFillRate);
register.registerMetric(yieldImpressions);
register.registerMetric(optimizationAttempts);
register.registerMetric(optimizationDuration);
register.registerMetric(forecastAccuracy);
register.registerMetric(recommendationsGenerated);
register.registerMetric(backtestRuns);
register.registerMetric(backtestDuration);

// Export register for metrics endpoint
export { register };

// Helper to set gauge values
export const setYieldMetrics = (inventoryType: string, data: {
  ecpm?: number;
  fillRate?: number;
}) => {
  if (data.ecpm !== undefined) {
    yieldEcpm.labels(inventoryType).set(data.ecpm);
  }
  if (data.fillRate !== undefined) {
    yieldFillRate.labels(inventoryType).set(data.fillRate);
  }
};

// Helper to track revenue
export const trackRevenue = (inventoryType: string, strategy: string, amount: number) => {
  yieldRevenue.labels(inventoryType, strategy).inc(amount);
};

// Helper to track impressions
export const trackImpressions = (inventoryType: string, demandSource: string, count: number) => {
  yieldImpressions.labels(inventoryType, demandSource).inc(count);
};