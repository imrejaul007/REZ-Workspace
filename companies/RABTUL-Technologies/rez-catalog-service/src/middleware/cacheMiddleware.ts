/**
 * Cache Middleware
 * Express middleware for automatic menu caching on API routes.
 * Integrates with MenuCache service for read-through caching.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { menuCache, MenuCache } from '../services/menuCache';
import { logger } from '../config/logger';

/**
 * Extended Express Request with optional cached data
 */
export interface CachedRequest extends Request {
  cachedMenuData?: unknown;
  cacheHit?: boolean;
}

/**
 * Options for cache middleware
 */
export interface CacheMiddlewareOptions {
  /** Custom cache instance (defaults to singleton) */
  cache?: MenuCache;
  /** Whether to serve stale data if cache fails (defaults to false) */
  serveStaleOnError?: boolean;
  /** Custom key generator function */
  keyGenerator?: (req: Request) => string;
  /** Whether to include cache headers in response */
  includeCacheHeaders?: boolean;
  /** Skip caching for specific conditions */
  skipCache?: (req: Request) => boolean;
}

/**
 * Default cache key generator from request.
 * Uses merchantId from params or query.
 */
function defaultKeyGenerator(req: Request): string {
  const merchantId = req.params.merchantId || req.query.merchantId;
  if (!merchantId || typeof merchantId !== 'string') {
    throw new Error('Cannot generate cache key: merchantId not found in request');
  }
  return merchantId;
}

/**
 * Create cache middleware that reads from cache and sets request attributes.
 * Use this as a pre-handler middleware.
 */
export function cacheRead(options: CacheMiddlewareOptions = {}): RequestHandler {
  const {
    cache = menuCache,
    includeCacheHeaders = true,
    skipCache,
  } = options;

  return async (req: CachedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Check if we should skip caching
    if (skipCache && skipCache(req)) {
      return next();
    }

    try {
      let merchantId: string;

      try {
        merchantId = options.keyGenerator
          ? options.keyGenerator(req)
          : defaultKeyGenerator(req);
      } catch (error) {
      logger.debug('[CacheMiddleware] Skipping cache read - no cache key found');
      return next();
    }

      // Check if data is in cache
      const cachedData = await cache.get(merchantId);

      if (cachedData !== null) {
        req.cachedMenuData = cachedData;
        req.cacheHit = true;

        if (includeCacheHeaders) {
          const ttl = await cache.getTTL(merchantId);
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-TTL', ttl.toString());
        }

        logger.debug(`[CacheMiddleware] Cache HIT for merchant: ${merchantId}`);
        // Don't call next() - the handler should use cachedData
        // but we continue to allow handlers that want both
      } else {
        req.cacheHit = false;

        if (includeCacheHeaders) {
          res.setHeader('X-Cache', 'MISS');
        }

        logger.debug(`[CacheMiddleware] Cache MISS for merchant: ${merchantId}`);
      }

      next();
    } catch (error) {
      logger.error('[CacheMiddleware] Cache read error:', error);
      // On error, continue without caching
      next();
    }
  };
}

/**
 * Create cache middleware that writes to cache after successful response.
 * Use this as a post-handler middleware with res.json override.
 */
export function cacheWrite(options: CacheMiddlewareOptions = {}): RequestHandler {
  const {
    cache = menuCache,
    includeCacheHeaders = true,
    skipCache,
  } = options;

  return (req: CachedRequest, res: Response, next: NextFunction): void => {
    // Check if we should skip caching
    if (skipCache && skipCache(req)) {
      return next();
    }

    let merchantId: string;
    try {
      merchantId = options.keyGenerator
        ? options.keyGenerator(req)
        : defaultKeyGenerator(req);
    } catch {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to capture response data
    res.json = function (body: unknown): Response {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body) {
        cache.set(merchantId, body)
          .then((success) => {
            if (success && includeCacheHeaders) {
              res.setHeader('X-Cache-Write', 'SUCCESS');
              logger.debug(`[CacheMiddleware] Cached response for merchant: ${merchantId}`);
            }
          })
          .catch((error) => {
            logger.error(`[CacheMiddleware] Failed to write cache for ${merchantId}:`, error);
          });
      }

      // Restore original json and call it
      res.json = originalJson;
      return res.json(body);
    };

    next();
  };
}

/**
 * Combined cache middleware for read-through caching.
 * Reads from cache first, falls back to handler, then caches result.
 * Returns cached data if available, otherwise calls next() to let handler execute.
 */
export function cacheReadThrough(options: CacheMiddlewareOptions = {}): RequestHandler {
  const {
    cache = menuCache,
    includeCacheHeaders = true,
    skipCache,
  } = options;

  return async (req: CachedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Check if we should skip caching
    if (skipCache && skipCache(req)) {
      return next();
    }

    try {
      let merchantId: string;
      try {
        merchantId = options.keyGenerator
          ? options.keyGenerator(req)
          : defaultKeyGenerator(req);
      } catch {
        return next();
      }

      // Try to get from cache
      const cachedData = await cache.get(merchantId);

      if (cachedData !== null) {
        // Cache hit - return cached data immediately
        req.cachedMenuData = cachedData;
        req.cacheHit = true;

        if (includeCacheHeaders) {
          const ttl = await cache.getTTL(merchantId);
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-TTL', ttl.toString());
        }

        logger.debug(`[CacheMiddleware] Read-through HIT for merchant: ${merchantId}`);
        // Send cached response without calling the handler
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(cachedData));
        return;
      }

      // Cache miss - continue to handler, which will be wrapped by cacheWrite
      req.cacheHit = false;

      if (includeCacheHeaders) {
        res.setHeader('X-Cache', 'MISS');
      }

      // Store merchantId for cacheWrite middleware
      (req as unknown as Record<string, string>).__cacheMerchantId = merchantId;

      logger.debug(`[CacheMiddleware] Read-through MISS for merchant: ${merchantId}`);
      next();
    } catch (error) {
      logger.error('[CacheMiddleware] Read-through error:', error);
      next();
    }
  };
}

/**
 * Middleware to invalidate menu cache.
 * Should be used after menu update/create/delete operations.
 */
export function cacheInvalidate(options: CacheMiddlewareOptions = {}): RequestHandler {
  const {
    cache = menuCache,
    includeCacheHeaders = true,
    skipCache,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Don't skip - we always want to attempt invalidation
    // unless explicitly told to skip

    try {
      let merchantId: string;
      try {
        merchantId = options.keyGenerator
          ? options.keyGenerator(req)
          : defaultKeyGenerator(req);
      } catch {
        return next();
      }

      const invalidated = await cache.invalidate(merchantId);

      if (includeCacheHeaders) {
        res.setHeader('X-Cache-Invalidated', invalidated ? 'true' : 'false');
      }

      if (invalidated) {
        logger.info(`[CacheMiddleware] Invalidated cache for merchant: ${merchantId}`);
      }

      next();
    } catch (error) {
      logger.error('[CacheMiddleware] Cache invalidation error:', error);
      next();
    }
  };
}

/**
 * Batch cache invalidation middleware.
 * Invalidates multiple merchant caches based on request body or query.
 */
export function cacheInvalidateBatch(options: CacheMiddlewareOptions = {}): RequestHandler {
  const {
    cache = menuCache,
    includeCacheHeaders = true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract merchant IDs from request
      let merchantIds: string[] = [];

      if (Array.isArray(req.body?.merchantIds)) {
        merchantIds = req.body.merchantIds;
      } else if (typeof req.query.merchantIds === 'string') {
        merchantIds = req.query.merchantIds.split(',').map((id) => id.trim());
      } else if (Array.isArray(req.query.merchantIds)) {
        merchantIds = req.query.merchantIds as string[];
      }

      if (merchantIds.length === 0) {
        return next();
      }

      const invalidatedCount = await cache.invalidateBatch(merchantIds);

      if (includeCacheHeaders) {
        res.setHeader('X-Cache-Invalidated-Count', invalidatedCount.toString());
      }

      logger.info(`[CacheMiddleware] Batch invalidated ${invalidatedCount} caches`);
      next();
    } catch (error) {
      logger.error('[CacheMiddleware] Batch invalidation error:', error);
      next();
    }
  };
}

/**
 * Get cache statistics endpoint handler.
 * Returns current cache stats as JSON.
 */
export function cacheStatsHandler(): RequestHandler {
  return (_req: Request, res: Response): void => {
    const stats = menuCache.getStats();
    res.json({
      success: true,
      data: stats,
    });
  };
}

/**
 * Helper to create a full cache-enabled route handler.
 * Combines read-through caching with handler that uses cached data.
 */
export function withCache<T extends RequestHandler>(
  handler: (req: CachedRequest, res: Response, next: NextFunction) => Promise<void>,
  options: CacheMiddlewareOptions = {}
): RequestHandler {
  const readThrough = cacheReadThrough(options);

  return async (req: CachedRequest, res: Response, next: NextFunction): Promise<void> => {
    // First apply read-through middleware logic
    const merchantId = options.keyGenerator
      ? options.keyGenerator(req)
      : defaultKeyGenerator(req);

    const cachedData = await menuCache.get(merchantId);

    if (cachedData !== null) {
      req.cachedMenuData = cachedData;
      req.cacheHit = true;
      res.setHeader('X-Cache', 'HIT');
      const ttl = await menuCache.getTTL(merchantId);
      res.setHeader('X-Cache-TTL', ttl.toString());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(cachedData));
      return;
    }

    req.cacheHit = false;
    res.setHeader('X-Cache', 'MISS');

    // Continue to handler
    await handler(req, res, next);

    // After handler, cache the response if successful
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Response body should be set by the handler
      // In practice, you'd want to capture this via response interceptors
    }
  };
}
