/**
 * Custom Prometheus metrics for rez-payment-service
 * Provides observability into HTTP requests, payment operations, and wallet transactions
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

// ── Redis Metrics ─────────────────────────────────────────────────────────────

/**
 * Gauge for Redis connection status
 */
export const redisConnectionStatus = new client.Gauge({
  name: 'redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)',
  registers: [register],
});

// ── BullMQ Queue Metrics ───────────────────────────────────────────────────────

/**
 * Counter for BullMQ jobs processed
 */
export const bullQueueJobsTotal = new client.Counter({
  name: 'bull_queue_jobs_total',
  help: 'Total BullMQ jobs processed',
  labelNames: ['queue', 'status'],
  registers: [register],
});

/**
 * Histogram for BullMQ job processing duration
 */
export const bullQueueJobDuration = new client.Histogram({
  name: 'bull_queue_job_duration_seconds',
  help: 'BullMQ job processing duration in seconds',
  labelNames: ['queue', 'job_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});

/**
 * Gauge for BullMQ queue size
 */
export const bullQueueSize = new client.Gauge({
  name: 'bull_queue_size',
  help: 'Current BullMQ queue size',
  labelNames: ['queue'],
  registers: [register],
});

/**
 * Counter for BullMQ job retries
 */
export const bullQueueJobRetries = new client.Counter({
  name: 'bull_queue_job_retries_total',
  help: 'Total BullMQ job retries',
  labelNames: ['queue', 'job_name'],
  registers: [register],
});

/**
 * Counter for BullMQ job failures (after all retries exhausted)
 */
export const bullQueueJobFailures = new client.Counter({
  name: 'bull_queue_job_failures_total',
  help: 'Total BullMQ job failures (after retries exhausted)',
  labelNames: ['queue', 'job_name'],
  registers: [register],
});

// ── Payment Operation Metrics ─────────────────────────────────────────────────

/**
 * Counter for payment operations
 */
export const paymentOperationsTotal = new client.Counter({
  name: 'payment_operations_total',
  help: 'Total payment operations',
  labelNames: ['operation', 'provider', 'status'],
  registers: [register],
});

/**
 * Histogram for payment processing duration
 */
export const paymentProcessingDuration = new client.Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Payment processing duration in seconds',
  labelNames: ['operation', 'provider'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

/**
 * Counter for payment amounts (in paisa/smallest unit)
 */
export const paymentAmountTotal = new client.Counter({
  name: 'payment_amount_total',
  help: 'Total payment amount processed (in paisa)',
  labelNames: ['operation', 'provider', 'currency'],
  registers: [register],
});

/**
 * Counter for Razorpay webhook events
 */
export const webhookEventsTotal = new client.Counter({
  name: 'webhook_events_total',
  help: 'Total webhook events received',
  labelNames: ['event', 'status'],
  registers: [register],
});

/**
 * Counter for webhook processing errors
 */
export const webhookErrorsTotal = new client.Counter({
  name: 'webhook_errors_total',
  help: 'Total webhook processing errors',
  labelNames: ['event', 'error_type'],
  registers: [register],
});

// ── Wallet Operation Metrics ──────────────────────────────────────────────────

/**
 * Counter for wallet operations
 */
export const walletOperationsTotal = new client.Counter({
  name: 'wallet_operations_total',
  help: 'Total wallet operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Histogram for wallet operation duration
 */
export const walletOperationDuration = new client.Histogram({
  name: 'wallet_operation_duration_seconds',
  help: 'Wallet operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

/**
 * Counter for wallet amounts (in coins)
 */
export const walletCoinsTotal = new client.Counter({
  name: 'wallet_coins_total',
  help: 'Total wallet coins processed',
  labelNames: ['operation'],
  registers: [register],
});

/**
 * Counter for lost coins recovery operations
 */
export const lostCoinsRecoveryTotal = new client.Counter({
  name: 'lost_coins_recovery_total',
  help: 'Total lost coins recovery operations',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Gauge for pending reconciliation jobs
 */
export const reconciliationPendingJobs = new client.Gauge({
  name: 'reconciliation_pending_jobs',
  help: 'Number of pending reconciliation jobs',
  registers: [register],
});

// ── Reconciliation Metrics ─────────────────────────────────────────────────────

/**
 * Counter for reconciliation runs
 */
export const reconciliationRunsTotal = new client.Counter({
  name: 'reconciliation_runs_total',
  help: 'Total reconciliation runs',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Histogram for reconciliation duration
 */
export const reconciliationDuration = new client.Histogram({
  name: 'reconciliation_duration_seconds',
  help: 'Reconciliation run duration in seconds',
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

/**
 * Counter for reconciliation discrepancies
 */
export const reconciliationDiscrepancies = new client.Counter({
  name: 'reconciliation_discrepancies_total',
  help: 'Total reconciliation discrepancies found',
  labelNames: ['type'],
  registers: [register],
});

// ── Business Operation Metrics ────────────────────────────────────────────────

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

// ── DLQ Metrics ───────────────────────────────────────────────────────────────

/**
 * Gauge for Dead Letter Queue size
 */
export const dlqSize = new client.Gauge({
  name: 'dead_letter_queue_size',
  help: 'Current Dead Letter Queue size',
  labelNames: ['queue'],
  registers: [register],
});

/**
 * Counter for DLQ entries
 */
export const dlqEntriesTotal = new client.Counter({
  name: 'dead_letter_queue_entries_total',
  help: 'Total entries added to Dead Letter Queue',
  labelNames: ['queue', 'reason'],
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
