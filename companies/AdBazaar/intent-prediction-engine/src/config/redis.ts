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
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected', { url: REDIS_URL });
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error: (error as Error).message });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
}

export function isRedisConnected(): boolean {
  return redisClient?.status === 'ready';
}

// Cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis cache get error', { key, error: (error as Error).message });
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedisClient();
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis cache set error', { key, error: (error as Error).message });
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  try {
    await client.del(key);
  } catch (error) {
    logger.error('Redis cache delete error', { key, error: (error as Error).message });
  }
}
