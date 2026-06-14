import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// SECURITY: the Store model uses `strict: false`, so spreading raw req.body
// into create/update was a mass-assignment hole — callers could set
// `isVerified: true`, `merchant: <other-id>`, `adminApproved: true`, etc.
// Every mutation below must whitelist fields.

const STORE_CREATE_ALLOWED_FIELDS = [
  'name', 'description', 'category', 'subCategory', 'tags',
  'location', 'address', 'phone', 'email', 'logo', 'banner', 'images',
  'gstNumber', 'panNumber', 'fssaiNumber', 'businessHours', 'operatingHours',
  'serviceCapabilities', 'deliveryRadius', 'minOrder', 'estimatedTime',
  'bankDetails', 'upiId', 'metadata',
];

const STORE_UPDATE_ALLOWED_FIELDS = [
  ...STORE_CREATE_ALLOWED_FIELDS,
  'isActive', 'isFeatured', 'isPaused',
];

function pickFields(body: Record<string, unknown>, allowed: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of allowed) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: stores });
  } catch (e) {
    logger.error('[outlets] Failed to list outlets', { error: e?.message });
    res.status(500).json({ success: false, message: 'Failed to list outlets' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const store = await Store.create({
      ...pickFields(req.body, STORE_CREATE_ALLOWED_FIELDS),
      merchantId: req.merchantId,
    });
    res.status(201).json({ success: true, data: store });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Failed to create outlet' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: pickFields(req.body, STORE_UPDATE_ALLOWED_FIELDS) },
      { new: true },
    );
    if (!store) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, data: store });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || 'Failed to update outlet' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { isActive: false, deletedAt: new Date() } },
      { new: true },
    );
    if (!store) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, message: 'Outlet deactivated' });
  } catch (e) {
    logger.error('[outlets] Failed to deactivate outlet', { error: e?.message });
    res.status(500).json({ success: false, message: 'Failed to deactivate outlet' });
  }
});

export default router;
