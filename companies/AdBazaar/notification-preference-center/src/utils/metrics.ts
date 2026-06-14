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
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const preferencesUpdatedTotal = new client.Counter({
  name: 'preferences_updated_total',
  help: 'Total number of preference updates',
  labelNames: ['channel', 'type'],
  registers: [register],
});

export const subscriptionsTotal = new client.Counter({
  name: 'subscriptions_total',
  help: 'Total number of subscriptions',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const activeUsersGauge = new client.Gauge({
  name: 'users_with_preferences_count',
  help: 'Number of users with notification preferences',
  registers: [register],
});

export const channelEngagementGauge = new client.Gauge({
  name: 'channel_engagement_rate',
  help: 'Channel engagement rate',
  labelNames: ['channel'],
  registers: [register],
});

export { register };
export default register;