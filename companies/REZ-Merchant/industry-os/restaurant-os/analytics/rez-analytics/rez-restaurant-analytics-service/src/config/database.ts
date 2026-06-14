import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }
  return redis;
}

export async function closeConnections(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }

  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}
