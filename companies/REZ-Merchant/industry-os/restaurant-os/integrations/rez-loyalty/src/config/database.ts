import logger from './utils/logger';

import mongoose from 'mongoose';
import Redis from 'ioredis';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const connectRedis = (): Redis => {
  const redis = new Redis(REDIS_URL);

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  return redis;
};

// Redis key patterns
export const REDIS_KEYS = {
  POINTS_BALANCE: (userId: string) => `loyalty:points:${userId}`,
  DAILY_REDEMPTION: (userId: string, date: string) => `loyalty:redeem:daily:${userId}:${date}`,
  REFERRAL_COUNT: (userId: string) => `loyalty:referral:${userId}`,
  BIRTHDAY_CLAIMED: (userId: string, year: number) => `loyalty:birthday:${userId}:${year}`,
  PROCESSING_LOCK: (userId: string, transactionId: string) =>
    `loyalty:lock:${userId}:${transactionId}`,
} as const;

// TTL values in seconds
export const REDIS_TTL = {
  POINTS_CACHE: 300, // 5 minutes
  DAILY_REDEMPTION: 86400, // 24 hours
  PROCESSING_LOCK: 30, // 30 seconds
} as const;
