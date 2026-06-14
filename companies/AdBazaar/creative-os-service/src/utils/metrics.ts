import promClient from 'prom-client';

// Create a Registry
export const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// HTTP Request Duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// HTTP Request Counter
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// HTTP Errors Counter
export const httpErrorsTotal = new promClient.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['endpoint', 'method']
});

// Creative metrics
export const creativeOperationsTotal = new promClient.Counter({
  name: 'creative_operations_total',
  help: 'Total creative operations',
  labelNames: ['operation', 'status']
});

export const creativeGenerationDuration = new promClient.Histogram({
  name: 'creative_generation_duration_seconds',
  help: 'Duration of creative generation operations',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

export const predictionRequestsTotal = new promClient.Counter({
  name: 'prediction_requests_total',
  help: 'Total prediction requests',
  labelNames: ['model_version', 'status']
});

export const predictionConfidence = new promClient.Gauge({
  name: 'prediction_confidence_score',
  help: 'Average prediction confidence score',
  labelNames: ['creative_type']
});

export const variationTestsTotal = new promClient.Gauge({
  name: 'variation_tests_total',
  help: 'Total number of active variation tests',
  labelNames: ['test_type', 'status']
});

export const optimizationImprovements = new promClient.Gauge({
  name: 'optimization_improvement_percentage',
  help: 'Average optimization improvement percentage',
  labelNames: ['goal']
});

// Business metrics
export const activeCreativesGauge = new promClient.Gauge({
  name: 'active_creatives_count',
  help: 'Number of active creatives'
});

export const creativeTypesGauge = new promClient.Gauge({
  name: 'creative_types_count',
  help: 'Number of creatives by type',
  labelNames: ['type']
});

export const templateUsageCounter = new promClient.Counter({
  name: 'template_usage_total',
  help: 'Total template usage count',
  labelNames: ['template_id', 'category']
});

// Export metrics object for easy access
export const metrics = {
  httpRequestDuration,
  httpRequestsTotal,
  httpErrorsTotal,
  creativeOperationsTotal,
  creativeGenerationDuration,
  predictionRequestsTotal,
  predictionConfidence,
  variationTestsTotal,
  optimizationImprovements,
  activeCreativesGauge,
  creativeTypesGauge,
  templateUsageCounter
};