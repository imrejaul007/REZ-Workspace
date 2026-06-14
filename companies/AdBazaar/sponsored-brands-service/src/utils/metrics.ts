import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

register.registerMetric(httpRequestDuration);

export const campaignCounter = new client.Counter({
  name: 'sponsored_brands_campaigns_total',
  help: 'Total number of sponsored brand campaigns',
  labelNames: ['status', 'advertiser_id']
});

register.registerMetric(campaignCounter);

export const keywordCounter = new client.Counter({
  name: 'sponsored_brands_keywords_total',
  help: 'Total number of keywords',
  labelNames: ['campaign_id', 'match_type', 'status']
});

register.registerMetric(keywordCounter);

export const impressionsGauge = new client.Gauge({
  name: 'sponsored_brands_impressions_total',
  help: 'Total impressions for sponsored brand campaigns',
  labelNames: ['campaign_id']
});

register.registerMetric(impressionsGauge);

export const clicksGauge = new client.Gauge({
  name: 'sponsored_brands_clicks_total',
  help: 'Total clicks for sponsored brand campaigns',
  labelNames: ['campaign_id']
});

register.registerMetric(clicksGauge);

export const spendGauge = new client.Gauge({
  name: 'sponsored_brands_spend_total',
  help: 'Total spend for sponsored brand campaigns in cents',
  labelNames: ['campaign_id']
});

register.registerMetric(spendGauge);

export const roasGauge = new client.Gauge({
  name: 'sponsored_brands_roas',
  help: 'Return on ad spend for campaigns',
  labelNames: ['campaign_id']
});

register.registerMetric(roasGauge);

export const bidGauge = new client.Gauge({
  name: 'sponsored_brands_keyword_bid',
  help: 'Current bid for keywords',
  labelNames: ['campaign_id', 'keyword_id']
});

register.registerMetric(bidGauge);

export const activeCampaignsGauge = new client.Gauge({
  name: 'sponsored_brands_active_campaigns',
  help: 'Number of active sponsored brand campaigns',
  labelNames: ['advertiser_id']
});

register.registerMetric(activeCampaignsGauge);

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestsTotal);

export const errorCounter = new client.Counter({
  name: 'sponsored_brands_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'service']
});

register.registerMetric(errorCounter);

export const cacheHitsCounter = new client.Counter({
  name: 'sponsored_brands_cache_hits_total',
  help: 'Total number of cache hits'
});

register.registerMetric(cacheHitsCounter);

export const cacheMissesCounter = new client.Counter({
  name: 'sponsored_brands_cache_misses_total',
  help: 'Total number of cache misses'
});

register.registerMetric(cacheMissesCounter);

export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

export const getContentType = (): string => {
  return register.contentType;
};

export default register;