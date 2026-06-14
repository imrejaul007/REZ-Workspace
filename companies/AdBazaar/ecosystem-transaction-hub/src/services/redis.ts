import Redis from 'ioredis';
import config from '../config';
import { logger } from 'utils/logger.js';
import { cacheHits, cacheMisses } from '../middleware/metrics';

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis error', { error: err.message });
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis connection failed', { error });
      // Continue without Redis - will use in-memory fallback
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const data = await this.client.get(`${config.redis.keyPrefix}${key}`);
      if (data) {
        cacheHits.inc();
        return JSON.parse(data) as T;
      }
      cacheMisses.inc();
      return null;
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(`${config.redis.keyPrefix}${key}`, ttlSeconds, serialized);
      } else {
        await this.client.set(`${config.redis.keyPrefix}${key}`, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error', { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.del(`${config.redis.keyPrefix}${key}`);
      return true;
    } catch (error) {
      logger.error('Redis del error', { key, error });
      return false;
    }
  }

  async hset(key: string, field: string, value: unknown): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.hset(`${config.redis.keyPrefix}${key}`, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis hset error', { key, field, error });
      return false;
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const data = await this.client.hget(`${config.redis.keyPrefix}${key}`, field);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      logger.error('Redis hget error', { key, field, error });
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    if (!this.client) return null;

    try {
      const data = await this.client.hgetall(`${config.redis.keyPrefix}${key}`);
      if (data) {
        const result: Record<string, T> = {};
        for (const [k, v] of Object.entries(data)) {
          result[k] = JSON.parse(v) as T;
        }
        return result;
      }
      return null;
    } catch (error) {
      logger.error('Redis hgetall error', { key, error });
      return null;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;

    try {
      return await this.client.incr(`${config.redis.keyPrefix}${key}`);
    } catch (error) {
      logger.error('Redis incr error', { key, error });
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.expire(`${config.redis.keyPrefix}${key}`, ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error', { key, error });
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];

    try {
      const allKeys = await this.client.keys(`${config.redis.keyPrefix}${pattern}`);
      return allKeys.map((k) => k.replace(config.redis.keyPrefix, ''));
    } catch (error) {
      logger.error('Redis keys error', { pattern, error });
      return [];
    }
  }

  async publish(channel: string, message: unknown): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Redis publish error', { channel, error });
      return false;
    }
  }
}

export const redisService = new RedisService();
export default redisService;