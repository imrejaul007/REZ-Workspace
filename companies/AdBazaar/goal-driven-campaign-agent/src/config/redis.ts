import Redis from 'ioredis';
import config from './index.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;

export function createRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(config.redis.url, {
    retryStrategy: (times) => {
      if (times > config.redis.maxRetries) {
        logger.error('Redis max retries exceeded');
        return null;
      }
      const delay = Math.min(times * config.redis.retryDelayMs, 5000);
      logger.warn(`Redis reconnecting in ${delay}ms`, { attempt: times });
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis ready');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error', { error: err });
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

// Cache utilities
export async function setCache(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  const client = getRedisClient();
  const prefixedKey = `${config.redis.keyPrefix}${key}`;
  await client.setex(prefixedKey, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const prefixedKey = `${config.redis.keyPrefix}${key}`;
  const data = await client.get(prefixedKey);
  return data ? JSON.parse(data) : null;
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  const prefixedKey = `${config.redis.keyPrefix}${key}`;
  await client.del(prefixedKey);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  const prefixedPattern = `${config.redis.keyPrefix}${pattern}`;
  const keys = await client.keys(prefixedPattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}

export default {
  createRedisClient,
  getRedisClient,
  disconnectRedis,
  setCache,
  getCache,
  deleteCache,
  invalidateCachePattern
};
