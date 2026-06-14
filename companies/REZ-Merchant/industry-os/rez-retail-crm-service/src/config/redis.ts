import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export const initRedis = async (): Promise<RedisClientType> => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({
    url,
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
    logger.info('Redis Client Connected');
  });

  await redisClient.connect();
  return redisClient;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
};

export { redisClient };
