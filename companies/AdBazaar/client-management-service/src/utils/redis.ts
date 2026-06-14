import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;

export const createRedisClient = async (): Promise<Redis> => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    reconnectOnError: (err) => {
      logger.error('Redis reconnect on error:', err);
      return true;
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisClient;
};

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed gracefully');
  }
};

// Cache utilities
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisClient) return null;

  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<void> => {
  if (!redisClient) return;

  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error('Cache delete pattern error:', error);
  }
};

export default {
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
};