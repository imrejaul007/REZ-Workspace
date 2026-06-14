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

export const broadcastsTotal = new client.Counter({
  name: 'broadcasts_total',
  help: 'Total number of broadcasts',
  labelNames: ['channel', 'status'],
  registers: [register],
});

export const messagesSentTotal = new client.Counter({
  name: 'broadcast_messages_sent_total',
  help: 'Total number of messages sent in broadcasts',
  labelNames: ['channel', 'status'],
  registers: [register],
});

export const activeBroadcastsGauge = new client.Gauge({
  name: 'active_broadcasts_count',
  help: 'Number of active broadcasts',
  registers: [register],
});

export const recipientsGauge = new client.Gauge({
  name: 'broadcast_recipients_count',
  help: 'Number of broadcast recipients',
  registers: [register],
});

export { register };
export default register;