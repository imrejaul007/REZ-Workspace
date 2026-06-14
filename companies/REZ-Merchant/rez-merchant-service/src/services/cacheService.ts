/**
 * Cache Service
 *
 * Provides caching for frequently accessed data with:
 * - Automatic TTL management
 * - Cache invalidation patterns
 * - Cache-aside pattern support
 * - Metrics tracking
 */

import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { logger } from '../config/logger';

// ── Cache Keys ────────────────────────────────────────────────────────────────

export const CacheKeys = {
  // Merchant
  merchant: (id: string) => `merchant:${id}`,
  merchantByPhone: (phone: string) => `merchant:phone:${phone}`,
  merchantSettings: (id: string) => `merchant:${id}:settings`,

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

  // Reconciliation
  reconciliationSession: (id: string) => `recon:${id}`,
  bankTransactions: (accountId: string) => `bank:${accountId}:txns`,

  // User/Session
  session: (sessionId: string) => `session:${sessionId}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,

  // Dashboard/Analytics
  dashboardMetrics: (merchantId: string) => `merchant:${merchantId}:dashboard`,
  analyticsSummary: (merchantId: string) => `merchant:${merchantId}:analytics`,
} as const;

// ── TTL Constants ─────────────────────────────────────────────────────────────

export const CacheTTL = {
  SHORT: 60,        // 1 minute - frequently changing data
  MEDIUM: 300,      // 5 minutes - standard caching
  LONG: 3600,       // 1 hour - slowly changing data
  VERY_LONG: 86400, // 24 hours - static/reference data
} as const;

// ── Cache Service ─────────────────────────────────────────────────────────────

export class CacheService {
  private hits = 0;
  private misses = 0;

  /**
   * Get cached value or fetch from source
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CacheTTL.MEDIUM
  ): Promise<T> {
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
      this.hits++;
      return cached;
    }

    this.misses++;
    const value = await fetchFn();
    await cacheSet(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate cache by key pattern
   */
  async invalidate(pattern: string): Promise<void> {
    await cacheDel(pattern);
    logger.debug(`[Cache] Invalidated: ${pattern}`);
  }

  /**
   * Invalidate multiple keys
   */
  async invalidateMany(...patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(p => cacheDel(p)));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// Singleton instance
export const cacheService = new CacheService();

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

// ── Cache-aside pattern helpers ───────────────────────────────────────────────

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  return cacheService.getOrSet(key, fetcher, ttlSeconds);
}

export async function invalidateRelated(
  primaryKey: string,
  relatedKeys: string[]
): Promise<void> {
  await cacheService.invalidateMany(primaryKey, ...relatedKeys);
}
