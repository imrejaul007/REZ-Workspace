import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge, Registry } from 'prom-client';
import { config } from '../config';
import logger from 'utils/logger.js';

// Create a custom registry
const register = new Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Active requests gauge
const httpActiveRequests = new Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  registers: [register],
});

// Business metrics
const campaignsCreated = new Counter({
  name: 'campaigns_created_total',
  help: 'Total number of campaigns created',
  labelNames: ['type', 'status'],
  registers: [register],
});

const recommendationsGenerated = new Counter({
  name: 'recommendations_generated_total',
  help: 'Total number of recommendations generated',
  labelNames: ['priority'],
  registers: [register],
});

const activeManagers = new Gauge({
  name: 'ai_marketing_managers_active',
  help: 'Number of active AI marketing managers',
  registers: [register],
});

const campaignPerformance = new Histogram({
  name: 'campaign_performance_roas',
  help: 'Campaign ROAS distribution',
  buckets: [0, 0.5, 1, 2, 3, 5, 10],
  registers: [register],
});

/**
 * Metrics collection middleware
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Increment active requests
  httpActiveRequests.inc();

  // Track request completion
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    httpActiveRequests.dec();
  });

  next();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
};

/**
 * Health check endpoint handler
 */
export const healthHandler = (req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-marketing-manager',
    version: '1.0.0',
  });
};

/**
 * Record campaign creation
 */
export const recordCampaignCreated = (type: string, status: string): void => {
  campaignsCreated.inc({ type, status });
};

/**
 * Record recommendation generated
 */
export const recordRecommendationGenerated = (priority: string): void => {
  recommendationsGenerated.inc({ priority });
};

/**
 * Update active managers count
 */
export const updateActiveManagers = (count: number): void => {
  activeManagers.set(count);
};

/**
 * Record campaign performance
 */
export const recordCampaignPerformance = (roas: number): void => {
  campaignPerformance.observe(roas);
};

export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  httpActiveRequests,
  campaignsCreated,
  recommendationsGenerated,
  activeManagers,
  campaignPerformance,
};