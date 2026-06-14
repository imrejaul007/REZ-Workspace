import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import logger from '../config/logger.js';

const metricsLogger = logger.child({ component: 'MetricsMiddleware' });

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const eventsTotal = new client.Counter({
  name: 'events_total',
  help: 'Total number of events created',
  labelNames: ['type', 'status']
});

export const eventsActive = new client.Gauge({
  name: 'events_active',
  help: 'Number of active events',
  labelNames: ['type']
});

export const footfallPrediction = new client.Gauge({
  name: 'event_footfall_prediction',
  help: 'Predicted footfall for events',
  labelNames: ['type']
});

export const impactAnalysisDuration = new client.Histogram({
  name: 'impact_analysis_duration_seconds',
  help: 'Duration of impact analysis in seconds',
  labelNames: ['event_type']
});

export const merchantReach = new client.Gauge({
  name: 'merchant_reach_count',
  help: 'Number of merchants in event radius',
  labelNames: ['category']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(eventsTotal);
register.registerMetric(eventsActive);
register.registerMetric(footfallPrediction);
register.registerMetric(impactAnalysisDuration);
register.registerMetric(merchantReach);

/**
 * Metrics middleware
 * Tracks request duration and counts
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;

    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString()
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    metricsLogger.error('Failed to get metrics', { error });
    res.status(500).end();
  }
};

export { register };
export default metricsMiddleware;