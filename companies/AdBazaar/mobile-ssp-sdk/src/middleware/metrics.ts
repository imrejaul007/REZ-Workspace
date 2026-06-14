import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for SSP service

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: 'ssp_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'ssp_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Ad request counter
export const adRequestsTotal = new client.Counter({
  name: 'ssp_ad_requests_total',
  help: 'Total number of ad requests',
  labelNames: ['platform', 'ad_format', 'status'],
  registers: [register],
});

// Ad fill rate gauge
export const adFillRate = new client.Gauge({
  name: 'ssp_ad_fill_rate',
  help: 'Ad fill rate percentage',
  labelNames: ['platform', 'ad_format'],
  registers: [register],
});

// Impression counter
export const impressionsTotal = new client.Counter({
  name: 'ssp_impressions_total',
  help: 'Total number of impressions',
  labelNames: ['platform', 'ad_format'],
  registers: [register],
});

// Click counter
export const clicksTotal = new client.Counter({
  name: 'ssp_clicks_total',
  help: 'Total number of clicks',
  labelNames: ['platform', 'ad_format'],
  registers: [register],
});

// CTR (Click-through rate) gauge
export const ctrGauge = new client.Gauge({
  name: 'ssp_ctr',
  help: 'Click-through rate percentage',
  labelNames: ['platform', 'ad_format'],
  registers: [register],
});

// Active publishers gauge
export const activePublishersGauge = new client.Gauge({
  name: 'ssp_active_publishers',
  help: 'Number of active publishers',
  registers: [register],
});

// Active apps gauge
export const activeAppsGauge = new client.Gauge({
  name: 'ssp_active_apps',
  help: 'Number of active apps',
  registers: [register],
});

// Revenue counter
export const revenueTotal = new client.Counter({
  name: 'ssp_revenue_total',
  help: 'Total revenue generated',
  labelNames: ['currency'],
  registers: [register],
});

// Ad response time histogram
export const adResponseTimeSeconds = new client.Histogram({
  name: 'ssp_ad_response_time_seconds',
  help: 'Time to respond to ad requests',
  labelNames: ['platform', 'ad_format'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

// Redis cache hit/miss
export const cacheHits = new client.Counter({
  name: 'ssp_cache_hits_total',
  help: 'Total number of cache hits',
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: 'ssp_cache_misses_total',
  help: 'Total number of cache misses',
  registers: [register],
});

/**
 * Metrics middleware - tracks request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    next();
    return;
  }

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
};

/**
 * Get metrics endpoint handler
 */
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

/**
 * Get content type for metrics
 */
export const getMetricsContentType = (): string => {
  return register.contentType;
};

export { register };