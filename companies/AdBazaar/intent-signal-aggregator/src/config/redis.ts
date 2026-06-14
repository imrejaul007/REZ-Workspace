import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully', { url: REDIS_URL });
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

// Signal deduplication helpers
export async function checkSignalDuplicate(signalHash: string, windowMs: number): Promise<boolean> {
  const redis = getRedisClient();
  const key = `signal:dedup:${signalHash}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function markSignalProcessed(signalHash: string, windowMs: number): Promise<void> {
  const redis = getRedisClient();
  const key = `signal:dedup:${signalHash}`;
  await redis.setex(key, Math.ceil(windowMs / 1000), '1');
}

// Signal caching helpers
export async function cacheSignalStats(stats: string): Promise<void> {
  const redis = getRedisClient();
  await redis.setex('signal:stats:cache', 60, stats); // Cache for 60 seconds
}

export async function getCachedSignalStats(): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get('signal:stats:cache');
}

// User signal history cache
export async function cacheUserSignals(userId: string, signals: string): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`signals:user:${userId}`, 300, signals); // Cache for 5 minutes
}

export async function getCachedUserSignals(userId: string): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(`signals:user:${userId}`);
}

// Real-time signal pub/sub for routing
export async function publishSignal(signal: unknown): Promise<void> {
  const redis = getRedisClient();
  await redis.publish('intent:signals', JSON.stringify(signal));
}

export function subscribeToSignals(callback: (signal: unknown) => void): void {
  const redis = getRedisClient();
  const subscriber = redis.duplicate();

  subscriber.subscribe('intent:signals', (err) => {
    if (err) {
      logger.error('Failed to subscribe to signals', { error: err.message });
      return;
    }
    logger.info('Subscribed to intent:signals channel');
  });

  subscriber.on('message', (_channel, message) => {
    try {
      const signal = JSON.parse(message);
      callback(signal);
    } catch (error) {
      logger.error('Failed to parse signal message', { error });
    }
  });
}