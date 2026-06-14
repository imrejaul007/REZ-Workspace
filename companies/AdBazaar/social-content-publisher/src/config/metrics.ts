import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const postsCreatedTotal = new client.Counter({
  name: 'posts_created_total',
  help: 'Total number of posts created',
  labelNames: ['company_id'],
  registers: [register],
});

export const postsPublishedTotal = new client.Counter({
  name: 'posts_published_total',
  help: 'Total number of posts published',
  labelNames: ['platform', 'status'],
  registers: [register],
});

export const queueProcessingDuration = new client.Histogram({
  name: 'queue_processing_duration_seconds',
  help: 'Duration of queue processing in seconds',
  labelNames: ['platform'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export default register;