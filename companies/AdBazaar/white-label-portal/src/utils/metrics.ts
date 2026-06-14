import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for white-label-portal

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'white_label_portal_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'white_label_portal_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Portal metrics
export const portalTotal = new Gauge({
  name: 'white_label_portal_total',
  help: 'Total number of white label portals',
  labelNames: ['status'],
  registers: [register],
});

export const portalClientsTotal = new Gauge({
  name: 'white_label_portal_clients_total',
  help: 'Total number of clients across all portals',
  registers: [register],
});

// Branding metrics
export const brandingUpdatesTotal = new Counter({
  name: 'white_label_portal_branding_updates_total',
  help: 'Total number of branding updates',
  registers: [register],
});

// Domain metrics
export const customDomainsTotal = new Gauge({
  name: 'white_label_portal_custom_domains_total',
  help: 'Total number of custom domains',
  labelNames: ['status'],
  registers: [register],
});

export const sslCertificatesTotal = new Gauge({
  name: 'white_label_portal_ssl_certificates_total',
  help: 'Total number of SSL certificates',
  registers: [register],
});

// Analytics metrics
export const analyticsRecordsTotal = new Counter({
  name: 'white_label_portal_analytics_records_total',
  help: 'Total number of analytics records',
  registers: [register],
});

export const analyticsImpressions = new Counter({
  name: 'white_label_portal_analytics_impressions_total',
  help: 'Total number of ad impressions',
  registers: [register],
});

export const analyticsClicks = new Counter({
  name: 'white_label_portal_analytics_clicks_total',
  help: 'Total number of ad clicks',
  registers: [register],
});

// Report metrics
export const reportsGeneratedTotal = new Counter({
  name: 'white_label_portal_reports_generated_total',
  help: 'Total number of reports generated',
  labelNames: ['type', 'format'],
  registers: [register],
});

// Error metrics
export const errorsTotal = new Counter({
  name: 'white_label_portal_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'component'],
  registers: [register],
});

// Database metrics
export const dbOperationDuration = new Histogram({
  name: 'white_label_portal_db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Redis metrics
export const redisOperationDuration = new Histogram({
  name: 'white_label_portal_redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Middleware to track HTTP requests
export const metricsMiddleware = (
  req: { method: string; url: string },
  res: { statusCode: number },
  next: () => void
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.url.split('?')[0];

    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });

  next();
};

// Get metrics in Prometheus format
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

// Get metrics content type
export const getMetricsContentType = (): string => {
  return register.contentType;
};

// Reset all metrics (useful for testing)
export const resetMetrics = (): void => {
  register.resetMetrics();
};

export { register };
