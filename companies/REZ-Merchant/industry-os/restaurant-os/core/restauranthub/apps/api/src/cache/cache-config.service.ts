import logger from './utils/logger';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  constructor(private readonly configService: ConfigService) {}

  isRedisEnabled(): boolean {
    return this.configService.get('CACHE_TYPE', 'memory') === 'redis';
  }

  getRedisHost(): string {
    return this.configService.get('REDIS_HOST', 'localhost');
  }

  getRedisPort(): number {
    return parseInt(this.configService.get('REDIS_PORT', '6379'), 10);
  }

  getRedisPassword(): string {
    // CRITICAL FIX: Remove hardcoded fallback password
    const password = this.configService.get('REDIS_PASSWORD');
    if (!password) {
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (isProduction) {
        throw new Error('[FATAL] REDIS_PASSWORD environment variable is required in production');
      }
      logger.warn('[Cache] REDIS_PASSWORD not set, using insecure default (development only)');
      return 'dev-only-redis-secret-do-not-use-in-prod';
    }
    return password;
  }

  getRedisDb(): number {
    return parseInt(this.configService.get('REDIS_DB', '0'), 10);
  }

  getDefaultTtl(): number {
    return parseInt(this.configService.get('CACHE_TTL', '300'), 10); // 5 minutes
  }

  getMaxItems(): number {
    return parseInt(this.configService.get('CACHE_MAX_ITEMS', '1000'), 10);
  }

  getKeyPrefix(): string {
    return this.configService.get('CACHE_KEY_PREFIX', 'restopapa:');
  }

  // Performance-specific configuration
  getQueryCacheTtl(): number {
    return parseInt(this.configService.get('QUERY_CACHE_TTL', '600'), 10); // 10 minutes
  }

  getUserCacheTtl(): number {
    return parseInt(this.configService.get('USER_CACHE_TTL', '1800'), 10); // 30 minutes
  }

  getProductCacheTtl(): number {
    return parseInt(this.configService.get('PRODUCT_CACHE_TTL', '3600'), 10); // 1 hour
  }

  getStaticDataCacheTtl(): number {
    return parseInt(this.configService.get('STATIC_DATA_CACHE_TTL', '86400'), 10); // 24 hours
  }

  getApiResponseCacheTtl(): number {
    return parseInt(this.configService.get('API_RESPONSE_CACHE_TTL', '300'), 10); // 5 minutes
  }

  // Cache strategy configuration
  enableCacheWarmup(): boolean {
    return this.configService.get('CACHE_WARMUP_ENABLED', 'true') === 'true';
  }

  enableCacheCompression(): boolean {
    return this.configService.get('CACHE_COMPRESSION_ENABLED', 'true') === 'true';
  }

  getCompressionThreshold(): number {
    return parseInt(this.configService.get('CACHE_COMPRESSION_THRESHOLD', '1024'), 10); // 1KB
  }

  enableCacheMetrics(): boolean {
    return this.configService.get('CACHE_METRICS_ENABLED', 'true') === 'true';
  }

  getCacheEvictionPolicy(): string {
    return this.configService.get('CACHE_EVICTION_POLICY', 'lru');
  }

  getMaxMemoryUsage(): string {
    return this.configService.get('CACHE_MAX_MEMORY', '256mb');
  }
}