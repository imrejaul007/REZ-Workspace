import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

export const hashtagSearchCounter = new client.Counter({
  name: 'hashtag_search_total',
  help: 'Total number of hashtag searches',
  labelNames: ['type'],
});
register.registerMetric(hashtagSearchCounter);

export const hashtagCacheHits = new client.Counter({
  name: 'hashtag_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['type'],
});
register.registerMetric(hashtagCacheHits);

export const trendingHashtagGauge = new client.Gauge({
  name: 'trending_hashtags_count',
  help: 'Number of trending hashtags',
});
register.registerMetric(trendingHashtagGauge);

export const hashtagSetCounter = new client.Counter({
  name: 'hashtag_sets_created_total',
  help: 'Total number of hashtag sets created',
});
register.registerMetric(hashtagSetCounter);