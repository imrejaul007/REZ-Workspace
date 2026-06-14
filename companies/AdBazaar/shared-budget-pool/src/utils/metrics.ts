import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const budgetPoolGauge = new client.Gauge({
  name: 'budget_pool_balance',
  help: 'Current balance of budget pools',
  labelNames: ['pool_id', 'pool_name', 'organization_id'],
});

export const budgetPoolTotalGauge = new client.Gauge({
  name: 'budget_pool_total',
  help: 'Total budget of pools',
  labelNames: ['pool_id', 'pool_name', 'organization_id'],
});

export const allocationGauge = new client.Gauge({
  name: 'allocation_count',
  help: 'Number of allocations',
  labelNames: ['pool_id', 'status'],
});

export const transactionCounter = new client.Counter({
  name: 'transaction_count',
  help: 'Total number of transactions',
  labelNames: ['pool_id', 'type'],
});

export const transactionAmount = new client.Counter({
  name: 'transaction_amount_total',
  help: 'Total transaction amount',
  labelNames: ['pool_id', 'type', 'currency'],
});

export const spendGauge = new client.Gauge({
  name: 'allocation_spent',
  help: 'Amount spent from allocations',
  labelNames: ['allocation_id', 'campaign_id', 'pool_id'],
});

export const serviceHealthGauge = new client.Gauge({
  name: 'service_health',
  help: 'Service health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(budgetPoolGauge);
register.registerMetric(budgetPoolTotalGauge);
register.registerMetric(allocationGauge);
register.registerMetric(transactionCounter);
register.registerMetric(transactionAmount);
register.registerMetric(spendGauge);
register.registerMetric(serviceHealthGauge);

export const trackRequest = (method: string, route: string, statusCode: number, duration: number) => {
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
  httpRequestTotal.labels(method, route, statusCode.toString()).inc();
};

export const updatePoolMetrics = (poolId: string, poolName: string, orgId: string, balance: number, total: number) => {
  budgetPoolGauge.labels(poolId, poolName, orgId).set(balance);
  budgetPoolTotalGauge.labels(poolId, poolName, orgId).set(total);
};

export const recordTransaction = (poolId: string, type: string, amount: number, currency: string) => {
  transactionCounter.labels(poolId, type).inc();
  transactionAmount.labels(poolId, type, currency).inc(amount);
};

export const updateAllocationMetrics = (poolId: string, status: string, count: number) => {
  allocationGauge.labels(poolId, status).set(count);
};

export const updateSpendMetrics = (allocationId: string, campaignId: string, poolId: string, spent: number) => {
  spendGauge.labels(allocationId, campaignId, poolId).set(spent);
};

export const setServiceHealth = (service: string, healthy: boolean) => {
  serviceHealthGauge.labels(service).set(healthy ? 1 : 0);
};

export const getMetrics = async () => {
  return register.metrics();
};

export const getContentType = () => {
  return register.contentType;
};

export default register;