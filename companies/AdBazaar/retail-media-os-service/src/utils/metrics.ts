import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for Retail Media OS
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Retail Media specific metrics
export const retailersTotal = new client.Gauge({
  name: 'retail_media_retailers_total',
  help: 'Total number of registered retailers'
});

export const storesTotal = new client.Gauge({
  name: 'retail_media_stores_total',
  help: 'Total number of store locations'
});

export const campaignsTotal = new client.Gauge({
  name: 'retail_media_campaigns_total',
  help: 'Total number of active campaigns'
});

export const activeCampaigns = new client.Gauge({
  name: 'retail_media_active_campaigns',
  help: 'Number of currently active campaigns'
});

export const adImpressionsTotal = new client.Counter({
  name: 'retail_media_ad_impressions_total',
  help: 'Total number of ad impressions',
  labelNames: ['retailer_id', 'campaign_id']
});

export const adClicksTotal = new client.Counter({
  name: 'retail_media_ad_clicks_total',
  help: 'Total number of ad clicks',
  labelNames: ['retailer_id', 'campaign_id']
});

export const salesLiftTotal = new client.Gauge({
  name: 'retail_media_sales_lift_percent',
  help: 'Average sales lift percentage',
  labelNames: ['retailer_id']
});

export const inventoryUtilization = new client.Gauge({
  name: 'retail_media_inventory_utilization_percent',
  help: 'Retail media inventory utilization percentage',
  labelNames: ['retailer_id']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(retailersTotal);
register.registerMetric(storesTotal);
register.registerMetric(campaignsTotal);
register.registerMetric(activeCampaigns);
register.registerMetric(adImpressionsTotal);
register.registerMetric(adClicksTotal);
register.registerMetric(salesLiftTotal);
register.registerMetric(inventoryUtilization);

// Middleware for tracking request metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};

// Metrics endpoint handler
export const getMetrics = async () => {
  return register.metrics();
};

export const getContentType = () => {
  return register.contentType;
};

export default {
  register,
  httpRequestDuration,
  httpRequestTotal,
  metricsMiddleware,
  getMetrics,
  getContentType
};