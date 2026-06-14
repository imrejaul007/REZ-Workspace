import Redis from 'ioredis';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

const createRedisClient = (): Redis => {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  const client = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  client.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
};

const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  try {
    await client.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

// Cache helpers
const cacheGet = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (error) {
    logger.error('Redis cache get error:', error);
    return null;
  }
};

const cacheSet = async (key: string, value: string, ttlSeconds = 3600): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, value);
  } catch (error) {
    logger.error('Redis cache set error:', error);
  }
};

const cacheDelete = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Redis cache delete error:', error);
  }
};

const cacheClearPattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    logger.error('Redis cache clear pattern error:', error);
  }
};

export {
  getRedisClient,
  connectRedis,
  disconnectRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheClearPattern
};