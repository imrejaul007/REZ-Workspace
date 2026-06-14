/**
 * Intent Graph Consumer
 *
 * Consumes intent-related events from Redis pub/sub and processes them.
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../config/logger';

let redisClient: RedisClientType | null = null;
let subscriber: RedisClientType | null = null;
let isRunning = false;

const INTENT_CHANNEL = 'intent:events';

export async function startIntentGraphConsumer(): Promise<void> {
  if (isRunning) {
    logger.warn('[IntentGraphConsumer] Already running');
    return;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    // Create main client for publishing responses
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => logger.error('[IntentGraphConsumer] Redis error', err));

    // Create separate subscriber client
    subscriber = redisClient.duplicate();
    subscriber.on('error', (err) => logger.error('[IntentGraphConsumer] Subscriber error', err));

    await redisClient.connect();
    await subscriber.connect();

    await subscriber.subscribe(INTENT_CHANNEL, async (message) => {
      try {
        const event = JSON.parse(message);
        logger.info('[IntentGraphConsumer] Processing event', { type: event.type });
        await processIntentEvent(event);
      } catch (error) {
        logger.error('[IntentGraphConsumer] Failed to process event', { error, message });
      }
    });

    isRunning = true;
    logger.info('[IntentGraphConsumer] Started');
  } catch (error) {
    logger.error('[IntentGraphConsumer] Failed to start', error);
    throw error;
  }
}

async function processIntentEvent(event: { type: string; userId?: string; data?: Record<string, unknown> }): Promise<void> {
  switch (event.type) {
    case 'intent_detected':
      // Handle new intent detection
      logger.info('[IntentGraphConsumer] Intent detected', { userId: event.userId });
      break;
    case 'intent_resolved':
      // Handle intent resolution
      logger.info('[IntentGraphConsumer] Intent resolved', { userId: event.userId });
      break;
    default:
      logger.debug('[IntentGraphConsumer] Unknown event type', { type: event.type });
  }
}

export async function stopIntentGraphConsumer(): Promise<void> {
  if (!isRunning) {
    return;
  }

  try {
    if (subscriber) {
      await subscriber.unsubscribe(INTENT_CHANNEL);
      await subscriber.quit();
      subscriber = null;
    }
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
    isRunning = false;
    logger.info('[IntentGraphConsumer] Stopped');
  } catch (error) {
    logger.error('[IntentGraphConsumer] Error during cleanup', error);
  }
}
