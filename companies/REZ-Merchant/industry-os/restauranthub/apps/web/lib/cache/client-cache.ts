/**
 * Client-side caching utility for improved performance
 * Provides memory caching with TTL and size limits
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
}

interface CacheConfig {
  maxSize?: number; // Maximum cache size in MB
  defaultTTL?: number; // Default TTL in milliseconds
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

class ClientCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private currentSize = 0;
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig = {}) {
    this.maxSize = (config.maxSize || 50) * 1024 * 1024; // Convert MB to bytes
    this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.cleanupInterval = config.cleanupInterval || 60 * 1000; // 1 minute

    this.startCleanup();
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      size: this.estimateSize(data),
    };

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
    }

    // Check if we need to make space
    this.ensureSpace(item.size);

    this.cache.set(key, item);
    this.currentSize += item.size;
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.currentSize,
      memoryUsageMB: Math.round((this.currentSize / 1024 / 1024) * 100) / 100,
      maxSizeMB: Math.round((this.maxSize / 1024 / 1024) * 100) / 100,
    };
  }

  /**
   * Get or set pattern with automatic caching
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Estimate the size of data in bytes
   */
  private estimateSize(data): number {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  /**
   * Ensure there's enough space for new item
   */
  private ensureSpace(requiredSize: number): void {
    if (this.currentSize + requiredSize <= this.maxSize) {
      return;
    }

    // Convert cache to array and sort by timestamp (oldest first)
    const items = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    // Remove oldest items until we have enough space
    for (const [key] of items) {
      this.delete(key);
      if (this.currentSize + requiredSize <= this.maxSize) {
        break;
      }
    }
  }

  /**
   * Start automatic cleanup of expired items
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Remove expired items
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Stop the cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Global cache instance
export const clientCache = new ClientCache({
  maxSize: 50, // 50MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
});

// Cache keys generator
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  restaurant: (id: string) => `restaurant:${id}`,
  restaurants: (query?: string) => `restaurants${query ? `:${query}` : ''}`,
  job: (id: string) => `job:${id}`,
  jobs: (query?: string) => `jobs${query ? `:${query}` : ''}`,
  vendor: (id: string) => `vendor:${id}`,
  vendors: (query?: string) => `vendors${query ? `:${query}` : ''}`,
  product: (id: string) => `product:${id}`,
  products: (query?: string) => `products${query ? `:${query}` : ''}`,
  community: (type?: string) => `community${type ? `:${type}` : ''}`,
  analytics: (type: string, period?: string) =>
    `analytics:${type}${period ? `:${period}` : ''}`,
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};

// Utility hooks for React Query integration
export const createCacheKey = (baseKey: string, params: Record<string, unknown> = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');

  return sortedParams ? `${baseKey}|${sortedParams}` : baseKey;
};

// Cache invalidation patterns
export const invalidateCache = (pattern: string | RegExp) => {
  const keysToDelete: string[] = [];

  for (const key of clientCache['cache'].keys()) {
    const matches = typeof pattern === 'string'
      ? key.includes(pattern)
      : pattern.test(key);

    if (matches) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    clientCache.delete(key);
  }
};

export default clientCache;