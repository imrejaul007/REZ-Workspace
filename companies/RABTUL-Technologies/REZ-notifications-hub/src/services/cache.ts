import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

class CacheService {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, caching disabled', { error });
      // Allow app to work without Redis
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.client!.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  // Convenience methods for notifications
  async cacheTemplate(templateId: string, template: unknown, ttlSeconds = 3600): Promise<void> {
    await this.set(`template:${templateId}`, template, ttlSeconds);
  }

  async getTemplate<T>(templateId: string): Promise<T | null> {
    return this.get<T>(`template:${templateId}`);
  }

  async cachePreferences(userId: string, preferences: unknown, ttlSeconds = 1800): Promise<void> {
    await this.set(`preferences:${userId}`, preferences, ttlSeconds);
  }

  async getPreferences<T>(userId: string): Promise<T | null> {
    return this.get<T>(`preferences:${userId}`);
  }

  async invalidatePreferences(userId: string): Promise<void> {
    await this.delete(`preferences:${userId}`);
  }

  async cacheOptOut(userId: string, channel: string, ttlSeconds = 3600): Promise<void> {
    await this.set(`optout:${userId}:${channel}`, true, ttlSeconds);
  }

  async isOptedOut(userId: string, channel: string): Promise<boolean> {
    return !!(await this.get<boolean>(`optout:${userId}:${channel}`));
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const fullKey = `ratelimit:${key}`;
      const count = await this.client!.incr(fullKey);

      if (count === 1) {
        await this.client!.expire(fullKey, windowSeconds);
      }

      return count;
    } catch (error) {
      logger.error('Rate limit increment error', { key, error });
      return 0;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
