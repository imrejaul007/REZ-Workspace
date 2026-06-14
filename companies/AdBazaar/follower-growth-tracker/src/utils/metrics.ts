import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for follower growth tracker
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const followerGrowthGauge = new client.Gauge({
  name: 'follower_growth_current',
  help: 'Current follower count',
  labelNames: ['account_id'],
});

export const followerChangeGauge = new client.Gauge({
  name: 'follower_change_daily',
  help: 'Daily follower change',
  labelNames: ['account_id'],
});

export const growthRateGauge = new client.Gauge({
  name: 'growth_rate_percentage',
  help: 'Growth rate percentage',
  labelNames: ['account_id', 'period'],
});

export const unfollowCounter = new client.Counter({
  name: 'unfollow_events_total',
  help: 'Total number of unfollow events',
  labelNames: ['account_id'],
});

export const milestoneReachedCounter = new client.Counter({
  name: 'milestone_reached_total',
  help: 'Total number of milestones reached',
  labelNames: ['account_id', 'milestone'],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(followerGrowthGauge);
register.registerMetric(followerChangeGauge);
register.registerMetric(growthRateGauge);
register.registerMetric(unfollowCounter);
register.registerMetric(milestoneReachedCounter);