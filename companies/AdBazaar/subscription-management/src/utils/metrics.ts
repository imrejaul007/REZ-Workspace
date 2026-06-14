import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics for subscription service

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'subscription_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'subscription_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Subscription metrics
export const subscriptionCreatedTotal = new Counter({
  name: 'subscription_created_total',
  help: 'Total number of subscriptions created',
  labelNames: ['plan_type'],
  registers: [register]
});

export const subscriptionCancelledTotal = new Counter({
  name: 'subscription_cancelled_total',
  help: 'Total number of subscriptions cancelled',
  labelNames: ['reason'],
  registers: [register]
});

export const subscriptionRenewedTotal = new Counter({
  name: 'subscription_renewed_total',
  help: 'Total number of subscriptions renewed',
  registers: [register]
});

export const subscriptionUpgradedTotal = new Counter({
  name: 'subscription_upgraded_total',
  help: 'Total number of subscription upgrades',
  registers: [register]
});

export const subscriptionDowngradedTotal = new Counter({
  name: 'subscription_downgraded_total',
  help: 'Total number of subscription downgrades',
  registers: [register]
});

// Active subscriptions gauge
export const activeSubscriptionsGauge = new Gauge({
  name: 'subscription_active_count',
  help: 'Current number of active subscriptions',
  labelNames: ['plan_type', 'status'],
  registers: [register]
});

// Revenue metrics
export const monthlyRecurringRevenue = new Gauge({
  name: 'subscription_mrr_dollars',
  help: 'Monthly recurring revenue in dollars',
  registers: [register]
});

export const annualRecurringRevenue = new Gauge({
  name: 'subscription_arr_dollars',
  help: 'Annual recurring revenue in dollars',
  registers: [register]
});

// Invoice metrics
export const invoiceCreatedTotal = new Counter({
  name: 'subscription_invoice_created_total',
  help: 'Total number of invoices created',
  labelNames: ['status'],
  registers: [register]
});

export const invoicePaidTotal = new Counter({
  name: 'subscription_invoice_paid_total',
  help: 'Total number of invoices paid',
  registers: [register]
});

export const invoiceAmountTotal = new Counter({
  name: 'subscription_invoice_amount_total',
  help: 'Total invoice amount processed',
  labelNames: ['currency'],
  registers: [register]
});

// Database operation metrics
export const dbOperationDuration = new Histogram({
  name: 'subscription_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

// Redis operation metrics
export const redisOperationDuration = new Histogram({
  name: 'subscription_redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register]
});

// External service call metrics
export const externalServiceDuration = new Histogram({
  name: 'subscription_external_service_duration_seconds',
  help: 'Duration of external service calls in seconds',
  labelNames: ['service', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const externalServiceErrors = new Counter({
  name: 'subscription_external_service_errors_total',
  help: 'Total number of external service errors',
  labelNames: ['service', 'operation', 'error_code'],
  registers: [register]
});

export { register };
