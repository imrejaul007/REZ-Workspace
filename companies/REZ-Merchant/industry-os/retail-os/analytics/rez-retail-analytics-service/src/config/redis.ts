import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export const initRedis = async (): Promise<RedisClientType> => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({ url });

  redisClient.on('error', (err) => logger.error('Redis Error:', err));
  redisClient.on('connect', () => logger.info('Redis Connected'));

  await redisClient.connect();
  return redisClient;
};

export { redisClient };
