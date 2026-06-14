import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('[Redis] Connected', { url: redisUrl });
});

redis.on('error', (err) => {
  logger.error('[Redis] Error', { error: err.message });
});

redis.on('close', () => {
  logger.warn('[Redis] Connection closed');
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    if (error instanceof Error && error.message.includes('already connected')) {
      return;
    }
    logger.error('[Redis] Failed to connect', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
