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

export const webhookDeliveriesTotal = new client.Counter({
  name: 'webhook_deliveries_total',
  help: 'Total number of webhook deliveries',
  labelNames: ['status', 'event_type'],
  registers: [register],
});

export const webhookDeliveryDuration = new client.Histogram({
  name: 'webhook_delivery_duration_seconds',
  help: 'Webhook delivery duration in seconds',
  labelNames: ['status'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const activeWebhooksGauge = new client.Gauge({
  name: 'active_webhooks_count',
  help: 'Number of active webhooks',
  registers: [register],
});

export const webhookQueueSize = new client.Gauge({
  name: 'webhook_queue_size',
  help: 'Number of webhooks in delivery queue',
  registers: [register],
});

export { register };
export default register;