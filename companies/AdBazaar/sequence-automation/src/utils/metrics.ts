import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'sequence_automation_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'sequence_automation_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const sequencesCreatedTotal = new Counter({
  name: 'sequence_automation_sequences_created_total',
  help: 'Total sequences created',
  registers: [register]
});

export const enrollmentsTotal = new Counter({
  name: 'sequence_automation_enrollments_total',
  help: 'Total enrollments',
  labelNames: ['status'],
  registers: [register]
});

export const stepsCompletedTotal = new Counter({
  name: 'sequence_automation_steps_completed_total',
  help: 'Total steps completed',
  labelNames: ['sequence_id'],
  registers: [register]
});

export const activeSequencesGauge = new Gauge({
  name: 'sequence_automation_active_sequences',
  help: 'Number of active sequences',
  registers: [register]
});

export const activeEnrollmentsGauge = new Gauge({
  name: 'sequence_automation_active_enrollments',
  help: 'Number of active enrollments',
  registers: [register]
});