/**
 * ReZ Upsell - Cache Service
 */

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class CacheService {
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached value
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Get or set cache
   */
  static async remember<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  /**
   * Increment counter
   */
  static async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const count = await redis.incr(key);
      if (ttlSeconds && count === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  /**
   * Cache shop config
   */
  static async getShopConfig(shop: string): Promise<any | null> {
    return this.get(`config:${shop}`);
  }

  static async setShopConfig(shop: string, config: any): Promise<void> {
    return this.set(`config:${shop}`, config, 600); // 10 min cache
  }

  /**
   * Cache upsell offer
   */
  static async getOffer(shop: string, cartKey: string): Promise<any | null> {
    return this.get(`offer:${shop}:${cartKey}`);
  }

  static async setOffer(shop: string, cartKey: string, offer: any): Promise<void> {
    return this.set(`offer:${shop}:${cartKey}`, offer, 300); // 5 min cache
  }
}

export default redis;
