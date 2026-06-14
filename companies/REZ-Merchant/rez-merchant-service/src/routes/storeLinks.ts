
/**
 * Store Links routes - Manage configurable links for REZ Now store pages.
 *
 * Endpoints:
 * GET    /store-links/:storeId      - Get all links for a store
 * POST   /store-links/:storeId      - Create/update links for a store
 * PATCH  /store-links/:storeId/:linkId - Update a specific link
 * DELETE /store-links/:storeId/:linkId - Delete a specific link
 * POST   /store-links/:storeId/:linkId/click - Track a link click
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { StoreLink } from '../models/StoreLink';
import { merchantAuth } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(merchantAuth);

const LINK_TYPES = ['website', 'menu', 'reservation', 'order', 'contact', 'social'] as const;
type LinkType = typeof LINK_TYPES[number];

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
 * GET /store-links/:storeId
 * Returns all links for a store.
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    let storeLink = await StoreLink.findOne({ storeId: new mongoose.Types.ObjectId(storeId) }).lean();
    if (!storeLink) {
      // Create empty links document if not exists
      storeLink = await StoreLink.create({ storeId: new mongoose.Types.ObjectId(storeId), links: [] });
    }

    res.json({ success: true, data: storeLink });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /store-links/:storeId
 * Create or replace all links for a store.
 * Body: { links: IStoreLinkItem[] }
 */
router.post('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { links } = req.body as { links: unknown[] };

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    if (!Array.isArray(links)) {
      res.status(400).json({ success: false, message: 'links must be an array' });
      return;
    }

    // Validate and sanitize links
    const sanitizedLinks = links.map((link, index) => {
      if (!LINK_TYPES.includes(link.type as LinkType)) {
        throw new Error(`Invalid link type: ${link.type}`);
      }
      if (!link.title || typeof link.title !== 'string') {
        throw new Error(`Link title is required at index ${index}`);
      }
      if (!link.url || typeof link.url !== 'string') {
        throw new Error(`Link URL is required at index ${index}`);
      }
      return {
        id: link.id || uuidv4(),
        type: link.type,
        title: link.title.trim(),
        url: link.url.trim(),
        icon: link.icon || null,
        order: typeof link.order === 'number' ? link.order : index,
        clickCount: typeof link.clickCount === 'number' ? link.clickCount : 0,
      };
    });

    const storeLink = await StoreLink.findOneAndUpdate(
      { storeId: new mongoose.Types.ObjectId(storeId) },
      { $set: { links: sanitizedLinks } },
      { upsert: true, new: true },
    );

    res.json({ success: true, data: storeLink });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * PATCH /store-links/:storeId/:linkId
 * Update a specific link.
 */
router.patch('/:storeId/:linkId', async (req: Request, res: Response) => {
  try {
    const { storeId, linkId } = req.params;
    const updates = req.body;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    if (updates.type && !LINK_TYPES.includes(updates.type as LinkType)) {
      res.status(400).json({ success: false, message: `Invalid link type: ${updates.type}` });
      return;
    }

    // Build the update object for the specific link
    const storeLink = await StoreLink.findOne({ storeId: new mongoose.Types.ObjectId(storeId) });
    if (!storeLink) {
      res.status(404).json({ success: false, message: 'Store links not found' });
      return;
    }

    const linkIndex = storeLink.links.findIndex((l: { id?: string }) => l.id === linkId);
    if (linkIndex === -1) {
      res.status(404).json({ success: false, message: 'Link not found' });
      return;
    }

    // Apply updates to the specific link
    const link = storeLink.links[linkIndex] as unknown;
    if (updates.title !== undefined) link.title = updates.title.trim();
    if (updates.url !== undefined) link.url = updates.url.trim();
    if (updates.type !== undefined) link.type = updates.type;
    if (updates.icon !== undefined) link.icon = updates.icon;
    if (typeof updates.order === 'number') link.order = updates.order;

    await storeLink.save();

    res.json({ success: true, data: storeLink });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * DELETE /store-links/:storeId/:linkId
 * Delete a specific link.
 */
router.delete('/:storeId/:linkId', async (req: Request, res: Response) => {
  try {
    const { storeId, linkId } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const storeLink = await StoreLink.findOneAndUpdate(
      { storeId: new mongoose.Types.ObjectId(storeId) },
      { $pull: { links: { id: linkId } } },
      { new: true },
    );

    if (!storeLink) {
      res.status(404).json({ success: false, message: 'Store links not found' });
      return;
    }

    res.json({ success: true, data: storeLink });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /store-links/:storeId/:linkId/click
 * Track a link click.
 */
router.post('/:storeId/:linkId/click', async (req: Request, res: Response) => {
  try {
    const { storeId, linkId } = req.params;

    const storeLink = await StoreLink.findOne({ storeId: new mongoose.Types.ObjectId(storeId) });
    if (!storeLink) {
      res.status(404).json({ success: false, message: 'Store links not found' });
      return;
    }

    const linkIndex = storeLink.links.findIndex((l: { id?: string }) => l.id === linkId);
    if (linkIndex === -1) {
      res.status(404).json({ success: false, message: 'Link not found' });
      return;
    }

    // Increment click count
    const link = storeLink.links[linkIndex] as unknown;
    link.clickCount = (link.clickCount || 0) + 1;
    await storeLink.save();

    res.json({ success: true, data: { clickCount: link.clickCount } });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
