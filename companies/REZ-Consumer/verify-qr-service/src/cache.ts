import logger from './utils/logger';

/**
 * REZ Verify QR Service - Redis Caching Layer
 */

import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
});

redis.on('error', (err) => {
  console.error('Redis cache error:', err.message);
});

redis.on('connect', () => {
  logger.info('Redis cache connected');
});

// Cache configuration
const CACHE_CONFIG = {
  // TTL in seconds
  TTL: {
    SERIAL_VERIFY: 300, // 5 minutes
    WARRANTY_STATUS: 600, // 10 minutes
    SERVICE_CENTER: 1800, // 30 minutes
    SLOTS: 300, // 5 minutes
    PLANS: 3600, // 1 hour
    ANALYTICS: 900, // 15 minutes
    QR_CONTENT: 600, // 10 minutes
    NEAREST_CENTER: 300, // 5 minutes
  }
};

class CacheService {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.REDIS_URL ? true : false;
    if (this.enabled) {
      this.connect();
    }
  }

  private async connect() {
    try {
      await redis.connect();
    } catch (e) {
      console.error('Failed to connect to Redis:', e);
      this.enabled = false;
    }
  }

  // Generate cache key
  private key(prefix: string, ...parts: (string | number)[]): string {
    const hash = crypto.createHash('md5').update(parts.join(':')).digest('hex').substring(0, 8);
    return `verify-qr:${prefix}:${hash}`;
  }

  // Get from cache
  async get<T>(prefix: string, ...parts: (string | number)[]): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const key = this.key(prefix, ...parts);
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (e) {
      console.error('Cache get error:', e);
      return null;
    }
  }

  // Set in cache
  async set(prefix: string, ttl: number, data, ...parts: (string | number)[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const key = this.key(prefix, ...parts);
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (e) {
      console.error('Cache set error:', e);
    }
  }

  // Delete from cache
  async del(prefix: string, ...parts: (string | number)[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const key = this.key(prefix, ...parts);
      await redis.del(key);
    } catch (e) {
      console.error('Cache del error:', e);
    }
  }

  // Delete by pattern
  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await redis.keys(`verify-qr:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.error('Cache del pattern error:', e);
    }
  }

  // Clear all cache
  async flush(): Promise<void> {
    if (!this.enabled) return;

    try {
      await redis.flushdb();
    } catch (e) {
      console.error('Cache flush error:', e);
    }
  }

  // Helper methods for common queries

  // Serial verification cache
  async getSerialVerify(serial: string) {
    return this.get<unknown>('serial', serial);
  }

  async setSerialVerify(serial: string, data) {
    return this.set('serial', CACHE_CONFIG.TTL.SERIAL_VERIFY, data, serial);
  }

  // Warranty status cache
  async getWarrantyStatus(serial: string) {
    return this.get<unknown>('warranty', serial);
  }

  async setWarrantyStatus(serial: string, data) {
    return this.set('warranty', CACHE_CONFIG.TTL.WARRANTY_STATUS, data, serial);
  }

  // Service center cache
  async getServiceCenter(centerId: string) {
    return this.get<unknown>('center', centerId);
  }

  async setServiceCenter(centerId: string, data) {
    return this.set('center', CACHE_CONFIG.TTL.SERVICE_CENTER, data, centerId);
  }

  // Service slots cache
  async getServiceSlots(centerId: string, date: string) {
    return this.get<unknown>('slots', centerId, date);
  }

  async setServiceSlots(centerId: string, date: string, data) {
    return this.set('slots', CACHE_CONFIG.TTL.SLOTS, data, centerId, date);
  }

  // Warranty plans cache
  async getWarrantyPlans(brand?: string) {
    return this.get<unknown>('plans', brand || 'all');
  }

  async setWarrantyPlans(brand: string | undefined, data) {
    return this.set('plans', CACHE_CONFIG.TTL.PLANS, data, brand || 'all');
  }

  // QR dynamic content cache
  async getQRContent(serial: string) {
    return this.get<unknown>('qr-content', serial);
  }

  async setQRContent(serial: string, data) {
    return this.set('qr-content', CACHE_CONFIG.TTL.QR_CONTENT, data, serial);
  }

  // Nearest center cache (based on location)
  async getNearestCenter(lat: number, lng: number, brand?: string) {
    return this.get<unknown>('nearest', lat.toFixed(2), lng.toFixed(2), brand || 'all');
  }

  async setNearestCenter(lat: number, lng: number, brand: string | undefined, data) {
    return this.set('nearest', CACHE_CONFIG.TTL.NEAREST_CENTER, data, lat.toFixed(2), lng.toFixed(2), brand || 'all');
  }

  // Invalidate cache on updates
  async invalidateSerial(serial: string) {
    await this.del('serial', serial);
    await this.del('warranty', serial);
    await this.del('qr-content', serial);
  }

  async invalidateCenter(centerId: string) {
    await this.del('center', centerId);
    await this.delPattern(`slots:${centerId}*`);
  }

  async invalidateSlots(centerId: string) {
    await this.delPattern(`slots:${centerId}*`);
  }
}

export const cache = new CacheService();
export { redis, CACHE_CONFIG };
