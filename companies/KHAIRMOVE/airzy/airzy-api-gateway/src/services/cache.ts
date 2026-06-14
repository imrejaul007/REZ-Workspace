import Redis from 'ioredis';
import config from '../config';
import { logger } from '../utils/logger';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = config.cache.enabled;
    this.initRedis();
    this.startMemoryCleanup();
  }

  private async initRedis(): Promise<void> {
    if (!this.enabled) {
      logger.info('Cache disabled, using in-memory cache only');
      return;
    }

    try {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, falling back to memory cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3
      });

      this.redis.on('error', (err) => {
        logger.error('Redis error', { error: err.message });
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected');
      });
    } catch (error) {
      logger.warn('Redis initialization failed, using memory cache only');
      this.redis = null;
    }
  }

  private startMemoryCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      this.memoryCache.forEach((entry, key) => {
        if (entry.expiresAt <= now) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        logger.debug(`Cleaned ${cleaned} expired cache entries`);
      }
    }, 60000); // Run every minute
  }

  async get(key: string): Promise<string | null> {
    // Try Redis first
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          return value;
        }
      } catch (error) {
        logger.warn('Redis get failed, falling back to memory', { key });
      }
    }

    // Fall back to memory cache
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        return entry.value;
      }
      this.memoryCache.delete(key);
    }

    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || config.cache.defaultTTL) * 1000;

    // Try Redis first
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl || config.cache.defaultTTL, value);
        return;
      } catch (error) {
        logger.warn('Redis set failed, using memory cache', { key });
      }
    }

    // Fall back to memory cache
    this.memoryCache.set(key, { value, expiresAt });

    // Check memory cache size
    if (this.memoryCache.size > config.cache.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

      const toRemove = Math.floor(config.cache.maxSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  }

  async delete(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        logger.warn('Redis delete failed', { key });
      }
    }

    this.memoryCache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (this.redis) {
      try {
        if (pattern) {
          const keys = await this.redis.keys(`*${pattern}*`);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.flushdb();
        }
      } catch (error) {
        logger.warn('Redis clear failed');
      }
    }

    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      this.memoryCache.forEach((_, key) => {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      });
    } else {
      this.memoryCache.clear();
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  getStats(): {
    memorySize: number;
    redisConnected: boolean;
    enabled: boolean;
  } {
    return {
      memorySize: this.memoryCache.size,
      redisConnected: this.redis?.status === 'ready',
      enabled: this.enabled
    };
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;