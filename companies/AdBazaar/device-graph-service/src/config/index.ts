import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export interface AppConfig {
  port: number;
  env: string;
  mongodb: {
    uri: string;
    options: mongoose.ConnectionOptions;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  service: {
    name: string;
    id: string;
  };
  auth: {
    internalTokens: string[];
    apiKeys: string[];
    adminToken?: string;
  };
}

let redisClient: RedisClientType | null = null;

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '4997', 10),
  env: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/device-graph',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  service: {
    name: 'device-graph-service',
    id: process.env.SERVICE_ID || 'device-graph',
  },

  auth: {
    internalTokens: process.env.INTERNAL_SERVICE_TOKENS?.split(',') || [],
    apiKeys: process.env.VALID_API_KEYS?.split(',') || [],
    adminToken: process.env.INTERNAL_ADMIN_TOKEN,
  },
};

/**
 * Connect to MongoDB
 */
export async function connectMongoDB(): Promise<mongoose.Connection> {
  try {
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    });

    logger.info('Connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<RedisClientType> {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', { error: err instanceof Error ? err.message : String(err) });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Get Redis client
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Close all connections
 */
export async function closeConnections(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing connections:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Health check for dependencies
 */
export async function checkDependencies(): Promise<{
  mongodb: boolean;
  redis: boolean;
}> {
  const status = {
    mongodb: false,
    redis: false,
  };

  // Check MongoDB
  try {
    status.mongodb = mongoose.connection.readyState === 1;
  } catch {
    status.mongodb = false;
  }

  // Check Redis
  try {
    if (redisClient) {
      await redisClient.ping();
      status.redis = true;
    }
  } catch {
    status.redis = false;
  }

  return status;
}

export default config;