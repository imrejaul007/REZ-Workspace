/**
 * Redis Cache Service for REZ Referral OS
 */

import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const DEFAULT_TTL = 300;

export class CacheService {
  private redis = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`[Cache] Get error: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`[Cache] Set error: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`[Cache] Del error: ${key}`, error);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error(`[Cache] DelByPattern error: ${pattern}`, error);
    }
  }

  async cached<T>(key: string, fn: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

export const cacheService = new CacheService();
