import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { CacheConfigService } from './cache-config.service';

interface CacheItem<T> {
  value: T;
  expiry?: number;
  tags?: string[];
}

@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private cache: LRUCache<string, CacheItem<unknown>>;
  private tagMap: Map<string, Set<string>> = new Map(); // tag -> keys mapping

  constructor(private config: CacheConfigService) {
    this.cache = new LRUCache({
      max: this.config.getMaxItems(),
      ttl: this.config.getDefaultTtl() * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      ttlAutopurge: true,
      // Memory optimization
      allowStale: false,
      fetchMethod: undefined,
    });

    this.logger.log(`Memory cache initialized with max items: ${this.config.getMaxItems()}`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.cache.get(key);

      if (!item) {
        return null;
      }

      // Check manual expiry
      if (item.expiry && Date.now() > item.expiry) {
        this.cache.delete(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      this.logger.error(`Memory cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<boolean> {
    try {
      const expiry = ttl ? Date.now() + (ttl * 1000) : undefined;

      const item: CacheItem<T> = {
        value,
        expiry,
        tags,
      };

      // Set in cache
      this.cache.set(key, item);

      // Update tag mapping
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          if (!this.tagMap.has(tag)) {
            this.tagMap.set(tag, new Set());
          }
          this.tagMap.get(tag)!.add(key);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Memory cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const item = this.cache.get(key);

      // Clean up tag mappings
      if (item?.tags) {
        for (const tag of item.tags) {
          const tagKeys = this.tagMap.get(tag);
          if (tagKeys) {
            tagKeys.delete(key);
            if (tagKeys.size === 0) {
              this.tagMap.delete(tag);
            }
          }
        }
      }

      return this.cache.delete(key);
    } catch (error) {
      this.logger.error(`Memory cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    try {
      let deletedCount = 0;
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));

      for (const [key] of this.cache.entries()) {
        if (regex.test(key)) {
          if (await this.delete(key)) {
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Memory cache pattern delete error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async deleteByTags(tags: string[]): Promise<number> {
    try {
      let deletedCount = 0;
      const keysToDelete = new Set<string>();

      for (const tag of tags) {
        const tagKeys = this.tagMap.get(tag);
        if (tagKeys) {
          for (const key of tagKeys) {
            keysToDelete.add(key);
          }
        }
      }

      for (const key of keysToDelete) {
        if (await this.delete(key)) {
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Memory cache tag delete error:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());

    if (!pattern) {
      return allKeys;
    }

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagMap.clear();
    this.logger.log('Memory cache cleared');
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset(keyValuePairs: Record<string, unknown>, ttl?: number): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(keyValuePairs)) {
        await this.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      this.logger.error('Memory cache mset error:', error);
      return false;
    }
  }

  async increment(key: string, delta: number = 1): Promise<number> {
    try {
      const current = await this.get<number>(key) || 0;
      const newValue = current + delta;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      this.logger.error(`Memory cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, delta: number = 1): Promise<number> {
    return this.increment(key, -delta);
  }

  // Cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRatio: number;
    tags: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRatio: this.cache.calculatedSize > 0 ? this.cache.size / this.cache.calculatedSize : 0,
      tags: this.tagMap.size,
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: unknown }> {
    try {
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'test';

      await this.set(testKey, testValue, 5); // 5 second TTL
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      if (retrieved === testValue) {
        return {
          status: 'healthy',
          details: {
            type: 'memory',
            stats: this.getStats(),
          },
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            error: 'Health check value mismatch',
            stats: this.getStats(),
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          stats: this.getStats(),
        },
      };
    }
  }

  // Cleanup expired items manually (useful for debugging)
  cleanupExpired(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && now > item.expiry) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Get all keys for a specific tag
  getKeysByTag(tag: string): string[] {
    const tagKeys = this.tagMap.get(tag);
    return tagKeys ? Array.from(tagKeys) : [];
  }

  // Get memory usage estimate (approximate)
  getMemoryUsage(): { estimated: string; items: number } {
    const items = this.cache.size;
    // Rough estimate: 1KB per item on average
    const estimatedBytes = items * 1024;
    const estimated = this.formatBytes(estimatedBytes);

    return { estimated, items };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
