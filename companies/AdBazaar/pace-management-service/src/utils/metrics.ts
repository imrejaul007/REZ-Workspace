import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { METRICS_LABELS } from '../types';

// Create a custom registry
const register = new Registry();

// Add default metrics (Node.js runtime metrics)
client.collectDefaultMetrics({ register });

// Custom metrics for Pace Management Service

// Campaign pacing counters
export const pacingCampaignsTotal = new Counter({
  name: 'pace_campaigns_total',
  help: 'Total number of campaigns with pacing configured',
  labelNames: [METRICS_LABELS.PACING_STRATEGY],
  registers: [register]
});

export const pacingCampaignsActive = new Gauge({
  name: 'pace_campaigns_active',
  help: 'Number of currently active pacing campaigns',
  labelNames: [METRICS_LABELS.PACING_STRATEGY],
  registers: [register]
});

export const pacingBudgetTotal = new Gauge({
  name: 'pace_budget_total',
  help: 'Total budget across all pacing campaigns',
  registers: [register]
});

export const pacingBudgetSpent = new Gauge({
  name: 'pace_budget_spent',
  help: 'Total amount spent across all pacing campaigns',
  registers: [register]
});

// Status metrics
export const pacingStatusDistribution = new Gauge({
  name: 'pace_status_distribution',
  help: 'Distribution of campaigns by pacing status',
  labelNames: [METRICS_LABELS.CAMPAIGN_STATUS],
  registers: [register]
});

export const pacePercentage = new Gauge({
  name: 'pace_percentage',
  help: 'Current pace percentage for campaigns',
  labelNames: ['campaign_id'],
  registers: [register]
});

// Alert metrics
export const pacingAlertsTotal = new Counter({
  name: 'pace_alerts_total',
  help: 'Total number of pacing alerts triggered',
  labelNames: [METRICS_LABELS.ALERT_TYPE, METRICS_LABELS.SEVERITY],
  registers: [register]
});

export const pacingAlertsActive = new Gauge({
  name: 'pace_alerts_active',
  help: 'Number of currently active pacing alerts',
  registers: [register]
});

// Optimization metrics
export const optimizationRequestsTotal = new Counter({
  name: 'pace_optimization_requests_total',
  help: 'Total number of optimization requests',
  labelNames: ['adjustment_type', 'success'],
  registers: [register]
});

export const optimizationBudgetAdjustment = new Histogram({
  name: 'pace_optimization_budget_adjustment',
  help: 'Budget adjustment values from optimizations',
  buckets: [-100, -50, -25, -10, 0, 10, 25, 50, 100],
  registers: [register]
});

// Forecast metrics
export const forecastAccuracy = new Gauge({
  name: 'pace_forecast_accuracy',
  help: 'Forecast accuracy percentage',
  labelNames: ['campaign_id'],
  registers: [register]
});

// API metrics
export const apiRequestDuration = new Histogram({
  name: 'pace_api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

export const apiRequestsTotal = new Counter({
  name: 'pace_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Performance metrics
export const mongoOperationDuration = new Histogram({
  name: 'pace_mongo_operation_duration_seconds',
  help: 'Duration of MongoDB operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
});

export const redisOperationDuration = new Histogram({
  name: 'pace_redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05],
  registers: [register]
});

// Helper function to record API request metrics
export function recordApiMetrics(
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void {
  const labels = { method, route, status_code: statusCode.toString() };
  apiRequestDuration.observe(labels, duration);
  apiRequestsTotal.inc(labels);
}

// Helper function to update pacing status metrics
export function updatePacingStatusMetrics(
  campaignId: string,
  pacePercentageValue: number,
  status: string
): void {
  pacePercentage.set({ campaign_id: campaignId }, pacePercentageValue);
  pacingStatusDistribution.set({ campaign_status: status }, 1);
}

// Export the registry for use in the main entry point
export { register };

// Default export for convenience
export default {
  register,
  pacingCampaignsTotal,
  pacingCampaignsActive,
  pacingBudgetTotal,
  pacingBudgetSpent,
  pacingStatusDistribution,
  pacePercentage,
  pacingAlertsTotal,
  pacingAlertsActive,
  optimizationRequestsTotal,
  optimizationBudgetAdjustment,
  forecastAccuracy,
  apiRequestDuration,
  apiRequestsTotal,
  mongoOperationDuration,
  redisOperationDuration,
  recordApiMetrics,
  updatePacingStatusMetrics
};
