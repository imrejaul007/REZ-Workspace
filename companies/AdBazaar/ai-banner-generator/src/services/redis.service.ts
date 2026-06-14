/**
 * Redis Cache Service for AI Banner Generator
 */

import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

class RedisCacheService {
  private client: Redis | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (!config.REDIS_ENABLED) {
      logger.info('Redis disabled, running without cache');
      return;
    }

    try {
      this.client = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('Redis connection failed, running without cache', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  // Cache operations
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) return null;

    try {
      const data = await this.client!.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      logger.error('Redis get error', { key, error: error instanceof Error ? error.message : 'Unknown' });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client!.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error('Redis set error', { key, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error', { key, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', { key, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  // Generation-specific cache methods
  async cacheGeneration(generationId: string, data: unknown, ttlSeconds = 1800): Promise<boolean> {
    return this.set(`generation:${generationId}`, data, ttlSeconds);
  }

  async getCachedGeneration(generationId: string): Promise<unknown | null> {
    return this.get(`generation:${generationId}`);
  }

  async cacheTemplate(templateId: string, data: unknown, ttlSeconds = 7200): Promise<boolean> {
    return this.set(`template:${templateId}`, data, ttlSeconds);
  }

  async getCachedTemplate(templateId: string): Promise<unknown | null> {
    return this.get(`template:${templateId}`);
  }

  async cacheTemplateList(category: string, data: unknown, ttlSeconds = 600): Promise<boolean> {
    return this.set(`templates:${category}`, data, ttlSeconds);
  }

  async getCachedTemplateList(category: string): Promise<unknown | null> {
    return this.get(`templates:${category}`);
  }

  async invalidateGenerationCache(generationId: string): Promise<boolean> {
    return this.delete(`generation:${generationId}`);
  }

  async invalidateTemplateCache(templateId: string): Promise<boolean> {
    return this.delete(`template:${templateId}`);
  }

  async invalidateAllTemplateCache(): Promise<void> {
    if (!this.isConnected()) return;
    try {
      const keys = await this.client!.keys('templates:*');
      if (keys.length > 0) {
        await this.client!.del(...keys);
      }
    } catch (error) {
      logger.error('Failed to invalidate template cache', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }
}

export const redisService = new RedisCacheService();
export default redisService;