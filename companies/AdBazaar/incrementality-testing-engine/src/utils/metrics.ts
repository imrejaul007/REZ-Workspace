import client, { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for Incrementality Testing Engine

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'incrementality_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new Counter({
  name: 'incrementality_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Experiment metrics
export const experimentsTotal = new Gauge({
  name: 'incrementality_experiments_total',
  help: 'Total number of experiments',
  labelNames: ['status', 'type']
});

export const experimentActive = new Gauge({
  name: 'incrementality_experiments_active',
  help: 'Number of active experiments'
});

// Test group metrics
export const testGroupsTotal = new Gauge({
  name: 'incrementality_test_groups_total',
  help: 'Total number of test groups',
  labelNames: ['type']
});

// Lift analysis metrics
export const liftAnalysisTotal = new Counter({
  name: 'incrementality_lift_analyses_total',
  help: 'Total number of lift analyses performed',
  labelNames: ['significance']
});

export const averageLift = new Gauge({
  name: 'incrementality_average_lift_percent',
  help: 'Average lift percentage across experiments'
});

export const significantExperiments = new Gauge({
  name: 'incrementality_significant_experiments',
  help: 'Number of experiments with statistically significant lift'
});

// Result metrics
export const resultsProcessed = new Counter({
  name: 'incrementality_results_processed_total',
  help: 'Total number of results processed'
});

export const impressionsTotal = new Counter({
  name: 'incrementality_impressions_total',
  help: 'Total number of impressions tracked'
});

export const conversionsTotal = new Counter({
  name: 'incrementality_conversions_total',
  help: 'Total number of conversions tracked'
});

// Geo test metrics
export const geoTestsTotal = new Gauge({
  name: 'incrementality_geo_tests_total',
  help: 'Total number of geo tests',
  labelNames: ['status']
});

// Budget metrics
export const budgetAllocated = new Gauge({
  name: 'incrementality_budget_allocated_total',
  help: 'Total budget allocated for experiments'
});

export const budgetSpent = new Gauge({
  name: 'incrementality_budget_spent_total',
  help: 'Total budget spent on experiments'
});

// Recommendation metrics
export const recommendationsGenerated = new Counter({
  name: 'incrementality_recommendations_generated_total',
  help: 'Total number of recommendations generated',
  labelNames: ['type', 'priority']
});

// Analysis duration
export const analysisDuration = new Histogram({
  name: 'incrementality_analysis_duration_seconds',
  help: 'Duration of lift analysis in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

// Database operation metrics
export const dbOperationDuration = new Histogram({
  name: 'incrementality_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

// Redis operation metrics
export const cacheHitTotal = new Counter({
  name: 'incrementality_cache_hits_total',
  help: 'Total number of cache hits'
});

export const cacheMissTotal = new Counter({
  name: 'incrementality_cache_misses_total',
  help: 'Total number of cache misses'
});

// Export all metrics
export const metrics = {
  httpRequestDuration,
  httpRequestTotal,
  experimentsTotal,
  experimentActive,
  testGroupsTotal,
  liftAnalysisTotal,
  averageLift,
  significantExperiments,
  resultsProcessed,
  impressionsTotal,
  conversionsTotal,
  geoTestsTotal,
  budgetAllocated,
  budgetSpent,
  recommendationsGenerated,
  analysisDuration,
  dbOperationDuration,
  cacheHitTotal,
  cacheMissTotal
};

// Helper function to record HTTP request metrics
export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
) => {
  const labels = { method, route, status_code: statusCode.toString() };
  httpRequestDuration.observe(labels, duration);
  httpRequestTotal.inc(labels);
};

// Helper function to update experiment metrics
export const updateExperimentMetrics = async () => {
  // This would typically query the database to get current counts
  // For now, we'll leave this as a placeholder
};

// Export the register for use in Express
export { register as metricsRegistry };

export default metrics;