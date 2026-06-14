import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheConfigService } from './cache-config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private subscriber!: Redis;
  private isConnected = false;
  private connectionRetryCount = 0;
  private readonly maxRetries = 5;

  constructor(private config: CacheConfigService) {}

  async onModuleInit() {
    if (this.config.isRedisEnabled()) {
      await this.connect();
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const redisConfig = {
        host: this.config.getRedisHost(),
        port: this.config.getRedisPort(),
        password: this.config.getRedisPassword(),
        db: this.config.getRedisDb(),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        commandTimeout: 5000,
        family: 4,
        keepAlive: 30000,
        retryDelayOnClusterDown: 300,
        enableReadyCheck: true,
      };

      this.client = new Redis(redisConfig);
      this.subscriber = new Redis({ ...redisConfig });

      // Event handlers for client
      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
        this.isConnected = true;
        this.connectionRetryCount = 0;
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', (delay: number) => {
        this.connectionRetryCount++;
        this.logger.log(`Redis client reconnecting in ${delay}ms (attempt ${this.connectionRetryCount})`);
      });

      // Event handlers for subscriber
      this.subscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error);
      });

      // Connect with retry logic
      await this.connectWithRetry();
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.client.connect();
        await this.subscriber.connect();
        this.logger.log(`Redis connected successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        this.logger.error(`Redis connection attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to connect to Redis after ${this.maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      this.logger.log('Redis connections closed');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  // Basic Redis operations with error handling
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, returning null');
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping SET');
        return false;
      }

      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping DEL');
        return false;
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        return null;
      }
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      this.logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      if (!this.isConnected) {
        return {};
      }
      return await this.client.hgetall(key);
    } catch (error) {
      this.logger.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.hdel(key, field);
      return true;
    } catch (error) {
      this.logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.sadd(key, member);
      return true;
    } catch (error) {
      this.logger.error(`Redis SADD error for key ${key}, member ${member}:`, error);
      return false;
    }
  }

  async srem(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.srem(key, member);
      return true;
    } catch (error) {
      this.logger.error(`Redis SREM error for key ${key}, member ${member}:`, error);
      return false;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        return [];
      }
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis SISMEMBER error for key ${key}, member ${member}:`, error);
      return false;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.publish(channel, message);
      return true;
    } catch (error) {
      this.logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return false;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
      return true;
    } catch (error) {
      this.logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
      return false;
    }
  }

  async unsubscribe(channel: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      await this.subscriber.unsubscribe(channel);
      return true;
    } catch (error) {
      this.logger.error(`Redis UNSUBSCRIBE error for channel ${channel}:`, error);
      return false;
    }
  }

  // Advanced operations
  async pipeline(): Promise<unknown> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    return this.client.pipeline();
  }

  async transaction(): Promise<unknown> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    return this.client.multi();
  }

  // Utility methods
  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  isConnectionHealthy(): boolean {
    return this.isConnected && this.connectionRetryCount === 0;
  }

  getConnectionInfo(): unknown {
    return {
      isConnected: this.isConnected,
      connectionRetryCount: this.connectionRetryCount,
      host: this.config.getRedisHost(),
      port: this.config.getRedisPort(),
      db: this.config.getRedisDb(),
    };
  }
}