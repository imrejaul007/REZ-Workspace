import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const ugcContentTotal = new client.Gauge({
  name: 'ugc_content_total',
  help: 'Total number of UGC content items',
  labelNames: ['status', 'platform']
});

export const ugcCampaignsActive = new client.Gauge({
  name: 'ugc_campaigns_active',
  help: 'Number of active UGC campaigns'
});

export const ugcRightsPending = new client.Gauge({
  name: 'ugc_rights_pending',
  help: 'Number of pending rights requests'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(ugcContentTotal);
register.registerMetric(ugcCampaignsActive);
register.registerMetric(ugcRightsPending);

/**
 * Middleware to track request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    next();
    return;
  }

  // Hook into response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
};

/**
 * Update content metrics
 */
export const updateContentMetrics = async (): Promise<void> => {
  try {
    const { UGCContent, UGCCampaign, UGCRights } = await import('../models');

    // Count content by status and platform
    const contentByStatus = await UGCContent.aggregate([
      { $group: { _id: { status: '$status', platform: '$platform' }, count: { $sum: 1 } } }
    ]);

    // Reset all content metrics
    ugcContentTotal.reset();

    // Set new values
    for (const item of contentByStatus) {
      ugcContentTotal.labels(item._id.status, item._id.platform).set(item.count);
    }

    // Count active campaigns
    const activeCampaigns = await UGCCampaign.countDocuments({ status: 'active' });
    ugcCampaignsActive.set(activeCampaigns);

    // Count pending rights
    const pendingRights = await UGCRights.countDocuments({ status: 'pending' });
    ugcRightsPending.set(pendingRights);
  } catch (error) {
    logger.error('Error updating metrics:', error);
  }
};

export { register as metricsRegister };
export default register;