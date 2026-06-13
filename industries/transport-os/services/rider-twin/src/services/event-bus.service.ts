/**
 * Event Bus Service
 *
 * Manages pub/sub communication with the REZ Event Bus
 * Handles events like order.created, journey.completed, etc.
 */

import { createLogger } from '../utils/logger';
import { validateEnv } from '../utils/validate-env';

const logger = createLogger('event-bus-service');

export type EventHandler = (event: Record<string, any>) => Promise<void>;

export interface EventSubscription {
  topic: string;
  handler: EventHandler;
  subscribedAt: string;
}

/**
 * Event Bus Service for pub/sub messaging
 */
export class EventBusService {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private connected: boolean = false;
  private eventBusUrl: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.eventBusUrl = validateEnv().EVENT_BUS_URL || 'http://localhost:4025';
    logger.info('event_bus_service_initialized', { eventBusUrl: this.eventBusUrl });
  }

  /**
   * Connect to the event bus
   */
  async connect(): Promise<boolean> {
    try {
      // In production, this would establish actual connection to event bus
      // For now, simulate connection
      this.connected = true;
      logger.info('event_bus_connected', { eventBusUrl: this.eventBusUrl });
      return true;
    } catch (error) {
      logger.error('event_bus_connection_failed', { error });
      return false;
    }
  }

  /**
   * Disconnect from the event bus
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
    logger.info('event_bus_disconnected');
  }

  /**
   * Subscribe to an event topic
   */
  subscribe(topic: string, handler: EventHandler): void {
    const subscription: EventSubscription = {
      topic,
      handler,
      subscribedAt: new Date().toISOString(),
    };

    const existing = this.subscriptions.get(topic) || [];
    existing.push(subscription);
    this.subscriptions.set(topic, existing);

    logger.info('event_subscription_created', {
      topic,
      totalHandlers: existing.length,
    });
  }

  /**
   * Unsubscribe a handler from a topic
   */
  unsubscribe(topic: string, handler: EventHandler): void {
    const existing = this.subscriptions.get(topic) || [];
    const filtered = existing.filter(s => s.handler !== handler);
    this.subscriptions.set(topic, filtered);

    logger.info('event_subscription_removed', {
      topic,
      remainingHandlers: filtered.length,
    });
  }

  /**
   * Publish an event to a topic
   */
  async publish(topic: string, event: Record<string, any>): Promise<void> {
    if (!this.connected) {
      logger.warn('event_bus_not_connected', { topic });
      return;
    }

    const enrichedEvent = {
      ...event,
      _publishedAt: new Date().toISOString(),
      _source: 'rider-twin',
    };

    logger.debug('event_published', { topic, eventType: event.event_type });

    // In production, this would send to actual event bus
    // For now, trigger local handlers
    await this.triggerHandlers(topic, enrichedEvent);
  }

  /**
   * Trigger all handlers for a topic
   */
  private async triggerHandlers(topic: string, event: Record<string, any>): Promise<void> {
    const handlers = this.subscriptions.get(topic) || [];

    for (const subscription of handlers) {
      try {
        await subscription.handler(event);
      } catch (error) {
        logger.error('event_handler_error', {
          topic,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const handlers of this.subscriptions.values()) {
      count += handlers.length;
    }
    return count;
  }

  /**
   * Get topics with handlers
   */
  getTopics(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// ============================================
// SUPPORTED TOPICS
// ============================================

export const RIDER_EVENTS = {
  ORDER_CREATED: 'transport.order.created',
  ORDER_ASSIGNED: 'transport.order.assigned',
  ORDER_COMPLETED: 'transport.order.completed',
  ORDER_CANCELLED: 'transport.order.cancelled',
  JOURNEY_STARTED: 'transport.journey.started',
  JOURNEY_COMPLETED: 'transport.journey.completed',
  RIDER_UPDATED: 'transport.rider.updated',
  RIDER_LOYALTY_CHANGED: 'transport.rider.loyalty_changed',
  PAYMENT_PROCESSED: 'transport.payment.processed',
} as const;

export const RIDER_QUERIES = {
  RIDER_STATUS: 'rider.status',
  RIDER_PREFERENCES: 'rider.preferences',
  RIDER_LOYALTY: 'rider.loyalty',
  RIDER_ACTIVITY: 'rider.activity',
} as const;
