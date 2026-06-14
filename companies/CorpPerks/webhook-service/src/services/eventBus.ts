import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export interface WebhookEventData {
  eventId: string;
  subscriptionId: string;
  url: string;
  secret: string;
  eventType: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  attempt: number;
}

type WebhookEventHandler = (data: WebhookEventData) => Promise<void>;

class EventBus {
  private handlers: Map<string, WebhookEventHandler[]> = new Map();
  private processingQueue: WebhookEventData[] = [];
  private isProcessing = false;
  private maxConcurrent = 5;
  private activeCount = 0;

  /**
   * Subscribe to webhook events
   */
  on(eventType: string, handler: WebhookEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Publish a webhook event
   */
  publish(eventType: string, data: WebhookEventData): void {
    this.processingQueue.push(data);
    this.scheduleProcessing();
    logger.debug('Webhook event published', { eventType, eventId: data.eventId });
  }

  /**
   * Get queue stats
   */
  getStats(): { queueLength: number; activeCount: number } {
    return {
      queueLength: this.processingQueue.length,
      activeCount: this.activeCount,
    };
  }

  private scheduleProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processingQueue.length === 0 || this.activeCount >= this.maxConcurrent) {
      this.isProcessing = false;
      return;
    }

    const event = this.processingQueue.shift();
    if (!event) {
      this.isProcessing = false;
      return;
    }

    this.activeCount++;

    try {
      const handlers = this.handlers.get(event.eventType) || [];
      await Promise.all(handlers.map((handler) => handler(event)));
    } catch (error) {
      logger.error('Error processing webhook event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }
}

export const webhookEventBus = new EventBus();

/**
 * Publish webhook event to queue
 */
export function publishWebhookEvent(data: WebhookEventData): void {
  webhookEventBus.publish('webhook:deliver', data);
}

/**
 * Register webhook delivery handler
 */
export function registerWebhookHandler(
  handler: WebhookEventHandler
): void {
  webhookEventBus.on('webhook:deliver', handler);
}
