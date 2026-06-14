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

export const reportBuildDuration = new client.Histogram({
  name: 'report_build_duration_seconds',
  help: 'Duration of report building in seconds',
  labelNames: ['widget_count', 'complexity']
});

export const widgetOperations = new client.Counter({
  name: 'widget_operations_total',
  help: 'Total number of widget operations',
  labelNames: ['operation', 'type']
});

export const layoutChanges = new client.Counter({
  name: 'layout_changes_total',
  help: 'Total number of layout changes',
  labelNames: ['change_type']
});

export const queryExecutionTime = new client.Histogram({
  name: 'query_execution_time_seconds',
  help: 'Duration of data source query execution',
  labelNames: ['datasource', 'status']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(reportBuildDuration);
register.registerMetric(widgetOperations);
register.registerMetric(layoutChanges);
register.registerMetric(queryExecutionTime);

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
  reportBuildDuration,
  widgetOperations,
  layoutChanges,
  queryExecutionTime
};