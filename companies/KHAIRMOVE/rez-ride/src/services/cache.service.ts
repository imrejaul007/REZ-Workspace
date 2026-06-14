import { Injectable, Logger } from '@nestjs/common';

/**
 * Cache Service - Redis caching
 */
@Injectable()
export class CacheService {
  private logger = new Logger('CacheService');
  private cache = new Map();
  private expiry = new Map();

  async get<T>(key: string): Promise<T | null> {
    if (this.expiry.has(key) && Date.now() > this.expiry.get(key)!) {
      this.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    this.cache.set(key, value);
    this.expiry.set(key, Date.now() + ttlSeconds * 1000);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.expiry.delete(key);
  }

  async flush(): Promise<void> {
    this.cache.clear();
    this.expiry.clear();
  }
}
