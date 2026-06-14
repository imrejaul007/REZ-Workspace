import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  mongodb: {
    uri: string;
    options: mongoose.ConnectOptions;
  };
  redis: {
    host: string;
    port: number;
  };
}

interface RedisClient {
  client: Redis | null;
  subscriber: Redis | null;
  isConnected: boolean;
}

const config: DatabaseConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_analytics',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
};

const redisState: RedisClient = {
  client: null,
  subscriber: null,
  isConnected: false,
};

export async function connectMongoDB(): Promise<mongoose.Connection> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function connectRedis(): Promise<Redis> {
  try {
    const redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisState.client = redisClient;
    redisState.subscriber = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      lazyConnect: true,
    });

    await redisClient.connect();
    await redisState.subscriber.connect();

    redisState.isConnected = true;
    console.log('Redis connected successfully');

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      redisState.isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient(): Redis | null {
  return redisState.client;
}

export function getRedisSubscriber(): Redis | null {
  return redisState.subscriber;
}

export function isRedisConnected(): boolean {
  return redisState.isConnected;
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (redisState.client) {
      await redisState.client.quit();
    }
    if (redisState.subscriber) {
      await redisState.subscriber.quit();
    }
    await mongoose.disconnect();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error disconnecting database:', error);
    throw error;
  }
}

export { config };
