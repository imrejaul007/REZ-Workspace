import client, { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config';
import { logger } from './logger.service';
import { Channel, CampaignStatus, CampaignObjective } from '../types';

// Create custom registry
const register = new Registry();

// Add default metrics
collectDefaultMetrics({ register, prefix: `${config.metrics.prefix}_` });

// Campaign metrics counters
const campaignCreated = new Counter({
  name: `${config.metrics.prefix}_campaign_created_total`,
  help: 'Total number of campaigns created',
  labelNames: ['advertiser_id', 'objective', 'channel'],
  registers: [register],
});

const campaignLaunched = new Counter({
  name: `${config.metrics.prefix}_campaign_launched_total`,
  help: 'Total number of campaigns launched',
  labelNames: ['advertiser_id', 'objective', 'status'],
  registers: [register],
});

const campaignStatusChange = new Counter({
  name: `${config.metrics.prefix}_campaign_status_change_total`,
  help: 'Total number of campaign status changes',
  labelNames: ['from_status', 'to_status'],
  registers: [register],
});

// Message metrics
const messagesSent = new Counter({
  name: `${config.metrics.prefix}_messages_sent_total`,
  help: 'Total number of messages sent',
  labelNames: ['channel', 'campaign_id'],
  registers: [register],
});

const messagesDelivered = new Counter({
  name: `${config.metrics.prefix}_messages_delivered_total`,
  help: 'Total number of messages delivered',
  labelNames: ['channel', 'campaign_id'],
  registers: [register],
});

const messagesFailed = new Counter({
  name: `${config.metrics.prefix}_messages_failed_total`,
  help: 'Total number of failed messages',
  labelNames: ['channel', 'campaign_id', 'error_type'],
  registers: [register],
});

// Channel metrics
const channelRequests = new Counter({
  name: `${config.metrics.prefix}_channel_requests_total`,
  help: 'Total number of channel API requests',
  labelNames: ['channel', 'status'],
  registers: [register],
});

// Budget metrics
const budgetAllocated = new Gauge({
  name: `${config.metrics.prefix}_budget_allocated_total`,
  help: 'Total budget allocated across campaigns',
  labelNames: ['currency'],
  registers: [register],
});

const budgetSpent = new Gauge({
  name: `${config.metrics.prefix}_budget_spent_total`,
  help: 'Total budget spent across campaigns',
  labelNames: ['currency', 'channel'],
  registers: [register],
});

// Active campaigns gauge
const activeCampaigns = new Gauge({
  name: `${config.metrics.prefix}_active_campaigns`,
  help: 'Number of active campaigns',
  labelNames: ['objective', 'channel'],
  registers: [register],
});

// Performance histograms
const messageLatency = new Histogram({
  name: `${config.metrics.prefix}_message_send_latency_seconds`,
  help: 'Message send latency in seconds',
  labelNames: ['channel'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const apiLatency = new Histogram({
  name: `${config.metrics.prefix}_api_latency_seconds`,
  help: 'API request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// HTTP request counter
const httpRequests = new Counter({
  name: `${config.metrics.prefix}_http_requests_total`,
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

/**
 * Metrics Service
 * Handles Prometheus metrics collection and reporting
 */
export class MetricsService {
  private registry: Registry;

  constructor() {
    this.registry = register;
  }

  /**
   * Record campaign creation
   */
  recordCampaignCreated(advertiserId: string, objective: CampaignObjective, channels: Channel[]): void {
    for (const channel of channels) {
      campaignCreated.inc({ advertiser_id: advertiserId, objective, channel });
    }
  }

  /**
   * Record campaign launch
   */
  recordCampaignLaunched(advertiserId: string, objective: CampaignObjective, status: CampaignStatus): void {
    campaignLaunched.inc({ advertiser_id: advertiserId, objective, status });
  }

  /**
   * Record campaign status change
   */
  recordStatusChange(fromStatus: CampaignStatus, toStatus: CampaignStatus): void {
    campaignStatusChange.inc({ from_status: fromStatus, to_status: toStatus });
  }

  /**
   * Record message sent
   */
  recordMessageSent(channel: Channel, campaignId: string, count: number = 1): void {
    messagesSent.inc({ channel, campaign_id: campaignId }, count);
  }

  /**
   * Record message delivered
   */
  recordMessageDelivered(channel: Channel, campaignId: string, count: number = 1): void {
    messagesDelivered.inc({ channel, campaign_id: campaignId }, count);
  }

  /**
   * Record message failure
   */
  recordMessageFailed(channel: Channel, campaignId: string, errorType: string, count: number = 1): void {
    messagesFailed.inc({ channel, campaign_id: campaignId, error_type: errorType }, count);
  }

  /**
   * Record channel request
   */
  recordChannelRequest(channel: Channel, status: string): void {
    channelRequests.inc({ channel, status });
  }

  /**
   * Update budget metrics
   */
  updateBudgetMetrics(total: number, spent: number, currency: string): void {
    budgetAllocated.set({ currency }, total);
    budgetSpent.set({ currency, channel: 'total' }, spent);
  }

  /**
   * Update active campaigns count
   */
  updateActiveCampaigns(objective: CampaignObjective, channel: Channel, count: number): void {
    activeCampaigns.set({ objective, channel }, count);
  }

  /**
   * Record message send latency
   */
  recordMessageLatency(channel: Channel, durationSeconds: number): void {
    messageLatency.observe({ channel }, durationSeconds);
  }

  /**
   * Record API latency
   */
  recordApiLatency(method: string, route: string, status: number, durationSeconds: number): void {
    apiLatency.observe({ method, route, status: String(status) }, durationSeconds);
    httpRequests.inc({ method, route, status: String(status) });
  }

  /**
   * Get metrics for Prometheus scraping
   */
  async getMetrics(): Promise<string> {
    try {
      return await this.registry.metrics();
    } catch (error) {
      logger.error('Failed to collect metrics', error);
      return '';
    }
  }

  /**
   * Get metrics content type
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Reset all metrics (for testing)
   */
  async resetMetrics(): Promise<void> {
    this.registry.resetMetrics();
  }

  /**
   * Get current metric values
   */
  async getMetricValues(): Promise<Record<string, unknown>> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics.reduce((acc, metric) => {
      acc[metric.name] = metric.values;
      return acc;
    }, {} as Record<string, unknown>);
  }
}

export const metricsService = new MetricsService();

// Middleware for recording API latency
export function metricsMiddleware(req: { method: string; path: string }, res: { statusCode: number }, next: () => void): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metricsService.recordApiLatency(req.method, req.path, res.statusCode, duration);
  });

  next();
}

export default metricsService;