import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const recommendationsGenerated = new Counter({
  name: 'recommendations_generated_total',
  help: 'Total number of recommendations generated',
  labelNames: ['type', 'source'],
  registers: [register],
});

export const recommendationClicks = new Counter({
  name: 'recommendation_clicks_total',
  help: 'Total number of recommendation clicks',
  registers: [register],
});

export const recommendationConversions = new Counter({
  name: 'recommendation_conversions_total',
  help: 'Total number of recommendation conversions',
  registers: [register],
});

export const modelLatency = new Histogram({
  name: 'model_latency_seconds',
  help: 'Model inference latency in seconds',
  labelNames: ['model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export { register };