/**
 * Prometheus Metrics Middleware
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import logger from '../utils/logger';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const campaignCreatedTotal = new client.Counter({
  name: 'whatsapp_campaign_created_total',
  help: 'Total number of campaigns created',
  labelNames: ['template_type'],
  registers: [register],
});

export const campaignSentTotal = new client.Counter({
  name: 'whatsapp_campaign_sent_total',
  help: 'Total number of campaigns sent',
  labelNames: ['status'],
  registers: [register],
});

export const campaignMessagesTotal = new client.Counter({
  name: 'whatsapp_campaign_messages_total',
  help: 'Total messages sent across all campaigns',
  labelNames: ['campaign_id', 'status'],
  registers: [register],
});

export const activeCampaignsGauge = new client.Gauge({
  name: 'whatsapp_active_campaigns',
  help: 'Number of currently active campaigns',
  registers: [register],
});

// Metrics middleware
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = normalizePath(req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status_code: res.statusCode,
      },
      duration
    );

    // Log slow requests
    if (duration > 5) {
      logger.warn('Slow request detected', {
        method: req.method,
        path,
        duration: `${duration}s`,
      });
    }
  });

  next();
}

// Normalize paths to avoid high cardinality
function normalizePath(path: string): string {
  // Replace IDs with placeholder
  return path
    .replace(/\/[a-f0-9-]{24,}/gi, '/:id')
    .replace(/\/wa-[a-z0-9-]+/gi, '/:campaignId')
    .replace(/\/msg-[a-z0-9-]+/gi, '/:messageId');
}

// Metrics endpoint handler
export async function getMetrics(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    logger.error('Failed to get metrics', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    res.status(500).send('Failed to get metrics');
  }
}

// Health check endpoint
export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'healthy',
    service: 'whatsapp-campaign-automation',
    timestamp: new Date().toISOString(),
  });
}

// Readiness check endpoint
export async function readinessCheck(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Check MongoDB
    const mongoose = await import('mongoose');
    const mongoOk = mongoose.connection.readyState === 1;

    if (!mongoOk) {
      res.status(503).json({
        ready: false,
        error: 'MongoDB not connected',
      });
      return;
    }

    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export { register };