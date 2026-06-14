/**
 * Menu Cache Service
 * Redis-based caching for merchant menus to prevent MongoDB overload.
 * Provides get, set, invalidate, and warmCache operations with TTL.
 */

import { bullmqRedis } from '../config/redis';
import { logger } from '../config/logger';

const CACHE_TTL = 300; // 5 minutes in seconds
const CACHE_PREFIX = 'menu';

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  hitRate: number;
}

/**
 * Menu cache entry structure
 */
export interface MenuCacheEntry {
  data: unknown;
  cachedAt: number;
  version: string;
}

/**
 * MenuCache provides Redis caching for merchant menus.
 * Features:
 * - Automatic TTL expiration (5 minutes)
 * - Cache warming for frequently accessed menus
 * - Cache invalidation on menu updates
 * - Hit/miss statistics tracking
 */
export class MenuCache {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    hitRate: 0,
  };

  /**
   * Get a cached menu by merchant ID.
   * Returns null if not in cache (cache miss).
   */
  async get(merchantId: string): Promise<unknown | null> {
    if (!this.isValidMerchantId(merchantId)) {
      logger.warn(`[MenuCache] Invalid merchant ID: ${merchantId}`);
      return null;
    }

    try {
      const key = this.buildKey(merchantId);
      const cached = await bullmqRedis.get(key);

      if (cached) {
        this.stats.hits++;
        this.updateHitRate();

        const entry: MenuCacheEntry = JSON.parse(cached);
        logger.debug(`[MenuCache] HIT for merchant: ${merchantId}`);

        return entry.data;
      }

      this.stats.misses++;
      this.updateHitRate();
      logger.debug(`[MenuCache] MISS for merchant: ${merchantId}`);

      return null;
    } catch (error) {
      logger.error(`[MenuCache] Error getting cache for ${merchantId}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set a menu in the cache with TTL.
   * Overwrites unknown existing cached menu for the merchant.
   */
  async set(merchantId: string, menu: unknown): Promise<boolean> {
    if (!this.isValidMerchantId(merchantId)) {
      logger.warn(`[MenuCache] Invalid merchant ID: ${merchantId}`);
      return false;
    }

    if (menu === undefined || menu === null) {
      logger.warn(`[MenuCache] Cannot cache null/undefined menu for ${merchantId}`);
      return false;
    }

    try {
      const key = this.buildKey(merchantId);
      const entry: MenuCacheEntry = {
        data: menu,
        cachedAt: Date.now(),
        version: '1.0',
      };

      await bullmqRedis.setex(key, CACHE_TTL, JSON.stringify(entry));
      this.stats.sets++;
      logger.debug(`[MenuCache] SET for merchant: ${merchantId}, TTL: ${CACHE_TTL}s`);

      return true;
    } catch (error) {
      logger.error(`[MenuCache] Error setting cache for ${merchantId}:`, error);
      return false;
    }
  }

  /**
   * Invalidate (delete) a cached menu by merchant ID.
   * Should be called when menu is updated.
   */
  async invalidate(merchantId: string): Promise<boolean> {
    if (!this.isValidMerchantId(merchantId)) {
      logger.warn(`[MenuCache] Invalid merchant ID: ${merchantId}`);
      return false;
    }

    try {
      const key = this.buildKey(merchantId);
      const deleted = await bullmqRedis.del(key);

      if (deleted > 0) {
        this.stats.invalidations++;
        logger.info(`[MenuCache] INVALIDATED for merchant: ${merchantId}`);
        return true;
      }

      logger.debug(`[MenuCache] No cache to invalidate for merchant: ${merchantId}`);
      return false;
    } catch (error) {
      logger.error(`[MenuCache] Error invalidating cache for ${merchantId}:`, error);
      return false;
    }
  }

  /**
   * Warm the cache with menu data.
   * This is an alias for set() but semantically indicates
   * proactive cache population (e.g., on application startup).
   */
  async warmCache(merchantId: string, menu: unknown): Promise<boolean> {
    logger.info(`[MenuCache] Warming cache for merchant: ${merchantId}`);
    return this.set(merchantId, menu);
  }

  /**
   * Warm cache for multiple merchants in batch.
   * Useful for preloading frequently accessed menus.
   */
  async warmCacheBatch(entries: Array<{ merchantId: string; menu: unknown }>): Promise<number> {
    let successCount = 0;

    for (const { merchantId, menu } of entries) {
      const success = await this.set(merchantId, menu);
      if (success) successCount++;
    }

    logger.info(`[MenuCache] Batch warmed ${successCount}/${entries.length} menus`);
    return successCount;
  }

  /**
   * Invalidate cache for multiple merchants in batch.
   * Useful when bulk menu updates occur.
   */
  async invalidateBatch(merchantIds: string[]): Promise<number> {
    if (merchantIds.length === 0) return 0;

    const pipeline = bullmqRedis.pipeline();
    const validIds = merchantIds.filter((id) => this.isValidMerchantId(id));

    for (const merchantId of validIds) {
      pipeline.del(this.buildKey(merchantId));
    }

    try {
      const results = await pipeline.exec();
      const deletedCount = results?.filter(([err, result]) => !err && (result as number) > 0).length ?? 0;

      this.stats.invalidations += deletedCount;
      logger.info(`[MenuCache] Batch invalidated ${deletedCount}/${merchantIds.length} menus`);

      return deletedCount;
    } catch (error) {
      logger.error(`[MenuCache] Error in batch invalidation:`, error);
      return 0;
    }
  }

  /**
   * Check if a menu is cached without updating stats.
   */
  async has(merchantId: string): Promise<boolean> {
    if (!this.isValidMerchantId(merchantId)) return false;

    try {
      const key = this.buildKey(merchantId);
      const exists = await bullmqRedis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`[MenuCache] Error checking cache existence for ${merchantId}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a cached menu.
   * Returns -2 if key doesn't exist, -1 if no TTL, otherwise seconds remaining.
   */
  async getTTL(merchantId: string): Promise<number> {
    if (!this.isValidMerchantId(merchantId)) return -2;

    try {
      const key = this.buildKey(merchantId);
      return await bullmqRedis.ttl(key);
    } catch (error) {
      logger.error(`[MenuCache] Error getting TTL for ${merchantId}:`, error);
      return -2;
    }
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics.
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      hitRate: 0,
    };
    logger.info('[MenuCache] Statistics reset');
  }

  /**
   * Build Redis key for a merchant's menu cache.
   */
  private buildKey(merchantId: string): string {
    return `${CACHE_PREFIX}:${merchantId}`;
  }

  /**
   * Validate merchant ID format.
   * Accepts non-empty strings containing only alphanumeric, dash, and underscore.
   */
  private isValidMerchantId(merchantId: string): boolean {
    return typeof merchantId === 'string' && merchantId.length > 0 && merchantId.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(merchantId);
  }

  /**
   * Update the hit rate calculation.
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    if (total > 0) {
      this.stats.hitRate = Math.round((this.stats.hits / total) * 10000) / 100;
    }
  }
}

// Export singleton instance
export const menuCache = new MenuCache();
