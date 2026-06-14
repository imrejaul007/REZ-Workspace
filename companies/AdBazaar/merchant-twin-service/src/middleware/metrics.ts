/**
 * Prometheus Metrics
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// HTTP request counter
const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections gauge
const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Merchant twin specific metrics
const merchantTwinsCreated = new client.Counter({
  name: 'merchant_twins_created_total',
  help: 'Total number of merchant twins created',
  registers: [register],
});

const merchantTwinsRetrieved = new client.Counter({
  name: 'merchant_twins_retrieved_total',
  help: 'Total number of merchant twin retrievals',
  registers: [register],
});

const audienceInsightsGenerated = new client.Counter({
  name: 'audience_insights_generated_total',
  help: 'Total number of audience insights generated',
  registers: [register],
});

const advertisingInsightsGenerated = new client.Counter({
  name: 'advertising_insights_generated_total',
  help: 'Total number of advertising insights generated',
  registers: [register],
});

// Metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
}

// Metrics endpoint
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

// Export metrics for manual use
export const metrics = {
  merchantTwinsCreated: () => merchantTwinsCreated.inc(),
  merchantTwinsRetrieved: () => merchantTwinsRetrieved.inc(),
  audienceInsightsGenerated: () => audienceInsightsGenerated.inc(),
  advertisingInsightsGenerated: () => advertisingInsightsGenerated.inc(),
};

export { register };
export default register;