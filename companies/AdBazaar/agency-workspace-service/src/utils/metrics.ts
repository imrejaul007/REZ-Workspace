import client from 'prom-client';

// Initialize Prometheus metrics
export const register = new client.Registry();

register.setDefaultLabel({ app: 'agency-workspace-service' });

// Collect default metrics
client.collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metrics
export const agencyCreatedTotal = new client.Counter({
  name: 'agency_created_total',
  help: 'Total number of agencies created'
});

export const clientAddedTotal = new client.Counter({
  name: 'client_added_total',
  help: 'Total number of clients added to agencies'
});

export const campaignCreatedTotal = new client.Counter({
  name: 'campaign_created_total',
  help: 'Total number of campaigns created'
});

export const activeAgenciesGauge = new client.Gauge({
  name: 'active_agencies',
  help: 'Number of active agencies'
});

export const totalRevenueGauges = new client.Gauge({
  name: 'agency_total_revenue',
  help: 'Total revenue across all agencies',
  labelNames: ['agency_id']
});

export const activeCampaignsGauge = new client.Gauge({
  name: 'active_campaigns',
  help: 'Number of active campaigns',
  labelNames: ['agency_id']
});

// Cache metrics
export const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits'
});

export const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(agencyCreatedTotal);
register.registerMetric(clientAddedTotal);
register.registerMetric(campaignCreatedTotal);
register.registerMetric(activeAgenciesGauge);
register.registerMetric(totalRevenueGauges);
register.registerMetric(activeCampaignsGauge);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

// Metrics endpoint
export const metricsHandler = async (req: any, res: any) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};