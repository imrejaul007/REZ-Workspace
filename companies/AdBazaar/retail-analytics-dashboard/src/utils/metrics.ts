import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
  name: 'retail_analytics_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'retail_analytics_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dashboardQueriesTotal = new Counter({
  name: 'retail_analytics_dashboard_queries_total',
  help: 'Total number of dashboard queries',
  labelNames: ['query_type'],
  registers: [register],
});

export const salesLiftQueries = new Counter({
  name: 'retail_analytics_sales_lift_queries_total',
  help: 'Total number of sales lift queries',
  registers: [register],
});

export const performanceMetricsGauge = new Gauge({
  name: 'retail_analytics_performance_metrics',
  help: 'Current performance metrics values',
  labelNames: ['metric_type'],
  registers: [register],
});

export const activeCampaignsGauge = new Gauge({
  name: 'retail_analytics_active_campaigns',
  help: 'Number of active campaigns being tracked',
  registers: [register],
});

export const retailerCountGauge = new Gauge({
  name: 'retail_analytics_retailers_tracked',
  help: 'Number of retailers in the dashboard',
  registers: [register],
});

export const cacheHitsCounter = new Counter({
  name: 'retail_analytics_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const exportRequestsCounter = new Counter({
  name: 'retail_analytics_export_requests_total',
  help: 'Total number of data export requests',
  labelNames: ['format'],
  registers: [register],
});

export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

export const getContentType = (): string => {
  return register.contentType;
};

export const resetMetrics = (): void => {
  register.resetMetrics();
};