import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger.service';

// Redis client singleton
let redisClient: Redis | null = null;

// Connection state
let isConnected = false;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<Redis> {
  if (redisClient && isConnected) {
    return redisClient;
  }

  const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    keyPrefix: config.redis.keyPrefix,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('Redis: Max retry attempts reached');
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  };

  redisClient = new Redis(redisConfig);

  // Event handlers
  redisClient.on('connect', () => {
    logger.info('Redis: Connected');
    isConnected = true;
  });

  redisClient.on('ready', () => {
    logger.info('Redis: Ready');
    isConnected = true;
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Error:', err);
    isConnected = false;
  });

  redisClient.on('close', () => {
    logger.warn('Redis: Connection closed');
    isConnected = false;
  });

  redisClient.on('reconnecting', () => {
    logger.info('Redis: Reconnecting...');
  });

  try {
    await redisClient.connect();
    logger.info(`Redis: Connected to ${config.redis.host}:${config.redis.port}`);
  } catch (error) {
    logger.error('Redis: Initial connection failed', error);
    // Continue without Redis - some features may be degraded
  }

  return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis: Connection closed');
  }
}

// Cache operations
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Redis cache get error: ${key}`, error);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (!redisClient) return;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (error) {
    logger.error(`Redis cache set error: ${key}`, error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Redis cache delete error: ${key}`, error);
  }
}

// Campaign lock operations
export async function acquireCampaignLock(campaignId: string, ttlSeconds = 60): Promise<boolean> {
  if (!redisClient) return true; // Allow operation without Redis
  try {
    const key = `lock:campaign:${campaignId}`;
    const result = await redisClient.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    logger.error(`Redis lock acquire error: ${campaignId}`, error);
    return true;
  }
}

export async function releaseCampaignLock(campaignId: string): Promise<void> {
  if (!redisClient) return;
  try {
    const key = `lock:campaign:${campaignId}`;
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Redis lock release error: ${campaignId}`, error);
  }
}

// Rate limiting
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redisClient) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }

  try {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Remove old entries
    await redisClient.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await redisClient.zcard(key);

    if (count >= limit) {
      const oldestEntry = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldestEntry.length >= 2 ? parseInt(oldestEntry[1]) + windowMs : now + windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    // Add current request
    await redisClient.zadd(key, now, `${now}-${Math.random()}`);
    await redisClient.expire(key, windowSeconds);

    return { allowed: true, remaining: limit - count - 1, resetAt: now + windowMs };
  } catch (error) {
    logger.error(`Redis rate limit error: ${key}`, error);
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

// Pub/Sub helpers
export async function publishEvent(channel: string, message: unknown): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.publish(channel, JSON.stringify(message));
  } catch (error) {
    logger.error(`Redis publish error: ${channel}`, error);
  }
}

export function createSubscriber(): Redis | null {
  if (!redisClient) return null;
  return redisClient.duplicate();
}

export default {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  acquireCampaignLock,
  releaseCampaignLock,
  checkRateLimit,
  publishEvent,
  createSubscriber,
};