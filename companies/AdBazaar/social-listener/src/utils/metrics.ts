import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'social_listener_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'social_listener_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const keywordsMonitoredGauge = new Gauge({
  name: 'social_listener_keywords_monitored',
  help: 'Number of keywords being monitored',
  registers: [register]
});

export const mentionsProcessedTotal = new Counter({
  name: 'social_listener_mentions_processed_total',
  help: 'Total mentions processed',
  labelNames: ['platform', 'sentiment'],
  registers: [register]
});

export const sentimentAnalysisTotal = new Counter({
  name: 'social_listener_sentiment_analysis_total',
  help: 'Total sentiment analyses performed',
  labelNames: ['sentiment'],
  registers: [register]
});

export const alertsTriggeredTotal = new Counter({
  name: 'social_listener_alerts_triggered_total',
  help: 'Total alerts triggered',
  registers: [register]
});