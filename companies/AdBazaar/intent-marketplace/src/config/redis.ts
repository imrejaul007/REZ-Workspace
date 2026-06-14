import Redis from 'ioredis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        logger.warn('Redis reconnect on error', { error: err.message });
        return true;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected', { url: REDIS_URL });
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed gracefully');
  }
}

// Cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  if (data) {
    return JSON.parse(data) as T;
  }
  return null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}
