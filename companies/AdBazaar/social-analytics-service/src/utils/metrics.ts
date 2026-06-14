import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'social_analytics_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'social_analytics_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const analyticsQueriesTotal = new Counter({
  name: 'social_analytics_queries_total',
  help: 'Total number of analytics queries',
  labelNames: ['type'],
  registers: [register]
});

export const postsAnalyzedTotal = new Counter({
  name: 'social_analytics_posts_analyzed_total',
  help: 'Total number of posts analyzed',
  labelNames: ['platform'],
  registers: [register]
});

export const activeDashboardsGauge = new Gauge({
  name: 'social_analytics_active_dashboards',
  help: 'Number of active dashboards',
  registers: [register]
});

export const engagementRateGauge = new Gauge({
  name: 'social_analytics_engagement_rate',
  help: 'Average engagement rate',
  labelNames: ['platform'],
  registers: [register]
});