import client, {
  Registry,
  Counter,
  Histogram,
  Gauge,
  Summary,
  collectDefaultMetrics
} from 'prom-client';

// Create custom registry
const register = new Registry();

// Collect default metrics
collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metrics
export const publisherCount = new Gauge({
  name: 'publisher_os_publishers_total',
  help: 'Total number of publishers',
  labelNames: ['status', 'verified']
});

export const inventoryCount = new Gauge({
  name: 'publisher_os_inventory_total',
  help: 'Total number of inventory items',
  labelNames: ['publisher_id', 'type', 'enabled']
});

export const placementCount = new Gauge({
  name: 'publisher_os_placements_total',
  help: 'Total number of placements',
  labelNames: ['publisher_id', 'status']
});

// Revenue metrics
export const revenueTotal = new Counter({
  name: 'publisher_os_revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['publisher_id', 'currency']
});

export const impressionsTotal = new Counter({
  name: 'publisher_os_impressions_total',
  help: 'Total number of impressions',
  labelNames: ['publisher_id', 'ad_type']
});

export const bidsTotal = new Counter({
  name: 'publisher_os_bids_total',
  help: 'Total number of bid requests',
  labelNames: ['publisher_id']
});

export const winsTotal = new Counter({
  name: 'publisher_os_wins_total',
  help: 'Total number of bid wins',
  labelNames: ['publisher_id']
});

// eCPM metrics
export const ecpmGauge = new Gauge({
  name: 'publisher_os_ecpm_current',
  help: 'Current effective CPM',
  labelNames: ['publisher_id', 'ad_type']
});

// Floor price metrics
export const floorPriceGauge = new Gauge({
  name: 'publisher_os_floor_price_current',
  help: 'Current floor price',
  labelNames: ['publisher_id', 'inventory_id', 'type']
});

// Database operation metrics
export const dbOperationDuration = new Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection']
});

export const dbOperationTotal = new Counter({
  name: 'db_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'collection', 'status']
});

// Redis operation metrics
export const redisOperationDuration = new Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation']
});

export const redisOperationTotal = new Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status']
});

// Error metrics
export const errorTotal = new Counter({
  name: 'publisher_os_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code']
});

// Register all metrics
register.register(httpRequestDuration);
register.register(httpRequestTotal);
register.register(publisherCount);
register.register(inventoryCount);
register.register(placementCount);
register.register(revenueTotal);
register.register(impressionsTotal);
register.register(bidsTotal);
register.register(winsTotal);
register.register(ecpmGauge);
register.register(floorPriceGauge);
register.register(dbOperationDuration);
register.register(dbOperationTotal);
register.register(redisOperationDuration);
register.register(redisOperationTotal);
register.register(errorTotal);

// Export registry
export { register };

// Helper function to record HTTP request
export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void => {
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  httpRequestTotal.inc({ method, route, status_code: statusCode });
};

// Helper function to record business metrics
export const recordRevenue = (
  publisherId: string,
  currency: string,
  amount: number
): void => {
  revenueTotal.inc({ publisher_id: publisherId, currency }, amount);
};

export const recordImpression = (
  publisherId: string,
  adType: string
): void => {
  impressionsTotal.inc({ publisher_id: publisherId, ad_type: adType });
};

export const recordError = (type: string, code: string): void => {
  errorTotal.inc({ type, code });
};

export default register;
