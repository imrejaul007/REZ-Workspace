import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
  bypassCache?: boolean; // Skip cache for this operation
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 300; // 5 minutes default

  constructor(private readonly redis: RedisService) {}

  /**
   * Get cached data by key
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key, prefix);
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        return JSON.parse(cached);
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set cached data
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      if (options.bypassCache) return;

      const cacheKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;

      await this.redis.set(cacheKey, JSON.stringify(data), ttl);
      this.logger.debug(`Cache SET for key: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
      // Fail gracefully - don't break the application
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string, prefix?: string): Promise<void> {
    try {
      const cacheKey = this.buildKey(key, prefix);
      await this.redis.del(cacheKey);
      this.logger.debug(`Cache DEL for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    if (options.bypassCache) {
      return await fetchFn();
    }

    // Try to get from cache first
    const cached = await this.get<T>(key, options.prefix);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = this.redis.getClient();
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} cache entries matching: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Increment counter with expiration
   */
  async incrementCounter(
    key: string,
    ttl: number = 3600,
    prefix: string = 'counter'
  ): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, prefix);
      const count = await this.redis.incr(cacheKey);

      // Set expiration only on first increment
      if (count === 1) {
        await this.redis.expire(cacheKey, ttl);
      }

      return count;
    } catch (error) {
      this.logger.error(`Counter increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Cache API response based on request signature
   */
  generateApiCacheKey(
    method: string,
    url: string,
    userId?: string,
    queryParams?: Record<string, unknown> | undefined
  ): string {
    const parts = [method.toLowerCase(), url];

    if (userId) {
      parts.push(`user:${userId}`);
    }

    if (queryParams) {
      const sortedParams = Object.keys(queryParams)
        .sort()
        .map(key => `${key}:${queryParams[key]}`)
        .join('|');
      parts.push(sortedParams);
    }

    return parts.join(':');
  }

  /**
   * Cache warm-up for frequently accessed data
   */
  async warmupCache(
    keys: Array<{ key: string; fetchFn: () => Promise<unknown>; options?: CacheOptions }>
  ): Promise<void> {
    this.logger.log(`Starting cache warmup for ${keys.length} entries`);

    const promises = keys.map(async ({ key, fetchFn, options }) => {
      try {
        const data = await fetchFn();
        await this.set(key, data, options);
      } catch (error) {
        this.logger.error(`Cache warmup failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log('Cache warmup completed');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRatio: number;
    totalKeys: number;
  }> {
    try {
      const client = this.redis.getClient();
      const info = await client.info('stats');

      // Parse Redis stats
      const lines = info.split('\r\n');
      const stats: unknown = {};

      for (const line of lines) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }

      const hits = parseInt(stats.keyspace_hits || '0');
      const misses = parseInt(stats.keyspace_misses || '0');
      const total = hits + misses;
      const hitRatio = total > 0 ? hits / total : 0;

      // Count total keys
      const keys = await client.keys('*');

      return {
        hits,
        misses,
        hitRatio: Math.round(hitRatio * 100) / 100,
        totalKeys: keys.length
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0, hitRatio: 0, totalKeys: 0 };
    }
  }

  private buildKey(key: string, prefix?: string): string {
    const parts = ['api'];

    if (prefix) {
      parts.push(prefix);
    }

    parts.push(key);
    return parts.join(':');
  }
}