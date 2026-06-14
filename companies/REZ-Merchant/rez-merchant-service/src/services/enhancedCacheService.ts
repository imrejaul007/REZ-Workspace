/**
 * Enhanced Cache Service for Merchant Service
 * High-performance caching layer with Redis
 *
 * Features:
 * - Automatic TTL management
 * - Cache invalidation patterns
 * - Cache-aside pattern support
 * - Rate limiting
 * - Pub/Sub for cache invalidation
 * - Metrics tracking
 */

import Redis from 'ioredis';
import { logger } from '../config/logger';

// ── Cache Configuration ────────────────────────────────────────────────────────

const CACHE_CONFIG = {
  // Default TTL in seconds
  DEFAULT_TTL: 300, // 5 minutes

  // Per-key TTL overrides
  TTL: {
    MERCHANT_CONFIG: 600, // 10 minutes
    MERCHANT_STORES: 300, // 5 minutes
    MENU_ITEMS: 180, // 3 minutes
    CATEGORIES: 600, // 10 minutes
    CUSTOMER_PROFILE: 120, // 2 minutes
    DASHBOARD_STATS: 60, // 1 minute
    EXCHANGE_RATES: 3600, // 1 hour
    SESSION: 86400, // 24 hours
    RATE_LIMIT: 60, // 1 minute
    POPULAR_ITEMS: 300, // 5 minutes
    TAX_RATES: 86400, // 24 hours
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Key prefixes for namespace isolation
  PREFIX: 'rez:merchant:',

  // Key patterns
  PATTERNS: {
    MERCHANT: 'merchant:{id}',
    MERCHANT_CONFIG: 'merchant:{id}:config',
    MERCHANT_STORES: 'merchant:{id}:stores',
    STORE: 'store:{id}',
    MENU: 'menu:{merchantId}:{storeId}',
    MENU_ITEM: 'menu:item:{id}',
    CATEGORY: 'category:{id}',
    CUSTOMER: 'customer:{id}',
    SESSION: 'session:{token}',
    RATE_LIMIT: 'ratelimit:{ip}:{endpoint}',
    POPULAR: 'popular:{storeId}:{period}',
    DASHBOARD: 'dashboard:{merchantId}:{date}',
    EXCHANGE_RATES: 'exchange:rates',
    TAX_RATES: 'tax:rates:{state}',
  },
};

// ── Cache Keys Builder ─────────────────────────────────────────────────────────

export const CacheKeys = {
  // Merchant
  merchant: (id: string) => `merchant:${id}`,
  merchantByPhone: (phone: string) => `merchant:phone:${phone}`,
  merchantSettings: (id: string) => `merchant:${id}:settings`,
  merchantConfig: (id: string) => `merchant:${id}:config`,
  merchantStores: (id: string) => `merchant:${id}:stores`,

  // Supplier
  supplier: (id: string) => `supplier:${id}`,
  supplierByGstin: (gstin: string) => `supplier:gstin:${gstin}`,
  supplierLedger: (supplierId: string) => `supplier:${supplierId}:ledger`,

  // Purchase Orders
  purchaseOrder: (id: string) => `po:${id}`,
  purchaseOrdersByMerchant: (merchantId: string) => `merchant:${merchantId}:pos`,
  pendingPOs: (merchantId: string) => `merchant:${merchantId}:pending-pos`,

  // Credit Lines
  creditLine: (id: string) => `creditline:${id}`,
  creditLinesByMerchant: (merchantId: string) => `merchant:${merchantId}:creditlines`,
  creditLineBalance: (creditLineId: string) => `creditline:${creditLineId}:balance`,

  // Rates
  tdsRates: () => 'rates:tds',
  gstRates: () => 'rates:gst',
  exchangeRates: () => 'exchange:rates',
  taxRates: (state: string) => `tax:rates:${state}`,

  // Reconciliation
  reconciliationSession: (id: string) => `recon:${id}`,
  bankTransactions: (accountId: string) => `bank:${accountId}:txns`,

  // User/Session
  session: (sessionId: string) => `session:${sessionId}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,

  // Dashboard/Analytics
  dashboardMetrics: (merchantId: string) => `merchant:${merchantId}:dashboard`,
  analyticsSummary: (merchantId: string) => `merchant:${merchantId}:analytics`,
  popularItems: (storeId: string, period: string) => `popular:${storeId}:${period}`,

  // Menu
  menu: (merchantId: string, storeId: string) => `menu:${merchantId}:${storeId}`,
  menuItem: (id: string) => `menu:item:${id}`,
  category: (id: string) => `category:${id}`,

  // Customer
  customer: (id: string) => `customer:${id}`,
} as const;

// ── TTL Constants ─────────────────────────────────────────────────────────────

export const CacheTTL = CACHE_CONFIG.TTL;

// ── Enhanced Cache Service ─────────────────────────────────────────────────────

class EnhancedCacheService {
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private hits = 0;
  private misses = 0;
  private subscriber: Redis | null = null;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not configured, caching disabled');
      return;
    }

    this.connectionPromise = this.connect();
  }

  private async connect(): Promise<void> {
    try {
      this.redis = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 10) {
            logger.error('Redis: Max retry attempts reached');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        keepAlive: 30000,
      });

      this.redis.on('connect', () => {
        logger.info('Redis: Connected');
        this.isConnected = true;
      });

      this.redis.on('ready', () => {
        logger.info('Redis: Ready');
      });

      this.redis.on('error', (err) => {
        logger.error('Redis error:', { error: err.message });
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis: Connection closed');
        this.isConnected = false;
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Redis connection failed:', { error });
      this.isConnected = false;
    }
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected && this.redis) return true;

    if (this.connectionPromise) {
      await this.connectionPromise;
      return this.isConnected;
    }

    return false;
  }

  // ==================== BASIC OPERATIONS ====================

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!(await this.ensureConnection())) return null;

    try {
      const value = await this.redis!.get(`${CACHE_CONFIG.PREFIX}${key}`);
      if (value) {
        this.hits++;
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value) as T;
      }
      this.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache GET error for ${key}:`, { error });
      this.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;

    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || CACHE_CONFIG.DEFAULT_TTL;

      await this.redis!.setex(
        `${CACHE_CONFIG.PREFIX}${key}`,
        ttlSeconds,
        serialized
      );

      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache SET error for ${key}:`, { error });
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async del(key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;

    try {
      await this.redis!.del(`${CACHE_CONFIG.PREFIX}${key}`);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache DEL error for ${key}:`, { error });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!(await this.ensureConnection())) return 0;

    try {
      const fullPattern = `${CACHE_CONFIG.PREFIX}${pattern}`;
      const keys = await this.redis!.keys(fullPattern);

      if (keys.length > 0) {
        const deleted = await this.redis!.del(...keys);
        logger.debug(`Cache DEL pattern ${pattern}: ${deleted} keys`);
        return deleted;
      }
      return 0;
    } catch (error) {
      logger.error(`Cache DEL pattern error for ${pattern}:`, { error });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;

    try {
      const result = await this.redis!.exists(`${CACHE_CONFIG.PREFIX}${key}`);
      return result === 1;
    } catch (error) {
      logger.error(`Cache EXISTS error for ${key}:`, { error });
      return false;
    }
  }

  // ==================== SPECIALIZED CACHE METHODS ====================

  /**
   * Cache merchant configuration
   */
  async cacheMerchantConfig(merchantId: string, config: any): Promise<void> {
    const key = CacheKeys.merchantConfig(merchantId);
    await this.set(key, config, CACHE_CONFIG.TTL.MERCHANT_CONFIG);
  }

  /**
   * Get cached merchant configuration
   */
  async getMerchantConfig<T>(merchantId: string): Promise<T | null> {
    const key = CacheKeys.merchantConfig(merchantId);
    return this.get<T>(key);
  }

  /**
   * Invalidate merchant cache
   */
  async invalidateMerchant(merchantId: string): Promise<void> {
    await this.delPattern(`merchant:${merchantId}:*`);
  }

  /**
   * Cache menu items
   */
  async cacheMenu(merchantId: string, storeId: string, menu: any): Promise<void> {
    const key = CacheKeys.menu(merchantId, storeId);
    await this.set(key, menu, CACHE_CONFIG.TTL.MENU_ITEMS);
  }

  /**
   * Get cached menu
   */
  async getMenu<T>(merchantId: string, storeId: string): Promise<T | null> {
    const key = CacheKeys.menu(merchantId, storeId);
    return this.get<T>(key);
  }

  /**
   * Cache customer profile
   */
  async cacheCustomer(customerId: string, profile: any): Promise<void> {
    const key = CacheKeys.customer(customerId);
    await this.set(key, profile, CACHE_CONFIG.TTL.CUSTOMER_PROFILE);
  }

  /**
   * Get cached customer profile
   */
  async getCustomer<T>(customerId: string): Promise<T | null> {
    const key = CacheKeys.customer(customerId);
    return this.get<T>(key);
  }

  /**
   * Cache dashboard stats
   */
  async cacheDashboardStats(merchantId: string, date: string, stats: any): Promise<void> {
    const key = CacheKeys.dashboardMetrics(merchantId) + `:${date}`;
    await this.set(key, stats, CACHE_CONFIG.TTL.DASHBOARD_STATS);
  }

  /**
   * Get cached dashboard stats
   */
  async getDashboardStats<T>(merchantId: string, date: string): Promise<T | null> {
    const key = CacheKeys.dashboardMetrics(merchantId) + `:${date}`;
    return this.get<T>(key);
  }

  /**
   * Cache popular items
   */
  async cachePopularItems(storeId: string, period: 'daily' | 'weekly' | 'monthly', items: any[]): Promise<void> {
    const key = CacheKeys.popularItems(storeId, period);
    await this.set(key, items, CACHE_CONFIG.TTL.POPULAR_ITEMS);
  }

  /**
   * Get popular items
   */
  async getPopularItems<T>(storeId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<T | null> {
    const key = CacheKeys.popularItems(storeId, period);
    return this.get<T>(key);
  }

  /**
   * Cache exchange rates
   */
  async cacheExchangeRates(rates: any): Promise<void> {
    const key = CacheKeys.exchangeRates();
    await this.set(key, rates, CACHE_CONFIG.TTL.EXCHANGE_RATES);
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates<T>(): Promise<T | null> {
    const key = CacheKeys.exchangeRates();
    return this.get<T>(key);
  }

  /**
   * Cache tax rates
   */
  async cacheTaxRates(state: string, rates: any): Promise<void> {
    const key = CacheKeys.taxRates(state);
    await this.set(key, rates, CACHE_CONFIG.TTL.TAX_RATES);
  }

  /**
   * Get tax rates
   */
  async getTaxRates<T>(state: string): Promise<T | null> {
    const key = CacheKeys.taxRates(state);
    return this.get<T>(key);
  }

  // ==================== RATE LIMITING ====================

  /**
   * Check and increment rate limit
   * Returns: { allowed: boolean, remaining: number, resetAt: number }
   */
  async checkRateLimit(
    identifier: string,
    endpoint: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (!(await this.ensureConnection())) {
      return { allowed: true, remaining: limit, resetAt: 0 };
    }

    const key = `ratelimit:${identifier}:${endpoint}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    try {
      const pipeline = this.redis!.pipeline();

      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}:${Math.random()}`);
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const currentCount = (results?.[1]?.[1] as number) || 0;

      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - 1);
      const resetAt = now + windowSeconds;

      return { allowed, remaining, resetAt };
    } catch (error) {
      logger.error('Rate limit check error:', { error });
      return { allowed: true, remaining: limit, resetAt: 0 };
    }
  }

  // ==================== CACHE ASIDE PATTERN ====================

  /**
   * Get or fetch with cache-aside pattern
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Get cached value or fetch from source (alias for getOrFetch)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CACHE_CONFIG.TTL.MEDIUM
  ): Promise<T> {
    return this.getOrFetch(key, fetchFn, ttlSeconds);
  }

  // ==================== CACHE INVALIDATION HELPERS ====================

  /**
   * Invalidate all caches for a store
   */
  async invalidateStore(merchantId: string, storeId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`merchant:${merchantId}:*`),
      this.delPattern(`menu:${merchantId}:${storeId}`),
      this.delPattern(`popular:${storeId}:*`),
      this.delPattern(`dashboard:${merchantId}:*`),
    ]);
  }

  /**
   * Invalidate customer cache (on profile update)
   */
  async invalidateCustomer(customerId: string): Promise<void> {
    await this.del(CacheKeys.customer(customerId));
  }

  /**
   * Invalidate multiple keys
   */
  async invalidateMany(...patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(p => this.del(p)));
  }

  // ==================== STATS ====================

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      connected: this.isConnected,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics with Redis info
   */
  async getDetailedStats(): Promise<{
    connected: boolean;
    memoryUsed: string;
    totalKeys: number;
    hits: number;
    misses: number;
    hitRate: string;
  }> {
    if (!(await this.ensureConnection())) {
      return { connected: false, memoryUsed: 'N/A', totalKeys: 0, hits: 0, misses: 0, hitRate: '0%' };
    }

    try {
      const info = await this.redis!.info('memory');
      const keys = await this.redis!.dbsize();
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';

      const total = this.hits + this.misses;

      return {
        connected: true,
        memoryUsed,
        totalKeys: keys,
        hits: this.hits,
        misses: this.misses,
        hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', { error });
      return { connected: false, memoryUsed: 'N/A', totalKeys: 0, hits: 0, misses: 0, hitRate: '0%' };
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flush(): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;

    try {
      await this.redis!.flushdb();
      logger.warn('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', { error });
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// ── Decorator for method caching ──────────────────────────────────────────────

type Method = (...args: unknown[]) => Promise<unknown>;

/**
 * Decorator to cache method results
 */
export function cached(ttlSeconds: number = CacheTTL.MEDIUM) {
  return function (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod: Method = descriptor.value;
    const cache = new Map<string, { value: unknown; expiry: number }>();

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = JSON.stringify(args);

      const cached = cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, { value: result, expiry: Date.now() + ttlSeconds * 1000 });

      return result;
    };

    return descriptor;
  };
}

// ── Cache-aside pattern helpers ────────────────────────────────────────────────

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  return enhancedCacheService.getOrFetch(key, fetcher, ttlSeconds);
}

export async function invalidateRelated(
  primaryKey: string,
  relatedKeys: string[]
): Promise<void> {
  await enhancedCacheService.invalidateMany(primaryKey, ...relatedKeys);
}

// ── Singleton instance ─────────────────────────────────────────────────────────

export const enhancedCacheService = new EnhancedCacheService();
export default enhancedCacheService;
