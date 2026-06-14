import logger from './utils/logger';

/**
 * Database Configuration
 * MongoDB + Redis connections
 */

import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';

// ============================================
// MONGODB
// ============================================

export async function connectMongoDB(uri?: string): Promise<void> {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_pos_loyalty';

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected:', mongoUri);
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

// ============================================
// REDIS
// ============================================

let redisClient: RedisClientType | null = null;

export async function connectRedis(url?: string): Promise<RedisClientType> {
  if (redisClient) return redisClient;

  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({ url: redisUrl });

  redisClient.on('error', (err) => console.error('Redis error:', err));

  await redisClient.connect();
  console.log('Redis connected:', redisUrl);

  return redisClient;
}

export function getRedis(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
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

// ============================================
// SCHEMAS
// ============================================

import { Schema } from 'mongoose';

// Transaction Schema
const TransactionSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  coinsEarned: { type: Number, required: true },
  tierMultiplier: { type: Number, default: 1 },
  bonusCoins: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'wallet'] },
  posType: { type: String, enum: ['nextabizz', 'kds', 'reznow', 'restaurant', 'generic'] },
  items: [{ id: String, name: String, category: String, quantity: Number, price: Number }],
  createdAt: { type: Date, default: Date.now },
});

export const Transaction = mongoose.model('Transaction', TransactionSchema);

// Merchant Config Schema
const MerchantConfigSchema = new Schema({
  merchantId: { type: String, required: true, unique: true },
  name: String,
  earningRate: { type: Number, default: 1 },
  tierEnabled: { type: Boolean, default: true },
  tierBenefits: {
    SILVER: { extraEarning: Number, freeDelivery: Boolean },
    GOLD: { extraEarning: Number, freeDelivery: Boolean },
    PLATINUM: { extraEarning: Number, freeDelivery: Boolean },
  },
  notificationsEnabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
});

export const MerchantConfig = mongoose.model('MerchantConfig', MerchantConfigSchema);

// Customer Stats Schema
const CustomerStatsSchema = new Schema({
  userId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true },
  totalPurchases: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalCoins: { type: Number, default: 0 },
  lastPurchase: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CustomerStatsSchema.index({ userId: 1, merchantId: 1 }, { unique: true });

export const CustomerStats = mongoose.model('CustomerStats', CustomerStatsSchema);

// ============================================
// REDIS CACHE HELPERS
// ============================================

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const redis = getRedis();
    return await redis.get(key);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error([Cache] cacheGet failed for key ${key}: ${errorMessage}`);
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setEx(key, ttlSeconds, value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error([Cache] cacheSet failed for key ${key}: ${errorMessage}`);
    // Redis not available, continue without cache
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error([Cache] cacheDelete failed for key ${key}: ${errorMessage}`);
  }
}

export async function cacheIncrement(key: string): Promise<number> {
  try {
    const redis = getRedis();
    return await redis.incr(key);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error([Cache] cacheIncrement failed for key ${key}: ${errorMessage}`);
    return 0;
  }
}

// ============================================
// EXPORTS
// ============================================

export const db = {
  connect: connectMongoDB,
  disconnect: disconnectMongoDB,
  redis: {
    connect: connectRedis,
    get: getRedis,
    disconnect: disconnectRedis,
  },
  cache: {
    get: cacheGet,
    set: cacheSet,
    delete: cacheDelete,
    increment: cacheIncrement,
  },
  models: {
    Transaction,
    MerchantConfig,
    CustomerStats,
  },
};

export default db;
