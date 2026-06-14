import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        url: config.redis.url,
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.info('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async increment(key: string, by = 1): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incrBy(key, by);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return 0;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      return [];
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const redisService = new RedisService();