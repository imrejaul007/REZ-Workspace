import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * M3 BACKWARD COMPAT: The $or queries below exist because Store documents were
 * created with both `merchant` and `merchantId` fields (cross-service schema fork).
 * All new writes use `merchantId` only. The $or ensures old documents remain
 * accessible while the migration completes. See MERCH-M3-001 for tracking.
 */

// Allowed fields for store create/update — prevents mass assignment
const STORE_ALLOWED_FIELDS = [
  'name', 'slug', 'description', 'logo', 'banner', 'category', 'subcategories',
  'location', 'contact', 'operationalInfo', 'offers', 'paymentSettings',
  'rewardRules', 'isActive', 'isListed', 'tags', 'features',
];

function pickStoreFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of STORE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

// GET /stores — list merchant's stores
router.get('/', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).select('-adminNotes -adminApprovedBy').lean();
    res.json({ success: true, data: stores });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// Helper: merchant ownership filter that handles both `merchantId` (canonical)
// and legacy `merchant` field (for backward compat with pre-fix documents).
const ownershipFilter = (merchantId: string) => ({
  $or: [{ merchantId: merchantId }, { merchant: merchantId }],
});

// GET /stores/active
/**
 * @route GET /stores/active
 * @summary List active stores
 * @tags Stores
 * @security BearerAuth
 * @description Returns only active stores for the merchant.
 * @response {object} 200 - Active stores list
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({
      ...ownershipFilter(req.merchantId!),
      isActive: true,
    }).select('-adminNotes -adminApprovedBy').lean();
    res.json({ success: true, data: stores });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /stores/:id
/**
 * @route GET /stores/{id}
 * @summary Get store
 * @tags Stores
 * @security BearerAuth
 * @description Returns a specific store by ID.
 * @response {object} 200 - Store found
 * @response {object} 404 - Store not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOne({
      _id: req.params.id,
      ...ownershipFilter(req.merchantId!),
    }).select('-adminNotes -adminApprovedBy').lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /stores — create store
/**
 * @route POST /stores
 * @summary Create store
 * @tags Stores
 * @security BearerAuth
 * @description Creates a new store for the merchant.
 * @response {object} 201 - Store created
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const store = new Store({ ...pickStoreFields(req.body), merchantId: req.merchantId });
    await store.save();
    res.status(201).json({ success: true, data: store });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(400).json({ success: false, message: msg });
  }
});

// PUT /stores/:id — full update
/**
 * @route PUT /stores/{id}
 * @summary Update store (full)
 * @tags Stores
 * @security BearerAuth
 * @description Full update of store information.
 * @response {object} 200 - Store updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickStoreFields(req.body);
    allowedFields.updatedAt = new Date();
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, ...ownershipFilter(req.merchantId!) },
      { $set: allowedFields },
      { new: true },
    );
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(400).json({ success: false, message: msg });
  }
});

// PATCH /stores/:id — partial update
/**
 * @route PATCH /stores/{id}
 * @summary Update store (partial)
 * @tags Stores
 * @security BearerAuth
 * @description Partial update of store information.
 * @response {object} 200 - Store updated
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickStoreFields(req.body);
    allowedFields.updatedAt = new Date();
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, ...ownershipFilter(req.merchantId!) },
      { $set: allowedFields },
      { new: true },
    );
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(400).json({ success: false, message: msg });
  }
});

// DELETE /stores/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, ...ownershipFilter(req.merchantId!) },
      { $set: { isActive: false, isListed: false } },
      { new: true },
    );
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, message: 'Store deactivated' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /stores/:id/activate
/**
 * @route POST /stores/{id}/activate
 * @summary Activate store
 * @tags Stores
 * @security BearerAuth
 * @description Activates a previously deactivated store.
 * @response {object} 200 - Store activated
 */
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, ...ownershipFilter(req.merchantId!) },
      { $set: { isActive: true, isListed: true } },
      { new: true },
    );
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /stores/:id/deactivate
/**
 * @route POST /stores/{id}/deactivate
 * @summary Deactivate store
 * @tags Stores
 * @security BearerAuth
 * @description Deactivates a store.
 * @response {object} 200 - Store deactivated
 */
router.post('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, ...ownershipFilter(req.merchantId!) },
      { $set: { isActive: false } },
      { new: true },
    );
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
