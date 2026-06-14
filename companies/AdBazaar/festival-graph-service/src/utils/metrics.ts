import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for festival-graph-service
export const httpRequestsTotal = new client.Counter({
  name: 'festival_graph_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'festival_graph_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const festivalCount = new client.Gauge({
  name: 'festival_graph_festivals_total',
  help: 'Total number of festivals in the system',
  labelNames: ['status', 'type'],
  registers: [register],
});

export const artistCount = new client.Gauge({
  name: 'festival_graph_artists_total',
  help: 'Total number of artists',
  registers: [register],
});

export const impressionsTotal = new client.Counter({
  name: 'festival_graph_impressions_total',
  help: 'Total number of ad impressions',
  labelNames: ['festival_id', 'channel'],
  registers: [register],
});

export const ticketSalesTotal = new client.Counter({
  name: 'festival_graph_ticket_sales_total',
  help: 'Total number of ticket sales',
  labelNames: ['festival_id'],
  registers: [register],
});

export const revenueTotal = new client.Counter({
  name: 'festival_graph_revenue_total',
  help: 'Total revenue in INR',
  labelNames: ['festival_id'],
  registers: [register],
});

export const cacheHits = new client.Counter({
  name: 'festival_graph_cache_hits_total',
  help: 'Total number of cache hits',
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: 'festival_graph_cache_misses_total',
  help: 'Total number of cache misses',
  registers: [register],
});

export const externalServiceCalls = new client.Counter({
  name: 'festival_graph_external_service_calls_total',
  help: 'Total number of external service calls',
  labelNames: ['service', 'status'],
  registers: [register],
});

export const externalServiceLatency = new client.Histogram({
  name: 'festival_graph_external_service_latency_seconds',
  help: 'Latency of external service calls in seconds',
  labelNames: ['service'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Middleware to track HTTP metrics
export function metricsMiddleware(req: any, res: any, next: () => void): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode,
      },
      duration
    );
  });

  next();
}

export { register };

// Function to get metrics
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

// Function to get content type
export function getContentType(): string {
  return register.contentType;
}