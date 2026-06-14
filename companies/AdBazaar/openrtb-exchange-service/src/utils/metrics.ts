import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
export const registry = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: registry });

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'openrtb_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'openrtb_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry]
});

// Bid request counter
export const bidRequestsTotal = new Counter({
  name: 'openrtb_bid_requests_total',
  help: 'Total number of bid requests received',
  labelNames: ['status'],
  registers: [registry]
});

// Bid response counter
export const bidResponsesTotal = new Counter({
  name: 'openrtb_bid_responses_total',
  help: 'Total number of bid responses sent',
  labelNames: ['status', 'has_bids'],
  registers: [registry]
});

// Auction counter
export const auctionsTotal = new Counter({
  name: 'openrtb_auctions_total',
  help: 'Total number of auctions completed',
  labelNames: ['type', 'status'],
  registers: [registry]
});

// Active bids gauge
export const activeBidsGauge = new Gauge({
  name: 'openrtb_active_bids',
  help: 'Number of active bids in the exchange',
  registers: [registry]
});

// Active deals gauge
export const activeDealsGauge = new Gauge({
  name: 'openrtb_active_deals',
  help: 'Number of active deals in the exchange',
  registers: [registry]
});

// Seat count gauge
export const seatsGauge = new Gauge({
  name: 'openrtb_seats',
  help: 'Number of seats in the exchange',
  labelNames: ['status'],
  registers: [registry]
});

// Bid latency histogram
export const bidLatency = new Histogram({
  name: 'openrtb_bid_latency_seconds',
  help: 'Time to process bid requests',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registry]
});

// Auction value histogram
export const auctionValue = new Histogram({
  name: 'openrtb_auction_value_dollars',
  help: 'Winning auction values in dollars',
  buckets: [0.1, 0.5, 1, 5, 10, 25, 50, 100, 500, 1000],
  registers: [registry]
});

// Error counter
export const errorsTotal = new Counter({
  name: 'openrtb_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint'],
  registers: [registry]
});

// Metrics endpoint handler
export const metricsHandler = async () => {
  return registry.metrics();
};

// Get all metrics
export const getMetrics = async () => {
  return registry.getMetricsAsJSON();
};

export default registry;
