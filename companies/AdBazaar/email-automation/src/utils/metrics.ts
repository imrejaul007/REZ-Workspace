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

export const emailsSentTotal = new client.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['sequence_id', 'status'],
  registers: [register],
});

export const emailOpensGauge = new client.Gauge({
  name: 'email_opens_total',
  help: 'Total number of email opens',
  registers: [register],
});

export const emailClicksGauge = new client.Gauge({
  name: 'email_clicks_total',
  help: 'Total number of email clicks',
  registers: [register],
});

export const activeSequencesGauge = new client.Gauge({
  name: 'active_sequences_count',
  help: 'Number of active email sequences',
  registers: [register],
});

export const enrollmentsGauge = new client.Gauge({
  name: 'total_enrollments_count',
  help: 'Total number of enrollments',
  registers: [register],
});

export { register };
export default register;