import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

const router = Router();
router.use(merchantAuth);

const clearCategoryCache = async (merchantId: string) => {
  await cacheDel(`categories:${merchantId}:*`);
  await cacheDel(`prodcats:${merchantId}:*`);
};

// GET /categories — list categories with product counts
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string;
    const parent = req.query.parent as string;
    const includeEmpty = req.query.includeEmpty === 'true';
    const cacheKey = `categories:${req.merchantId}:${storeId || 'all'}:${parent || 'root'}:${includeEmpty}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const filter: unknown = { merchant: new mongoose.Types.ObjectId(req.merchantId!) };
    if (storeId) filter.store = new mongoose.Types.ObjectId(storeId);
    else {
      const stores = await Store.find({ merchantId: req.merchantId }, '_id').lean();
      filter.store = { $in: stores.map((s) => s._id) };
    }
    if (parent) filter.parentCategory = new mongoose.Types.ObjectId(parent);
    else if (!includeEmpty) filter.$or = [{ parentCategory: { $exists: false } }, { parentCategory: null }];

    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();

    // Attach live product counts
    const productFilter: unknown = { merchant: new mongoose.Types.ObjectId(req.merchantId!) };
    if (storeId) productFilter.store = new mongoose.Types.ObjectId(storeId);
    const countAgg = await Product.aggregate([
      { $match: productFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    for (const row of countAgg) {
      if (row._id) countMap[row._id.toString().toLowerCase()] = row.count;
    }

    const enriched = categories.map((cat) => ({
      ...cat,
      id: cat._id?.toString(),
      productCount: countMap[cat.name?.toLowerCase()] || cat.productCount || 0,
    }));

    // Nest subcategories under their parents
    const parentIds = new Set(enriched.filter((c) => !c.parentCategory).map((c) => c._id.toString()));
    const result = enriched
      .filter((c) => !c.parentCategory)
      .map((cat) => ({
        ...cat,
        subcategories: enriched.filter(
          (sub) => sub.parentCategory && sub.parentCategory.toString() === cat._id.toString()
        ),
      }));

    const resp = { success: true, data: result };
    await cacheSet(cacheKey, resp, 300);
    res.json(resp);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /categories/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string;
    const filter: unknown = { merchant: new mongoose.Types.ObjectId(req.merchantId!) };
    if (storeId) filter.store = new mongoose.Types.ObjectId(storeId);
    const stats = await Product.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /categories/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      merchant: req.merchantId,
    }).lean();
    if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    res.json({ success: true, data: category });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /categories — create a new category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, image, icon, storeId, parentCategory, isActive } = req.body;
    if (!name?.trim()) { res.status(400).json({ success: false, message: 'Category name is required' }); return; }
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId is required' }); return; }

    const existing = await Category.findOne({
      merchant: req.merchantId,
      store: storeId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) { res.status(409).json({ success: false, message: 'A category with this name already exists' }); return; }

    const maxSort = await Category.findOne({ store: storeId }).sort({ sortOrder: -1 }).lean();
    const category = await Category.create({
      merchant: req.merchantId,
      store: storeId,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description?.trim() || '',
      image: image || '',
      icon: icon || '',
      parentCategory: parentCategory || undefined,
      isActive: isActive !== false,
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
    });

    await clearCategoryCache(req.merchantId!);
    res.status(201).json({ success: true, data: category });
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /categories/:id — update a category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, image, icon, isActive, parentCategory, sortOrder } = req.body;
    const update: unknown = {};
    if (name !== undefined) {
      update.name = name.trim();
      update.slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) update.description = description;
    if (image !== undefined) update.image = image;
    if (icon !== undefined) update.icon = icon;
    if (isActive !== undefined) update.isActive = isActive;
    if (parentCategory !== undefined) update.parentCategory = parentCategory || null;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, merchant: req.merchantId },
      { $set: update },
      { new: true },
    ).lean();
    if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }

    await clearCategoryCache(req.merchantId!);
    res.json({ success: true, data: category });
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, merchant: req.merchantId });
    if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }

    // Move products in this category to "Uncategorized"
    await Product.updateMany(
      { merchant: req.merchantId, category: category.name },
      { $set: { category: 'Uncategorized' } },
    );

    await Category.deleteOne({ _id: req.params.id });
    await clearCategoryCache(req.merchantId!);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /categories/bulk-update — bulk operations (rename, merge, move, delete)
router.post('/bulk-update', async (req: Request, res: Response) => {
  try {
    // Support both formats: { categories: [...] } and { operations: [...] }
    const operations = req.body.operations || req.body.categories;
    if (!Array.isArray(operations)) {
      res.status(400).json({ success: false, message: 'operations or categories array required' });
      return;
    }

    const results: Array<{ success: boolean; message: string }> = [];

    for (const op of operations) {
      try {
        if (op.type) {
          // Operation-based format from organize.tsx
          switch (op.type) {
            case 'rename_category':
              await Product.updateMany(
                { merchant: req.merchantId, category: op.oldCategory },
                { $set: { category: op.newCategory } },
              );
              await Category.updateMany(
                { merchant: req.merchantId, name: op.oldCategory },
                { $set: { name: op.newCategory, slug: op.newCategory?.toLowerCase().replace(/\s+/g, '-') } },
              );
              results.push({ success: true, message: `Renamed ${op.oldCategory} to ${op.newCategory}` });
              break;
            case 'merge_categories':
              if (op.sourceCategories) {
                await Product.updateMany(
                  { merchant: req.merchantId, category: { $in: op.sourceCategories } },
                  { $set: { category: op.newCategory } },
                );
                await Category.deleteMany(
                  { merchant: req.merchantId, name: { $in: op.sourceCategories } },
                );
              }
              results.push({ success: true, message: `Merged into ${op.newCategory}` });
              break;
            case 'delete_category':
              await Product.updateMany(
                { merchant: req.merchantId, category: op.oldCategory },
                { $set: { category: 'Uncategorized' } },
              );
              await Category.deleteMany(
                { merchant: req.merchantId, name: op.oldCategory },
              );
              results.push({ success: true, message: `Deleted ${op.oldCategory}` });
              break;
            default:
              results.push({ success: false, message: `Unknown operation: ${op.type}` });
          }
        } else {
          // MEDIUM FIX: Whitelist only allowed fields in upsert format to prevent mass assignment
          const ALLOWED_CATEGORY_FIELDS = ['name', 'description', 'image', 'icon', 'sortOrder', 'isActive', 'slug'];
          const safeOp: Record<string, unknown> = {};
          for (const f of ALLOWED_CATEGORY_FIELDS) {
            if (op[f] !== undefined) safeOp[f] = op[f];
          }
          // Generate slug from name if not provided
          if (!safeOp.slug && safeOp.name) {
            safeOp.slug = safeOp.name.toLowerCase().replace(/\s+/g, '-');
          }
          await Category.updateOne(
            { _id: op._id || new mongoose.Types.ObjectId() },
            { $set: { ...safeOp, merchant: req.merchantId } },
            { upsert: true },
          );
          results.push({ success: true, message: `Updated ${safeOp.name || op._id}` });
        }
      } catch (opErr) {
        results.push({ success: false, message: opErr.message });
      }
    }

    await clearCategoryCache(req.merchantId!);
    res.json({ success: true, data: { results } });
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /categories/organize — reorder
router.put('/organize', async (req: Request, res: Response) => {
  try {
    const { order } = req.body; // [{ id, sortOrder }]
    if (!Array.isArray(order)) { res.status(400).json({ success: false, message: 'order array required' }); return; }
    await Promise.all(order.map((item) =>
      Category.findOneAndUpdate(
        { _id: item.id, merchant: req.merchantId },
        { $set: { sortOrder: item.sortOrder } },
      ),
    ));
    await clearCategoryCache(req.merchantId!);
    res.json({ success: true, message: 'Categories reordered' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
