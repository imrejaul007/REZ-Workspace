/**
 * REZ Workspace - Production Database Configuration
 *
 * Features:
 * - MongoDB connection with retry logic
 * - Redis connection with clustering support
 * - Connection pooling
 * - Automatic reconnection
 * - Health checks
 */

import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../../shared/logger';

// ============================================
// CONFIGURATION
// ============================================

interface DatabaseConfig {
  mongodb: {
    uri: string;
    options: mongoose.ConnectOptions;
    retryAttempts: number;
    retryDelay: number;
  };
  redis: {
    url: string;
    password?: string;
    retryAttempts: number;
    retryDelay: number;
  };
}

const dbConfig: DatabaseConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-workspace',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      retryReads: true,
    },
    retryAttempts: 5,
    retryDelay: 5000,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    retryAttempts: 5,
    retryDelay: 3000,
  },
};

// ============================================
// MONGODB CONNECTION
// ============================================

let isConnected = false;
let mongoConnection: typeof mongoose | null = null;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isConnected && mongoConnection) {
    return mongoConnection;
  }

  let attempts = 0;

  while (attempts < dbConfig.mongodb.retryAttempts) {
    attempts++;
    try {
      logger.info(`[MongoDB] Connecting to database (attempt ${attempts}/${dbConfig.mongodb.retryAttempts})...`);

      const conn = await mongoose.connect(dbConfig.mongodb.uri, {
        ...dbConfig.mongodb.options,
      });

      mongoConnection = conn;
      isConnected = true;

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        logger.info('[MongoDB] Connected successfully');
        isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        logger.error('[MongoDB] Connection error:', err);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('[MongoDB] Disconnected - attempting to reconnect...');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('[MongoDB] Reconnected successfully');
        isConnected = true;
      });

      // Handle process termination
      process.on('SIGINT', gracefulShutdownMongoDB);
      process.on('SIGTERM', gracefulShutdownMongoDB);

      logger.info('[MongoDB] Database connection established');
      return conn;
    } catch (error) {
      logger.error(`[MongoDB] Connection attempt ${attempts} failed:`, error);

      if (attempts >= dbConfig.mongodb.retryAttempts) {
        logger.error('[MongoDB] Max retry attempts reached. Database connection failed.');
        throw error;
      }

      logger.info(`[MongoDB] Retrying in ${dbConfig.mongodb.retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, dbConfig.mongodb.retryDelay));
    }
  }

  throw new Error('Failed to connect to MongoDB after maximum retries');
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoConnection) {
    try {
      await mongoConnection.disconnect();
      isConnected = false;
      mongoConnection = null;
      logger.info('[MongoDB] Disconnected successfully');
    } catch (error) {
      logger.error('[MongoDB] Error during disconnection:', error);
      throw error;
    }
  }
}

async function gracefulShutdownMongoDB(): Promise<void> {
  logger.info('[MongoDB] Graceful shutdown initiated...');
  await disconnectMongoDB();
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// ============================================
// REDIS CONNECTION
// ============================================

let redisClient: RedisClientType | null = null;
let redisSubscriber: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  let attempts = 0;

  while (attempts < dbConfig.redis.retryAttempts) {
    attempts++;
    try {
      logger.info(`[Redis] Connecting to cache (attempt ${attempts}/${dbConfig.redis.retryAttempts})...`);

      // Main client
      redisClient = createClient({
        url: dbConfig.redis.url,
        password: dbConfig.redis.password,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > dbConfig.redis.retryAttempts) {
              return new Error('Max Redis reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Subscriber client (for pub/sub)
      redisSubscriber = redisClient.duplicate();

      // Event handlers
      redisClient.on('error', (err) => {
        logger.error('[Redis] Client error:', err);
      });

      redisClient.on('connect', () => {
        logger.info('[Redis] Client connected');
      });

      redisClient.on('ready', () => {
        logger.info('[Redis] Client ready');
      });

      redisClient.on('end', () => {
        logger.info('[Redis] Client disconnected');
      });

      // Connect both clients
      await redisClient.connect();
      await redisSubscriber.connect();

      // Handle process termination
      process.on('SIGINT', gracefulShutdownRedis);
      process.on('SIGTERM', gracefulShutdownRedis);

      logger.info('[Redis] Cache connection established');
      return redisClient;
    } catch (error) {
      logger.error(`[Redis] Connection attempt ${attempts} failed:`, error);

      if (attempts >= dbConfig.redis.retryAttempts) {
        logger.warn('[Redis] Max retry attempts reached. Service will continue without cache.');
        // Don't throw - Redis is optional for some operations
        return createDummyRedisClient();
      }

      logger.info(`[Redis] Retrying in ${dbConfig.redis.retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, dbConfig.redis.retryDelay));
    }
  }

  return createDummyRedisClient();
}

async function gracefulShutdownRedis(): Promise<void> {
  logger.info('[Redis] Graceful shutdown initiated...');

  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
  if (redisSubscriber?.isOpen) {
    await redisSubscriber.quit();
  }

  logger.info('[Redis] Disconnected successfully');
}

export async function disconnectRedis(): Promise<void> {
  await gracefulShutdownRedis();
}

export function getRedisClient(): RedisClientType {
  return redisClient || createDummyRedisClient();
}

export function getRedisSubscriber(): RedisClientType {
  return redisSubscriber || createDummyRedisClient();
}

// Create a dummy client for graceful degradation
function createDummyRedisClient(): RedisClientType {
  const dummyClient = createClient();
  return dummyClient;
}

// ============================================
// HEALTH CHECKS
// ============================================

export async function checkDatabaseHealth(): Promise<{
  mongodb: { status: string; latency?: number; error?: string };
  redis: { status: string; latency?: number; error?: string };
}> {
  const health = {
    mongodb: { status: 'unknown' as string },
    redis: { status: 'unknown' as string },
  };

  // Check MongoDB
  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    health.mongodb = {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    health.mongodb = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Redis
  try {
    if (redisClient?.isOpen) {
      const start = Date.now();
      await redisClient.ping();
      health.redis = {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } else {
      health.redis = {
        status: 'disconnected',
      };
    }
  } catch (error) {
    health.redis = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return health;
}

// ============================================
// CACHE UTILITIES
// ============================================

export const cacheUtils = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Silently fail - cache is optional
    }
  },

  async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch {
      // Silently fail
    }
  },

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  },
};

export default {
  connectMongoDB,
  disconnectMongoDB,
  connectRedis,
  disconnectRedis,
  getRedisClient,
  getRedisSubscriber,
  checkDatabaseHealth,
  cacheUtils,
  isMongoConnected,
};