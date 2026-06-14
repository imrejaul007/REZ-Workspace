import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'trigger_condition_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'trigger_condition_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const triggersCreatedTotal = new Counter({
  name: 'trigger_condition_triggers_created_total',
  help: 'Total triggers created',
  registers: [register]
});

export const triggersFiredTotal = new Counter({
  name: 'trigger_condition_triggers_fired_total',
  help: 'Total triggers fired',
  labelNames: ['status'],
  registers: [register]
});

export const conditionsEvaluatedTotal = new Counter({
  name: 'trigger_condition_conditions_evaluated_total',
  help: 'Total conditions evaluated',
  labelNames: ['result'],
  registers: [register]
});

export const activeTriggersGauge = new Gauge({
  name: 'trigger_condition_active_triggers',
  help: 'Number of active triggers',
  registers: [register]
});