import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

interface RedisState {
  isConnected: boolean;
  client?: Redis;
}

const redisState: RedisState = {
  isConnected: false
};

// Create Redis client
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  lazyConnect: true
});

// Event handlers
redis.on('connect', () => {
  logger.info('Redis connecting...', { url: REDIS_URL.replace(/\/\/.*@/, '//***@') });
});

redis.on('ready', () => {
  redisState.isConnected = true;
  redisState.client = redis;
  logger.info('Redis connected and ready');
});

redis.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
  redisState.isConnected = false;
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
  redisState.isConnected = false;
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // If already connected, that's fine
    if (!errorMessage.includes('already')) {
      logger.error('Failed to connect to Redis', { error: errorMessage });
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisState.isConnected) {
    await redis.quit();
    redisState.isConnected = false;
    logger.info('Redis disconnected');
  }
}

export function isRedisConnected(): boolean {
  return redisState.isConnected;
}

export function getRedisClient(): Redis {
  return redis;
}

// Cache helpers with TTL
export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis setCache error', { key, error: (error as Error).message });
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) as T : null;
  } catch (error) {
    logger.error('Redis getCache error', { key, error: (error as Error).message });
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Redis deleteCache error', { key, error: (error as Error).message });
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('Cache invalidated', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Redis invalidateCachePattern error', { pattern, error: (error as Error).message });
  }
}

export default {
  connectRedis,
  disconnectRedis,
  isRedisConnected,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  invalidateCachePattern
};