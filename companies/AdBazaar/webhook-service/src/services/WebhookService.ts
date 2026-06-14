import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { Webhook, IWebhook } from '../models/Webhook';
import { WebhookLog, IWebhookLog } from '../models/WebhookLog';
import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import { webhookDeliveriesTotal, webhookDeliveryDuration, activeWebhooksGauge, webhookQueueSize } from '../utils/metrics';

export class WebhookService {
  private redisClient: RedisClientType | null = null;
  private isProcessing = false;

  async initialize(): Promise<void> {
    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      await this.redisClient.connect();
      logger.info('Redis connected for webhook queue');
    } catch (error) {
      logger.warn('Redis not available, using in-memory queue');
    }
  }

  async createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
    headers?: Record<string, string>;
    retryPolicy?: IWebhook['retryPolicy'];
    filters?: IWebhook['filters'];
    ownerId: string;
    metadata?: Record<string, unknown>;
  }): Promise<IWebhook> {
    const secret = data.secret || crypto.randomBytes(32).toString('hex');

    const webhook = new Webhook({
      ...data,
      secret,
      active: true,
    });

    await webhook.save();
    await this.updateActiveWebhooksGauge();

    logger.info(`Webhook created: ${webhook._id}`, { name: data.name, events: data.events });
    return webhook;
  }

  async getWebhook(id: string): Promise<IWebhook | null> {
    return Webhook.findById(id);
  }

  async getWebhooksByOwner(ownerId: string): Promise<IWebhook[]> {
    return Webhook.find({ ownerId, active: true }).sort({ createdAt: -1 });
  }

  async updateWebhook(id: string, updates: Partial<IWebhook>): Promise<IWebhook | null> {
    const webhook = await Webhook.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    await this.updateActiveWebhooksGauge();
    return webhook;
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const result = await Webhook.findByIdAndDelete(id);
    if (result) {
      await this.updateActiveWebhooksGauge();
      logger.info(`Webhook deleted: ${id}`);
      return true;
    }
    return false;
  }

  async toggleWebhook(id: string, active: boolean): Promise<IWebhook | null> {
    return this.updateWebhook(id, { active });
  }

  async triggerWebhooks(event: string, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await Webhook.find({
      events: event,
      active: true,
    });

    for (const webhook of webhooks) {
      if (this.shouldTrigger(webhook, payload)) {
        await this.queueWebhookDelivery(webhook, event, payload);
      }
    }

    logger.info(`Triggered ${webhooks.length} webhooks for event: ${event}`);
  }

  private shouldTrigger(webhook: IWebhook, payload: Record<string, unknown>): boolean {
    if (!webhook.filters) return true;

    if (webhook.filters.campaignTypes?.length) {
      const campaignType = payload.campaignType as string;
      if (!webhook.filters.campaignTypes.includes(campaignType)) return false;
    }

    if (webhook.filters.advertisers?.length) {
      const advertiserId = payload.advertiserId as string;
      if (!webhook.filters.advertisers.includes(advertiserId)) return false;
    }

    if (webhook.filters.minBudget) {
      const budget = payload.budget as number;
      if (budget < webhook.filters.minBudget) return false;
    }

    return true;
  }

  private async queueWebhookDelivery(
    webhook: IWebhook,
    event: string,
    payload: Record<string, unknown>
  ): Promise<IWebhookLog> {
    const log = new WebhookLog({
      webhookId: webhook._id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      headers: webhook.headers as Record<string, string>,
    });
    await log.save();

    const queueItem = JSON.stringify({ logId: log._id, webhookId: webhook._id });

    if (this.redisClient) {
      await this.redisClient.lPush('webhook:queue', queueItem);
      await webhookQueueSize.inc();
    } else {
      this.processQueue();
    }

    return log;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        let queueItem: string | null = null;

        if (this.redisClient) {
          queueItem = await this.redisClient.rPop('webhook:queue');
          if (!queueItem) break;
          await webhookQueueSize.dec();
        }

        const { logId } = queueItem ? JSON.parse(queueItem) : { logId: null };

        if (logId) {
          await this.deliverWebhook(logId as unknown as string);
        }
      }
    } catch (error) {
      logger.error('Error processing webhook queue', { error });
    } finally {
      this.isProcessing = false;
    }
  }

  async deliverWebhook(logId: string): Promise<void> {
    const log = await WebhookLog.findById(logId);
    if (!log) return;

    const webhook = await Webhook.findById(log.webhookId);
    if (!webhook) {
      log.status = 'failed';
      log.error = 'Webhook not found';
      await log.save();
      return;
    }

    const startTime = Date.now();
    const signature = this.generateSignature(log.payload, webhook.secret);

    try {
      const response = await axios.post(webhook.url, log.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': log.event,
          'X-Webhook-Timestamp': new Date().toISOString(),
          ...(log.headers || {}),
        },
        timeout: 30000,
      });

      log.status = 'delivered';
      log.responseCode = response.status;
      log.responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      log.duration = Date.now() - startTime;
      log.attempts += 1;
      log.lastAttemptAt = new Date();

      webhookDeliveriesTotal.labels('success', log.event).inc();
      webhookDeliveryDuration.observe({ status: 'success' }, log.duration / 1000);

      await this.updateWebhookSuccessRate(webhook._id as string);
      logger.info(`Webhook delivered successfully: ${logId}`, { status: log.responseCode });
    } catch (error) {
      const axiosError = error as AxiosError;
      log.attempts += 1;
      log.lastAttemptAt = new Date();
      log.duration = Date.now() - startTime;
      log.responseCode = axiosError.response?.status;
      log.responseBody = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : undefined;
      log.error = axiosError.message;

      webhookDeliveriesTotal.labels('failed', log.event).inc();
      webhookDeliveryDuration.observe({ status: 'failed' }, log.duration / 1000);

      if (log.attempts < webhook.retryPolicy.maxRetries) {
        log.status = 'retrying';
        const delay = webhook.retryPolicy.retryDelay * Math.pow(webhook.retryPolicy.backoffMultiplier, log.attempts - 1);
        log.nextRetryAt = new Date(Date.now() + delay);
        logger.warn(`Webhook delivery failed, scheduling retry: ${logId}`, {
          attempt: log.attempts,
          nextRetry: log.nextRetryAt
        });
      } else {
        log.status = 'failed';
        logger.error(`Webhook delivery failed after ${log.attempts} attempts: ${logId}`, {
          error: log.error
        });
      }

      await this.updateWebhookSuccessRate(webhook._id as string);
    }

    await log.save();
  }

  private generateSignature(payload: Record<string, unknown>, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  private async updateWebhookSuccessRate(webhookId: string): Promise<void> {
    const stats = await WebhookLog.aggregate([
      { $match: { webhookId: webhookId as unknown as typeof import('mongoose').Types.ObjectId } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
      }},
    ]);

    if (stats.length > 0) {
      const rate = stats[0].total > 0 ? (stats[0].delivered / stats[0].total) * 100 : 0;
      await Webhook.findByIdAndUpdate(webhookId, {
        successRate: Math.round(rate * 100) / 100,
        lastTriggeredAt: new Date(),
      });
    }
  }

  async testWebhook(webhookId: string): Promise<IWebhookLog> {
    const webhook = await Webhook.findById(webhookId);
    if (!webhook) throw new Error('Webhook not found');

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook._id,
      },
    };

    const log = await this.queueWebhookDelivery(webhook, 'test', testPayload);

    setTimeout(() => this.deliverWebhook((log._id as unknown) as string), 100);

    return log;
  }

  async getWebhookLogs(webhookId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ logs: IWebhookLog[]; total: number }> {
    const { page = 1, limit = 50, status } = options;
    const query: Record<string, unknown> = { webhookId };

    if (status) {
      query.status = status;
    }

    const [logs, total] = await Promise.all([
      WebhookLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WebhookLog.countDocuments(query),
    ]);

    return { logs, total };
  }

  async retryFailedWebhooks(): Promise<number> {
    const failedLogs = await WebhookLog.find({
      status: 'retrying',
      nextRetryAt: { $lte: new Date() },
    }).limit(100);

    for (const log of failedLogs) {
      await this.deliverWebhook((log._id as unknown) as string);
    }

    return failedLogs.length;
  }

  private async updateActiveWebhooksGauge(): Promise<void> {
    const count = await Webhook.countDocuments({ active: true });
    activeWebhooksGauge.set(count);
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const webhookService = new WebhookService();