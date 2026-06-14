/**
 * Redis Cache Service
 */

import Redis from 'ioredis';
import { config } from '../config/env';
import logger from 'utils/logger.js';
import { cacheHits, cacheMisses } from '../utils/metrics';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = new Redis(config.REDIS_URL, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, continuing without cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('Redis connection failed, continuing without cache');
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const data = await this.client.get(`${config.REDIS_KEY_PREFIX}${key}`);
      if (data) {
        cacheHits.labels('redis').inc();
        return JSON.parse(data) as T;
      }
      cacheMisses.labels('redis').inc();
      return null;
    } catch (error) {
      logger.error('Redis get error:', { key, error: error instanceof Error ? error.message : 'Unknown' });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(`${config.REDIS_KEY_PREFIX}${key}`, ttlSeconds, serialized);
      } else {
        await this.client.set(`${config.REDIS_KEY_PREFIX}${key}`, serialized);
      }
    } catch (error) {
      logger.error('Redis set error:', { key, error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(`${config.REDIS_KEY_PREFIX}${key}`);
    } catch (error) {
      logger.error('Redis del error:', { key, error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(`${config.REDIS_KEY_PREFIX}${pattern}`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Redis delPattern error:', { pattern, error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisService = new RedisService();
export default redisService;