import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import config from '../config/index.js';

// Create a custom registry
const register = new Registry();

// Add default labels
register.setDefaultLabels(config.metrics.defaultLabels);

// Collect default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDuration);

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestTotal);

// Campaign metrics
export const campaignsCreated = new Counter({
  name: 'campaigns_created_total',
  help: 'Total number of campaigns created'
});
register.registerMetric(campaignsCreated);

export const campaignsByStatus = new Gauge({
  name: 'campaigns_by_status',
  help: 'Number of campaigns by status',
  labelNames: ['status']
});
register.registerMetric(campaignsByStatus);

export const agentActionsTotal = new Counter({
  name: 'agent_actions_total',
  help: 'Total number of agent actions taken',
  labelNames: ['action_type']
});
register.registerMetric(agentActionsTotal);

export const agentDecisionDuration = new Histogram({
  name: 'agent_decision_duration_seconds',
  help: 'Duration of agent decision cycles in seconds',
  labelNames: ['decision_type']
});
register.registerMetric(agentDecisionDuration);

export const campaignBudget = new Gauge({
  name: 'campaign_budget_total',
  help: 'Total budget allocated to campaigns',
  labelNames: ['goal_type']
});
register.registerMetric(campaignBudget);

export const campaignSpend = new Gauge({
  name: 'campaign_spend_total',
  help: 'Total spend across campaigns',
  labelNames: ['goal_type']
});
register.registerMetric(campaignSpend);

export const campaignConversions = new Gauge({
  name: 'campaign_conversions_total',
  help: 'Total conversions achieved',
  labelNames: ['goal_type']
});
register.registerMetric(campaignConversions);

export const campaignProgress = new Gauge({
  name: 'campaign_progress_percent',
  help: 'Average progress percentage of active campaigns',
  labelNames: ['goal_type']
});
register.registerMetric(campaignProgress);

// Redis cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits'
});
register.registerMetric(cacheHits);

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses'
});
register.registerMetric(cacheMisses);

// External service call metrics
export const externalServiceCalls = new Counter({
  name: 'external_service_calls_total',
  help: 'Total number of external service calls',
  labelNames: ['service', 'endpoint', 'status']
});
register.registerMetric(externalServiceCalls);

export const externalServiceDuration = new Histogram({
  name: 'external_service_duration_seconds',
  help: 'Duration of external service calls in seconds',
  labelNames: ['service', 'endpoint']
});
register.registerMetric(externalServiceDuration);

// Error metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'source']
});
register.registerMetric(errorsTotal);

// Get metrics endpoint handler
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

// Get metrics content type
export function getMetricsContentType(): string {
  return register.contentType;
}

// Reset all metrics (for testing)
export function resetMetrics(): void {
  register.resetMetrics();
}

export { register };
export default register;
