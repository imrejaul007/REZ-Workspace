/**
 * Custom Prometheus metrics for rez-merchant-service
 * Provides observability into HTTP requests, database operations, and merchant operations
 */

import client from 'prom-client';

// Create a custom registry to isolate this service's metrics
export const register = new client.Registry();

// Add default metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({ register });

// ── HTTP Request Metrics ────────────────────────────────────────────────────────

/**
 * Histogram of HTTP request durations in seconds
 * Buckets optimized for typical web request latency patterns
 */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Counter for total HTTP requests
 */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Gauge for concurrent HTTP requests
 */
export const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [register],
});

// ── Database Connection Pool Metrics ──────────────────────────────────────────

/**
 * Gauge for MongoDB connection pool size
 */
export const dbConnectionPool = new client.Gauge({
  name: 'mongodb_connection_pool_size',
  help: 'Current MongoDB connection pool size',
  labelNames: ['state'],
  registers: [register],
});

/**
 * Histogram for database query duration
 */
export const dbQueryDuration = new client.Histogram({
  name: 'mongodb_query_duration_seconds',
  help: 'MongoDB query duration in seconds',
  labelNames: ['collection', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

// ── Redis Metrics ─────────────────────────────────────────────────────────────

/**
 * Gauge for Redis connection status
 */
export const redisConnectionStatus = new client.Gauge({
  name: 'redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)',
  registers: [register],
});

/**
 * Counter for Redis operations
 */
export const redisOperationsTotal = new client.Counter({
  name: 'redis_operations_total',
  help: 'Total Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// ── Rate Limiter Metrics ───────────────────────────────────────────────────────

/**
 * Counter for rate limit exceeded events
 */
export const rateLimitExceededTotal = new client.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total rate limit exceeded events',
  labelNames: ['limiter'],
  registers: [register],
});

// ── Business Operation Metrics ────────────────────────────────────────────────

/**
 * Counter for merchant operations
 */
export const merchantOperationsTotal = new client.Counter({
  name: 'merchant_operations_total',
  help: 'Total merchant operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// ── Custom Business Metrics ─────────────────────────────────────────────────────

/**
 * Counter for orders created
 */
export const ordersCreatedTotal = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Counter for payments processed
 */
export const paymentsProcessedTotal = new client.Counter({
  name: 'payments_processed_total',
  help: 'Total payments processed',
  labelNames: ['status', 'gateway'],
  registers: [register],
});

/**
 * Gauge for active merchants
 */
export const activeMerchantsGauge = new client.Gauge({
  name: 'active_merchants',
  help: 'Number of active merchants',
  registers: [register],
});

/**
 * Counter for total revenue
 */
export const revenueTotal = new client.Counter({
  name: 'revenue_total',
  help: 'Total revenue processed',
  labelNames: ['currency'],
  registers: [register],
});

/**
 * Histogram for merchant operation durations
 */
export const merchantOperationDuration = new client.Histogram({
  name: 'merchant_operation_duration_seconds',
  help: 'Merchant operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Counter for order operations
 */
export const orderOperationsTotal = new client.Counter({
  name: 'order_operations_total',
  help: 'Total order operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Counter for campaign operations
 */
export const campaignOperationsTotal = new client.Counter({
  name: 'campaign_operations_total',
  help: 'Total campaign operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Counter for engagement metrics
 */
export const engagementOperationsTotal = new client.Counter({
  name: 'engagement_operations_total',
  help: 'Total engagement operations',
  labelNames: ['type'],
  registers: [register],
});

// ── Generic Business Operation Metrics ────────────────────────────────────────

/**
 * Counter for generic business operations
 */
export const businessOperationTotal = new client.Counter({
  name: 'business_operation_total',
  help: 'Business operations count',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Histogram for business operation durations
 */
export const businessOperationDuration = new client.Histogram({
  name: 'business_operation_duration_seconds',
  help: 'Business operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// ── Circuit Breaker Metrics ────────────────────────────────────────────────────

/**
 * Gauge for circuit breaker state (0=closed, 1=half-open, 2=open)
 */
export const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['name'],
  registers: [register],
});

/**
 * Counter for circuit breaker failures
 */
export const circuitBreakerFailures = new client.Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total circuit breaker failures',
  labelNames: ['name'],
  registers: [register],
});

/**
 * Counter for circuit breaker successes
 */
export const circuitBreakerSuccesses = new client.Counter({
  name: 'circuit_breaker_successes_total',
  help: 'Total circuit breaker successes',
  labelNames: ['name'],
  registers: [register],
});

/**
 * Counter for circuit breaker rejections
 */
export const circuitBreakerRejections = new client.Counter({
  name: 'circuit_breaker_rejections_total',
  help: 'Total circuit breaker rejections',
  labelNames: ['name'],
  registers: [register],
});

// ── Metrics Middleware Helper ─────────────────────────────────────────────────

/**
 * Express middleware to track HTTP request metrics
 * Usage: app.use(metricsMiddleware)
 */
export function metricsMiddleware(
  req: { method: string; path: string; route?: { path: string } },
  res: { on: (event: string, cb: () => void) => void; statusCode: number },
  next: () => void,
): void {
  const start = Date.now();
  httpRequestsInFlight.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration,
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestsInFlight.dec();
  });

  next();
}

/**
 * Get metrics endpoint handler for Express
 * Usage: app.get('/metrics', getMetricsHandler)
 */
export async function getMetricsHandler(_req: unknown, res: { set: (header: string, value: string) => void; end: (data: string) => void }): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

// ═══════════════════════════════════════════════════════════════════════════════
// B2B-Specific Metrics
// ═══════════════════════════════════════════════════════════════════════════════

// ── Supplier Metrics ─────────────────────────────────────────────────────────

export const suppliersCreatedTotal = new client.Counter({
  name: 'b2b_suppliers_created_total',
  help: 'Total suppliers created',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const suppliersUpdatedTotal = new client.Counter({
  name: 'b2b_suppliers_updated_total',
  help: 'Total supplier updates',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const supplierCreditLimitGauge = new client.Gauge({
  name: 'b2b_supplier_credit_limit',
  help: 'Total credit limit per supplier',
  labelNames: ['merchant_id', 'supplier_id'],
  registers: [register],
});

// ── Purchase Order Metrics ────────────────────────────────────────────────────

export const purchaseOrdersCreatedTotal = new client.Counter({
  name: 'b2b_purchase_orders_created_total',
  help: 'Total purchase orders created',
  labelNames: ['merchant_id', 'status'],
  registers: [register],
});

export const purchaseOrdersApprovedTotal = new client.Counter({
  name: 'b2b_purchase_orders_approved_total',
  help: 'Total purchase orders approved',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const purchaseOrdersRejectedTotal = new client.Counter({
  name: 'b2b_purchase_orders_rejected_total',
  help: 'Total purchase orders rejected',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const purchaseOrdersOverdueGauge = new client.Gauge({
  name: 'b2b_purchase_orders_overdue',
  help: 'Number of overdue purchase orders',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const purchaseOrderValueTotal = new client.Counter({
  name: 'b2b_purchase_order_value_total',
  help: 'Total value of purchase orders',
  labelNames: ['merchant_id', 'status'],
  registers: [register],
});

// ── Credit Line Metrics ───────────────────────────────────────────────────────

export const creditLinesCreatedTotal = new client.Counter({
  name: 'b2b_credit_lines_created_total',
  help: 'Total credit lines created',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const creditLineUtilizationGauge = new client.Gauge({
  name: 'b2b_credit_line_utilization',
  help: 'Credit line utilization percentage',
  labelNames: ['merchant_id', 'credit_line_id'],
  registers: [register],
});

export const creditLimitExceededTotal = new client.Counter({
  name: 'b2b_credit_limit_exceeded_total',
  help: 'Total times credit limit was exceeded',
  labelNames: ['merchant_id', 'supplier_id'],
  registers: [register],
});

// ── Payment Metrics ────────────────────────────────────────────────────────────

export const supplierPaymentsTotal = new client.Counter({
  name: 'b2b_supplier_payments_total',
  help: 'Total supplier payments',
  labelNames: ['merchant_id', 'method'],
  registers: [register],
});

export const supplierPaymentValueTotal = new client.Counter({
  name: 'b2b_supplier_payment_value_total',
  help: 'Total value of supplier payments',
  labelNames: ['merchant_id', 'currency'],
  registers: [register],
});

// ── Webhook Metrics ───────────────────────────────────────────────────────────

export const webhooksDeliveredTotal = new client.Counter({
  name: 'b2b_webhooks_delivered_total',
  help: 'Total webhooks delivered successfully',
  labelNames: ['event', 'status_code'],
  registers: [register],
});

export const webhooksFailedTotal = new client.Counter({
  name: 'b2b_webhooks_failed_total',
  help: 'Total webhook delivery failures',
  labelNames: ['event', 'error_type'],
  registers: [register],
});

export const webhookDeliveryDuration = new client.Histogram({
  name: 'b2b_webhook_delivery_duration_seconds',
  help: 'Webhook delivery duration in seconds',
  labelNames: ['event'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// ── Aging Report Metrics ───────────────────────────────────────────────────────

export const agingReportsGeneratedTotal = new client.Counter({
  name: 'b2b_aging_reports_generated_total',
  help: 'Total aging reports generated',
  labelNames: ['merchant_id'],
  registers: [register],
});

export const overdueAmountGauge = new client.Gauge({
  name: 'b2b_overdue_amount',
  help: 'Total overdue amount',
  labelNames: ['merchant_id', 'bucket'],
  registers: [register],
}); // bucket: current, days30to60, days60to90, days90plus

// ── Cache Metrics ─────────────────────────────────────────────────────────────

export const cacheHitsTotal = new client.Counter({
  name: 'b2b_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissesTotal = new client.Counter({
  name: 'b2b_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// ── Rate Limiter B2B Metrics ──────────────────────────────────────────────────

export const b2bRateLimitExceededTotal = new client.Counter({
  name: 'b2b_rate_limit_exceeded_total',
  help: 'Total rate limit exceeded for B2B routes',
  labelNames: ['route', 'limiter'],
  registers: [register],
});

// ── Dunning Metrics ───────────────────────────────────────────────────────────

export const remindersSentTotal = new client.Counter({
  name: 'b2b_reminders_sent_total',
  help: 'Total payment reminders sent',
  labelNames: ['channel', 'type'], // channel: sms, email, whatsapp; type: overdue, due_soon
  registers: [register],
});

// ── Helper Functions for Recording B2B Metrics ────────────────────────────────

/**
 * Record a supplier operation
 */
export function recordSupplierOperation(operation: 'created' | 'updated', merchantId: string): void {
  if (operation === 'created') {
    suppliersCreatedTotal.inc({ merchant_id: merchantId });
  } else {
    suppliersUpdatedTotal.inc({ merchant_id: merchantId });
  }
}

/**
 * Record a purchase order event
 */
export function recordPurchaseOrderEvent(
  event: 'created' | 'approved' | 'rejected' | 'overdue',
  merchantId: string,
  value?: number,
  status?: string
): void {
  if (event === 'created') {
    purchaseOrdersCreatedTotal.inc({ merchant_id: merchantId, status: status || 'draft' });
    if (value) {
      purchaseOrderValueTotal.inc({ merchant_id: merchantId, status: status || 'draft' }, value);
    }
  } else if (event === 'approved') {
    purchaseOrdersApprovedTotal.inc({ merchant_id: merchantId });
  } else if (event === 'rejected') {
    purchaseOrdersRejectedTotal.inc({ merchant_id: merchantId });
  } else if (event === 'overdue') {
    purchaseOrdersOverdueGauge.inc({ merchant_id: merchantId });
  }
}

/**
 * Record webhook delivery
 */
export function recordWebhookDelivery(event: string, success: boolean, statusCode?: number, durationMs?: number): void {
  if (success) {
    webhooksDeliveredTotal.inc({ event, status_code: String(statusCode || 200) });
  } else {
    webhooksFailedTotal.inc({ event, error_type: 'delivery_failed' });
  }
  if (durationMs !== undefined) {
    webhookDeliveryDuration.observe({ event }, durationMs / 1000);
  }
}

/**
 * Record cache operation
 */
export function recordCacheOperation(cacheType: string, hit: boolean): void {
  if (hit) {
    cacheHitsTotal.inc({ cache_type: cacheType });
  } else {
    cacheMissesTotal.inc({ cache_type: cacheType });
  }
}
