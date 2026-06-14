import Redis from 'ioredis';
import { config } from './index.js';

let redis: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  try {
    logger.info(`Connecting to Redis at ${config.redis.url}...`);

    redis = new Redis(config.redis.url, {
      password: config.redis.password || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    await redis.connect();
    logger.info('Redis connected successfully');

    redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    return redis;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis disconnected');
  }
};

// Cache helper functions
export const cacheGet = async (key: string): Promise<string | null> => {
  const client = getRedis();
  return client.get(key);
};

export const cacheSet = async (
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> => {
  const client = getRedis();
  if (ttlSeconds) {
    await client.setex(key, ttlSeconds, value);
  } else {
    await client.set(key, value);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  const client = getRedis();
  await client.del(key);
};

export const cacheIncrement = async (key: string): Promise<number> => {
  const client = getRedis();
  return client.incr(key);
};