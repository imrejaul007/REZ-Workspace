import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { WebhookSubscription, IWebhookSubscription } from '../models/webhookSubscription.js';
import { WebhookEvent, IWebhookEvent } from '../models/webhookEvent.js';
import { generateSignature, generateWebhookSecret } from './signatureService.js';
import { logger } from '../utils/logger.js';
import { publishWebhookEvent, WebhookEventData } from './eventBus.js';

export interface CreateSubscriptionInput {
  url: string;
  events: string[];
  secret?: string;
  description?: string;
  headers?: Record<string, string>;
  createdBy: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  processingTimeMs: number;
}

class WebhookService {
  /**
   * Create a new webhook subscription
   */
  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<IWebhookSubscription> {
    const secret = input.secret || generateWebhookSecret();

    const subscription = new WebhookSubscription({
      url: input.url,
      events: input.events,
      secret,
      description: input.description,
      headers: input.headers || {},
      createdBy: input.createdBy,
    });

    await subscription.save();
    logger.info('Webhook subscription created', {
      subscriptionId: subscription._id,
      url: input.url,
      events: input.events,
    });

    return subscription;
  }

  /**
   * Get all subscriptions with optional filtering
   */
  async getSubscriptions(filter?: {
    events?: string[];
    isActive?: boolean;
    createdBy?: string;
  }): Promise<IWebhookSubscription[]> {
    const query: Record<string, unknown> = {};

    if (filter?.events?.length) {
      query.events = { $in: filter.events };
    }
    if (filter?.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter?.createdBy) {
      query.createdBy = filter.createdBy;
    }

    return WebhookSubscription.find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string): Promise<IWebhookSubscription | null> {
    return WebhookSubscription.findById(id).select('+secret');
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(id: string): Promise<boolean> {
    const result = await WebhookSubscription.findByIdAndDelete(id);
    if (result) {
      await WebhookEvent.deleteMany({ subscriptionId: id });
      logger.info('Webhook subscription deleted', { subscriptionId: id });
      return true;
    }
    return false;
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    updates: Partial<{
      url: string;
      events: string[];
      isActive: boolean;
      description: string;
      headers: Record<string, string>;
    }>
  ): Promise<IWebhookSubscription | null> {
    return WebhookSubscription.findByIdAndUpdate(id, updates, { new: true });
  }

  /**
   * Get webhook logs with filtering and pagination
   */
  async getLogs(options: {
    subscriptionId?: string;
    eventType?: string;
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    logs: IWebhookEvent[];
    total: number;
  }> {
    const query: Record<string, unknown> = {};

    if (options.subscriptionId) {
      query.subscriptionId = options.subscriptionId;
    }
    if (options.eventType) {
      query.eventType = options.eventType;
    }
    if (options.status) {
      query.status = options.status;
    }
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      WebhookEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(options.offset || 0)
        .limit(options.limit || 50)
        .populate('subscriptionId', 'url events'),
      WebhookEvent.countDocuments(query),
    ]);

    return { logs, total };
  }

  /**
   * Trigger webhooks for an event type
   */
  async triggerWebhooks(
    eventType: string,
    payload: Record<string, unknown>,
    options?: {
      source?: string;
      idempotencyKey?: string;
    }
  ): Promise<string[]> {
    // Find all active subscriptions for this event
    const subscriptions = await WebhookSubscription.find({
      events: eventType,
      isActive: true,
    });

    if (subscriptions.length === 0) {
      logger.debug('No subscriptions found for event type', { eventType });
      return [];
    }

    const eventIds: string[] = [];

    // Create events and publish to queue for processing
    for (const subscription of subscriptions) {
      const event = new WebhookEvent({
        subscriptionId: subscription._id,
        eventType,
        payload,
        headers: this.buildHeaders(subscription, payload),
        status: 'pending',
        maxAttempts: config.webhook.maxRetries,
      });

      await event.save();
      eventIds.push(event._id.toString());

      // Publish to event bus for async processing
      publishWebhookEvent({
        eventId: event._id.toString(),
        subscriptionId: subscription._id.toString(),
        url: subscription.url,
        secret: subscription.secret,
        eventType,
        payload,
        headers: Object.fromEntries(
          new Map(
            Object.entries(subscription.headers).map(([k, v]) => [k, String(v)])
          )
        ),
        attempt: 1,
      });
    }

    logger.info('Webhook events queued', {
      eventType,
      subscriptionCount: subscriptions.length,
      eventIds,
    });

    return eventIds;
  }

  /**
   * Deliver a webhook to the target URL
   */
  async deliverWebhook(eventId: string): Promise<WebhookDeliveryResult> {
    const event = await WebhookEvent.findById(eventId);
    if (!event) {
      throw new Error(`Webhook event not found: ${eventId}`);
    }

    const subscription = await WebhookSubscription.findById(
      event.subscriptionId
    ).select('+secret');

    if (!subscription) {
      throw new Error(
        `Subscription not found: ${event.subscriptionId}`
      );
    }

    const startTime = Date.now();

    try {
      const payloadStr = JSON.stringify(event.payload);
      const timestamp = Math.floor(Date.now() / 1000);

      const response = await axios.post(
        event.subscriptionId.toString(),
        {
          url: subscription.url,
          payload: event.payload,
          signature: generateSignature({
            timestamp,
            payload: payloadStr,
            secret: subscription.secret,
          }),
          headers: {
            ...event.headers,
            'Content-Type': 'application/json',
          },
        },
        {
          timeout: config.webhook.timeoutMs,
          validateStatus: () => true,
        }
      );

      const processingTimeMs = Date.now() - startTime;

      const result: WebhookDeliveryResult = {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        responseBody: typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data),
        processingTimeMs,
      };

      await this.updateEventStatus(event, result);

      return result;
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const result: WebhookDeliveryResult = {
        success: false,
        error: errorMessage,
        processingTimeMs,
      };

      await this.updateEventStatus(event, result);
      return result;
    }
  }

  /**
   * Test a webhook subscription by sending a test event
   */
  async testSubscription(
    subscriptionId: string
  ): Promise<WebhookDeliveryResult> {
    const subscription = await WebhookSubscription.findById(
      subscriptionId
    ).select('+secret');

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    const testPayload = {
      test: true,
      timestamp: Date.now(),
      message: 'This is a test webhook event',
      subscriptionId: subscription._id.toString(),
    };

    const startTime = Date.now();

    try {
      const payloadStr = JSON.stringify(testPayload);
      const timestamp = Math.floor(Date.now() / 1000);

      const response = await axios.post(subscription.url, testPayload, {
        timeout: config.webhook.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Signature': generateSignature({
            timestamp,
            payload: payloadStr,
            secret: subscription.secret,
          }),
          'X-Webhook-Timestamp': timestamp.toString(),
          ...Object.fromEntries(
            Object.entries(subscription.headers).map(([k, v]) => [
              k,
              String(v),
            ])
          ),
        },
        validateStatus: () => true,
      });

      const processingTimeMs = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        responseBody:
          typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data),
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      return {
        success: false,
        error:
          error instanceof AxiosError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Unknown error',
        processingTimeMs,
      };
    }
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks(): Promise<number> {
    const eventsToRetry = await WebhookEvent.find({
      status: { $in: ['failed', 'retrying'] },
      nextRetryAt: { $lte: new Date() },
      attempts: { $lt: config.webhook.maxRetries },
    }).limit(100);

    let retriedCount = 0;

    for (const event of eventsToRetry) {
      await this.deliverWebhook(event._id.toString());
      retriedCount++;
    }

    if (retriedCount > 0) {
      logger.info('Retried failed webhooks', { count: retriedCount });
    }

    return retriedCount;
  }

  /**
   * Process pending webhooks (called by queue worker)
   */
  async processWebhook(data: WebhookEventData): Promise<void> {
    const { eventId, url, secret, payload, headers } = data;
    const event = await WebhookEvent.findById(eventId);
    if (!event || event.status === 'success') {
      return;
    }

    event.attempts += 1;
    event.lastAttemptAt = new Date();
    event.status = 'retrying';
    await event.save();

    const startTime = Date.now();

    try {
      const payloadStr = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000);

      const response = await axios.post(url, payload, {
        timeout: config.webhook.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': data.eventType,
          'X-Webhook-Signature': generateSignature({
            timestamp,
            payload: payloadStr,
            secret,
          }),
          'X-Webhook-Timestamp': timestamp.toString(),
          ...headers,
        },
        validateStatus: () => true,
      });

      const processingTimeMs = Date.now() - startTime;

      if (response.status >= 200 && response.status < 300) {
        event.status = 'success';
        event.completedAt = new Date();
        event.processingTimeMs = processingTimeMs;
        event.response = {
          statusCode: response.status,
          body:
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data),
          headers: response.headers as Record<string, string>,
        };

        await WebhookSubscription.findByIdAndUpdate(
          event.subscriptionId,
          {
            $inc: { successCount: 1 },
            lastTriggeredAt: new Date(),
          }
        );
      } else {
        await this.handleFailure(event, {
          statusCode: response.status,
          body: typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data),
          processingTimeMs,
        });
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      await this.handleFailure(event, {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs,
      });
    }

    await event.save();
  }

  private async handleFailure(
    event: IWebhookEvent,
    result: { statusCode?: number; body?: string; error?: string; processingTimeMs: number }
  ): Promise<void> {
    const isLastAttempt = event.attempts >= event.maxAttempts;

    event.status = isLastAttempt ? 'failed' : 'retrying';
    event.completedAt = isLastAttempt ? new Date() : undefined;
    event.processingTimeMs = result.processingTimeMs;
    event.error = result.error
      ? { message: result.error }
      : {
          message: `HTTP ${result.statusCode}`,
        };

    if (!isLastAttempt) {
      const delay = config.webhook.retryDelayMs * Math.pow(2, event.attempts - 1);
      event.nextRetryAt = new Date(Date.now() + delay);

      publishWebhookEvent({
        eventId: event._id.toString(),
        subscriptionId: event.subscriptionId.toString(),
        url: '', // Will be fetched from subscription
        secret: '', // Will be fetched from subscription
        eventType: event.eventType,
        payload: event.payload as Record<string, unknown>,
        headers: Object.fromEntries(
          Object.entries(event.headers).map(([k, v]) => [k, String(v)])
        ),
        attempt: event.attempts + 1,
      });
    }

    await WebhookSubscription.findByIdAndUpdate(event.subscriptionId, {
      $inc: { failureCount: 1 },
    });
  }

  private buildHeaders(
    subscription: IWebhookSubscription,
    payload: Record<string, unknown>
  ): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadStr = JSON.stringify(payload);

    return {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'custom',
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-Signature': generateSignature({
        timestamp,
        payload: payloadStr,
        secret: subscription.secret,
      }),
      ...Object.fromEntries(
        Object.entries(subscription.headers).map(([k, v]) => [k, String(v)])
      ),
    };
  }

  private async updateEventStatus(
    event: IWebhookEvent,
    result: WebhookDeliveryResult
  ): Promise<void> {
    if (result.success) {
      event.status = 'success';
      event.completedAt = new Date();
      event.processingTimeMs = result.processingTimeMs;
      event.response = result.statusCode
        ? {
            statusCode: result.statusCode,
            body: result.responseBody || '',
            headers: {},
          }
        : undefined;

      await WebhookSubscription.findByIdAndUpdate(event.subscriptionId, {
        $inc: { successCount: 1 },
        lastTriggeredAt: new Date(),
      });
    } else {
      await this.handleFailure(event, {
        statusCode: result.statusCode,
        body: result.responseBody,
        error: result.error,
        processingTimeMs: result.processingTimeMs,
      });
    }

    await event.save();
  }
}

export const webhookService = new WebhookService();
