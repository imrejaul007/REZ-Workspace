/**
 * Cache Middleware
 *
 * Express middleware for caching API responses.
 * Supports:
 * - GET request caching
 * - Cache invalidation on mutations
 * - Custom TTL per route
 * - ETag support
 */

import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../config/redis';
import { CacheKeys, CacheTTL } from '../services/cacheService';

interface CacheOptions {
  ttl?: number;
  keyFn?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

const CACHE_PREFIX = 'api:';

/**
 * Create cache key from request
 */
function defaultKeyFn(req: Request): string {
  return `${req.path}:${JSON.stringify(req.query)}:${req.user?.merchantId || ''}`;
}

/**
 * Middleware to cache GET responses
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = CacheTTL.MEDIUM,
    keyFn = defaultKeyFn,
    condition = (req) => req.method === 'GET'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) {
      return next();
    }

    const key = `${CACHE_PREFIX}${keyFn(req)}`;

    try {
      const cached = await cacheGet<{ data: unknown; etag: string }>(key);

      if (cached) {
        // Check ETag
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('ETag', cached.etag);
        res.json(cached.data);
        return;
      }

      // Intercept response
      const originalJson = res.json.bind(res);
      const etag = `W/"${Date.now()}"`;

      res.json = function (data: unknown) {
        // Cache the response
        cacheSet(key, { data, etag }, ttl).catch(() => {});

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('ETag', etag);
        return originalJson(data);
      };

      next();
    } catch {
      next();
    }
  };
}

/**
 * Middleware to bust cache on mutations
 */
export function bustCacheMiddleware(keys: string[]) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data: unknown) {
      // Invalidate caches after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { cacheDel } = await import('../config/redis');
        await Promise.all(keys.map(key => cacheDel(key)));
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache keys for common routes
 */
export const RouteCacheKeys = {
  // Suppliers
  suppliers: (merchantId: string) => CacheKeys.supplier(merchantId),
  supplierByGstin: (gstin: string) => CacheKeys.supplierByGstin(gstin),

  // Purchase Orders
  purchaseOrders: (merchantId: string) => CacheKeys.purchaseOrdersByMerchant(merchantId),
  pendingPOs: (merchantId: string) => CacheKeys.pendingPOs(merchantId),

  // Credit Lines
  creditLines: (merchantId: string) => CacheKeys.creditLinesByMerchant(merchantId),

  // Dashboard
  dashboard: (merchantId: string) => CacheKeys.dashboardMetrics(merchantId),

  // Settings
  settings: (merchantId: string) => CacheKeys.merchantSettings(merchantId),
};
