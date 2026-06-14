import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
