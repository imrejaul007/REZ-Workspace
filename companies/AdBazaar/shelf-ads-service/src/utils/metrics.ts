import client from 'prom-client';

// Initialize Prometheus metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for Shelf Ads Service
export const httpRequestDuration = new client.Histogram({
  name: 'shelf_ads_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new client.Counter({
  name: 'shelf_ads_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const storeCount = new client.Gauge({
  name: 'shelf_ads_stores_total',
  help: 'Total number of registered stores'
});

export const shelfCount = new client.Gauge({
  name: 'shelf_ads_shelves_total',
  help: 'Total number of shelves'
});

export const activeCampaigns = new client.Gauge({
  name: 'shelf_ads_active_campaigns',
  help: 'Number of active shelf ad campaigns'
});

export const adImpressionsTotal = new client.Counter({
  name: 'shelf_ads_impressions_total',
  help: 'Total number of ad impressions',
  labelNames: ['campaign_id', 'shelf_id']
});

export const adClicksTotal = new client.Counter({
  name: 'shelf_ads_clicks_total',
  help: 'Total number of ad clicks',
  labelNames: ['campaign_id', 'shelf_id']
});

export const salesLiftPercentage = new client.Gauge({
  name: 'shelf_ads_sales_lift_percentage',
  help: 'Average sales lift percentage',
  labelNames: ['campaign_id']
});

export const campaignBudget = new client.Gauge({
  name: 'shelf_ads_campaign_budget_spent',
  help: 'Campaign budget spent',
  labelNames: ['campaign_id']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(storeCount);
register.registerMetric(shelfCount);
register.registerMetric(activeCampaigns);
register.registerMetric(adImpressionsTotal);
register.registerMetric(adClicksTotal);
register.registerMetric(salesLiftPercentage);
register.registerMetric(campaignBudget);

export { register };
export default register;