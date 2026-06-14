import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from '../config/index.js';

let redis: Redis | null = null;

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

export async function connectRedis(): Promise<Redis> {
  if (redis) {
    return redis;
  }

  redis = new Redis(config.redis.url, {
    keyPrefix: config.redis.keyPrefix,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  return redis;
}

export function getRedisClient(): Redis {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function healthCheck(): Promise<{
  mongodb: { status: string; latency?: number };
  redis: { status: string; latency?: number };
}> {
  const result = {
    mongodb: { status: 'down' as string },
    redis: { status: 'down' as string },
  };

  // MongoDB health check
  const mongoStart = Date.now();
  try {
    await mongoose.connection.db?.admin().ping();
    result.mongodb = {
      status: 'up',
      latency: Date.now() - mongoStart,
    };
  } catch (error) {
    result.mongodb = {
      status: 'down',
    };
  }

  // Redis health check
  const redisStart = Date.now();
  try {
    if (redis) {
      await redis.ping();
      result.redis = {
        status: 'up',
        latency: Date.now() - redisStart,
      };
    }
  } catch (error) {
    result.redis = {
      status: 'down',
    };
  }

  return result;
}