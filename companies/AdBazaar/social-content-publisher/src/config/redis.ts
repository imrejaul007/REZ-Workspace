import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed, running without cache');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisClient;
};

export const getRedisClient = (): Redis | null => redisClient;

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};