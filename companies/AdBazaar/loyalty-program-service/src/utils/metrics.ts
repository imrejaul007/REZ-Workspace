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

export const programsCreated = new Counter({
  name: 'programs_created_total',
  help: 'Total number of loyalty programs created',
  registers: [register],
});

export const enrollments = new Counter({
  name: 'loyalty_enrollments_total',
  help: 'Total number of loyalty enrollments',
  registers: [register],
});

export const pointsEarned = new Counter({
  name: 'points_earned_total',
  help: 'Total points earned',
  labelNames: ['program_id'],
  registers: [register],
});

export const pointsRedeemed = new Counter({
  name: 'points_redeemed_total',
  help: 'Total points redeemed',
  labelNames: ['program_id'],
  registers: [register],
});

export const activeMembers = new Gauge({
  name: 'active_loyalty_members',
  help: 'Number of active loyalty members',
  labelNames: ['program_id'],
  registers: [register],
});

export { register };