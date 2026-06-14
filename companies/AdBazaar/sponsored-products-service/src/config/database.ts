import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import config from './index';

let mongoConnection: typeof mongoose | null = null;
let redisClient: RedisClientType | null = null;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (mongoConnection) {
    return mongoConnection;
  }

  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      minPoolSize: config.mongodb.options.minPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    });

    mongoConnection = conn;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoConnection) {
    await mongoose.disconnect();
    mongoConnection = null;
    logger.info('MongoDB disconnected');
  }
}

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

// Wrapper for Redis client with fallback for when Redis is not available
export const redisClientWrapper = {
  async get(key: string): Promise<string | null> {
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
    try {
      return await redisClient.get(key);
    } catch {
      return null;
    }
  },

  async setEx(key: string, ttl: number, value: string): Promise<void> {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    try {
      await redisClient.setEx(key, ttl, value);
    } catch {
      // Silently fail
    }
  },

  async del(key: string): Promise<void> {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    try {
      await redisClient.del(key);
    } catch {
      // Silently fail
    }
  },

  async lPush(key: string, value: string): Promise<void> {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    try {
      await redisClient.lPush(key, value);
    } catch {
      // Silently fail
    }
  },

  async lTrim(key: string, start: number, stop: number): Promise<void> {
    if (!redisClient || !redisClient.isOpen) {
      return;
    }
    try {
      await redisClient.lTrim(key, start, stop);
    } catch {
      // Silently fail
    }
  },
};

// Export as named export for service imports
export { redisClient as redisClientInstance };

// Default export for backward compatibility
export default {
  connectMongoDB,
  disconnectMongoDB,
  connectRedis,
  disconnectRedis,
  getRedisClient,
};