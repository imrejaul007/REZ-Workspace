/**
 * REZ Now configuration routes.
 *
 * GET  /rez-now-config  — return the REZ Now page fields for the merchant's active store
 * PATCH /rez-now-config — partially update those fields
 *
 * Both endpoints resolve the store via req.merchantId (set by merchantAuth).
 * The first active store owned by that merchant is used; merchants with
 * multiple stores should pass ?storeId=<id> as a query param.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const REZ_NOW_FIELDS = [
  'slug',
  'storeType',
  'fssaiNumber',
  'gstNumber',
  'googlePlaceId',
  'instagramHandle',
  'facebookUrl',
  'twitterHandle',
  'websiteUrl',
  'acceptsOnlineOrders',
  'acceptsScanPay',
  'showLoyaltyStamps',
  'deliveryEnabled',
  'deliveryRadiusKm',
  'deliveryFee',
  'storeLatitude',
  'storeLongitude',
] as const;

const FSSAI_RE = /^\d{14}$/;
const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Resolve the store document for the authenticated merchant.
 * Prefers the storeId query param; falls back to the first active store.
 */
async function resolveStore(req: Request): Promise<InstanceType<typeof Store> | null> {
  const merchantId = req.merchantId;
  if (!merchantId) return null;

  const storeIdParam = req.query.storeId as string | undefined;

  if (storeIdParam) {
    if (!mongoose.Types.ObjectId.isValid(storeIdParam)) return null;
    return Store.findOne({
      _id: new mongoose.Types.ObjectId(storeIdParam),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    });
  }

  return Store.findOne({
    merchantId: new mongoose.Types.ObjectId(merchantId),
    isActive: true,
  }).sort({ createdAt: 1 });
}

/**
 * GET /rez-now-config
 * Returns the REZ Now page config for the merchant's store.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' });
      return;
    }

    const data: Record<string, unknown> = {};
    for (const field of REZ_NOW_FIELDS) {
      data[field] = (store as unknown)[field] ?? null;
    }

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Failed to fetch REZ Now config' });
  }
});

/**
 * PATCH /rez-now-config
 * Accepts a partial update of REZ Now page fields.
 * Unknown fields are silently ignored (whitelist-only update).
 */
router.patch('/', async (req: Request, res: Response) => {
  try {
    const store = await resolveStore(req);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;

    // Validate fssaiNumber if provided
    if (body.fssaiNumber !== undefined && body.fssaiNumber !== '' && body.fssaiNumber !== null) {
      if (typeof body.fssaiNumber !== 'string' || !FSSAI_RE.test(body.fssaiNumber)) {
        res.status(400).json({ success: false, message: 'fssaiNumber must be exactly 14 digits' });
        return;
      }
    }

    // Validate gstNumber if provided
    if (body.gstNumber !== undefined && body.gstNumber !== '' && body.gstNumber !== null) {
      if (typeof body.gstNumber !== 'string' || !GST_RE.test(String(body.gstNumber).toUpperCase())) {
        res.status(400).json({ success: false, message: 'gstNumber must be a valid 15-character GST identification number' });
        return;
      }
    }

    // Validate boolean fields
    const booleanFields = ['acceptsOnlineOrders', 'acceptsScanPay', 'showLoyaltyStamps', 'deliveryEnabled'] as const;
    for (const key of booleanFields) {
      if (key in body && body[key] !== undefined && typeof body[key] !== 'boolean') {
        res.status(400).json({ success: false, message: `${key} must be a boolean` });
        return;
      }
    }

    // Validate numeric delivery fields
    const numericFields = ['deliveryRadiusKm', 'deliveryFee', 'storeLatitude', 'storeLongitude'] as const;
    for (const key of numericFields) {
      if (key in body && body[key] !== undefined && body[key] !== null) {
        if (typeof body[key] !== 'number' || isNaN(body[key] as number)) {
          res.status(400).json({ success: false, message: `${key} must be a number` });
          return;
        }
      }
    }

    if ('deliveryRadiusKm' in body && typeof body.deliveryRadiusKm === 'number' && body.deliveryRadiusKm < 0) {
      res.status(400).json({ success: false, message: 'deliveryRadiusKm must be >= 0' });
      return;
    }
    if ('deliveryFee' in body && typeof body.deliveryFee === 'number' && body.deliveryFee < 0) {
      res.status(400).json({ success: false, message: 'deliveryFee must be >= 0' });
      return;
    }

    // Apply whitelist — include all REZ Now fields (slug IS writable; the "read-only"
    // comment above was incorrect — if slug is not persisted, the frontend's
    // wizard-slug-guard creates a permanent redirect loop: slug is sent but dropped,
    // activeStore.slug stays undefined, dashboard re-redirects to wizard forever.)
    const WRITABLE_FIELDS = REZ_NOW_FIELDS;
    const updates: Record<string, unknown> = {};
    for (const field of WRITABLE_FIELDS) {
      if (field in body) {
        // Uppercase gstNumber for storage consistency
        if (field === 'gstNumber' && typeof body[field] === 'string') {
          updates[field] = (body[field] as string).toUpperCase();
        } else {
          updates[field] = body[field];
        }
      }
    }

    await Store.updateOne({ _id: store._id }, { $set: updates });

    // Return fresh config
    const updated = await Store.findById(store._id).lean();
    const data: Record<string, unknown> = {};
    for (const field of REZ_NOW_FIELDS) {
      data[field] = (updated as unknown)?.[field] ?? null;
    }

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Failed to update REZ Now config' });
  }
});

export default router;
