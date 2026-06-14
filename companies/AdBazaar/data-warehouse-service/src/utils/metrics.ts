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

export const dataSyncDuration = new client.Histogram({
  name: 'data_sync_duration_seconds',
  help: 'Duration of data synchronization in seconds',
  labelNames: ['source', 'status']
});

export const dataSyncTotal = new client.Counter({
  name: 'data_sync_total',
  help: 'Total number of data syncs',
  labelNames: ['source', 'status']
});

export const recordsProcessed = new client.Counter({
  name: 'records_processed_total',
  help: 'Total number of records processed',
  labelNames: ['source', 'operation']
});

export const queryExecutionTime = new client.Histogram({
  name: 'warehouse_query_duration_seconds',
  help: 'Duration of warehouse queries in seconds',
  labelNames: ['query_type', 'status']
});

export const transformationDuration = new client.Histogram({
  name: 'transformation_duration_seconds',
  help: 'Duration of data transformations',
  labelNames: ['transformation_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dataSyncDuration);
register.registerMetric(dataSyncTotal);
register.registerMetric(recordsProcessed);
register.registerMetric(queryExecutionTime);
register.registerMetric(transformationDuration);

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
  dataSyncDuration,
  dataSyncTotal,
  recordsProcessed,
  queryExecutionTime,
  transformationDuration
};