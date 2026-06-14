import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import logger from './logger';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  try {
    const client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message });
    });

    client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

    await client.connect();
    redisClient = client;

    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error: (error as Error).message });
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
    logger.info('Redis disconnected gracefully');
  }
};

// Cache operations
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error', { key, error: (error as Error).message });
    return null;
  }
};

export const cacheSet = async <T>(key: string, value: T, ttlSeconds?: number): Promise<void> => {
  try {
    const client = getRedisClient();
    const ttl = ttlSeconds || config.cache.ttl.medium;
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error', { key, error: (error as Error).message });
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Cache delete error', { key, error: (error as Error).message });
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.error('Cache delete pattern error', { pattern, error: (error as Error).message });
  }
};

export default {
  connectRedis,
  getRedisClient,
  disconnectRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
};