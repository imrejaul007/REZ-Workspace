import Redis from 'ioredis';
import config from '../config/index.js';

export class CacheService {
  private redis: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      this.redis = new Redis(config.redis.url, {
        maxRetriesPerRequest: config.redis.maxRetries,
        retryStrategy: (times) => {
          if (times > config.redis.maxRetries) {
            return null;
          }
          return Math.min(times * config.redis.retryDelay, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        this.isConnected = false;
      });

      this.redis.connect().catch((err) => {
        logger.error('Redis initial connection failed:', err.message);
      });
    } catch (error) {
      logger.error('Redis initialization error:', error);
    }
  }

  private getClient(): Redis | null {
    return this.redis;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return null;
    }

    try {
      const value = await client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl: number = config.cache.ttl): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return false;
    }

    try {
      await client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return false;
    }

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      const deleted = await client.del(...keys);
      return deleted;
    } catch (error) {
      logger.error('Cache invalidate error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return false;
    }

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return 0;
    }

    try {
      return await client.incr(key);
    } catch (error) {
      logger.error('Cache incr error:', error);
      return 0;
    }
  }

  /**
   * Set multiple values
   */
  async setMultiple(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return false;
    }

    try {
      const pipeline = client.pipeline();
      for (const entry of entries) {
        pipeline.setex(entry.key, entry.ttl || config.cache.ttl, JSON.stringify(entry.value));
      }
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache setMultiple error:', error);
      return false;
    }
  }

  /**
   * Get multiple values
   */
  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const client = this.getClient();
    const result = new Map<string, T | null>();

    if (!client || !this.isConnected || keys.length === 0) {
      keys.forEach((key) => result.set(key, null));
      return result;
    }

    try {
      const values = await client.mget(...keys);
      keys.forEach((key, index) => {
        const value = values[index];
        result.set(key, value ? (JSON.parse(value) as T) : null);
      });
      return result;
    } catch (error) {
      logger.error('Cache getMultiple error:', error);
      keys.forEach((key) => result.set(key, null));
      return result;
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    const client = this.getClient();
    if (client) {
      await client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.isConnected) {
      return false;
    }

    try {
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
