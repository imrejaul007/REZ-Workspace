import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Business metrics
export const clientOperationsTotal = new Counter({
  name: 'client_operations_total',
  help: 'Total number of client operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const contactOperationsTotal = new Counter({
  name: 'contact_operations_total',
  help: 'Total number of contact operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const campaignOperationsTotal = new Counter({
  name: 'campaign_operations_total',
  help: 'Total number of campaign operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// Database metrics
export const dbOperationDuration = new Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Redis metrics
export const cacheHitTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// Active clients gauge
export const activeClientsGauge = new Gauge({
  name: 'active_clients_total',
  help: 'Total number of active clients',
  labelNames: ['agency_id', 'status'],
  registers: [register],
});

// Budget and spend metrics
export const totalBudgetGauge = new Gauge({
  name: 'total_client_budget',
  help: 'Total client budgets in INR',
  labelNames: ['agency_id'],
  registers: [register],
});

export const totalSpendGauge = new Gauge({
  name: 'total_client_spend',
  help: 'Total client spend in INR',
  labelNames: ['agency_id'],
  registers: [register],
});

// Performance metrics
export const avgROASGauge = new Gauge({
  name: 'average_roas',
  help: 'Average ROAS across clients',
  labelNames: ['agency_id'],
  registers: [register],
});

// Error metrics
export const errorTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'operation'],
  registers: [register],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode.toString(),
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode.toString(),
    });
  });

  next();
};

export default register;