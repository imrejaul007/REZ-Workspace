import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for publisher dashboard
export const httpRequestDuration = new client.Histogram({
  name: 'publisher_dashboard_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new client.Counter({
  name: 'publisher_dashboard_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const dashboardQueriesTotal = new client.Counter({
  name: 'publisher_dashboard_queries_total',
  help: 'Total number of dashboard queries',
  labelNames: ['type', 'publisher_id']
});

export const dashboardQueryDuration = new client.Histogram({
  name: 'publisher_dashboard_query_duration_seconds',
  help: 'Duration of dashboard queries in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const revenueTotal = new client.Gauge({
  name: 'publisher_dashboard_revenue_total',
  help: 'Total revenue tracked',
  labelNames: ['publisher_id', 'currency']
});

export const impressionsTotal = new client.Gauge({
  name: 'publisher_dashboard_impressions_total',
  help: 'Total impressions tracked',
  labelNames: ['publisher_id']
});

export const activePublishersGauge = new client.Gauge({
  name: 'publisher_dashboard_active_publishers',
  help: 'Number of active publishers',
});

export const cacheHitRate = new client.Gauge({
  name: 'publisher_dashboard_cache_hit_rate',
  help: 'Cache hit rate percentage',
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dashboardQueriesTotal);
register.registerMetric(dashboardQueryDuration);
register.registerMetric(revenueTotal);
register.registerMetric(impressionsTotal);
register.registerMetric(activePublishersGauge);
register.registerMetric(cacheHitRate);

// Metrics endpoint handler
export const metricsHandler = async (req: any, res: any) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

export default register;