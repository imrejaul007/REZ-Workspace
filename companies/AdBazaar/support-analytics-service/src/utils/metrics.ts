/**
 * Prometheus metrics for Support Analytics Service
 */

import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'analytics_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});
register.registerMetric(httpRequestDuration);

// Analytics query metrics
const analyticsQueries = new client.Counter({
  name: 'analytics_queries_total',
  help: 'Total number of analytics queries',
  labelNames: ['type', 'dimension'],
});
register.registerMetric(analyticsQueries);

// Dashboard metrics
const dashboardsCreated = new client.Counter({
  name: 'analytics_dashboards_created_total',
  help: 'Total number of dashboards created',
});
register.registerMetric(dashboardsCreated);

// Metric recording
const metricsRecorded = new client.Counter({
  name: 'analytics_metrics_recorded_total',
  help: 'Total number of metrics recorded',
  labelNames: ['type'],
});
register.registerMetric(metricsRecorded);

// Trend calculations
const trendsCalculated = new client.Counter({
  name: 'analytics_trends_calculated_total',
  help: 'Total number of trends calculated',
});
register.registerMetric(trendsCalculated);

// Query duration
const queryDuration = new client.Histogram({
  name: 'analytics_query_duration_seconds',
  help: 'Duration of analytics queries',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});
register.registerMetric(queryDuration);

// Export metrics utilities
export const analyticsMetrics = {
  register,
  recordRequestDuration: (path: string, durationMs: number) => {
    httpRequestDuration.observe({ method: 'GET', path, status_code: '200' }, durationMs / 1000);
  },
  incrementAnalyticsQueries: (type: string, dimension: string) => {
    analyticsQueries.inc({ type, dimension });
  },
  incrementDashboardsCreated: () => {
    dashboardsCreated.inc();
  },
  incrementMetricsRecorded: (type: string) => {
    metricsRecorded.inc({ type });
  },
  incrementTrendsCalculated: () => {
    trendsCalculated.inc();
  },
  observeQueryDuration: (type: string, durationSeconds: number) => {
    queryDuration.observe({ type }, durationSeconds);
  },
};

export default analyticsMetrics;