/**
 * Redis Configuration
 */

import Redis from 'ioredis';
import { logger } from './logger';

let redis: Redis;

export async function connectRedis(): Promise<Redis> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      logger.error('Redis reconnect on error', { error: err.message });
      return true;
    },
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redis;
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
}

export { redis };
