import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.redis.url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis: Max reconnection attempts reached');
          return new Error('Redis: Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  await redisClient.connect();
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client not connected');
  }
  return redisClient;
}

// Cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(`${config.redis.keyPrefix}${key}`);
  if (data) {
    return JSON.parse(data) as T;
  }
  return null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedisClient();
  await client.setEx(
    `${config.redis.keyPrefix}${key}`,
    ttlSeconds,
    JSON.stringify(value)
  );
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`${config.redis.keyPrefix}${key}`);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(`${config.redis.keyPrefix}${pattern}`);
  if (keys.length > 0) {
    await client.del(keys);
  }
}
