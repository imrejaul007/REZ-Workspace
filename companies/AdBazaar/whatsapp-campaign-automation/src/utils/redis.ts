/**
 * Redis client utility for caching and real-time operations
 */

import Redis from 'ioredis';
import { config } from '../config';
import logger from './logger';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}

// Cache helpers
export async function setCache(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

// Campaign-specific cache helpers
export async function setCampaignLock(campaignId: string, ttlSeconds = 300): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.set(`lock:campaign:${campaignId}`, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function releaseCampaignLock(campaignId: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`lock:campaign:${campaignId}`);
}

export async function incrementCampaignMetric(campaignId: string, metric: string): Promise<number> {
  const client = getRedisClient();
  return client.hincrby(`campaign:metrics:${campaignId}`, metric, 1);
}

export async function getCampaignMetrics(campaignId: string): Promise<Record<string, number>> {
  const client = getRedisClient();
  const metrics = await client.hgetall(`campaign:metrics:${campaignId}`);
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(metrics)) {
    result[key] = parseInt(value, 10);
  }
  return result;
}