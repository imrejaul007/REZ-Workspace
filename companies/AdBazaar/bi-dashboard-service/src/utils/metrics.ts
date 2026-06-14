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

export const dashboardRefreshDuration = new client.Histogram({
  name: 'dashboard_refresh_duration_seconds',
  help: 'Duration of dashboard refresh in seconds',
  labelNames: ['dashboard_id']
});

export const chartRenderDuration = new client.Histogram({
  name: 'chart_render_duration_seconds',
  help: 'Duration of chart rendering in seconds',
  labelNames: ['chart_type']
});

export const widgetUpdates = new client.Counter({
  name: 'widget_updates_total',
  help: 'Total number of widget updates',
  labelNames: ['widget_type', 'operation']
});

export const dataFetchDuration = new client.Histogram({
  name: 'data_fetch_duration_seconds',
  help: 'Duration of data fetching for widgets',
  labelNames: ['datasource', 'status']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dashboardRefreshDuration);
register.registerMetric(chartRenderDuration);
register.registerMetric(widgetUpdates);
register.registerMetric(dataFetchDuration);

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
  dashboardRefreshDuration,
  chartRenderDuration,
  widgetUpdates,
  dataFetchDuration
};