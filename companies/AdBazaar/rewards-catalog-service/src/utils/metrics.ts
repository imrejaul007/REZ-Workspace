import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const rewardsCreated = new Counter({
  name: 'rewards_created_total',
  help: 'Total number of rewards created',
  registers: [register],
});

export const redemptions = new Counter({
  name: 'reward_redemptions_total',
  help: 'Total number of reward redemptions',
  labelNames: ['reward_id'],
  registers: [register],
});

export const inventoryUsed = new Counter({
  name: 'inventory_used_total',
  help: 'Total inventory used',
  labelNames: ['reward_id'],
  registers: [register],
});

export const activeRewards = new Gauge({
  name: 'active_rewards',
  help: 'Number of active rewards in catalog',
  registers: [register],
});

export { register };