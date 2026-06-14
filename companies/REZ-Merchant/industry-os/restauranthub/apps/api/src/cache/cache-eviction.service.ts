import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheService } from './cache.service';
import { CacheConfigService } from './cache-config.service';
import { RedisService } from './redis.service';

export interface CacheEvictionRule {
  pattern?: string;
  tags?: string[];
  maxAge?: number; // in seconds
  priority?: 'low' | 'medium' | 'high';
}

@Injectable()
export class CacheEvictionService {
  private readonly logger = new Logger(CacheEvictionService.name);
  private evictionRules: Map<string, CacheEvictionRule> = new Map();

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: CacheConfigService,
    private readonly redisService: RedisService,
  ) {
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // User data - evict on updates
    this.addEvictionRule('user-data', {
      tags: ['user', 'profile'],
      priority: 'high',
    });

    // Product data - evict daily
    this.addEvictionRule('product-data', {
      tags: ['product', 'inventory'],
      maxAge: 3600, // 1 hour
      priority: 'medium',
    });

    // Analytics data - evict weekly
    this.addEvictionRule('analytics-data', {
      tags: ['analytics', 'reports'],
      maxAge: 86400, // 24 hours
      priority: 'low',
    });

    // API responses - evict frequently
    this.addEvictionRule('api-responses', {
      pattern: 'restopapa:api:*',
      maxAge: 300, // 5 minutes
      priority: 'medium',
    });

    // Static data - rarely evict
    this.addEvictionRule('static-data', {
      tags: ['static', 'config'],
      maxAge: 86400 * 7, // 7 days
      priority: 'low',
    });
  }

  addEvictionRule(name: string, rule: CacheEvictionRule): void {
    this.evictionRules.set(name, rule);
    this.logger.log(`Added cache eviction rule: ${name}`);
  }

  removeEvictionRule(name: string): boolean {
    const removed = this.evictionRules.delete(name);
    if (removed) {
      this.logger.log(`Removed cache eviction rule: ${name}`);
    }
    return removed;
  }

  async evictByRule(ruleName: string): Promise<number> {
    const rule = this.evictionRules.get(ruleName);
    if (!rule) {
      this.logger.warn(`Cache eviction rule not found: ${ruleName}`);
      return 0;
    }

    let evictedCount = 0;

    try {
      // Evict by tags
      if (rule.tags && rule.tags.length > 0) {
        evictedCount += await this.cacheService.deleteByTags(rule.tags);
      }

      // Evict by pattern
      if (rule.pattern) {
        evictedCount += await this.cacheService.deletePattern(rule.pattern);
      }

      this.logger.log(`Evicted ${evictedCount} cache entries using rule: ${ruleName}`);
      return evictedCount;
    } catch (error) {
      this.logger.error(`Failed to evict cache using rule ${ruleName}:`, error);
      return 0;
    }
  }

  async evictExpired(): Promise<number> {
    if (!this.configService.isRedisEnabled()) {
      this.logger.debug('Redis not enabled, skipping expired key cleanup');
      return 0;
    }

    let evictedCount = 0;

    try {
      // Get all keys with TTL
      const client = this.redisService.getClient();
      const stream = client.scanStream({
        match: `${this.configService.getKeyPrefix()}*`,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        const pipeline = client.pipeline();

        for (const key of keys) {
          // Check if key has expired
          pipeline.ttl(key);
        }

        const results = await pipeline.exec();
        const expiredKeys: string[] = [];

        results?.forEach((result, index) => {
          if (result && Array.isArray(result) && result[1] === -2) {
            // TTL -2 means key is expired
            expiredKeys.push(keys[index]);
          }
        });

        if (expiredKeys.length > 0) {
          await this.cacheService.deletePattern(expiredKeys.join('|'));
          evictedCount += expiredKeys.length;
        }
      });

      return new Promise((resolve) => {
        stream.on('end', () => {
          this.logger.log(`Cleaned up ${evictedCount} expired cache entries`);
          resolve(evictedCount);
        });
      });
    } catch (error) {
      this.logger.error('Failed to cleanup expired cache entries:', error);
      return 0;
    }
  }

  async evictBySize(maxSizeBytes?: number): Promise<number> {
    if (!this.configService.isRedisEnabled()) {
      this.logger.debug('Redis not enabled, skipping size-based eviction');
      return 0;
    }

    try {
      const maxSize = maxSizeBytes || this.parseMemorySize(this.configService.getMaxMemoryUsage());
      const client = this.redisService.getClient();

      // Get current memory usage
      const info = await client.info('memory');
      const memoryUsage = this.extractMemoryUsage(info);

      if (memoryUsage <= maxSize) {
        return 0;
      }

      // Implement LRU-based eviction
      const keys = await client.keys(`${this.configService.getKeyPrefix()}*`);
      const keyData: Array<{ key: string; lastAccess: number; size: number }> = [];

      // Get key metadata
      const pipeline = client.pipeline();
      keys.forEach(key => {
        pipeline.object('IDLETIME', key);
        pipeline.memory('USAGE', key);
      });

      const results = await pipeline.exec();

      for (let i = 0; i < keys.length; i++) {
        const idleTime = Number(results?.[i * 2]?.[1] ?? 0);
        const memoryUsage = Number(results?.[i * 2 + 1]?.[1] ?? 0);

        keyData.push({
          key: keys[i],
          lastAccess: Date.now() - (idleTime * 1000),
          size: memoryUsage,
        });
      }

      // Sort by last access time (oldest first)
      keyData.sort((a, b) => a.lastAccess - b.lastAccess);

      let evictedCount = 0;
      let currentSize = memoryUsage;
      const targetSize = maxSize * 0.8; // Evict to 80% of max size

      for (const { key, size } of keyData) {
        if (currentSize <= targetSize) break;

        await this.cacheService.delete(key.replace(this.configService.getKeyPrefix(), ''));
        currentSize -= size;
        evictedCount++;
      }

      this.logger.log(`Evicted ${evictedCount} cache entries to free memory`);
      return evictedCount;
    } catch (error) {
      this.logger.error('Failed to evict cache by size:', error);
      return 0;
    }
  }

  async evictByPriority(priority: 'low' | 'medium' | 'high'): Promise<number> {
    let evictedCount = 0;

    for (const [ruleName, rule] of this.evictionRules.entries()) {
      if (rule.priority === priority) {
        evictedCount += await this.evictByRule(ruleName);
      }
    }

    this.logger.log(`Evicted ${evictedCount} cache entries with priority: ${priority}`);
    return evictedCount;
  }

  // Scheduled cleanup tasks
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledCleanup(): Promise<void> {
    if (!this.configService.enableCacheMetrics()) {
      return;
    }

    this.logger.debug('Running scheduled cache cleanup');

    try {
      // Cleanup expired entries
      await this.evictExpired();

      // Cleanup by age-based rules
      for (const [ruleName, rule] of this.evictionRules.entries()) {
        if (rule.maxAge) {
          // This is a simplified approach - in a real implementation,
          // you'd track entry timestamps
          const shouldEvict = crypto.randomInt(0, 9) === 0; // ~10% chance
          if (shouldEvict) {
            await this.evictByRule(ruleName);
          }
        }
      }
    } catch (error) {
      this.logger.error('Scheduled cleanup failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async hourlyCleanup(): Promise<void> {
    this.logger.debug('Running hourly cache cleanup');

    try {
      // Evict medium priority items
      await this.evictByPriority('medium');

      // Check memory usage and evict if necessary
      await this.evictBySize();
    } catch (error) {
      this.logger.error('Hourly cleanup failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async dailyCleanup(): Promise<void> {
    this.logger.debug('Running daily cache cleanup');

    try {
      // Evict low priority items
      await this.evictByPriority('low');

      // Log cache statistics
      const metrics = this.cacheService.getMetrics();
      this.logger.log('Cache metrics:', metrics);
    } catch (error) {
      this.logger.error('Daily cleanup failed:', error);
    }
  }

  // Utility methods
  private parseMemorySize(sizeStr: string): number {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);

    if (!match) {
      throw new Error(`Invalid memory size format: ${sizeStr}`);
    }

    const [, amount, unit] = match;
    return parseFloat(amount) * (units[unit as keyof typeof units] || 1);
  }

  private extractMemoryUsage(info: string): number {
    const lines = info.split('\r\n');
    const usedMemoryLine = lines.find(line => line.startsWith('used_memory:'));

    if (usedMemoryLine) {
      return parseInt(usedMemoryLine.split(':')[1]);
    }

    return 0;
  }

  // Manual eviction methods
  async forceEvictAll(): Promise<void> {
    await this.cacheService.clear();
    this.logger.log('Force evicted all cache entries');
  }

  async evictUserData(userId: string): Promise<number> {
    const patterns = [
      `user:${userId}:*`,
      `profile:${userId}:*`,
      `session:${userId}:*`,
    ];

    let evictedCount = 0;
    for (const pattern of patterns) {
      evictedCount += await this.cacheService.deletePattern(pattern);
    }

    this.logger.log(`Evicted ${evictedCount} cache entries for user: ${userId}`);
    return evictedCount;
  }

  async evictRestaurantData(restaurantId: string): Promise<number> {
    const patterns = [
      `restaurant:${restaurantId}:*`,
      `menu:${restaurantId}:*`,
      `orders:${restaurantId}:*`,
    ];

    let evictedCount = 0;
    for (const pattern of patterns) {
      evictedCount += await this.cacheService.deletePattern(pattern);
    }

    this.logger.log(`Evicted ${evictedCount} cache entries for restaurant: ${restaurantId}`);
    return evictedCount;
  }

  getEvictionRules(): Array<{ name: string; rule: CacheEvictionRule }> {
    return Array.from(this.evictionRules.entries()).map(([name, rule]) => ({ name, rule }));
  }
}
