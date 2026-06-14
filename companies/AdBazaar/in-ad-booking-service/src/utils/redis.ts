/**
 * Redis client utility for in-ad-booking-service
 */

import Redis from 'ioredis';
import config from '../config';
import logger from './logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
  } catch (err) {
    logger.warn('Redis connection failed, continuing without cache', { error: err instanceof Error ? err.message : 'Unknown' });
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default { getRedisClient, connectRedis, disconnectRedis };
