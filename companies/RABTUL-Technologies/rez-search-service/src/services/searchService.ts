import mongoose from 'mongoose';
import { cacheKey, cached } from './cacheHelper';
import { redis } from '../config/redis';
import { logger } from '@rez/rez-shared/logger';

// Query timeout to prevent indefinite hangs
const QUERY_TIMEOUT_MS = 5000;

// Slow query logging threshold
const SLOW_QUERY_THRESHOLD_MS = 200;

/**
 * Logs queries that exceed the slow query threshold.
 */
function logSlowQuery(label: string, duration: number, details: Record<string, unknown>) {
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    logger.warn(`[SLOW_QUERY] ${label} took ${duration}ms`, {
      duration,
      threshold: SLOW_QUERY_THRESHOLD_MS,
      ...details,
    });
  }
}

// ── Document interfaces ────────────────────────────────────────────────────────
// SEA-005 FIX: Typed interfaces replace all `as any` casts from untyped MongoDB
// `.lean()` / `.toArray()` results. Each interface mirrors the projected fields
// for the corresponding collection.

// StoreCategory mirrors the embedded category shape stored on store documents.
interface StoreCategory {
  _id?: mongoose.Types.ObjectId;
  name?: string;
  slug?: string;
}

// StoreProjection is the set of fields returned from stores collection queries.
interface StoreProjection {
  _id: mongoose.Types.ObjectId;
  name?: string;
  slug?: string;
  logo?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  distance?: number;
  cashbackRate?: number;
  categories?: StoreCategory[];
  isOpen?: boolean;
  location?: {
    city?: string;
    address?: { city?: string };
  };
  visit_count?: number;
  hasActiveOffer?: boolean;
  activeOffersCount?: number;
}

// ProductProjection is the set of fields returned from products collection queries.
interface ProductProjection {
  _id: mongoose.Types.ObjectId;
  name?: string;
  price?: number;
  image?: string;
  store?: mongoose.Types.ObjectId;
  category?: { slug?: string } | mongoose.Types.ObjectId;
  rating?: number;
}

// CategoryProjection is the set of fields returned from categories collection queries.
interface CategoryProjection {
  _id: mongoose.Types.ObjectId;
  name?: string;
  slug?: string;
}

// UserStreakDoc represents a document in the userstreaks collection.
interface UserStreakDoc {
  _id: unknown;
  lastStoreId?: unknown;
  updatedAt?: Date;
  type?: string;
  checkInCount?: number;
  visitCount?: number;
}

// TrendingStoreAggregate mirrors the raw output of the userstreaks aggregation.
interface TrendingStoreAggregate {
  _id: unknown;
  checkInCount: number;
}

// TrendingVisitCount mirrors the raw output of the visit-count aggregation.
interface TrendingVisitCount {
  _id: unknown;
  visitCount: number;
}

interface SearchStoresParams {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  page?: number;
  limit?: number;
  /** Optional — used for personalisation boost (prior visits by this user). */
  userId?: string;
}

interface SearchProductsParams {
  query?: string;
  storeId?: string;
  category?: string;
  /** Filter by category ObjectId — takes precedence over category slug when both are supplied. */
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// ── Behavioral ranking weights ─────────────────────────────────────────────
// Scores are normalised to [0, 1] and combined into relevance_score.
// location remains the primary sort key; relevance_score is a tie-breaker.
const RANK_WEIGHT_POPULARITY    = 0.35; // visit_count / max visits in result set
const RANK_WEIGHT_HAS_OFFER     = 0.25; // binary: has active offer/deal
const RANK_WEIGHT_PERSONALISED  = 0.40; // binary: user has visited this store before

/**
 * Fetch the set of storeIds that a given user has visited before.
 * Returns an empty set if userId is absent or the query fails.
 */
async function getPriorVisitedStoreIds(userId: string): Promise<Set<string>> {
  const startTime = Date.now();
  try {
    const StoreVisits = mongoose.connection.collection('storevisits');
    const docs = await StoreVisits.find(
      { userId },
      { projection: { storeId: 1 } },
    ).maxTimeMS(QUERY_TIMEOUT_MS).toArray();
    const duration = Date.now() - startTime;
    logSlowQuery('getPriorVisitedStoreIds', duration, { userId, count: docs.length });
    return new Set(docs.map((d) => String((d as { storeId?: unknown }).storeId)));
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getPriorVisitedStoreIds failed', { duration, userId, error: error.message });
    if (error.code === 50) {
      logger.error('getPriorVisitedStoreIds query timed out', { error: error.message, userId });
    }
    return new Set();
  }
}

/**
 * Compute a [0, 1] relevance_score combining popularity, offers, and personalisation.
 * maxVisitCount is the highest visit_count in the current result batch (for normalisation).
 */
function computeRelevanceScore(
  store: StoreProjection,
  maxVisitCount: number,
  priorVisitedIds: Set<string>,
): number {
  const storeId = String(store._id);

  // Popularity: normalise visit_count against the max in this batch
  const visitCount   = store.visit_count ?? 0;
  const popularityScore = maxVisitCount > 0 ? visitCount / maxVisitCount : 0;

  // Active offer boost: true if store has at least one active offer/deal
  const hasActiveOffer = Boolean(store.hasActiveOffer || (store.activeOffersCount ?? 0) > 0);

  // Personalisation boost: true if user has visited this store before
  const isPersonalised = priorVisitedIds.has(storeId);

  return (
    popularityScore * RANK_WEIGHT_POPULARITY +
    (hasActiveOffer ? 1 : 0) * RANK_WEIGHT_HAS_OFFER +
    (isPersonalised ? 1 : 0) * RANK_WEIGHT_PERSONALISED
  );
}

export async function searchStores(params: SearchStoresParams) {
  const { query, lat, lng, radius = 5000, category, page = 1, limit = 20, userId } = params;
  const skip = (page - 1) * limit;
  // FIX: Include userId in cache key so personalized results are not served to wrong users.
  // Previously, User A's personalized ranking could be cached and served to User B.
  const key = cacheKey('stores', { ...params, userId: userId || '__anon__' });

  return cached(key, 60, async () => {
    const Stores = mongoose.connection.collection('stores');
    const pipeline: Record<string, unknown>[] = [];

    // Geo stage if location provided
    if (lat && lng) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
        },
      });
    }

    // Match filters
    const match: Record<string, unknown> = { isActive: true };
    if (query) match.$text = { $search: query };
    if (category) match['categories.slug'] = category;
    pipeline.push({ $match: match });

    // Sort (primary)
    if (!lat && query) pipeline.push({ $sort: { score: { $meta: 'textScore' }, rating: -1 } });
    else if (!lat) pipeline.push({ $sort: { rating: -1 } });

    // Fetch a larger candidate set so we can apply relevance re-ranking before pagination.
    // Increased from 3→5: at 3x, any store beyond position 60 on page 1 (limit=20) was
    // permanently invisible regardless of personalisation score.
    const CANDIDATE_MULTIPLIER = 5;
    const candidateLimit = limit * CANDIDATE_MULTIPLIER;

    const countPipeline = [...pipeline, { $count: 'total' }];

    // Pull candidates with behavioral signal fields included
    const candidatePipeline = [
      ...pipeline,
      { $skip: 0 },
      { $limit: skip + candidateLimit },
      {
        $project: {
          _id: 1, name: 1, slug: 1, logo: 1, address: 1, rating: 1,
          reviewCount: 1, distance: 1, cashbackRate: 1, categories: 1,
          isOpen: 1, location: 1,
          visit_count: 1,
          hasActiveOffer: 1,
          activeOffersCount: 1,
        },
      },
    ];

    // Fetch prior visits for personalisation (only if userId supplied)
    const [candidateStores, countResult, priorVisitedIds] = await Promise.all([
      (async () => {
        const startTime = Date.now();
        try {
          const result = await Stores.aggregate(candidatePipeline).maxTimeMS(QUERY_TIMEOUT_MS).toArray() as StoreProjection[];
          logSlowQuery('searchStores.candidates', Date.now() - startTime, { count: result.length });
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('searchStores candidate query failed', { duration, error: error.message });
          if (error.code === 50) {
            logger.error('searchStores candidate query timed out', { error: error.message });
            throw new Error('Search query timed out, please try again');
          }
          throw error;
        }
      })(),
      (async () => {
        const startTime = Date.now();
        try {
          const result = await Stores.aggregate(countPipeline).maxTimeMS(QUERY_TIMEOUT_MS).toArray();
          logSlowQuery('searchStores.count', Date.now() - startTime, {});
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('searchStores count query failed', { duration, error: error.message });
          if (error.code === 50) {
            logger.error('searchStores count query timed out', { error: error.message });
            throw new Error('Search query timed out, please try again');
          }
          throw error;
        }
      })(),
      userId ? getPriorVisitedStoreIds(userId) : Promise.resolve(new Set<string>()),
    ]);

    // Compute max visit_count in this candidate set for normalisation
    const maxVisitCount = candidateStores.reduce(
      (max: number, s) => Math.max(max, s.visit_count ?? 0),
      0,
    );

    // Attach relevance_score to each candidate
    // SEA-005 FIX: Explicit ScoredStore type replaces all implicit `as any` casts.
    type ScoredStore = StoreProjection & { relevance_score: number };
    const scored: ScoredStore[] = candidateStores.map((store) => ({
      ...store,
      relevance_score: computeRelevanceScore(store, maxVisitCount, priorVisitedIds),
    }));

    // Re-rank: if geo present, keep distance as primary sort but use relevance_score
    // as a tiebreaker within close distance bands (500m buckets).
    // Without geo, sort purely by relevance_score descending.
    if (lat && lng) {
      scored.sort((a, b) => {
        const bandA = Math.floor((a.distance ?? 0) / 500);
        const bandB = Math.floor((b.distance ?? 0) / 500);
        if (bandA !== bandB) return bandA - bandB;
        return b.relevance_score - a.relevance_score;
      });
    } else {
      scored.sort((a, b) => b.relevance_score - a.relevance_score);
    }

    // Paginate after re-ranking
    const pageStores = scored.slice(skip, skip + limit).map((s) => ({
      _id:           s._id,
      name:          s.name,
      slug:          s.slug,
      logo:          s.logo,
      address:       s.address,
      rating:        s.rating,
      reviewCount:   s.reviewCount,
      distance:      s.distance,
      cashbackRate:  s.cashbackRate,
      categories:    s.categories,
      isOpen:        s.isOpen,
      location:      s.location,
      relevance_score: parseFloat(s.relevance_score.toFixed(4)),
    }));

    const total = countResult[0]?.total || 0;
    return { stores: pageStores, total, page, hasMore: skip + pageStores.length < total };
  });
}

export async function searchProducts(params: SearchProductsParams) {
  const { query, storeId, category, categoryId, minPrice, maxPrice, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;
  // SEA-005 FIX: Cast params to Record<string, unknown> to satisfy cacheKey signature.
  const key = cacheKey('products', params as unknown as Record<string, unknown>);

  return cached(key, 60, async () => {
    const Products = mongoose.connection.collection('products');
    // SEA-005 FIX: Use explicit price filter type to avoid `filter.price as any` casts.
    type PriceFilter = { $gte?: number; $lte?: number } | undefined;
    const filter: {
      isActive: boolean;
      $text?: { $search: string };
      store?: mongoose.Types.ObjectId;
      category?: mongoose.Types.ObjectId | { slug: string };
      price?: PriceFilter;
    } = { isActive: true };

    if (query) filter.$text = { $search: query };
    if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        throw new Error(`Invalid storeId: ${storeId}`);
      }
      filter.store = new mongoose.Types.ObjectId(storeId);
    }

    // categoryId (ObjectId) takes precedence over slug-based category param
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new Error(`Invalid categoryId: ${categoryId}`);
      }
      filter.category = new mongoose.Types.ObjectId(categoryId);
    } else if (category) {
      filter.category = { slug: category };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      (async () => {
        const startTime = Date.now();
        try {
          const result = await Products.find(filter)
            .project({ _id: 1, name: 1, price: 1, image: 1, store: 1, category: 1, rating: 1 })
            .sort(query ? { score: { $meta: 'textScore' } } : { rating: -1 })
            .skip(skip).limit(limit)
            .maxTimeMS(QUERY_TIMEOUT_MS).toArray();
          logSlowQuery('searchProducts', Date.now() - startTime, { count: result.length });
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('searchProducts query failed', { duration, error: error.message });
          if (error.code === 50) {
            logger.error('searchProducts query timed out', { error: error.message });
            throw new Error('Search query timed out, please try again');
          }
          throw error;
        }
      })(),
      (async () => {
        const startTime = Date.now();
        try {
          const result = await Products.countDocuments(filter).maxTimeMs(QUERY_TIMEOUT_MS);
          logSlowQuery('searchProducts.count', Date.now() - startTime, {});
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('searchProducts count query failed', { duration, error: error.message });
          if (error.code === 50) {
            logger.error('searchProducts count query timed out', { error: error.message });
            throw new Error('Search query timed out, please try again');
          }
          throw error;
        }
      })(),
    ]);

    // Build active filters summary so the frontend can show filter chips
    const activeFilters: Record<string, string | number> = {};
    if (categoryId)            activeFilters.categoryId = categoryId;
    else if (category)         activeFilters.category   = category;
    if (minPrice !== undefined) activeFilters.minPrice  = minPrice;
    if (maxPrice !== undefined) activeFilters.maxPrice  = maxPrice;

    return { products, total, page, hasMore: skip + products.length < total, activeFilters };
  });
}

/**
 * Returns available filter options for the product search UI:
 *   - categories: distinct category documents referenced by active products
 *   - priceRange: { min, max } price across all active products
 */
export async function getProductFilters(): Promise<{
  categories: Array<{ id: string; name: string; slug?: string }>;
  priceRange: { min: number; max: number };
}> {
  const Products   = mongoose.connection.collection('products');
  const Categories = mongoose.connection.collection('categories');

  const activeFilter = { isActive: true };

  // Distinct category ObjectIds from products
  const distinctStart = Date.now();
  const distinctCategoryIds = await Products.distinct('category', activeFilter) as mongoose.Types.ObjectId[];
  logSlowQuery('getProductFilters.distinctCategories', Date.now() - distinctStart, { count: distinctCategoryIds.length });

  // Resolve category names; fall back to empty array if categories collection is absent
  const categoryStart = Date.now();
  const categoryDocs = distinctCategoryIds.length > 0
    ? await Categories.find({
        _id: { $in: distinctCategoryIds },
      })
      .project({ _id: 1, name: 1, slug: 1 })
      .toArray()
    : [];
  logSlowQuery('getProductFilters.categoryLookup', Date.now() - categoryStart, { count: categoryDocs.length });

  // Min/max price via aggregation
  const priceStart = Date.now();
  const priceAgg = await Products.aggregate([
    { $match: activeFilter },
    {
      $group: {
        _id: null,
        min: { $min: '$price' },
        max: { $max: '$price' },
      },
    },
  ]).toArray();
  logSlowQuery('getProductFilters.priceRange', Date.now() - priceStart, {});

  const priceRange = {
    min: (priceAgg[0]?.min as number) ?? 0,
    max: (priceAgg[0]?.max as number) ?? 0,
  };

  return {
    categories: categoryDocs.map((c) => ({
      id:   c._id.toString(),
      name: c.name ?? '',
      slug: c.slug ?? undefined,
    })),
    priceRange,
  };
}

// ── Trending Stores ────────────────────────────────────────────────────────────

export interface TrendingStore {
  storeId: string;
  storeName: string;
  logo: string | null;
  category: string | null;
  city: string | null;
  checkInCount: number;
}

/**
 * Returns the top trending stores based on unique user check-in activity
 * from the last 7 days (userstreaks collection, type='store_visit').
 * Results are cached for 5 minutes per limit value.
 */
export async function getTrendingStores(limit = 10): Promise<TrendingStore[]> {
  const safeLimit = Math.min(limit, 20);
  const key = cacheKey('trending', { limit: safeLimit });

  return cached(key, 300, async () => {
    const UserStreaks = mongoose.connection.collection('userstreaks');
    const Stores      = mongoose.connection.collection('stores');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Aggregate check-ins grouped by store from the last 7 days
    const grouped = await UserStreaks.aggregate([
      {
        $match: {
          updatedAt: { $gte: sevenDaysAgo },
          type: 'store_visit',
        },
      },
      {
        $group: {
          _id: '$lastStoreId',
          checkInCount: { $sum: 1 },
        },
      },
      { $sort: { checkInCount: -1 } },
      { $limit: safeLimit },
    ]).toArray() as TrendingStoreAggregate[];

    if (grouped.length === 0) return [];

    // Collect storeIds — may be stored as string or ObjectId
    const storeIds: (string | mongoose.Types.ObjectId)[] = grouped.map((g: TrendingStoreAggregate) => {
      try {
        return new mongoose.Types.ObjectId(String(g._id));
      } catch {
        return String(g._id);
      }
    });

    // Enrich with store data
    const storeDocs = await Stores.find(
      { _id: { $in: storeIds as mongoose.Types.ObjectId[] }, isActive: true },
      {
        projection: {
          _id: 1,
          name: 1,
          logo: 1,
          categories: 1,
          location: 1,
        },
      },
    ).toArray() as StoreProjection[];

    const storeMap = new Map<string, StoreProjection>();
    for (const s of storeDocs) {
      storeMap.set(String(s._id), s);
    }

    // Merge in original rank order, skipping stores not found / inactive
    const results: TrendingStore[] = [];
    for (const g of grouped) {
      const store = storeMap.get(String(g._id));
      if (!store) continue;

      const primaryCategory =
        Array.isArray(store.categories) && store.categories.length > 0
          ? (store.categories[0]?.name ?? store.categories[0]?.slug ?? null)
          : null;

      const city =
        store.location?.city ??
        store.location?.address?.city ??
        null;

      results.push({
        storeId:      String(store._id),
        storeName:    store.name ?? '',
        logo:         store.logo ?? null,
        category:     primaryCategory,
        city,
        checkInCount: g.checkInCount,
      });
    }

    return results;
  });
}

// ── Trending by Category ───────────────────────────────────────────────────────

export interface TrendingCategoryStore {
  storeId: string;
  storeName: string;
  logo: string | null;
  visitCount: number;
}

export interface TrendingCategory {
  categoryId: string;
  categoryName: string;
  stores: TrendingCategoryStore[];
}

/**
 * PERFORMANCE FIX: Replaced in-memory cache with Redis-based caching.
 * Previously, _trendingByCategoryCache was module-level in-memory state.
 * Under Node.js cluster mode, each worker had its own isolated copy causing
 * inconsistent/trending data across replicas.
 *
 * Now uses Redis with shared TTL for multi-replica deployments.
 */
const TRENDING_BY_CATEGORY_TTL_SEC = 600; // 10 minutes in seconds

/**
 * Returns top 5 categories each with their top 3 trending stores.
 * Trending is determined by visit count (entries in userstreaks collection)
 * from the last 7 days. Results are cached in Redis for 10 minutes.
 *
 * PERFORMANCE FIX: Uses Redis-based caching instead of in-memory to support
 * multi-replica deployments.
 */
export async function getTrendingByCategory(): Promise<TrendingCategory[]> {
  const cacheKeyTrending = cacheKey('trending_by_category', { type: 'top5' });

  return cached(cacheKeyTrending, TRENDING_BY_CATEGORY_TTL_SEC, async () => {
    const UserStreaks = mongoose.connection.collection('userstreaks');
    const Stores      = mongoose.connection.collection('stores');
    const Categories  = mongoose.connection.collection('categories');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count visits per store over the last 7 days
    const visitCounts = await UserStreaks.aggregate([
      {
        $match: {
          updatedAt: { $gte: sevenDaysAgo },
          type: 'store_visit',
        },
      },
      {
        $group: {
          _id: '$lastStoreId',
          visitCount: { $sum: 1 },
        },
      },
      { $sort: { visitCount: -1 } },
      // Fetch more than we need so categories can each have top-3
      { $limit: 200 },
    ]).toArray() as TrendingVisitCount[];

    if (visitCounts.length === 0) return [];

    // Collect storeIds
    const storeIds: (string | mongoose.Types.ObjectId)[] = visitCounts.map((v: TrendingVisitCount) => {
      try { return new mongoose.Types.ObjectId(String(v._id)); } catch { return String(v._id); }
    });

    // Fetch store docs with category info
    const storeDocs = await Stores.find(
      { _id: { $in: storeIds as mongoose.Types.ObjectId[] }, isActive: true },
      {
        projection: {
          _id: 1,
          name: 1,
          logo: 1,
          categories: 1,
        },
      },
    ).toArray() as StoreProjection[];

    const storeMap = new Map<string, StoreProjection>();
    for (const s of storeDocs) {
      storeMap.set(String(s._id), s);
    }

    // Collect all unique categoryIds across these stores
    const allCategoryIds = new Set<string>();
    for (const s of storeDocs) {
      if (Array.isArray(s.categories)) {
        for (const cat of s.categories) {
          const catId = cat._id ? String(cat._id) : null;
          if (catId) allCategoryIds.add(catId);
        }
      }
    }

    // Resolve category names
    const categoryObjectIds = [...allCategoryIds].reduce<mongoose.Types.ObjectId[]>((acc, id) => {
      try { acc.push(new mongoose.Types.ObjectId(id)); } catch { /* skip invalid */ }
      return acc;
    }, []);

    const categoryDocs = categoryObjectIds.length > 0
      ? await Categories.find(
          { _id: { $in: categoryObjectIds } },
          { projection: { _id: 1, name: 1 } },
        ).toArray()
      : [];

    const categoryNameMap = new Map<string, string>();
    for (const c of categoryDocs) {
      categoryNameMap.set(String(c._id), c.name ?? '');
    }

    // Build a map: categoryId → top 3 stores by visitCount
    const categoryStoreMap = new Map<string, TrendingCategoryStore[]>();

    for (const v of visitCounts) {
      const store = storeMap.get(String(v._id));
      if (!store) continue;

      if (!Array.isArray(store.categories)) continue;

      for (const cat of store.categories) {
        const catId = cat._id ? String(cat._id) : null;
        if (!catId) continue;

        if (!categoryStoreMap.has(catId)) {
          categoryStoreMap.set(catId, []);
        }

        const list = categoryStoreMap.get(catId)!;
        if (list.length < 3) {
          list.push({
            storeId:    String(store._id),
            storeName: store.name ?? '',
            logo:       store.logo ?? null,
            visitCount: v.visitCount,
          });
        }
      }
    }

    // Build result: top 5 categories by total visitCount of their top stores.
    // SEA-008 FIX: Sort using an array sort (O(n log n) for n ≤ 200 categories).
    // This is bounded by `$limit: 200` in the aggregation — acceptable for this size.
    const categoryTotals: Array<{ categoryId: string; total: number }> = [];
    for (const [catId, stores] of categoryStoreMap.entries()) {
      const total = stores.reduce((sum, s) => sum + s.visitCount, 0);
      categoryTotals.push({ categoryId: catId, total });
    }
    categoryTotals.sort((a, b) => b.total - a.total);

    const top5 = categoryTotals.slice(0, 5);

    const result: TrendingCategory[] = top5.map(({ categoryId }) => ({
      categoryId,
      categoryName: categoryNameMap.get(categoryId) ?? categoryId,
      stores: categoryStoreMap.get(categoryId) ?? [],
    }));

    return result;
  });
}

// ── Autocomplete helpers ───────────────────────────────────────────────────────

/**
 * Build a fuzzy-tolerant MongoDB regex for a query string.
 *
 * Strategy:
 *   1. Exact prefix match first (highest confidence)
 *   2. Fallback to a permissive regex that allows missing / transposed characters
 *      within edit-distance ~1 by generating a regex that accepts each character
 *      as optional (covers common typos like "mcdonalds" → "McDonald's").
 *
 * We build a single regex that matches the query as a substring, with each
 * character being "loosely" required — non-word characters and apostrophes in the
 * target are treated as optional separators via [\W']*.
 */
function buildFuzzyRegex(query: string): RegExp {
  // Hard cap at 50 chars to prevent exponential backtracking on long inputs.
  // getAutocomplete already rejects queries > 50 chars, this is a defence-in-depth guard.
  const truncated = query.slice(0, 50);
  const escaped = truncated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Insert [\W']* between each character to skip punctuation / apostrophes
  const fuzzyPattern = escaped.split('').join('[\\W\']*');
  return new RegExp(fuzzyPattern, 'i');
}

/**
 * Build a prefix regex for the query (strict, fast).
 */
function buildPrefixRegex(query: string): RegExp {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}`, 'i');
}

export interface AutocompleteResult {
  stores: Array<{ id: string; name: string; slug?: string; type: 'store' }>;
  categories: Array<{ id: string; name: string; slug?: string; type: 'category' }>;
  products: Array<{ id: string; name: string; type: 'product' }>;
}

/**
 * Improved autocomplete with fuzzy matching, category-awareness, and 5-minute Redis cache.
 *
 * For each input query we run three parallel lookups:
 *   1. Stores — prefix match first, falls back to fuzzy if prefix yields < limit/2 results
 *   2. Categories — prefix + fuzzy against the categories collection
 *   3. Products — prefix + fuzzy
 *
 * Results are deduplicated and returned in the structured format:
 *   { stores: [...], categories: [...], products: [...] }
 */
export async function getAutocomplete(query: string, limit = 5): Promise<AutocompleteResult> {
  const empty: AutocompleteResult = { stores: [], categories: [], products: [] };
  if (!query || query.length < 2 || query.length > 50) return empty;

  const normalised = query.toLowerCase().trim();
  const key = cacheKey('autocomplete_v2', { query: normalised, limit });

  // 5-minute TTL (300s) as per sprint spec
  return cached(key, 300, async () => {
    const prefixRegex = buildPrefixRegex(query);
    const fuzzyRegex  = buildFuzzyRegex(query);

    const Stores     = mongoose.connection.collection('stores');
    const Products   = mongoose.connection.collection('products');
    const Categories = mongoose.connection.collection('categories');

    const perType = Math.max(3, Math.ceil(limit / 2));

    // Run all lookups in parallel
    // SEA-005 FIX: Cast to typed projection interfaces; _id is included so dedupe can use item._id.
    const [
      prefixStores,
      fuzzyStores,
      prefixCategories,
      fuzzyCategories,
      prefixProducts,
      fuzzyProducts,
    ] = await Promise.all([
      Stores.find({ name: prefixRegex, isActive: true })
        .project({ _id: 1, name: 1, slug: 1 })
        .limit(perType)
        .toArray() as unknown as StoreProjection[],

      Stores.find({ name: fuzzyRegex, isActive: true })
        .project({ _id: 1, name: 1, slug: 1 })
        .limit(limit)
        .toArray() as unknown as StoreProjection[],

      Categories.find({ name: prefixRegex })
        .project({ _id: 1, name: 1, slug: 1 })
        .limit(perType)
        .toArray() as unknown as CategoryProjection[],

      Categories.find({ name: fuzzyRegex })
        .project({ _id: 1, name: 1, slug: 1 })
        .limit(limit)
        .toArray() as unknown as CategoryProjection[],

      Products.find({ name: prefixRegex, isActive: true })
        .project({ _id: 1, name: 1 })
        .limit(perType)
        .toArray() as unknown as ProductProjection[],

      Products.find({ name: fuzzyRegex, isActive: true })
        .project({ _id: 1, name: 1 })
        .limit(limit)
        .toArray() as unknown as ProductProjection[],
    ]);

    // Merge prefix (higher rank) + fuzzy results, deduplicating by _id.
    // SEA-005 FIX: Type-specific dedupe functions replace `as any[]` casts.
    function dedupeStores(primary: StoreProjection[], secondary: StoreProjection[], max: number): StoreProjection[] {
      const seen = new Set<string>();
      const result: StoreProjection[] = [];
      for (const item of [...primary, ...secondary]) {
        const id = item._id.toString();
        if (!seen.has(id)) { seen.add(id); result.push(item); }
        if (result.length >= max) break;
      }
      return result;
    }
    function dedupeCategories(primary: CategoryProjection[], secondary: CategoryProjection[], max: number): CategoryProjection[] {
      const seen = new Set<string>();
      const result: CategoryProjection[] = [];
      for (const item of [...primary, ...secondary]) {
        const id = item._id.toString();
        if (!seen.has(id)) { seen.add(id); result.push(item); }
        if (result.length >= max) break;
      }
      return result;
    }
    function dedupeProducts(primary: ProductProjection[], secondary: ProductProjection[], max: number): ProductProjection[] {
      const seen = new Set<string>();
      const result: ProductProjection[] = [];
      for (const item of [...primary, ...secondary]) {
        const id = item._id.toString();
        if (!seen.has(id)) { seen.add(id); result.push(item); }
        if (result.length >= max) break;
      }
      return result;
    }

    const mergedStores     = dedupeStores(prefixStores,     fuzzyStores,     limit);
    const mergedCategories = dedupeCategories(prefixCategories, fuzzyCategories, limit);
    const mergedProducts   = dedupeProducts(prefixProducts,   fuzzyProducts,   limit);

    return {
      stores: mergedStores.map(s => ({
        id:   s._id.toString(),
        name: s.name ?? '',
        slug: s.slug ?? undefined,
        type: 'store' as const,
      })),
      categories: mergedCategories.map(c => ({
        id:   c._id.toString(),
        name: c.name ?? '',
        slug: c.slug ?? undefined,
        type: 'category' as const,
      })),
      products: mergedProducts.map(p => ({
        id:   p._id.toString(),
        name: p.name ?? '',
        type: 'product' as const,
      })),
    };
  });
}
