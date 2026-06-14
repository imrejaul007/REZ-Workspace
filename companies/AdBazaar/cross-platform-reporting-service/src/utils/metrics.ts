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

export const reportGenerationDuration = new client.Histogram({
  name: 'report_generation_duration_seconds',
  help: 'Duration of report generation in seconds',
  labelNames: ['report_type', 'source']
});

export const reportGenerationTotal = new client.Counter({
  name: 'report_generation_total',
  help: 'Total number of reports generated',
  labelNames: ['report_type', 'status']
});

export const dataSourceQueries = new client.Counter({
  name: 'datasource_queries_total',
  help: 'Total number of data source queries',
  labelNames: ['source', 'status']
});

export const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(reportGenerationDuration);
register.registerMetric(reportGenerationTotal);
register.registerMetric(dataSourceQueries);
register.registerMetric(cacheHits);

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
  reportGenerationDuration,
  reportGenerationTotal,
  dataSourceQueries,
  cacheHits
};