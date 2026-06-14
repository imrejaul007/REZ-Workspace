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

export const messagesSentTotal = new client.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const conversationsActiveGauge = new client.Gauge({
  name: 'active_conversations_count',
  help: 'Number of active conversations',
  registers: [register],
});

export const unreadMessagesGauge = new client.Gauge({
  name: 'unread_messages_count',
  help: 'Number of unread messages',
  registers: [register],
});

export { register };
export default register;