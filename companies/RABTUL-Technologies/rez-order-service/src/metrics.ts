/**
 * Custom Prometheus metrics for rez-order-service
 * Provides observability into HTTP requests, BullMQ workers, and order operations
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
 * Gauge for active BullMQ workers
 */
export const bullQueueActiveWorkers = new client.Gauge({
  name: 'bull_queue_active_workers',
  help: 'Number of active BullMQ workers',
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

// ── Order Operation Metrics ────────────────────────────────────────────────────

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
 * Histogram for order operation durations
 */
export const orderOperationDuration = new client.Histogram({
  name: 'order_operation_duration_seconds',
  help: 'Order operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Gauge for order status counts
 */
export const orderStatusCounts = new client.Gauge({
  name: 'order_status_counts',
  help: 'Current count of orders by status',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Counter for order status transitions
 */
export const orderStatusTransitions = new client.Counter({
  name: 'order_status_transitions_total',
  help: 'Total order status transitions',
  labelNames: ['from_status', 'to_status'],
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
 * Histogram for business operation durations
 */
export const businessOperationDuration = new client.Histogram({
  name: 'business_operation_duration_seconds',
  help: 'Business operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// ── SSE/Streaming Metrics ─────────────────────────────────────────────────────

/**
 * Gauge for active SSE connections
 */
export const sseActiveConnections = new client.Gauge({
  name: 'sse_active_connections',
  help: 'Number of active Server-Sent Events connections',
  registers: [register],
});

/**
 * Counter for SSE events sent
 */
export const sseEventsTotal = new client.Counter({
  name: 'sse_events_total',
  help: 'Total SSE events sent',
  labelNames: ['event_type'],
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
