import Redis from 'ioredis';
import logger from './logger';

let redisClient: Redis | null = null;

export const createRedisClient = (): Redis => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  const client = new Redis({
    host,
    port,
    password: password || undefined,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  client.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  try {
    await client.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without Redis:', error);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default getRedisClient;