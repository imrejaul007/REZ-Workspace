// Redis-backed cache for tier/karma data
// SECURITY: Uses Redis instead of in-memory for production readiness
// PERFORMANCE: Enhanced with cache-aside pattern and async helpers

import { getRedis } from '../config/redis';

interface CachedData<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class RedisCache {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  private readonly namespace = 'profile:cache';

  private buildKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get cached value by key.
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis();
      const fullKey = this.buildKey(key);
      const cached = await redis.get(fullKey);

      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const parsed = JSON.parse(cached) as CachedData<T>;

      // Check if expired (defensive, Redis TTL should handle this)
      if (new Date(parsed.expiresAt) < new Date()) {
        await redis.del(fullKey);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return parsed.data;
    } catch (error) {
      this.stats.errors++;
      console.error('[Cache] Get failed:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL.
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      const redis = getRedis();
      const fullKey = this.buildKey(key);
      const cached: CachedData<T> = {
        data: value,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      };

      await redis.setEx(fullKey, ttlSeconds, JSON.stringify(cached));
      this.stats.sets++;
    } catch (error) {
      this.stats.errors++;
      console.error('[Cache] Set failed:', error);
    }
  }

  /**
   * Cache-aside pattern: get from cache or fetch from source and cache.
   * @param key - Cache key
   * @param fetcher - Async function to fetch data if not cached
   * @param ttlSeconds - Time to live in seconds
   * @returns Cached or freshly fetched data
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Delete cached value.
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      const redis = getRedis();
      await redis.del(this.buildKey(key));
      this.stats.deletes++;
    } catch (error) {
      this.stats.errors++;
      console.error('[Cache] Delete failed:', error);
    }
  }

  /**
   * Clear all cached values matching a pattern.
   * @param pattern - Key pattern (e.g., "tier:*")
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      const redis = getRedis();
      const fullPattern = this.buildKey(pattern);
      const keys = await redis.keys(fullPattern);

      if (keys.length > 0) {
        await redis.del(keys);
        this.stats.deletes += keys.length;
      }
      return keys.length;
    } catch (error) {
      this.stats.errors++;
      console.error('[Cache] ClearPattern failed:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * Reset cache statistics.
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Check if Redis is connected and healthy.
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const redis = getRedis();
      const result = await redis.ping();
      return { healthy: result === 'PONG' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Cache] Health check failed: ${errorMessage}`);
      return { healthy: false, error: errorMessage };
    }
  }
}

export const cache = new RedisCache();
export default cache;

// ─── Backward Compatibility ─────────────────────────────────────────────────────
// For synchronous access patterns, provide a sync wrapper
// Note: This is only for cases where async is not possible

class SyncCacheFallback {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Fallback sync cache if Redis is unavailable
const syncFallback = new SyncCacheFallback();
