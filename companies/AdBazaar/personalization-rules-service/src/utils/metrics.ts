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

export const rulesCreated = new Counter({
  name: 'rules_created_total',
  help: 'Total number of rules created',
  registers: [register],
});

export const rulesMatched = new Counter({
  name: 'rules_matched_total',
  help: 'Total number of rule matches',
  labelNames: ['rule_id'],
  registers: [register],
});

export const rulesExecuted = new Counter({
  name: 'rules_executed_total',
  help: 'Total number of rule executions',
  labelNames: ['rule_id', 'result'],
  registers: [register],
});

export const activeRules = new Gauge({
  name: 'active_rules',
  help: 'Number of currently active rules',
  registers: [register],
});

export { register };