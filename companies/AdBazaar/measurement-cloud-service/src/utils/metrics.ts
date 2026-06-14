import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for measurement cloud service

// HTTP request metrics
export const httpRequestDuration = new client.Histogram({
  name: 'measurement_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new client.Counter({
  name: 'measurement_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Measurement metrics
export const measurementsRecorded = new client.Counter({
  name: 'measurement_recorded_total',
  help: 'Total number of measurements recorded',
  labelNames: ['type', 'campaign_id']
});

export const measurementProcessingDuration = new client.Histogram({
  name: 'measurement_processing_duration_seconds',
  help: 'Duration of measurement processing in seconds',
  labelNames: ['type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Impression metrics
export const impressionsRecorded = new client.Counter({
  name: 'measurement_impressions_total',
  help: 'Total number of impressions recorded',
  labelNames: ['campaign_id', 'device_type', 'placement_type']
});

export const impressionViewabilityRate = new client.Gauge({
  name: 'measurement_impression_viewability_rate',
  help: 'Viewability rate of impressions',
  labelNames: ['campaign_id']
});

// Attribution metrics
export const attributionConversions = new client.Counter({
  name: 'measurement_attribution_conversions_total',
  help: 'Total number of attributed conversions',
  labelNames: ['campaign_id', 'model_type']
});

export const attributionTouchpoints = new client.Gauge({
  name: 'measurement_attribution_touchpoints',
  help: 'Number of touchpoints in attribution chain',
  labelNames: ['campaign_id']
});

// Brand safety metrics
export const brandSafetyChecks = new client.Counter({
  name: 'measurement_brand_safety_checks_total',
  help: 'Total number of brand safety checks performed',
  labelNames: ['campaign_id', 'result']
});

export const brandSafetyScore = new client.Gauge({
  name: 'measurement_brand_safety_score',
  help: 'Brand safety score for campaigns',
  labelNames: ['campaign_id']
});

// Viewability metrics
export const viewableImpressions = new client.Counter({
  name: 'measurement_viewable_impressions_total',
  help: 'Total number of viewable impressions',
  labelNames: ['campaign_id', 'standard']
});

export const viewabilityRate = new client.Gauge({
  name: 'measurement_viewability_rate',
  help: 'Viewability rate percentage',
  labelNames: ['campaign_id', 'standard']
});

// Cache metrics
export const cacheHits = new client.Counter({
  name: 'measurement_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

export const cacheMisses = new client.Counter({
  name: 'measurement_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

// Database metrics
export const dbOperationDuration = new client.Histogram({
  name: 'measurement_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Error metrics
export const errorsTotal = new client.Counter({
  name: 'measurement_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'service']
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(measurementsRecorded);
register.registerMetric(measurementProcessingDuration);
register.registerMetric(impressionsRecorded);
register.registerMetric(impressionViewabilityRate);
register.registerMetric(attributionConversions);
register.registerMetric(attributionTouchpoints);
register.registerMetric(brandSafetyChecks);
register.registerMetric(brandSafetyScore);
register.registerMetric(viewableImpressions);
register.registerMetric(viewabilityRate);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(dbOperationDuration);
register.registerMetric(errorsTotal);

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};

export default register;
