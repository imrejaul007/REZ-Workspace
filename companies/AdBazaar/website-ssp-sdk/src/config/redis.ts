import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
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
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Return a mock client for development when Redis is not available
    return createMockRedisClient();
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Disconnected from Redis');
  }
}

// Mock Redis client for development when Redis is not available
function createMockRedisClient(): RedisClientType {
  const mockData = new Map<string, string>();

  return {
    get: async (key: string) => mockData.get(key) || null,
    set: async (key: string, value: string) => {
      mockData.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      mockData.delete(key);
      return 1;
    },
    expire: async () => 1,
    incr: async (key: string) => {
      const current = parseInt(mockData.get(key) || '0', 10);
      mockData.set(key, String(current + 1));
      return current + 1;
    },
    hGet: async () => null,
    hSet: async () => 0,
    hGetAll: async () => ({}),
    quit: async () => 'OK',
    on: () => mockClient as unknown as RedisClientType,
    connect: async () => {},
    isOpen: true,
  } as unknown as RedisClientType;
}

const mockClient = {
  on: () => mockClient,
};
