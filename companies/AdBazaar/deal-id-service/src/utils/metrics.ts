import client from 'prom-client';

const register = new client.Registry();

register.setDefaultLabels({
  app: 'deal-id-service',
  port: process.env.PORT || '4963',
});

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const dealsCreatedTotal = new client.Counter({
  name: 'deals_created_total',
  help: 'Total number of deals created',
  labelNames: ['type', 'buyer'],
});

export const dealsActivatedTotal = new client.Counter({
  name: 'deals_activated_total',
  help: 'Total number of deals activated',
});

export const dealsPausedTotal = new client.Counter({
  name: 'deals_paused_total',
  help: 'Total number of deals paused',
});

export const dealsCompletedTotal = new client.Counter({
  name: 'deals_completed_total',
  help: 'Total number of deals completed',
});

export const negotiationsCreatedTotal = new client.Counter({
  name: 'negotiations_created_total',
  help: 'Total number of negotiations created',
  labelNames: ['status'],
});

export const negotiationsAcceptedTotal = new client.Counter({
  name: 'negotiations_accepted_total',
  help: 'Total number of negotiations accepted',
});

export const negotiationsRejectedTotal = new client.Counter({
  name: 'negotiations_rejected_total',
  help: 'Total number of negotiations rejected',
});

export const dealImpressionsTotal = new client.Counter({
  name: 'deal_impressions_total',
  help: 'Total number of impressions across all deals',
  labelNames: ['deal_id'],
});

export const dealSpendTotal = new client.Counter({
  name: 'deal_spend_total',
  help: 'Total spend across all deals',
  labelNames: ['deal_id', 'currency'],
});

export const activeDealsGauge = new client.Gauge({
  name: 'active_deals_count',
  help: 'Number of currently active deals',
});

export const dealValueGauge = new client.Gauge({
  name: 'deal_total_value',
  help: 'Total value of all deals',
  labelNames: ['currency'],
});

export const negotiationRoundGauge = new client.Gauge({
  name: 'negotiation_current_round',
  help: 'Current negotiation round',
  labelNames: ['deal_id'],
});

export const pacingRatioGauge = new client.Gauge({
  name: 'deal_pacing_ratio',
  help: 'Current pacing ratio for deals',
  labelNames: ['deal_id', 'strategy'],
});

export const analyticsLatency = new client.Histogram({
  name: 'analytics_query_duration_seconds',
  help: 'Duration of analytics queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const mongodbOperationDuration = new client.Histogram({
  name: 'mongodb_operation_duration_seconds',
  help: 'Duration of MongoDB operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const redisOperationDuration = new client.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05],
});

export const errorTotal = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code'],
});

export const metrics = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  dealsCreatedTotal,
  dealsActivatedTotal,
  dealsPausedTotal,
  dealsCompletedTotal,
  negotiationsCreatedTotal,
  negotiationsAcceptedTotal,
  negotiationsRejectedTotal,
  dealImpressionsTotal,
  dealSpendTotal,
  activeDealsGauge,
  dealValueGauge,
  negotiationRoundGauge,
  pacingRatioGauge,
  analyticsLatency,
  mongodbOperationDuration,
  redisOperationDuration,
  errorTotal,
};

export function recordDealCreated(type: string, buyer: string): void {
  dealsCreatedTotal.inc({ type, buyer });
}

export function recordDealActivated(): void {
  dealsActivatedTotal.inc();
  activeDealsGauge.inc();
}

export function recordDealPaused(): void {
  dealsPausedTotal.inc();
  activeDealsGauge.dec();
}

export function recordDealCompleted(): void {
  dealsCompletedTotal.inc();
  activeDealsGauge.dec();
}

export function recordNegotiationCreated(status: string): void {
  negotiationsCreatedTotal.inc({ status });
}

export function recordNegotiationAccepted(): void {
  negotiationsAcceptedTotal.inc();
}

export function recordNegotiationRejected(): void {
  negotiationsRejectedTotal.inc();
}

export function recordImpressions(dealId: string, count: number): void {
  dealImpressionsTotal.inc({ deal_id: dealId }, count);
}

export function recordSpend(dealId: string, amount: number, currency: string = 'USD'): void {
  dealSpendTotal.inc({ deal_id: dealId, currency }, amount);
}

export function recordError(type: string, code: string): void {
  errorTotal.inc({ type, code });
}

export function recordMongoOperation(operation: string, collection: string, duration: number): void {
  mongodbOperationDuration.observe({ operation, collection }, duration / 1000);
}

export function recordRedisOperation(operation: string, duration: number): void {
  redisOperationDuration.observe({ operation }, duration / 1000);
}

export async function getMetricsSummary(): Promise<{
  deals: { total: number; active: number; value: number };
  negotiations: { total: number; pending: number; accepted: number };
  performance: { avgResponseTime: number; totalRequests: number };
}> {
  const metricsData = await register.getMetricsAsJSON();

  const dealsMetrics = metricsData.find((m) => m.name === 'deals_created_total');
  const activeMetrics = metricsData.find((m) => m.name === 'active_deals_count');

  return {
    deals: {
      total: dealsMetrics ? Object.values(dealsMetrics.values).reduce((a: number, b: any) => a + Number(b), 0) : 0,
      active: activeMetrics ? Number(Object.values(activeMetrics.values)[0]) : 0,
      value: 0,
    },
    negotiations: {
      total: 0,
      pending: 0,
      accepted: 0,
    },
    performance: {
      avgResponseTime: 0,
      totalRequests: 0,
    },
  };
}