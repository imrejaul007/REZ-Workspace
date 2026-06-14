import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected', {
        host: config.redis.host,
        port: config.redis.port,
      });
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis Client Disconnected');
  }
};

export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number = config.dashboard.cacheDuration
): Promise<void> => {
  const client = getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  const data = await client.get(key);
  if (data) {
    return JSON.parse(data) as T;
  }
  return null;
};

export const deleteCache = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

export const clearCachePattern = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
};