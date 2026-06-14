import logger from './utils/logger';

/**
 * Redis Configuration
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

export async function connectRedis(): Promise<void> {
  await redis.ping();
  logger.info('Redis connection verified');
}

export default redis;
