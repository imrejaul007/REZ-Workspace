/**
 * HTTP server for rez-catalog-service.
 *
 * Adds read-only REST endpoints on top of the existing BullMQ worker.
 * Queries the shared MongoDB 'products' and 'categories' collections directly
 * (strict:false models).
 *
 * Endpoints:
 *   GET /health                                 — Render health check
 *   GET /products                               — Product listing (storeId, category, search, page)
 *   GET /products/featured                      — Featured products near location (lat, lng)
 *   GET /products/:productId                    — Single product detail
 *   GET /categories                             — Category list
 *   GET /categories/:categoryId/products        — Products by category
 */

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import http from 'http';
import { logger } from './config/logger';
import { requireInternalToken } from './middleware/internalAuth';
import { tracingMiddleware } from './middleware/tracing';
import { Product } from './models/Product';
import { Category } from './models/Category';
import { validateBody, validateQuery } from './middleware/validation';
import {
  ProductListQuerySchema,
  FeaturedProductsQuerySchema,
  MerchantProductsQuerySchema,
  CreateProductSchema,
  UpdateProductSchema,
} from './validation/productSchemas';
import { sendCatalogViewToRezMind } from './services/rezMindService';

/** Escape user input before using it in a MongoDB $regex to prevent ReDoS (BUG-21). */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Redis-backed rate limiter for public endpoints ─────────────────────────────────
// CRITICAL FIX: Replaced in-memory Map with Redis sorted-set rate limiter.
// The in-memory Map was per-process — bypassed when multiple Render instances share a load balancer.
// Redis ensures all instances share the same counter.

import { bullmqRedis } from './config/redis';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window per IP

/**
 * Redis-backed rate limiter using sliding window. CRITICAL FIX: replaced in-memory Map
 * (per-process, bypassable across instances) with Redis sorted-set (shared state).
 *
 * H12 FIX: Changed from fail-open to fail-closed for security.
 * If Redis is unavailable, reject requests rather than allow unlimited access.
 */
async function checkCatalogRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const redisKey = `rl:catlog:ip:${ip}`;

  try {
    const pipe = bullmqRedis.pipeline();
    pipe.zremrangebyscore(redisKey, '-inf', now - RATE_LIMIT_WINDOW_MS);
    pipe.zcard(redisKey);
    pipe.zadd(redisKey, now, `${now}`);
    pipe.pexpire(redisKey, RATE_LIMIT_WINDOW_MS);
    const results = await pipe.exec();
    const count = (results?.[1]?.[1] as number) ?? 0;
    return count < RATE_LIMIT_MAX;
  } catch (err) {
    // H12 FIX: fail-closed — reject if Redis unavailable
    logger.error('[checkCatalogRateLimit] Redis unavailable, rejecting request', { ip, error: err });
    return false;
  }
}

// BE-CAT-028 FIX: Add query timeout protection (5 seconds)
const QUERY_TIMEOUT_MS = parseInt(process.env.MONGODB_QUERY_TIMEOUT_MS || '5000', 10);

const app = express();
// Behind Render LB + CF — trust N hops so per-IP rate limiters key on real client IP.
// See MASTER-PLAN-2026-04-19 P1 (trust proxy fleet-wide).
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
app.use(helmet());
// PERFORMANCE: Enable gzip compression for all responses
app.use(compression());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map(s => s.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(tracingMiddleware);

// Gateway sends /api/categories, /api/products — strip /api prefix for route matching
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
  }
  next();
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbOk = dbState === 1 || dbState === 2;
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    service: 'rez-catalog-service',
    uptime: process.uptime(),
    db: dbOk ? 'connected' : 'disconnected',
  });
});

// ── Featured products (before /:productId to avoid param conflict) ─────────

app.get('/products/featured', validateQuery(FeaturedProductsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!(await checkCatalogRateLimit(ip))) {
    return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }
  try {
    const lat = (req.query as unknown).lat as number | undefined;
    const lng = (req.query as unknown).lng as number | undefined;
    const limit = ((req.query as unknown).limit as number) || 20;

    const query: Record<string, unknown> = { isFeatured: true, isActive: true };

    // If location provided, we do a simple proximity pre-filter via a store lookup.
    // Full geo-query requires a geospatial index on the products collection which the
    // monolith may not have in all deployments, so we return featured products
    // globally and let the caller filter by distance on the client side.
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      // Include lat/lng in response metadata so callers can filter client-side
      const products = await Product.find(query)
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(limit)
        .maxTimeMS(QUERY_TIMEOUT_MS)
        .lean();

      return res.json({
        success: true,
        data: {
          products,
          location: { lat, lng },
          note: 'Sorted by popularity; geo-proximity filtering available via /api/products?search=',
        },
      });
    }

    const products = await Product.find(query)
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit)
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean();

    return res.json({ success: true, data: { products } });
  } catch (err) {
    next(err);
  }
});

// ── Product listing ───────────────────────────────────────────────────────────

app.get('/products', validateQuery(ProductListQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!(await checkCatalogRateLimit(ip))) {
    return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }
  try {
    const page = ((req.query as unknown).page as number) || 1;
    const limit = Math.min(100, ((req.query as unknown).limit as number) || 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    const storeIdRaw = req.query.storeId as string | undefined;
    if (storeIdRaw) {
      if (mongoose.isValidObjectId(storeIdRaw)) {
        filter['store'] = new mongoose.Types.ObjectId(storeIdRaw);
      } else {
        filter['store'] = storeIdRaw;
      }
    }

    const categoryRaw = req.query.category as string | undefined;
    if (categoryRaw) {
      // BE-CAT-015 FIX: Validate category is ObjectId before converting
      if (mongoose.isValidObjectId(categoryRaw)) {
        filter['category'] = new mongoose.Types.ObjectId(categoryRaw);
      } else {
        // Only accept alphanumeric slug format to prevent injection
        if (!/^[a-z0-9\-]+$/i.test(categoryRaw)) {
          return res.status(400).json({ success: false, error: 'Invalid category format' });
        }
        filter['category'] = categoryRaw;
      }
    }

    const search = req.query.search as string | undefined;
    if (search && search.trim()) {
      filter['$or'] = [
        { name: { $regex: escapeRegex(search.trim()), $options: 'i' } },
        { description: { $regex: escapeRegex(search.trim()), $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).maxTimeMS(QUERY_TIMEOUT_MS).lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Merchant: list products ───────────────────────────────────────────────────

app.get('/products/merchant/:merchantId', requireInternalToken, validateQuery(MerchantProductsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // BE-CAT-003 FIX: Validate merchantId is valid ObjectId format
    const merchantId = req.params['merchantId'] as string;
    if (!mongoose.isValidObjectId(merchantId)) {
      return res.status(400).json({ success: false, message: 'Invalid merchantId format' });
    }

    const page = ((req.query as unknown).page as number) || 1;
    const limit = Math.min(100, ((req.query as unknown).limit as number) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const filter: Record<string, unknown> = { merchantId, isActive: true };
    if (search && search.trim()) {
      filter['$or'] = [
        { name: { $regex: escapeRegex(search.trim()), $options: 'i' } },
        { description: { $regex: escapeRegex(search.trim()), $options: 'i' } },
      ];
    }

    const col = mongoose.connection.collection('products');
    const [products, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Merchant: create product ──────────────────────────────────────────────────

app.post('/products', requireInternalToken, validateBody(CreateProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, price, category, description, stock, merchantId, storeId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ success: false, message: 'price must be a positive number' });
    }
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required' });
    }

    const now = new Date();
    const doc: Record<string, unknown> = {
      name: name.trim(),
      price,
      category: category || null,
      description: description || '',
      stock: typeof stock === 'number' ? stock : 0,
      merchantId,
      storeId: storeId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const col = mongoose.connection.collection('products');
    const result = await col.insertOne(doc);

    return res.status(201).json({
      success: true,
      productId: result.insertedId.toString(),
      product: { _id: result.insertedId, ...doc },
    });
  } catch (err) {
    next(err);
  }
});

// ── Merchant: update product ──────────────────────────────────────────────────

app.patch('/products/:id', requireInternalToken, validateBody(UpdateProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const { merchantId, ...fields } = req.body as Record<string, unknown>;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required for ownership validation' });
    }

    // Validate writeable fields
    if (fields.name !== undefined && (!fields.name || typeof fields.name !== 'string' || !String(fields.name).trim())) {
      return res.status(400).json({ success: false, message: 'name cannot be empty' });
    }
    if (fields.price !== undefined && (typeof fields.price !== 'number' || fields.price <= 0)) {
      return res.status(400).json({ success: false, message: 'price must be a positive number' });
    }
    if (fields.stock !== undefined && (typeof fields.stock !== 'number' || !Number.isFinite(fields.stock) || fields.stock < 0)) {
      return res.status(400).json({ success: false, message: 'stock must be a non-negative number' });
    }

    // Explicit allowlist — prevents mass-assignment of protected fields like
    // merchantId, storeId, viewCount, or arbitrary schema fields
    const ALLOWED_FIELDS = [
      'name', 'description', 'price', 'compareAtPrice', 'images', 'thumbnail',
      'category', 'subcategory', 'tags', 'sku', 'barcode', 'stock', 'unit',
      'weight', 'dimensions', 'variants', 'addOns', 'preparationTime',
      'taxRate', 'discount', 'isAvailable', 'sortOrder', 'metadata',
    ];
    const safeFields: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (fields[key] !== undefined) safeFields[key] = fields[key];
    }

    const col = mongoose.connection.collection('products');
    const result = await col.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), merchantId },
      { $set: { ...safeFields, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by merchant' });
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Merchant: soft-delete product ────────────────────────────────────────────

app.delete('/products/:id', requireInternalToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const merchantIdRaw = req.query.merchantId;
    const merchantId = typeof merchantIdRaw === 'string' ? merchantIdRaw : undefined;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId query param is required' });
    }

    const col = mongoose.connection.collection('products');
    const result = await col.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), merchantId },
      { $set: { isActive: false, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by merchant' });
    }

    return res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
});

// ── Single product ────────────────────────────────────────────────────────────

app.get('/products/:productId', async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!(await checkCatalogRateLimit(ip))) {
    return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid productId' });
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Send to REZ Mind - catalog view event
    sendCatalogViewToRezMind({
      user_id: (req.query as unknown).userId,
      merchant_id: product.storeId ? String(product.storeId) : undefined,
      item_id: String(product._id),
      item_name: product.name as string,
      category: product.category as string,
    }).catch(() => {});

    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// ── Category list ─────────────────────────────────────────────────────────────

app.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!(await checkCatalogRateLimit(ip))) {
    return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    return res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
});

// ── Products by category ──────────────────────────────────────────────────────

app.get('/categories/:categoryId/products', async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!(await checkCatalogRateLimit(ip))) {
    return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }
  try {
    const categoryId: string = req.params['categoryId'] as string;

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const skip = (page - 1) * limit;

    // Accept both ObjectId and string slug/identifier
    const isOid = mongoose.isValidObjectId(categoryId);
    const categoryFilter: Record<string, unknown> = isOid
      ? { _id: new mongoose.Types.ObjectId(categoryId as string) }
      : { slug: escapeRegex(categoryId) };

    const category = await Category.findOne(categoryFilter).lean();
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productFilter: Record<string, unknown> = {
      isActive: true,
      category: (category as unknown)._id,
    };

    const [products, total] = await Promise.all([
      Product.find(productFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(productFilter),
    ]);

    return res.json({
      success: true,
      data: {
        category,
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Dietary Preferences Endpoints ───────────────────────────────────────────────

import { dietaryPreferencesService } from './services/dietaryPreferencesService';
import { tasteProfileService } from './services/tasteProfileService';
import { weatherService } from './services/weatherService';
import { menuRecommendationService } from './services/menuRecommendationService';

// GET /dietary-preferences/:userId
app.get('/dietary-preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const prefs = await dietaryPreferencesService.getByUserId(userId);
    if (!prefs) {
      return res.status(404).json({ success: false, message: 'Dietary preferences not found' });
    }
    return res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// PUT /dietary-preferences/:userId
app.put('/dietary-preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const input = req.body;
    const prefs = await dietaryPreferencesService.update(userId, input);
    return res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// PATCH /dietary-preferences/:userId
app.patch('/dietary-preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const input = req.body;
    const prefs = await dietaryPreferencesService.update(userId, input);
    return res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// POST /dietary-preferences/:userId/allergies
app.post('/dietary-preferences/:userId/allergies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { allergy } = req.body;
    if (!allergy || typeof allergy !== 'string') {
      return res.status(400).json({ success: false, message: 'allergy is required' });
    }
    const prefs = await dietaryPreferencesService.addAllergy(userId, allergy);
    return res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// DELETE /dietary-preferences/:userId/allergies/:allergy
app.delete('/dietary-preferences/:userId/allergies/:allergy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, allergy } = req.params;
    const prefs = await dietaryPreferencesService.removeAllergy(userId, decodeURIComponent(allergy));
    return res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// POST /dietary-preferences/:userId/dislikes
app.post('/dietary-preferences/:userId/dislikes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { item } = req.body;
    if (!item || typeof item !== 'string') {
      return res.status(400).json({ success: false, message: 'item is required' });
    }
    const prefs = await dietaryPreferencesService.addDislike(userId, item);
    return res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// ── Taste Profile Endpoints ────────────────────────────────────────────────────

// GET /taste-profile/:userId
app.get('/taste-profile/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const profile = await tasteProfileService.getByUserId(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Taste profile not found' });
    }
    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// PUT /taste-profile/:userId
app.put('/taste-profile/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const input = req.body;
    const profile = await tasteProfileService.update(userId, input);
    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /taste-profile/:userId
app.patch('/taste-profile/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const input = req.body;
    const profile = await tasteProfileService.update(userId, input);
    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// POST /taste-profile/learn
app.post('/taste-profile/learn', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, items, total, tip } = req.body;
    if (!userId || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'userId and items array are required' });
    }
    const profile = await tasteProfileService.learnFromOrder({ userId, items, total: total || 0, tip });
    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// ── Weather Endpoints ───────────────────────────────────────────────────────────

// GET /weather?lat=XX&lng=YY
app.get('/weather', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required' });
    }
    const weather = await weatherService.getWeather(lat, lng);
    const recommendations = weatherService.getWeatherRecommendations(weather);
    return res.json({
      success: true,
      data: {
        weather,
        recommendations,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Menu Recommendation Endpoints ──────────────────────────────────────────────

// POST /recommendations/menu
app.post('/recommendations/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, userId, cartItems, dietaryFilters, weatherCondition, timeOfDay, latitude, longitude, limit } = req.body;

    if (!timeOfDay || !['breakfast', 'lunch', 'dinner', 'late_night'].includes(timeOfDay)) {
      return res.status(400).json({
        success: false,
        message: 'timeOfDay is required and must be one of: breakfast, lunch, dinner, late_night',
      });
    }

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }

    const recommendations = await menuRecommendationService.getRecommendations({
      storeId,
      userId,
      cartItems,
      dietaryFilters,
      weatherCondition,
      timeOfDay,
      latitude,
      longitude,
      limit: limit || 10,
    });

    return res.json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
});

// GET /recommendations/similar/:itemId?limit=5
app.get('/recommendations/similar/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const similar = await menuRecommendationService.getSimilarItems(itemId, limit);
    return res.json({ success: true, data: { items: similar } });
  } catch (err) {
    next(err);
  }
});

// GET /recommendations/trending/:storeId?limit=10
app.get('/recommendations/trending/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const trending = await menuRecommendationService.getTrendingItems(storeId, limit);
    return res.json({ success: true, data: { items: trending } });
  } catch (err) {
    next(err);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[HTTP] Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Server factory ────────────────────────────────────────────────────────────

/**
 * Creates and starts the HTTP server for the catalog service.
 * Mounts Express with product/category endpoints, health checks, and Prometheus metrics.
 * @param port - The port number to listen on
 * @returns The HTTP server instance
 */
export function startHttpServer(port: number): http.Server {
  const server = http.createServer(app);
  server.listen(port, () => {
    logger.info(`[HTTP] Catalog service listening on port ${port}`);
  });
  return server;
}
