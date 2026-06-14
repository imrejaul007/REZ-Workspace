import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { validateEnv } from './env';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const env = validateEnv();
  const redisUrl = env.REDIS_URL;

  redisClient = new Redis(redisUrl, {
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisClient.on('connect', () => {
    logger.info('[Redis] Client connected');
  });

  redisClient.on('ready', () => {
    logger.info('[Redis] Client ready');
  });

  redisClient.on('error', (err) => {
    logger.error('[Redis] Client error: ' + err.message);
  });

  redisClient.on('close', () => {
    logger.warn('[Redis] Client connection closed');
  });

  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (redisSubscriber) return redisSubscriber;

  const env = validateEnv();
  const redisUrl = env.REDIS_URL;

  redisSubscriber = new Redis(redisUrl, {
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: false,
  });

  redisSubscriber.on('connect', () => {
    logger.info('[Redis] Subscriber connected');
  });

  redisSubscriber.on('error', (err) => {
    logger.error('[Redis] Subscriber error: ' + err.message);
  });

  return redisSubscriber;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
  }
  logger.info('[Redis] Disconnected');
}
