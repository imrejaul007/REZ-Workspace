import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheConfigService } from './cache-config.service';
import { RedisService } from './redis.service';
import { MemoryCacheService } from './memory-cache.service';
import * as zlib from 'zlib';
import * as util from 'util';

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
  namespace?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  avgResponseTime: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    avgResponseTime: 0,
  };
  private responseTimes: number[] = [];

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('CACHE_CONFIG') private config: CacheConfigService,
    private redisService: RedisService,
    private memoryCacheService: MemoryCacheService,
  ) {}

  /**
   * Get value from cache with performance tracking
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key, options?.namespace);

    try {
      let value: string | null | undefined;

      if (this.config.isRedisEnabled()) {
        value = await this.redisService.get(fullKey);
      } else {
        value = await this.cacheManager.get<string>(fullKey);
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, value != null);

      if (value == null) {
        return null;
      }

      // Handle compressed data
      if (options?.compress || this.shouldCompress(value)) {
        const decompressed = await gunzip(Buffer.from(value, 'base64'));
        value = decompressed.toString();
      }

      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Cache get error for key ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with compression and TTL
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key, options?.namespace);
    const ttl = options?.ttl || this.config.getDefaultTtl();

    try {
      let stringValue = JSON.stringify(value);

      // Compress large values
      if (options?.compress || this.shouldCompress(stringValue)) {
        const compressed = await gzip(Buffer.from(stringValue));
        stringValue = compressed.toString('base64');
      }

      if (this.config.isRedisEnabled()) {
        await this.redisService.set(fullKey, stringValue, ttl);

        // Set tags for cache invalidation
        if (options?.tags) {
          for (const tag of options.tags) {
            await this.redisService.sadd(`tag:${tag}`, fullKey);
            await this.redisService.expire(`tag:${tag}`, ttl + 60); // Slight buffer
          }
        }
      } else {
        await this.cacheManager.set(fullKey, stringValue, ttl * 1000); // Convert to ms for memory cache
      }

      this.metrics.sets++;
      this.updateResponseTime(Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Cache set error for key ${fullKey}:`, error);
    }
  }

  /**
   * Delete single key from cache
   */
  async delete(key: string, namespace?: string): Promise<void> {
    const fullKey = this.buildKey(key, namespace);

    try {
      if (this.config.isRedisEnabled()) {
        await this.redisService.del(fullKey);
      } else {
        await this.cacheManager.del(fullKey);
      }

      this.metrics.deletes++;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${fullKey}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string, namespace?: string): Promise<number> {
    const fullPattern = this.buildKey(pattern, namespace);

    if (!this.config.isRedisEnabled()) {
      this.logger.warn('Pattern deletion only supported with Redis');
      return 0;
    }

    try {
      // Use SCAN instead of KEYS to avoid blocking Redis in production
      const client = this.redisService.getClient();
      const keys: string[] = [];
      let cursor = '0';

      do {
        const result = await (client.scan as (cursor: string, match: string, count: number) => Promise<[string, string[]]>)(
          cursor,
          fullPattern,
          100,
        );
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== '0');

      if (keys.length === 0) return 0;

      // Delete in batches to avoid overwhelming Redis
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const pipeline = client.pipeline();
        batch.forEach(key => pipeline.del(key));
        await pipeline.exec();
      }

      this.metrics.deletes += keys.length;
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache pattern delete error for pattern ${fullPattern}:`, error);
      return 0;
    }
  }

  /**
   * Delete by tags
   */
  async deleteByTags(tags: string[]): Promise<number> {
    if (!this.config.isRedisEnabled()) {
      this.logger.warn('Tag-based deletion only supported with Redis');
      return 0;
    }

    try {
      let deletedCount = 0;

      for (const tag of tags) {
        const keys = await this.redisService.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          const pipeline = this.redisService.getClient().pipeline();
          keys.forEach(key => {
            pipeline.del(key);
            deletedCount++;
          });
          pipeline.del(`tag:${tag}`); // Clean up tag set
          await pipeline.exec();
        }
      }

      this.metrics.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      this.logger.error(`Cache tag delete error:`, error);
      return 0;
    }
  }

  /**
   * Cache with fallback function
   */
  async remember<T>(
    key: string,
    fallback: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    let value = await this.get<T>(key, options);

    if (value === null) {
      value = await fallback();
      await this.set(key, value, options);
    }

    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, delta: number = 1, namespace?: string): Promise<number> {
    const fullKey = this.buildKey(key, namespace);

    if (this.config.isRedisEnabled()) {
      return await this.redisService.getClient().incrby(fullKey, delta);
    } else {
      // Fallback for memory cache
      const current = await this.get<number>(key, { namespace }) || 0;
      const newValue = current + delta;
      await this.set(key, newValue, { namespace });
      return newValue;
    }
  }

  /**
   * Set with expiration
   */
  async setWithExpiry(key: string, value: unknown, seconds: number, namespace?: string): Promise<void> {
    await this.set(key, value, { ttl: seconds, namespace });
  }

  /**
   * Get multiple keys
   */
  async mget<T>(keys: string[], namespace?: string): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key, { namespace })));
  }

  /**
   * Set multiple keys
   */
  async mset(keyValuePairs: Record<string, unknown>, options?: CacheOptions): Promise<void> {
    const promises = Object.entries(keyValuePairs).map(([key, value]) =>
      this.set(key, value, options),
    );
    await Promise.all(promises);
  }

  /**
   * Check if key exists
   */
  async exists(key: string, namespace?: string): Promise<boolean> {
    const fullKey = this.buildKey(key, namespace);

    if (this.config.isRedisEnabled()) {
      return await this.redisService.exists(fullKey);
    } else {
      const value = await this.cacheManager.get(fullKey);
      return value !== undefined;
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
      avgResponseTime: this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0,
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.config.isRedisEnabled()) {
      await this.redisService.getClient().flushdb();
    } else {
      await this.cacheManager.reset();
    }
    this.resetMetrics();
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<{ status: string; details: unknown }> {
    try {
      if (this.config.isRedisEnabled()) {
        const info = await this.redisService.getClient().info();
        return {
          status: 'healthy',
          details: {
            type: 'redis',
            metrics: this.getMetrics(),
            redisInfo: this.parseRedisInfo(info),
          },
        };
      } else {
        return {
          status: 'healthy',
          details: {
            type: 'memory',
            metrics: this.getMetrics(),
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          metrics: this.getMetrics(),
        },
      };
    }
  }

  // Private helper methods
  private buildKey(key: string, namespace?: string): string {
    const prefix = this.config.getKeyPrefix();
    const ns = namespace ? `${namespace}:` : '';
    return `${prefix}${ns}${key}`;
  }

  private shouldCompress(value: string): boolean {
    return this.config.enableCacheCompression() &&
           value.length > this.config.getCompressionThreshold();
  }

  private updateMetrics(responseTime: number, isHit: boolean): void {
    if (isHit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    this.updateResponseTime(responseTime);
  }

  private updateResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    // Keep only last 1000 measurements
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      avgResponseTime: 0,
    };
    this.responseTimes = [];
  }

  private parseRedisInfo(info: string): { version: string; uptime: string; memory: string; clients: string; keyspace: string } {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return {
      version: result['redis_version'] || '',
      uptime: result['uptime_in_seconds'] || '',
      memory: result['used_memory_human'] || '',
      clients: result['connected_clients'] || '',
      keyspace: result['db0'] || '',
    };
  }
}
