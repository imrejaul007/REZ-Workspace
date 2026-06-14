import Redis from 'ioredis';
import { logger } from './logger';
import { cacheHits, cacheMisses } from './metrics';

let redis: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  return redis;
};

export const initRedis = async (): Promise<Redis | null> => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    });

    await redis.connect();
    logger.info('Redis connected successfully', { url: redisUrl });

    redis.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redis.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    return redis;
  } catch (error) {
    logger.warn('Redis connection failed, caching disabled', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
};

// Cache utilities
export const CACHE_TTL = {
  CONFERENCE: 300, // 5 minutes
  SPEAKERS: 600, // 10 minutes
  SESSIONS: 300, // 5 minutes
  ANALYTICS: 60, // 1 minute
  TARGETING: 120 // 2 minutes
};

export const cacheGet = async (key: string, prefix: string): Promise<string | null> => {
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    if (value) {
      cacheHits.inc({ key_prefix: prefix });
 } else {
      cacheMisses.inc({ key_prefix: prefix });
    }
    return value;
  } catch (error) {
    logger.error('Cache get error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttl: number): Promise<void> => {
  if (!redis) return;

  try {
    await redis.setex(key, ttl, value);
  } catch (error) {
    logger.error('Cache set error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const cacheDelete = async (pattern: string): Promise<void> => {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('Cache keys deleted', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Cache delete error', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const cacheInvalidateConference = async (conferenceId: string): Promise<void> => {
  await cacheDelete(`conference:${conferenceId}:*`);
  await cacheDelete('conferences:list:*');
  await cacheDelete('conferences:upcoming');
};

export default {
  getRedisClient,
  initRedis,
  closeRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheInvalidateConference
};
