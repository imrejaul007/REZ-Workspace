/**
 * Coin Sync Engine - Event-driven sync via Redis pub/sub
 * Handles real-time coin balance synchronization across services
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CoinType,
  CoinSyncEvent,
  TierChangedEvent,
  TransactionType,
} from '../types/index.js';
import { pub, sub, LOYALTY_CHANNELS, redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/services.js';

type EventHandler = (event: CoinSyncEvent) => Promise<void>;

export class CoinSyncEngine {
  private handlers: Map<string, EventHandler[]> = new Map();
  private processedEvents: Set<string> = new Set(); // For idempotency
  private isSubscribed = false;

  constructor() {
    // Initialize handlers map
    Object.values(LOYALTY_CHANNELS).forEach(channel => {
      this.handlers.set(channel, []);
    });
  }

  /**
   * Start listening to Redis channels
   */
  async start(): Promise<void> {
    if (this.isSubscribed) {
      logger.warn('[CoinSyncEngine] Already subscribed');
      return;
    }

    logger.info('[CoinSyncEngine] Starting Redis subscriptions...');

    // Subscribe to all channels
    await sub.subscribe(
      LOYALTY_CHANNELS.COIN_EARNED,
      LOYALTY_CHANNELS.COIN_REDEEMED,
      LOYALTY_CHANNELS.COIN_EXPIRED,
      LOYALTY_CHANNELS.TIER_CHANGED,
      LOYALTY_CHANNELS.SYNC_REQUEST,
      LOYALTY_CHANNELS.SYNC_RESPONSE
    );

    // Set up message handler
    sub.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message).catch(error => {
        logger.error('[CoinSyncEngine] Message handling error', { error, channel });
      });
    });

    this.isSubscribed = true;
    logger.info('[CoinSyncEngine] Subscribed to all channels');
  }

  /**
   * Stop listening
   */
  async stop(): Promise<void> {
    if (!this.isSubscribed) return;

    await sub.unsubscribe();
    this.isSubscribed = false;
    logger.info('[CoinSyncEngine] Unsubscribed from all channels');
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Remove event handler
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(eventType, handlers);
    }
  }

  // ========== Publish Methods ==========

  /**
   * Publish coin earned event
   */
  async publishCoinEarned(data: {
    userId: string;
    coinType: CoinType;
    amount: number;
    transactionId: string;
    referenceId: string;
    sourceApp: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const event: CoinSyncEvent = {
      eventId: uuidv4(),
      eventType: 'coin.earned',
      userId: data.userId,
      sourceApp: data.sourceApp,
      coinType: data.coinType,
      amount: data.amount,
      transactionId: data.transactionId,
      referenceId: data.referenceId,
      timestamp: new Date().toISOString(),
      metadata: data.metadata,
    };

    await this.publish(LOYALTY_CHANNELS.COIN_EARNED, event);
    return event.eventId;
  }

  /**
   * Publish coin redeemed event
   */
  async publishCoinRedeemed(data: {
    userId: string;
    coinType: CoinType;
    amount: number;
    transactionId: string;
    referenceId: string;
    sourceApp: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const event: CoinSyncEvent = {
      eventId: uuidv4(),
      eventType: 'coin.redeemed',
      userId: data.userId,
      sourceApp: data.sourceApp,
      coinType: data.coinType,
      amount: data.amount,
      transactionId: data.transactionId,
      referenceId: data.referenceId,
      timestamp: new Date().toISOString(),
      metadata: data.metadata,
    };

    await this.publish(LOYALTY_CHANNELS.COIN_REDEEMED, event);
    return event.eventId;
  }

  /**
   * Publish coin expired event
   */
  async publishCoinExpired(data: {
    userId: string;
    coinType: CoinType;
    amount: number;
    transactionId: string;
    referenceId: string;
    sourceApp: string;
  }): Promise<string> {
    const event: CoinSyncEvent = {
      eventId: uuidv4(),
      eventType: 'coin.expired',
      userId: data.userId,
      sourceApp: data.sourceApp,
      coinType: data.coinType,
      amount: data.amount,
      transactionId: data.transactionId,
      referenceId: data.referenceId,
      timestamp: new Date().toISOString(),
    };

    await this.publish(LOYALTY_CHANNELS.COIN_EXPIRED, event);
    return event.eventId;
  }

  /**
   * Publish tier changed event
   */
  async publishTierChanged(data: {
    userId: string;
    previousTier: string;
    newTier: string;
    source: string;
  }): Promise<string> {
    const event: TierChangedEvent = {
      eventId: uuidv4(),
      eventType: 'tier.changed',
      userId: data.userId,
      previousTier: data.previousTier as TierChangedEvent['previousTier'],
      newTier: data.newTier as TierChangedEvent['newTier'],
      source: data.source,
      timestamp: new Date().toISOString(),
    };

    await this.publish(LOYALTY_CHANNELS.TIER_CHANGED, event);
    return event.eventId;
  }

  /**
   * Publish sync request (for requesting balance sync from specific service)
   */
  async publishSyncRequest(userId: string, targetService?: string): Promise<string> {
    const eventId = uuidv4();
    const payload = JSON.stringify({
      eventId,
      eventType: 'sync.request',
      userId,
      targetService,
      timestamp: new Date().toISOString(),
    });

    await this.publishWithRetry(LOYALTY_CHANNELS.SYNC_REQUEST, payload);
    return eventId;
  }

  // ========== Private Methods ==========

  private async publish(channel: string, event: CoinSyncEvent | TierChangedEvent): Promise<void> {
    const payload = JSON.stringify(event);
    await this.publishWithRetry(channel, payload);
  }

  private async publishWithRetry(channel: string, payload: string, maxAttempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await pub.publish(channel, payload);
        logger.debug(`[CoinSyncEngine] Published to ${channel}`, { attempt });
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          logger.error(`[CoinSyncEngine] Failed to publish after ${maxAttempts} attempts`, { error, channel });
          throw error;
        }
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const event = JSON.parse(message) as CoinSyncEvent | TierChangedEvent;

      // Idempotency check
      if (this.processedEvents.has(event.eventId)) {
        logger.debug(`[CoinSyncEngine] Skipping duplicate event ${event.eventId}`);
        return;
      }

      // Ignore events from self
      if ('sourceApp' in event && event.sourceApp === 'loyalty-gateway') {
        logger.debug(`[CoinSyncEngine] Ignoring self-originated event ${event.eventId}`);
        return;
      }

      logger.info(`[CoinSyncEngine] Processing event from ${channel}`, {
        eventId: event.eventId,
        eventType: event.eventType,
      });

      // Get handlers for this channel
      const handlers = this.handlers.get(channel) || [];

      // Execute all handlers
      await Promise.allSettled(
        handlers.map(handler => handler(event as CoinSyncEvent))
      );

      // Mark as processed (with TTL to prevent memory bloat)
      this.processedEvents.add(event.eventId);
      setTimeout(() => {
        this.processedEvents.delete(event.eventId);
      }, 3600000); // 1 hour TTL

    } catch (error) {
      logger.error(`[CoinSyncEngine] Failed to handle message`, { error, channel, message });
    }
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<{
    lastSyncAt: string | null;
    pendingEvents: number;
    status: 'synced' | 'pending' | 'stale';
  }> {
    const lastSyncAt = await redis.get(`loyalty:sync:last:${userId}`);
    const pendingCount = await redis.zcard(`loyalty:sync:pending:${userId}`);

    let status: 'synced' | 'pending' | 'stale' = 'synced';
    if (pendingCount > 0) status = 'pending';
    if (!lastSyncAt) status = 'stale';

    return {
      lastSyncAt,
      pendingEvents: pendingCount,
      status,
    };
  }

  /**
   * Mark user as synced
   */
  async markSynced(userId: string): Promise<void> {
    await redis.set(`loyalty:sync:last:${userId}`, new Date().toISOString());
  }

  /**
   * Get processed event count (for monitoring)
   */
  getProcessedEventCount(): number {
    return this.processedEvents.size;
  }

  /**
   * Check if engine is healthy
   */
  isHealthy(): boolean {
    return this.isSubscribed;
  }
}
