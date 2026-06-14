import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
}

// Cache operations
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const data = await client.get(key);
  if (data) {
    return JSON.parse(data) as T;
  }
  return null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = await getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const client = await getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
}

// Session management
export async function setSession(userId: string, sessionData: Record<string, unknown>, ttlSeconds = 3600): Promise<void> {
  await cacheSet(`session:${userId}`, sessionData, ttlSeconds);
}

export async function getSession(userId: string): Promise<Record<string, unknown> | null> {
  return cacheGet(`session:${userId}`);
}

export async function deleteSession(userId: string): Promise<void> {
  await cacheDelete(`session:${userId}`);
}

// Context caching for copilot
export async function cacheContext(advertiserId: string, context: unknown, ttlSeconds = 60): Promise<void> {
  await cacheSet(`context:${advertiserId}`, context, ttlSeconds);
}

export async function getCachedContext(advertiserId: string): Promise<unknown | null> {
  return cacheGet(`context:${advertiserId}`);
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}