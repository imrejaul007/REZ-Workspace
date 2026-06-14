import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import { logger } from './logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<RedisClientType> {
  try {
    redisClient = createClient({ url: config.redis.url });

    redisClient.on('error', (error) => {
      logger.error('Redis Client Error', { error: error.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isOpen) {
    return connectRedis();
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis Client Disconnected');
  }
}
