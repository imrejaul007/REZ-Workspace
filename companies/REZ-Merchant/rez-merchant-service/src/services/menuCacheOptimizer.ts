/**
 * Menu Cache Optimizer Service
 *
 * Provides sub-2-second response times for QR-to-Menu by:
 * 1. Aggressive Redis caching with stale-while-revalidate pattern
 * 2. MongoDB aggregation pipeline (single query instead of 3)
 * 3. Popular menu preload on startup
 * 4. Background refresh for hot menus
 */

import mongoose from 'mongoose';
import { cacheGet, cacheSet, cacheDel, redis } from '../config/redis';
import { logger } from '../config/logger';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { Category } from '../models/Category';

// Cache configuration
const CACHE_PREFIX = 'qr:menu:';
const CACHE_TTL_SECONDS = 300; // 5 minutes
const STALE_TTL_SECONDS = 600; // 10 minutes (served while refreshing)
const WARMUP_BATCH_SIZE = 50;
const POPULAR_STORE_LIMIT = 100;

// Interface for optimized menu response
export interface MenuCacheData {
  store: {
    id: string;
    name: string;
    slug: string;
    logo: string | undefined;
    category: string;
    operationalInfo;
  };
  categories: MenuCategory[];
  totalProducts: number;
  cachedAt: number;
  version: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  products: MenuProduct[];
}

export interface MenuProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images: unknown[];
  pricing;
  inventory;
  isVeg?: boolean;
  tags: string[];
  preparationTime?: number;
  itemType?: string;
}

/**
 * Single MongoDB aggregation pipeline to fetch store, categories, and products.
 * Reduces 3 DB queries to 1 for ~50-70% latency improvement.
 */
export async function fetchMenuData(storeId: string): Promise<MenuCacheData | null> {
  const objectId = new mongoose.Types.ObjectId(storeId);

  // Aggregation pipeline: lookup categories and products in single query
  const pipeline = [
    // Match active store
    { $match: { _id: objectId, isActive: true } },

    // Lookup categories
    {
      $lookup: {
        from: 'categories',
        let: { storeId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$store', '$$storeId'] },
            },
          },
          { $sort: { sortOrder: 1, name: 1 } },
        ],
        as: 'categories',
      },
    },

    // Lookup products
    {
      $lookup: {
        from: 'products',
        let: { storeId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$store', '$$storeId'] },
              isActive: true,
              $or: [
                { isDeleted: { $exists: false } },
                { isDeleted: false },
              ],
            },
          },
          { $sort: { sortOrder: 1, createdAt: -1 } },
        ],
        as: 'products',
      },
    },

    // Project final shape
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        logo: 1,
        category: 1,
        operationalInfo: 1,
        categories: 1,
        products: 1,
      },
    },
  ];

  const results = await Store.aggregate(pipeline as unknown).exec();

  if (!results || results.length === 0) {
    return null;
  }

  const store = results[0];

  // Group products by category name
  const productsByCategory: Record<string, MenuProduct[]> = {};

  for (const product of store.products || []) {
    const catName = product.category || 'Uncategorized';
    if (!productsByCategory[catName]) {
      productsByCategory[catName] = [];
    }
    productsByCategory[catName].push({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      images: product.images,
      pricing: product.pricing,
      inventory: product.inventory,
      isVeg: product.isVeg,
      tags: product.tags || [],
      preparationTime: product.preparationTime,
      itemType: product.itemType,
    });
  }

  // Build menu categories with products
  const menuCategories: MenuCategory[] = store.categories.map((cat) => ({
    id: cat._id.toString(),
    name: cat.name,
    description: cat.description,
    image: cat.image,
    sortOrder: cat.sortOrder || 0,
    products: productsByCategory[cat.name] || [],
  }));

  // Add uncategorized products
  if (productsByCategory['Uncategorized']?.length > 0) {
    menuCategories.push({
      id: 'uncategorized',
      name: 'Uncategorized',
      description: 'Other items',
      sortOrder: 999,
      products: productsByCategory['Uncategorized'],
    });
  }

  return {
    store: {
      id: store._id.toString(),
      name: store.name,
      slug: store.slug,
      logo: store.logo,
      category: store.category,
      operationalInfo: store.operationalInfo,
    },
    categories: menuCategories,
    totalProducts: store.products?.length || 0,
    cachedAt: Date.now(),
    version: '2.0',
  };
}

/**
 * Get menu with stale-while-revalidate caching.
 * Returns cached data immediately; refreshes in background if stale.
 */
export async function getMenuFast(storeId: string): Promise<{ data: MenuCacheData | null; source: 'cache' | 'stale' | 'db' }> {
  const cacheKey = `${CACHE_PREFIX}${storeId}`;
  const staleKey = `${CACHE_PREFIX}stale:${storeId}`;

  // Try cache first
  const cached = await cacheGet<MenuCacheData>(cacheKey);
  if (cached) {
    return { data: cached, source: 'cache' };
  }

  // Check stale cache
  const stale = await cacheGet<MenuCacheData>(staleKey);
  if (stale) {
    // Trigger background refresh and return stale immediately
    refreshMenuInBackground(storeId).catch(() => {});
    return { data: stale, source: 'stale' };
  }

  // Cache miss - fetch from DB
  const data = await fetchMenuData(storeId);
  if (data) {
    // Store in both hot and stale cache
    await cacheSet(cacheKey, data, CACHE_TTL_SECONDS);
    await cacheSet(staleKey, data, STALE_TTL_SECONDS);
    return { data, source: 'db' };
  }

  return { data: null, source: 'db' };
}

/**
 * Background refresh - does not block the response.
 */
async function refreshMenuInBackground(storeId: string): Promise<void> {
  try {
    const data = await fetchMenuData(storeId);
    if (data) {
      const cacheKey = `${CACHE_PREFIX}${storeId}`;
      const staleKey = `${CACHE_PREFIX}stale:${storeId}`;
      await Promise.all([
        cacheSet(cacheKey, data, CACHE_TTL_SECONDS),
        cacheSet(staleKey, data, STALE_TTL_SECONDS),
      ]);
      logger.debug(`[MenuCache] Background refresh completed for store ${storeId}`);
    }
  } catch (err) {
    logger.warn(`[MenuCache] Background refresh failed for store ${storeId}`, { error: (err as Error).message });
  }
}

/**
 * Preload popular menus into Redis cache on startup.
 * This eliminates cold-start latency for the most accessed stores.
 */
export async function preloadPopularMenus(): Promise<{ loaded: number; failed: number }> {
  logger.info('[MenuCache] Starting popular menus preload...');
  const startTime = Date.now();

  let loaded = 0;
  let failed = 0;

  try {
    // Get popular stores (those with recent orders or high scan counts)
    const popularStores = await Store.find({
      isActive: true,
      isListed: true,
      acceptsOnlineOrders: true,
    })
      .sort({ 'analytics?.totalOrders': -1, createdAt: -1 })
      .limit(POPULAR_STORE_LIMIT)
      .select('_id')
      .lean();

    logger.info(`[MenuCache] Found ${popularStores.length} popular stores to preload`);

    // Preload in batches to avoid overwhelming Redis
    for (let i = 0; i < popularStores.length; i += WARMUP_BATCH_SIZE) {
      const batch = popularStores.slice(i, i + WARMUP_BATCH_SIZE);

      await Promise.all(
        batch.map(async (store) => {
          try {
            const data = await fetchMenuData(store._id.toString());
            if (data) {
              const cacheKey = `${CACHE_PREFIX}${store._id}`;
              const staleKey = `${CACHE_PREFIX}stale:${store._id}`;
              await Promise.all([
                cacheSet(cacheKey, data, CACHE_TTL_SECONDS),
                cacheSet(staleKey, data, STALE_TTL_SECONDS),
              ]);
              loaded++;
            }
          } catch (err) {
            failed++;
            logger.warn(`[MenuCache] Failed to preload store ${store._id}`, { error: (err as Error).message });
          }
        })
      );

      logger.debug(`[MenuCache] Preloaded batch ${Math.floor(i / WARMUP_BATCH_SIZE) + 1}, total loaded: ${loaded}`);
    }
  } catch (err) {
    logger.error('[MenuCache] Preload failed', { error: (err as Error).message });
  }

  const duration = Date.now() - startTime;
  logger.info(`[MenuCache] Preload complete: ${loaded} loaded, ${failed} failed in ${duration}ms`);

  return { loaded, failed };
}

/**
 * Invalidate menu cache when store data changes.
 */
export async function invalidateMenuCache(storeId: string, storeSlug?: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${storeId}`;
    const staleKey = `${CACHE_PREFIX}stale:${storeId}`;

    await Promise.all([
      redis.del(cacheKey),
      redis.del(staleKey),
    ]);

    if (storeSlug) {
      await cacheDel(`qr:store:${storeSlug}`);
    }

    logger.debug(`[MenuCache] Invalidated cache for store ${storeId}`);
  } catch (err) {
    logger.warn(`[MenuCache] Cache invalidation failed for store ${storeId}`, { error: (err as Error).message });
  }
}

/**
 * Get cache statistics for monitoring.
 */
export async function getMenuCacheStats(): Promise<{
  totalKeys: number;
  hitRate: number;
  avgLatencyMs: number;
}> {
  try {
    // Count cached menus
    let cursor = '0';
    let totalKeys = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${CACHE_PREFIX}*`, 'COUNT', 100);
      cursor = nextCursor;
      totalKeys += keys.filter(k => !k.includes(':stale:')).length;
    } while (cursor !== '0');

    return {
      totalKeys,
      hitRate: 0, // Would need separate tracking
      avgLatencyMs: 0,
    };
  } catch (err) {
    return { totalKeys: 0, hitRate: 0, avgLatencyMs: 0 };
  }
}
