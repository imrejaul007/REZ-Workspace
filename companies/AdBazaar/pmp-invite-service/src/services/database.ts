import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from '../config/index.js';

class DatabaseService {
  private static instance: DatabaseService;
  private mongoConnected = false;
  private redisConnected = false;
  private redisClient: Redis | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connectMongo(): Promise<void> {
    if (this.mongoConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      this.mongoConnected = true;
      logger.info(`MongoDB connected: ${config.mongodb.uri}`);

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.mongoConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.mongoConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.mongoConnected = true;
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnectMongo(): Promise<void> {
    if (!this.mongoConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.mongoConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  async connectRedis(): Promise<Redis> {
    if (this.redisClient && this.redisConnected) {
      return this.redisClient;
    }

    try {
      this.redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 3,
      });

      return new Promise((resolve, reject) => {
        this.redisClient!.on('connect', () => {
          this.redisConnected = true;
          logger.info(`Redis connected: ${config.redis.host}:${config.redis.port}`);
          resolve(this.redisClient!);
        });

        this.redisClient!.on('error', (err) => {
          logger.error('Redis connection error:', err);
          this.redisConnected = false;
        });

        this.redisClient!.on('close', () => {
          logger.warn('Redis connection closed');
          this.redisConnected = false;
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.redisConnected) {
            reject(new Error('Redis connection timeout'));
          }
        }, 5000);
      });
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnectRedis(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
      this.redisConnected = false;
      logger.info('Redis disconnected');
    }
  }

  isMongoConnected(): boolean {
    return this.mongoConnected;
  }

  isRedisConnected(): boolean {
    return this.redisConnected;
  }

  getRedisClient(): Redis | null {
    return this.redisClient;
  }

  async healthCheck(): Promise<{ mongodb: 'connected' | 'disconnected'; redis: 'connected' | 'disconnected' }> {
    const mongoStatus = this.mongoConnected && mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected';

    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.ping();
        redisStatus = 'connected';
      } catch {
        redisStatus = 'disconnected';
      }
    }

    return {
      mongodb: mongoStatus,
      redis: redisStatus,
    };
  }
}

export const databaseService = DatabaseService.getInstance();