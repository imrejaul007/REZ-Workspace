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

export const couponsCreated = new Counter({
  name: 'coupons_created_total',
  help: 'Total number of coupons created',
  registers: [register],
});

export const couponsRedeemed = new Counter({
  name: 'coupons_redeemed_total',
  help: 'Total number of coupon redemptions',
  labelNames: ['coupon_id'],
  registers: [register],
});

export const discountGiven = new Counter({
  name: 'discount_given_total',
  help: 'Total discount given',
  labelNames: ['currency'],
  registers: [register],
});

export const activeCoupons = new Gauge({
  name: 'active_coupons',
  help: 'Number of currently active coupons',
  registers: [register],
});

export { register };