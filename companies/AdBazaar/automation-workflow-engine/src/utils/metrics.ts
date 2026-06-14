import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'automation_workflow_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'automation_workflow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const workflowsCreatedTotal = new Counter({
  name: 'automation_workflows_created_total',
  help: 'Total workflows created',
  registers: [register]
});

export const workflowExecutionsTotal = new Counter({
  name: 'automation_workflow_executions_total',
  help: 'Total workflow executions',
  labelNames: ['status'],
  registers: [register]
});

export const activeWorkflowsGauge = new Gauge({
  name: 'automation_active_workflows',
  help: 'Number of active workflows',
  registers: [register]
});

export const workflowExecutionDuration = new Histogram({
  name: 'automation_workflow_execution_duration_seconds',
  help: 'Duration of workflow executions',
  labelNames: ['workflow_id'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register]
});