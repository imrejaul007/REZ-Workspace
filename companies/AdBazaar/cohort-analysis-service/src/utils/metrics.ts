import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const cohortAnalysisDuration = new client.Histogram({
  name: 'cohort_analysis_duration_seconds',
  help: 'Duration of cohort analysis in seconds',
  labelNames: ['cohort_type', 'size']
});

export const cohortAnalysisTotal = new client.Counter({
  name: 'cohort_analysis_total',
  help: 'Total number of cohort analyses performed',
  labelNames: ['cohort_type', 'status']
});

export const segmentOperations = new client.Counter({
  name: 'segment_operations_total',
  help: 'Total number of segment operations',
  labelNames: ['operation', 'type']
});

export const comparisonDuration = new client.Histogram({
  name: 'cohort_comparison_duration_seconds',
  help: 'Duration of cohort comparisons',
  labelNames: ['cohort_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(cohortAnalysisDuration);
register.registerMetric(cohortAnalysisTotal);
register.registerMetric(segmentOperations);
register.registerMetric(comparisonDuration);

export { register };

export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
};

export default {
  register,
  metricsMiddleware,
  httpRequestDuration,
  httpRequestTotal,
  cohortAnalysisDuration,
  cohortAnalysisTotal,
  segmentOperations,
  comparisonDuration
};