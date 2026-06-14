/**
 * Redis Configuration
 */

import Redis from 'ioredis';
import { logger } from './logger';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('[Redis] REDIS_URL not configured, Redis features disabled');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('[Redis] Max connection retries exceeded');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('connect', () => {
      logger.info('[Redis] Connected');
    });

    redis.on('error', (err) => {
      logger.error('[Redis] Error: ' + err.message);
    });

    redis.on('close', () => {
      logger.warn('[Redis] Connection closed');
    });

    return redis;
  } catch (error) {
    logger.error('[Redis] Failed to create client: ' + (error instanceof Error ? error.message : String(error)));
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      logger.info('[Redis] Disconnected gracefully');
    } catch (err) {
      logger.error('[Redis] Error during disconnect: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
}
