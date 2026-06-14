import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for Lift Study Service
export const httpRequestDuration = new client.Histogram({
  name: 'lift_study_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestTotal = new client.Counter({
  name: 'lift_study_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const studiesCreatedTotal = new client.Counter({
  name: 'lift_study_studies_created_total',
  help: 'Total number of lift studies created',
  labelNames: ['type']
});

export const studiesCompletedTotal = new client.Counter({
  name: 'lift_study_studies_completed_total',
  help: 'Total number of lift studies completed',
  labelNames: ['type']
});

export const brandLiftCalculationsTotal = new client.Counter({
  name: 'lift_study_brand_lift_calculations_total',
  help: 'Total number of brand lift calculations',
  labelNames: ['metric_type']
});

export const conversionLiftCalculationsTotal = new client.Counter({
  name: 'lift_study_conversion_lift_calculations_total',
  help: 'Total number of conversion lift calculations'
});

export const surveyResponsesTotal = new client.Counter({
  name: 'lift_study_survey_responses_total',
  help: 'Total number of survey responses collected',
  labelNames: ['study_type']
});

export const activeStudiesGauge = new client.Gauge({
  name: 'lift_study_active_studies',
  help: 'Number of currently active lift studies',
  labelNames: ['type']
});

export const analysisDuration = new client.Histogram({
  name: 'lift_study_analysis_duration_seconds',
  help: 'Duration of lift analysis computations',
  labelNames: ['analysis_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(studiesCreatedTotal);
register.registerMetric(studiesCompletedTotal);
register.registerMetric(brandLiftCalculationsTotal);
register.registerMetric(conversionLiftCalculationsTotal);
register.registerMetric(surveyResponsesTotal);
register.registerMetric(activeStudiesGauge);
register.registerMetric(analysisDuration);

// Middleware to track request metrics
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });

  next();
};

export default register;
