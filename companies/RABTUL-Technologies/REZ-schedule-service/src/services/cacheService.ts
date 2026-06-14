// ReZ Schedule - Cache Service
// Redis-based caching for availability and hot data
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;        // Time to live in seconds
  prefix?: string;    // Key prefix
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Simple in-memory cache (replace with Redis in production)
const cacheStore = new Map<string, CacheEntry<unknown>>();

// Cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cacheStore.entries()) {
        if (entry.expiresAt < now) {
          cacheStore.delete(key);
        }
      }
    }, 60000); // Run cleanup every minute
  }
}

startCleanup();

export class CacheService {
  private readonly prefix: string;

  constructor(prefix = 'rez:schedule') {
    this.prefix = prefix;
  }

  /**
   * Build a cache key
   */
  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300; // Default 5 minutes
    const fullKey = this.buildKey(key);

    cacheStore.set(fullKey, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });

    logger.debug(`[Cache] SET ${fullKey} (TTL: ${ttl}s)`);
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const entry = cacheStore.get(fullKey) as CacheEntry<T> | undefined;

    if (!entry) {
      logger.debug(`[Cache] MISS ${fullKey}`);
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      cacheStore.delete(fullKey);
      logger.debug(`[Cache] EXPIRED ${fullKey}`);
      return null;
    }

    logger.debug(`[Cache] HIT ${fullKey}`);
    return entry.value;
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    cacheStore.delete(fullKey);
    logger.debug(`[Cache] DELETE ${fullKey}`);
  }

  /**
   * Delete by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const fullPattern = this.buildKey(pattern);
    let count = 0;

    for (const key of cacheStore.keys()) {
      if (key.includes(fullPattern.replace('*', ''))) {
        cacheStore.delete(key);
        count++;
      }
    }

    logger.debug(`[Cache] DELETE_PATTERN ${pattern} (${count} keys)`);
    return count;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    const entry = cacheStore.get(fullKey);

    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      cacheStore.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Get TTL remaining for a key
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.buildKey(key);
    const entry = cacheStore.get(fullKey);

    if (!entry) return -1;
    if (entry.expiresAt < Date.now()) return -2;

    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  /**
   * Set multiple values
   */
  async setMany<T>(entries: { key: string; value: T; ttl?: number }[]): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, { ttl: entry.ttl });
    }
  }

  /**
   * Get many values
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * Increment a counter
   */
  async increment(key: string, amount = 1): Promise<number> {
    const fullKey = this.buildKey(key);
    const entry = cacheStore.get(fullKey) as CacheEntry<number> | undefined;

    const current = (entry?.value as number) || 0;
    const newValue = current + amount;

    // Set with 1 hour TTL for counters
    await this.set(key, newValue, { ttl: 3600 });

    return newValue;
  }

  /**
   * Cache availability slots
   */
  async cacheAvailabilitySlots(
    eventTypeId: string,
    date: string,
    slots: unknown[],
    ttl = 300 // 5 minutes
  ): Promise<void> {
    await this.set(`avail:${eventTypeId}:${date}`, slots, { ttl });
  }

  /**
   * Get cached availability slots
   */
  async getAvailabilitySlots(eventTypeId: string, date: string): Promise<unknown[] | null> {
    return this.get<unknown[]>(`avail:${eventTypeId}:${date}`);
  }

  /**
   * Invalidate availability cache
   */
  async invalidateAvailability(eventTypeId: string): Promise<number> {
    return this.deletePattern(`avail:${eventTypeId}:*`);
  }

  /**
   * Cache event type public data
   */
  async cacheEventType(slug: string, data: unknown, ttl = 300): Promise<void> {
    await this.set(`event:${slug}`, data, { ttl });
  }

  /**
   * Get cached event type
   */
  async getEventType(slug: string): Promise<unknown | null> {
    return this.get(`event:${slug}`);
  }

  /**
   * Invalidate event type cache
   */
  async invalidateEventType(slug: string): Promise<void> {
    await this.delete(`event:${slug}`);
  }

  /**
   * Cache with lock (for atomic operations)
   */
  async setWithLock<T>(
    key: string,
    value: T,
    ttl = 30,
    lockTtl = 10
  ): Promise<boolean> {
    const lockKey = `${this.buildKey(key)}:lock`;

    // Check if lock exists
    const existingLock = cacheStore.get(lockKey);
    if (existingLock && existingLock.expiresAt > Date.now()) {
      return false; // Already locked
    }

    // Set value and lock
    await this.set(key, value, { ttl });
    cacheStore.set(lockKey, {
      value: true,
      expiresAt: Date.now() + lockTtl * 1000,
    });

    return true;
  }

  /**
   * Release lock
   */
  async releaseLock(key: string): Promise<void> {
    const lockKey = `${this.buildKey(key)}:lock`;
    cacheStore.delete(lockKey);
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: number } {
    let expired = 0;
    const now = Date.now();

    for (const entry of cacheStore.values()) {
      if (entry.expiresAt < now) {
        expired++;
      }
    }

    return {
      size: cacheStore.size,
      keys: cacheStore.size - expired,
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    cacheStore.clear();
    logger.info('[Cache] Cleared all cache');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; size: number }> {
    return {
      status: 'healthy',
      size: cacheStore.size,
    };
  }
}

export const cacheService = new CacheService();
export default cacheService;
