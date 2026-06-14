import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.redis.url,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Connected to Redis');
  });

  await redisClient.connect();
  return redisClient;
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
    logger.info('Disconnected from Redis');
  }
}
