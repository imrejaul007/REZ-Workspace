import logger from './utils/logger';

import { createClient, RedisClientType } from 'redis';

let redis: RedisClientType;

export async function connectRedis(): Promise<RedisClientType> {
  // SECURITY FIX: Fail at startup if REDIS_URL not set
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required');
  }

  redis = createClient({ url: REDIS_URL });

  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });

  redis.on('disconnected', () => {
    logger.warn('Redis disconnected');
  });

  await redis.connect();
  logger.info('Connected to Redis');
  return redis;
}

export function getRedis(): RedisClientType {
  if (!redis) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redis;
}

// For rate limiter compatibility
export { redis };
