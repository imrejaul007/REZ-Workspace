
/**
 * Gallery routes - Manage store portfolio/media gallery.
 *
 * Endpoints:
 * GET    /gallery/:storeId         - List gallery items
 * POST   /gallery/:storeId         - Add gallery items
 * GET    /gallery/:storeId/:id     - Get specific item
 * PATCH  /gallery/:storeId/:id     - Update item
 * DELETE /gallery/:storeId/:id     - Delete item
 * POST   /gallery/:storeId/reorder - Reorder items
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { GalleryItem } from '../models/Gallery';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * Verify merchant owns the store.
 */
async function verifyStoreOwnership(storeId: string, merchantId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(storeId)) return false;
  const store = await Store.findOne({
    _id: new mongoose.Types.ObjectId(storeId),
    $or: [{ merchantId: new mongoose.Types.ObjectId(merchantId) }, { merchant: new mongoose.Types.ObjectId(merchantId) }],
  });
  return !!store;
}

/**
 * GET /gallery/:storeId
 * List gallery items for a store.
 * Query params:
 *   - type: filter by 'image' or 'video'
 *   - category: filter by category
 *   - active: filter by isActive (true/false)
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { type, category, active } = req.query;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const filter: unknown = { storeId: new mongoose.Types.ObjectId(storeId) };
    if (type && ['image', 'video'].includes(type as string)) filter.type = type;
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';

    const items = await GalleryItem.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /gallery/:storeId
 * Add gallery items (single or batch).
 * Body: { items: GalleryItem[] } or single item
 */
router.post('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { items } = req.body as { items?: unknown[] | unknown };

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    // Normalize to array
    const itemsArray = Array.isArray(items) ? items : items ? [items] : [];
    if (itemsArray.length === 0) {
      res.status(400).json({ success: false, message: 'items array is required' });
      return;
    }

    // Get current max sortOrder
    const maxSortItem = await GalleryItem.findOne({ storeId: new mongoose.Types.ObjectId(storeId) })
      .sort({ sortOrder: -1 })
      .select('sortOrder')
      .lean();
    let nextSortOrder = (maxSortItem?.sortOrder || 0) + 1;

    // Validate and prepare items
    const galleryItems = itemsArray.map((item, index) => {
      if (!item.type || !['image', 'video'].includes(item.type)) {
        throw new Error(`Invalid type at index ${index}. Must be 'image' or 'video'`);
      }
      if (!item.url || typeof item.url !== 'string') {
        throw new Error(`URL is required at index ${index}`);
      }
      return {
        storeId: new mongoose.Types.ObjectId(storeId),
        type: item.type,
        url: item.url.trim(),
        caption: item.caption?.trim(),
        category: item.category?.trim(),
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : nextSortOrder++,
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        metadata: item.metadata || undefined,
      };
    });

    const created = await GalleryItem.insertMany(galleryItems);

    res.status(201).json({ success: true, data: created });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * GET /gallery/:storeId/:id
 * Get a specific gallery item.
 */
router.get('/:storeId/:id', async (req: Request, res: Response) => {
  try {
    const { storeId, id } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const item = await GalleryItem.findOne({
      _id: new mongoose.Types.ObjectId(id),
      storeId: new mongoose.Types.ObjectId(storeId),
    }).lean();

    if (!item) {
      res.status(404).json({ success: false, message: 'Gallery item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * PATCH /gallery/:storeId/:id
 * Update a gallery item.
 */
router.patch('/:storeId/:id', async (req: Request, res: Response) => {
  try {
    const { storeId, id } = req.params;
    const updates = req.body;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    // Build allowed updates
    const allowedUpdates: unknown = {};
    if (updates.url !== undefined) allowedUpdates.url = updates.url.trim();
    if (updates.caption !== undefined) allowedUpdates.caption = updates.caption?.trim() || '';
    if (updates.category !== undefined) allowedUpdates.category = updates.category?.trim() || '';
    if (updates.type !== undefined && ['image', 'video'].includes(updates.type)) {
      allowedUpdates.type = updates.type;
    }
    if (typeof updates.sortOrder === 'number') allowedUpdates.sortOrder = updates.sortOrder;
    if (updates.isActive !== undefined) allowedUpdates.isActive = Boolean(updates.isActive);
    if (updates.metadata !== undefined) allowedUpdates.metadata = updates.metadata;

    const item = await GalleryItem.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), storeId: new mongoose.Types.ObjectId(storeId) },
      { $set: allowedUpdates },
      { new: true },
    );

    if (!item) {
      res.status(404).json({ success: false, message: 'Gallery item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * DELETE /gallery/:storeId/:id
 * Delete a gallery item.
 */
router.delete('/:storeId/:id', async (req: Request, res: Response) => {
  try {
    const { storeId, id } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const item = await GalleryItem.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      storeId: new mongoose.Types.ObjectId(storeId),
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Gallery item not found' });
      return;
    }

    res.json({ success: true, message: 'Gallery item deleted' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /gallery/:storeId/reorder
 * Reorder gallery items.
 * Body: { items: [{ id: string, sortOrder: number }] }
 */
router.post('/:storeId/reorder', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { items } = req.body as { items: { id: string; sortOrder: number }[] };

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'items array is required' });
      return;
    }

    // Update sort orders
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(item.id),
          storeId: new mongoose.Types.ObjectId(storeId),
        },
        update: { $set: { sortOrder: item.sortOrder } },
      },
    }));

    await GalleryItem.bulkWrite(bulkOps);

    // Return updated items
    const updatedItems = await GalleryItem.find({ storeId: new mongoose.Types.ObjectId(storeId) })
      .sort({ sortOrder: 1 })
      .lean();

    res.json({ success: true, data: updatedItems });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
