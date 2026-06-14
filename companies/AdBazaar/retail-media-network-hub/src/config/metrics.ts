import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Default metrics
client.collectDefaultMetrics({ register });

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
 registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Business metrics
export const campaignCreatedTotal = new Counter({
  name: 'retail_media_campaign_created_total',
  help: 'Total number of campaigns created',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const campaignBudgetSpent = new Histogram({
  name: 'retail_media_campaign_budget_spent',
  help: 'Campaign budget spent in rupees',
  labelNames: ['type'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register],
});

export const activeCampaignsGauge = new Gauge({
  name: 'retail_media_active_campaigns',
  help: 'Number of active campaigns',
  labelNames: ['type'],
  registers: [register],
});

export const adImpressionsTotal = new Counter({
  name: 'retail_media_ad_impressions_total',
  help: 'Total number of ad impressions',
  labelNames: ['campaign_type'],
  registers: [register],
});

export const adClicksTotal = new Counter({
  name: 'retail_media_ad_clicks_total',
  help: 'Total number of ad clicks',
  labelNames: ['campaign_type'],
  registers: [register],
});

export const adOrdersTotal = new Counter({
  name: 'retail_media_ad_orders_total',
  help: 'Total number of orders from ads',
  labelNames: ['campaign_type'],
  registers: [register],
});

export const adRevenueTotal = new Counter({
  name: 'retail_media_ad_revenue_total',
  help: 'Total revenue from ads in rupees',
  labelNames: ['campaign_type'],
  registers: [register],
});

export const sponsoredProductCreatedTotal = new Counter({
  name: 'retail_media_sponsored_product_created_total',
  help: 'Total number of sponsored products created',
  registers: [register],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Cache metrics
export const cacheHitTotal = new Counter({
  name: 'cache_hit_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissTotal = new Counter({
  name: 'cache_miss_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export { register };
