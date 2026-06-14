import IORedis from 'ioredis';
import { logger } from './logger';

function createRedisClient(): IORedis {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required');
  }

  const retryStrategy = (times: number) => {
    const base = Math.min(times * 200, 5000);
    return base + Math.floor(Math.random() * 500);
  };

  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    keepAlive: 10000,
    password: process.env.REDIS_PASSWORD,
    retryStrategy,
  });
}

export const redis = createRedisClient();

redis.on('error', (err) => logger.error('[Redis] Error: ' + err.message));
redis.on('connect', () => logger.info('[Redis] Connection established'));
redis.on('ready', () => logger.info('[Redis] Connection ready'));
redis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
