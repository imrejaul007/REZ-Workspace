import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../models/Product';
import { Store } from '../../models/Store';
import { merchantAuth, requireVerifiedMerchant } from '../../middleware/auth';
import { cacheGet, cacheSet, cacheDel } from '../../config/redis';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { createRateLimiter } from '@rez/shared';

// SEC-008 FIX: Rate limit product creation — 20 products per minute per merchant
const productWriteLimiter = createRateLimiter(
  redis.call.bind(redis),
  {
    windowMs: 60 * 1000,
    max: 20,
    keyPrefix: 'rl:product:create',
    keyGenerator: (req) => `merchant:${req.merchantId}:product-create`,
    message: 'Too many product creations. Please wait before creating more.',
  }
);

// SECURITY: `store` is intentionally NOT in the create whitelist.
// When present in req.body it is validated against Store ownership
// in the POST /products handler below before being merged in. A merchant
// that passes someone else's storeId gets 403 — previously this created
// cross-tenant products in the victim's catalogue.
const PRODUCT_CREATE_ALLOWED_FIELDS = [
  'name', 'description', 'category', 'subCategory', 'images', 'pricing',
  'inventory', 'sku', 'barcode', 'tags', 'isActive', 'isVeg', 'isFeatured',
  'sortOrder', 'preparationTime', 'weight', 'itemType',
  'variants', 'modifiers', 'servingInfo', 'nutritionInfo', 'allergens',
  'cashbackPercent', 'gstRate', 'hsnCode', 'price', 'originalPrice',
];

function pickProductFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of PRODUCT_CREATE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

/**
 * B14-B15 FIX: Normalise flat price/inventory fields sent by the merchant app
 * into the nested document structure required by the Product model.
 *
 * Mappings (only applied when the target nested path is not already set):
 *   price              → pricing.selling
 *   originalPrice      → pricing.mrp
 *   inventory.quantity → inventory.stock
 *
 * This ensures that queries reading pricing.selling / inventory.stock return
 * the correct values instead of undefined.
 */
function mapFlatToNestedProductFields(body: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = { ...body };

  // price → pricing.selling
  if (body.price !== undefined) {
    if (!body.pricing?.selling) {
      mapped.pricing = { ...body.pricing };
      mapped.pricing.selling = body.price;
    }
    delete mapped.price;
  }

  // originalPrice → pricing.original
  if (body.originalPrice !== undefined) {
    if (!body.pricing?.original) {
      mapped.pricing = { ...mapped.pricing };
      mapped.pricing.original = body.originalPrice;
    }
    delete mapped.originalPrice;
  }

  // inventory.quantity → inventory.stock
  if (body.inventory?.quantity !== undefined) {
    if (body.inventory?.stock === undefined) {
      mapped.inventory = { ...body.inventory };
      mapped.inventory.stock = body.inventory.quantity;
      delete mapped.inventory.quantity;
    }
  }

  return mapped;
}

/**
 * Validate that the caller owns the given storeId. Returns the store doc
 * on success, or null on mismatch / invalid id. Accepts undefined.
 */
export async function assertStoreOwnership(
  storeId: unknown,
  merchantId: string | undefined,
): Promise<{ _id: mongoose.Types.ObjectId } | null> {
  if (!storeId || typeof storeId !== 'string') return null;
  if (!mongoose.isValidObjectId(storeId)) return null;
  if (!merchantId) return null;
  return (await Store.findOne({ _id: storeId, merchantId: merchantId })
    .select('_id')
    .lean()) as unknown;
}

const VARIANT_ALLOWED_FIELDS = [
  'name', 'sku', 'price', 'stock', 'isAvailable', 'attributes', 'images', 'weight',
];

export function pickVariantFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of VARIANT_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

export function applyProductWriters(router: Router) {
  router.use(merchantAuth);
  // HIGH FIX: Gate product listing/creation to verified merchants only
  router.use(requireVerifiedMerchant);
}

// GET /products — paginated, filtered, cached per merchant+store+page
export function registerCrudRoutes(router: Router) {
  router.get('/', async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const search = req.query.search as string;
      const category = req.query.category as string;
      // Support both isActive (legacy) and status (frontend sends status=active/inactive)
      const isActive = req.query.isActive as string | undefined;
      const status = req.query.status as string | undefined;
      const stockLevel = req.query.stockLevel as string | undefined;
      const lowStock = req.query.lowStock === 'true';
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const cacheKey = `products:${req.merchantId}:${storeId || 'all'}:${page}:${limit}:${category || ''}:${search || ''}:${status || isActive || ''}:${stockLevel || lowStock}:${sortBy || ''}`;
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) { res.json(cached); return; }

      const filter: unknown = { merchant: new mongoose.Types.ObjectId(req.merchantId!), isDeleted: false };
      if (storeId) filter.store = new mongoose.Types.ObjectId(storeId);
      if (category) filter.category = category;

      // Handle status filter (frontend) and isActive filter (legacy)
      if (status === 'active') filter.isActive = true;
      else if (status === 'inactive') filter.isActive = false;
      else if (isActive !== undefined) filter.isActive = isActive === 'true';

      if (search) {
        // Escape regex metacharacters to prevent ReDoS from malicious search strings
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { sku: { $regex: safeSearch, $options: 'i' } },
          { category: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      // Handle stockLevel filter (frontend) and lowStock filter (legacy)
      if (stockLevel === 'low_stock' || lowStock) {
        filter['inventory.unlimited'] = { $ne: true };
        filter.$expr = {
          $lte: [
            '$inventory.stock',
            { $ifNull: ['$inventory.lowStockThreshold', 10] },
          ],
        };
      } else if (stockLevel === 'out_of_stock') {
        filter['inventory.unlimited'] = { $ne: true };
        filter['inventory.stock'] = { $lte: 0 };
      }

      // Build sort object
      let sortObj: unknown = { sortOrder: 1, createdAt: -1 };
      if (sortBy === 'created' || sortBy === 'createdAt') sortObj = { createdAt: sortOrder };
      else if (sortBy === 'name') sortObj = { name: sortOrder };
      else if (sortBy === 'price') sortObj = { 'pricing.selling': sortOrder };
      else if (sortBy === 'stock' || sortBy === 'quantity') sortObj = { 'inventory.stock': sortOrder };

      const [products, total] = await Promise.all([
        Product.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      const result = {
        success: true,
        data: products,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
      };

      await cacheSet(cacheKey, result, 120);
      res.json(result);
    } catch (err) {
      logger.error('[ROUTE ERROR]', err.message);
      res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
  });

  // GET /products/validate-sku
  router.get('/validate-sku', async (req: Request, res: Response) => {
    try {
      const { sku, storeId } = req.query;
      const existing = await Product.findOne({ sku, store: storeId, merchant: req.merchantId, isDeleted: false }).lean();
      res.json({ success: true, data: { isUnique: !existing } });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // GET /products/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, merchant: req.merchantId, isDeleted: false }).lean();
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      res.json({ success: true, data: product });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // POST /products
  router.post('/', productWriteLimiter, async (req: Request, res: Response) => {
    try {
      // SECURITY: validate body.store belongs to this merchant. Previously
      // `store` was in the create whitelist and never verified, so a merchant
      // could create products inside another merchant's store.
      const ownedStore = await assertStoreOwnership(req.body?.store, req.merchantId);
      if (!ownedStore) {
        res.status(403).json({
          success: false,
          message: 'You must provide a valid storeId that you own',
        });
        return;
      }

      const product = new Product({
        ...mapFlatToNestedProductFields(pickProductFields(req.body)),
        store: ownedStore._id,
        merchant: req.merchantId,
      });
      await product.save();
      await cacheDel(`products:${req.merchantId}:*`);
      await cacheDel(`prodcats:${req.merchantId}:*`);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  const PRODUCT_EDITABLE_FIELDS = [
    'name', 'description', 'price', 'originalPrice', 'category', 'subCategory',
    'images', 'isActive', 'isVeg', 'isAvailable', 'sortOrder', 'tags', 'sku',
    'inventory', 'variants', 'modifiers', 'preparationTime', 'servingInfo',
    'nutritionInfo', 'allergens', 'cashbackPercent', 'gstRate', 'hsnCode',
  ];

  // PUT /products/:id
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const normalized = mapFlatToNestedProductFields(req.body);
      const update: Record<string, unknown> = {};
      for (const field of PRODUCT_EDITABLE_FIELDS) {
        if (field in normalized) update[field] = normalized[field];
      }
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $set: update },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // DELETE /products/:id (soft delete)
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $set: { isActive: false } },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, message: 'Product deactivated' });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // PATCH /products/:id — partial update (e.g. lowStockAlert toggle)
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const allowed: Record<string, unknown> = {};
      const patchableFields = ['lowStockAlert', 'isActive', 'isAvailable', 'sortOrder'];
      for (const field of patchableFields) {
        if (field in req.body) allowed[field] = req.body[field];
      }
      // Allow nested inventory fields via inventory.* keys
      if ('inventory' in req.body && typeof req.body.inventory === 'object') {
        const inv = req.body.inventory as Record<string, unknown>;
        // CRIT-13 FIX: For stock updates, use atomic $inc with guard condition
        // instead of $set to prevent overselling due to race conditions
        if ('stock' in inv && typeof inv.stock === 'number') {
          // If the request is trying to SET stock (not increment), use conditional $inc
          const quantityDelta = inv.stock;
          const product = await Product.findOneAndUpdate(
            { _id: req.params.id, merchant: req.merchantId },
            // Atomically increment stock only if current stock >= abs(delta)
            // This prevents overselling in concurrent requests
            [
              {
                $set: {
                  'inventory.stock': {
                    $cond: [
                      { $gte: ['$inventory.stock', Math.abs(quantityDelta)] },
                      { $add: ['$inventory.stock', quantityDelta] },
                      '$inventory.stock', // No change if insufficient stock
                    ],
                  },
                },
              },
            ] as unknown,
            { new: true },
          );
          if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
          }
          await cacheDel(`products:${req.merchantId}:*`);
          res.json({ success: true, data: product });
          return;
        }
        // For non-stock inventory fields, use standard $set
        for (const key of Object.keys(inv)) {
          if (key !== 'stock') allowed[`inventory.${key}`] = inv[key];
        }
      }
      if (Object.keys(allowed).length === 0) {
        res.status(400).json({ success: false, message: 'No patchable fields provided' });
        return;
      }
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $set: allowed },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /products/bulk — bulk create
  // CRITICAL FIX: Validate store ownership for each product before creation
  router.post('/bulk', async (req: Request, res: Response) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({ success: false, message: 'products array required' }); return;
      }
      if (products.length > 100) {
        res.status(400).json({ success: false, message: 'Cannot create more than 100 products at once' }); return;
      }

      // CRITICAL FIX: Validate store ownership for each product's storeId
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (p.storeId) {
          const owned = await assertStoreOwnership(p.storeId, req.merchantId);
          if (!owned) {
            res.status(403).json({ success: false, message: `Product ${i}: You do not own the specified storeId` });
            return;
          }
        }
      }

      const docs = products.map((p) => ({
        ...mapFlatToNestedProductFields(pickProductFields(p)),
        merchant: req.merchantId,
      }));
      const result = await Product.insertMany(docs, { ordered: false });
      await cacheDel(`products:${req.merchantId}:*`);
      res.status(201).json({ success: true, data: { created: result.length } });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(400).json({ success: false, message: msg });
    }
  });

  // POST /products/bulk-action — bulk status change
  router.post('/bulk-action', async (req: Request, res: Response) => {
    try {
      const { productIds, action } = req.body;
      if (!Array.isArray(productIds) || !action) {
        res.status(400).json({ success: false, message: 'productIds and action required' }); return;
      }
      const update: unknown = {};
      if (action === 'activate') update.isActive = true;
      else if (action === 'deactivate') update.isActive = false;
      else if (action === 'delete') update.isActive = false;
      else { res.status(400).json({ success: false, message: 'Invalid action' }); return; }

      // Validate all IDs before passing to $in — a single invalid ObjectId causes Mongoose CastError
      const validIds = (productIds as string[]).filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length === 0) {
        res.status(400).json({ success: false, message: 'No valid productIds provided' }); return;
      }

      const result = await Product.updateMany(
        { _id: { $in: validIds }, merchant: req.merchantId },
        { $set: update },
      );
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: { modified: result.modifiedCount } });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });
}
