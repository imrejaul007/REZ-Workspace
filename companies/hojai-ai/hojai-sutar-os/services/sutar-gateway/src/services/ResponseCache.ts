// ============================================================================
// SUTAR Gateway - Response Cache
// Redis-style in-memory caching with TTL and eviction
// ============================================================================

import { createHash } from 'crypto';
import type { CacheEntry, CacheStats, ApiResponse } from '../types/index.js';

export interface CacheConfig {
  maxSize: number;
  maxMemory: number;
  defaultTtl: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  enableCompression: boolean;
}

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  compress?: boolean;
  tags?: string[];
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
  };
  private listeners: Set<(event: CacheEvent) => void> = new Set();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize ?? 10000,
      maxMemory: config?.maxMemory ?? 100 * 1024 * 1024, // 100MB
      defaultTtl: config?.defaultTtl ?? 300000, // 5 minutes
      evictionPolicy: config?.evictionPolicy ?? 'lru',
      enableCompression: config?.enableCompression ?? false,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
    };

    this.startCleanupTask();
  }

  // ---------------------------------------------------------------------------
  // Cache Operations
  // ---------------------------------------------------------------------------

  set(key: string, value: unknown, options?: CacheOptions): boolean {
    const cacheKey = this.buildKey(key, options?.keyPrefix);
    const ttl = options?.ttl ?? this.config.defaultTtl;
    const now = Date.now();

    // Calculate size
    const serialized = this.serialize(value);
    const size = Buffer.byteLength(serialized, 'utf8');

    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize || this.stats.totalSize + size > this.config.maxMemory) {
      this.evict(size);
    }

    const entry: CacheEntry = {
      key: cacheKey,
      value,
      ttl,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
      size,
      hitCount: 0,
      metadata: {
        tags: options?.tags ?? [],
        compressed: options?.compress ?? false,
      },
    };

    // Remove old entry if exists
    if (this.cache.has(cacheKey)) {
      const oldEntry = this.cache.get(cacheKey)!;
      this.stats.totalSize -= oldEntry.size;
      this.removeFromAccessOrder(cacheKey);
    }

    this.cache.set(cacheKey, entry);
    this.addToAccessOrder(cacheKey);
    this.stats.totalSize += size;

    this.emit({
      type: 'set',
      key: cacheKey,
      size,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  get(key: string, keyPrefix?: string): unknown | null {
    const cacheKey = this.buildKey(key, keyPrefix);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      this.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    // Update access tracking
    this.stats.hits++;
    entry.hitCount++;
    this.updateAccessOrder(cacheKey);

    this.emit({
      type: 'hit',
      key: cacheKey,
      hitCount: entry.hitCount,
      timestamp: new Date().toISOString(),
    });

    return entry.value;
  }

  has(key: string, keyPrefix?: string): boolean {
    const cacheKey = this.buildKey(key, keyPrefix);
    const entry = this.cache.get(cacheKey);

    if (!entry) return false;

    // Check expiration
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      this.delete(cacheKey);
      return false;
    }

    return true;
  }

  delete(key: string | string[]): number {
    const keys = Array.isArray(key) ? key : [key];
    let deleted = 0;

    for (const k of keys) {
      const entry = this.cache.get(k);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.removeFromAccessOrder(k);
        this.cache.delete(k);
        deleted++;
      }
    }

    return deleted;
  }

  clear(): ApiResponse<{ cleared: number; size: number }> {
    const cleared = this.cache.size;
    const size = this.stats.totalSize;

    this.cache.clear();
    this.accessOrder = [];
    this.stats.totalSize = 0;

    this.emit({
      type: 'clear',
      cleared,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse({ cleared, size });
  }

  // ---------------------------------------------------------------------------
  // Cache Queries
  // ---------------------------------------------------------------------------

  getStats(): ApiResponse<CacheStats> {
    const entries = Array.from(this.cache.values());
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;

    let oldestEntry: string | undefined;
    let newestEntry: string | undefined;

    if (entries.length > 0) {
      const sorted = entries.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      oldestEntry = sorted[0].createdAt;
      newestEntry = sorted[sorted.length - 1].createdAt;
    }

    return this.successResponse({
      totalKeys: this.cache.size,
      totalSize: this.stats.totalSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      evictions: this.stats.evictions,
      oldestEntry,
      newestEntry,
    });
  }

  getKeys(pattern?: string): string[] {
    if (!pattern) {
      return Array.from(this.cache.keys());
    }

    // Convert glob pattern to regex
    const regex = new RegExp(
      pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );

    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  getByTag(tag: string): CacheEntry[] {
    return Array.from(this.cache.values()).filter(entry => {
      const tags = entry.metadata.tags as string[] | undefined;
      return tags?.includes(tag) ?? false;
    });
  }

  deleteByTag(tag: string): number {
    const entries = this.getByTag(tag);
    let deleted = 0;

    for (const entry of entries) {
      if (this.delete(entry.key) > 0) {
        deleted++;
      }
    }

    return deleted;
  }

  // ---------------------------------------------------------------------------
  // Cache Warming
  // ---------------------------------------------------------------------------

  warm(keys: Array<{ key: string; value: unknown; options?: CacheOptions }>): number {
    let warmed = 0;

    for (const item of keys) {
      if (this.set(item.key, item.value, item.options)) {
        warmed++;
      }
    }

    return warmed;
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  private buildKey(key: string, prefix?: string): string {
    if (!prefix) return key;
    return `${prefix}:${key}`;
  }

  private serialize(value: unknown): string {
    return JSON.stringify(value);
  }

  private evict(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries());

    switch (this.config.evictionPolicy) {
      case 'lru':
        // Evict least recently used (first in access order)
        while (this.cache.size > 0 && (this.cache.size >= this.config.maxSize || this.stats.totalSize + requiredSpace > this.config.maxMemory)) {
          const oldest = this.accessOrder[0];
          if (oldest) {
            const entry = this.cache.get(oldest);
            if (entry) {
              this.stats.totalSize -= entry.size;
              this.stats.evictions++;
            }
            this.cache.delete(oldest);
            this.accessOrder.shift();
          }
        }
        break;

      case 'lfu':
        // Evict least frequently used
        entries.sort((a, b) => a[1].hitCount - b[1].hitCount);
        while (this.cache.size > 0 && (this.cache.size >= this.config.maxSize || this.stats.totalSize + requiredSpace > this.config.maxMemory)) {
          const [key, entry] = entries.shift()!;
          this.stats.totalSize -= entry.size;
          this.stats.evictions++;
          this.cache.delete(key);
          this.removeFromAccessOrder(key);
        }
        break;

      case 'fifo':
        // Evict oldest (first created)
        entries.sort((a, b) =>
          new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime()
        );
        while (this.cache.size > 0 && (this.cache.size >= this.config.maxSize || this.stats.totalSize + requiredSpace > this.config.maxMemory)) {
          const [key, entry] = entries.shift()!;
          this.stats.totalSize -= entry.size;
          this.stats.evictions++;
          this.cache.delete(key);
          this.removeFromAccessOrder(key);
        }
        break;
    }

    this.emit({
      type: 'eviction',
      evicted: this.stats.evictions,
      timestamp: new Date().toISOString(),
    });
  }

  private addToAccessOrder(key: string): void {
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private startCleanupTask(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.cache) {
        if (now > new Date(entry.expiresAt).getTime()) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        const entry = this.cache.get(key);
        if (entry) {
          this.stats.totalSize -= entry.size;
          this.cache.delete(key);
          this.removeFromAccessOrder(key);
        }
      }

      if (expiredKeys.length > 0) {
        this.emit({
          type: 'cleanup',
          expired: expiredKeys.length,
          timestamp: new Date().toISOString(),
        });
      }
    }, 60000); // Run every minute
  }

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return { success: false, error, timestamp: new Date().toISOString() };
  }

  private emit(event: CacheEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[Cache] Event listener error:', error);
      }
    }
  }

  onEvent(listener: (event: CacheEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: CacheEvent) => void): void {
    this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
    this.accessOrder = [];
    this.listeners.clear();
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
    };
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface CacheEvent {
  type: 'set' | 'hit' | 'miss' | 'eviction' | 'clear' | 'cleanup';
  key?: string;
  size?: number;
  hitCount?: number;
  cleared?: number;
  evicted?: number;
  expired?: number;
  timestamp: string;
}

export const responseCache = new ResponseCache();

// Helper functions
export function cacheGet(key: string, keyPrefix?: string): unknown | null {
  return responseCache.get(key, keyPrefix);
}

export function cacheSet(key: string, value: unknown, options?: CacheOptions): boolean {
  return responseCache.set(key, value, options);
}

export function cacheDelete(key: string | string[]): number {
  return responseCache.delete(key);
}

export function cacheClear(): ApiResponse<{ cleared: number; size: number }> {
  return responseCache.clear();
}

export function generateCacheKey(...parts: string[]): string {
  return createHash('md5').update(parts.join(':')).digest('hex');
}
