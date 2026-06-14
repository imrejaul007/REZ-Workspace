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

export const smsSentTotal = new client.Counter({
  name: 'sms_sent_total',
  help: 'Total number of SMS sent',
  labelNames: ['sequence_id', 'status'],
  registers: [register],
});

export const smsDeliveredGauge = new client.Gauge({
  name: 'sms_delivered_total',
  help: 'Total number of SMS delivered',
  registers: [register],
});

export const smsFailedGauge = new client.Gauge({
  name: 'sms_failed_total',
  help: 'Total number of SMS failed',
  registers: [register],
});

export const activeSequencesGauge = new client.Gauge({
  name: 'active_sms_sequences_count',
  help: 'Number of active SMS sequences',
  registers: [register],
});

export const enrollmentsGauge = new client.Gauge({
  name: 'total_sms_enrollments_count',
  help: 'Total number of SMS enrollments',
  registers: [register],
});

export { register };
export default register;