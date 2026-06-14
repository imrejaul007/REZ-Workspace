import { Router, Request, Response } from 'express';
import { Offer } from '../models/Offer';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import { validateOffer } from '../utils/offerValidator';
import { OfferOptimizer } from '../services/offerOptimizer';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// ── RC-1 FIX: Backend HTTP client ────────────────────────────────────────────
// All writes to the offers collection go through rez-backend.
// The merchant service is READ-ONLY on the offers collection.
// Backward-compatible env var names are all honoured.
function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    process.env.REZ_BACKEND_URL ||
    process.env.REZ_CONTRACTS_URL ||
    (() => { throw new Error('Backend URL is not configured') })()
  );
}

// HIGH FIX: All external HTTP calls must have a timeout to prevent resource exhaustion.
// Without timeouts, a slow or unresponsive backend causes request threads to hang indefinitely.
const BACKEND_TIMEOUT_MS = 10000; // 10 second timeout

async function backendPost<T>(path: string, body: unknown, authHeader: string | undefined): Promise<T> {
  const base = getBackendUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const json = await res.json() as { success: boolean; data?: T; message?: string; error?: string };
    if (!res.ok) {
      throw new Error((json as unknown)?.error || (json as unknown)?.message || `Backend POST ${path} failed: ${res.status}`);
    }
    return json.data as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Backend POST ${path} timed out after ${BACKEND_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

async function backendPut<T>(path: string, body: unknown, authHeader: string | undefined): Promise<T> {
  const base = getBackendUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const json = await res.json() as { success: boolean; data?: T; message?: string; error?: string };
    if (!res.ok) {
      throw new Error((json as unknown)?.error || (json as unknown)?.message || `Backend PUT ${path} failed: ${res.status}`);
    }
    return json.data as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Backend PUT ${path} timed out after ${BACKEND_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

async function backendDelete(path: string, authHeader: string | undefined): Promise<void> {
  const base = getBackendUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const json = await res.json() as { success: boolean; message?: string; error?: string };
      throw new Error((json as unknown)?.error || (json as unknown)?.message || `Backend DELETE ${path} failed: ${res.status}`);
    }
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Backend DELETE ${path} timed out after ${BACKEND_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

// GET /offers — list offers for merchant's stores
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const stores = await Store.find({ merchantId: merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) {
      res.json({ success: true, data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
      return;
    }

    const query: unknown = { 'store.id': { $in: storeIds } };
    if (req.query.store) {
      if (!mongoose.Types.ObjectId.isValid(req.query.store as string)) {
        res.status(400).json({ success: false, message: 'Invalid store id' }); return;
      }
      query['store.id'] = new mongoose.Types.ObjectId(req.query.store as string);
    }
    if (req.query.type) query.type = req.query.type;
    if (req.query.active !== undefined) query['validity.isActive'] = req.query.active === 'true';

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [offers, total] = await Promise.all([
      Offer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-adminNotes -approvedBy -rejectedBy').lean(),
      Offer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: offers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /offers — create offer
// RC-1 FIX: writes go through rez-backend HTTP API, not direct Offer model.
router.post('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const data = req.body;

    const store = await Store.findOne({ _id: data.storeId, merchantId: merchantId });
    if (!store) { res.status(403).json({ success: false, message: 'Store not found or access denied' }); return; }

    // B03-B06 fix: field names now match backend canonical model directly
    // (type, cashbackPercentage, restrictions.minOrderValue, restrictions.usageLimit,
    //  restrictions.usageLimitPerUser) — no handler-level mapping needed.
    const { isValid, errors } = validateOffer(data);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Offer validation failed', errors });
      return;
    }

    const authHeader = req.headers.authorization;
    const offerPayload = {
      ...data,
      location: { type: 'Point', coordinates: store.location?.coordinates || [0, 0] },
      store: { id: store._id, name: store.name, logo: store.logo, rating: store.ratings?.average || 0, verified: store.isVerified || false },
      validity: { startDate: new Date(data.validity.startDate), endDate: new Date(data.validity.endDate), isActive: data.validity.isActive ?? true },
      engagement: { likesCount: 0, sharesCount: 0, viewsCount: 0 },
      createdBy: new mongoose.Types.ObjectId(merchantId),
    };

    const createdOffer = await backendPost<unknown>('/offers', offerPayload, authHeader);
    res.status(201).json({ success: true, message: 'Offer created successfully', data: createdOffer });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /offers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: new mongoose.Types.ObjectId(req.merchantId) }).select('_id').lean();
    const storeIds = stores.map((s) => s._id.toString());
    const offer = await Offer.findOne({
      _id: req.params.id,
      storeIds: { $in: storeIds },
    }).select('-adminNotes -approvedBy -rejectedBy').lean();
    if (!offer) { res.status(404).json({ success: false, message: 'Offer not found' }); return; }
    res.json({ success: true, data: offer });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /offers/:id
// RC-1 FIX: writes go through rez-backend HTTP API, not direct Offer model.
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    // Verify the offer belongs to one of this merchant's stores
    const stores = await Store.find({ merchantId: merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id.toString());
    const offer = await Offer.findById(req.params.id).lean();
    if (!offer) { res.status(404).json({ success: false, message: 'Offer not found' }); return; }
    const offerStoreId = (offer as unknown)?.store?.id?.toString() || (offer as unknown)?.store?.toString();
    if (!offerStoreId || !storeIds.includes(offerStoreId)) {
      res.status(403).json({ success: false, message: 'Access denied: offer does not belong to your store' });
      return;
    }
    const OFFER_ALLOWED_FIELDS = [
      'title', 'description', 'type',
      'minOrderValue', 'maxDiscountAmount', 'couponCode', 'termsAndConditions',
      'categories', 'products', 'images', 'validity', 'tags', 'isExclusive',
    ];
    const safeUpdate: Record<string, unknown> = {};
    for (const f of OFFER_ALLOWED_FIELDS) { if ((req.body as unknown)[f] !== undefined) safeUpdate[f] = (req.body as unknown)[f]; }

    const mergedForValidation = { ...(offer as unknown), ...safeUpdate };
    const { isValid: isUpdateValid, errors: updateErrors } = validateOffer(mergedForValidation);
    if (!isUpdateValid) {
      res.status(400).json({ success: false, message: 'Offer validation failed', errors: updateErrors });
      return;
    }

    const authHeader = req.headers.authorization;
    const updated = await backendPut<unknown>(`/offers/${req.params.id}`, safeUpdate, authHeader);
    res.json({ success: true, message: 'Offer updated successfully', data: updated });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /offers/:id
// RC-1 FIX: writes go through rez-backend HTTP API, not direct Offer model.
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    // Verify the offer belongs to one of this merchant's stores
    const stores = await Store.find({ merchantId: merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id.toString());
    const offer = await Offer.findById(req.params.id).lean();
    if (!offer) { res.status(404).json({ success: false, message: 'Offer not found' }); return; }
    const offerStoreId = (offer as unknown)?.store?.id?.toString() || (offer as unknown)?.store?.toString();
    if (!offerStoreId || !storeIds.includes(offerStoreId)) {
      res.status(403).json({ success: false, message: 'Access denied: offer does not belong to your store' });
      return;
    }
    const authHeader = req.headers.authorization;
    await backendDelete(`/offers/${req.params.id}`, authHeader);
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /offers/calculate — Auto-apply best offer for a cart
// ReZ Loyalty feature: finds the best available offer for the given cart total
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { userId, cartTotal, storeId } = req.body;

    // Validate required fields
    if (typeof cartTotal !== 'number' || cartTotal <= 0) {
      res.status(400).json({
        success: false,
        message: 'cartTotal is required and must be a positive number'
      });
      return;
    }

    // If storeId is provided, verify it belongs to the merchant
    let targetMerchantId = merchantId;
    if (storeId) {
      const store = await Store.findOne({
        _id: storeId,
        merchantId: new mongoose.Types.ObjectId(merchantId)
      }).lean();

      if (!store) {
        res.status(403).json({
          success: false,
          message: 'Store not found or access denied'
        });
        return;
      }
      targetMerchantId = store.merchantId.toString();
    } else {
      // Use the merchant's first store
      const firstStore = await Store.findOne({
        merchantId: new mongoose.Types.ObjectId(merchantId)
      }).lean();

      if (!firstStore) {
        res.status(400).json({
          success: false,
          message: 'No stores found for merchant'
        });
        return;
      }
    }

    // Find the best offer
    const optimization = await OfferOptimizer.findBestOffer(
      userId || null,
      cartTotal,
      targetMerchantId
    );

    res.json({
      success: true,
      data: optimization
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /offers/eligible — Get all eligible offers for a cart (not just the best one)
router.get('/eligible', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { userId, cartTotal, storeId } = req.query;

    // Validate required fields
    const cartTotalNum = parseFloat(cartTotal as string);
    if (isNaN(cartTotalNum) || cartTotalNum <= 0) {
      res.status(400).json({
        success: false,
        message: 'cartTotal query parameter is required and must be a positive number'
      });
      return;
    }

    // If storeId is provided, verify it belongs to the merchant
    let targetMerchantId = merchantId;
    if (storeId) {
      const store = await Store.findOne({
        _id: storeId,
        merchantId: new mongoose.Types.ObjectId(merchantId)
      }).lean();

      if (!store) {
        res.status(403).json({
          success: false,
          message: 'Store not found or access denied'
        });
        return;
      }
      targetMerchantId = store.merchantId.toString();
    } else {
      // Use the merchant's first store
      const firstStore = await Store.findOne({
        merchantId: new mongoose.Types.ObjectId(merchantId)
      }).lean();

      if (!firstStore) {
        res.status(400).json({
          success: false,
          message: 'No stores found for merchant'
        });
        return;
      }
    }

    // Get all eligible offers sorted by savings
    const eligibleOffers = await OfferOptimizer.getEligibleOffers(
      (userId as string) || null,
      cartTotalNum,
      targetMerchantId
    );

    res.json({
      success: true,
      data: {
        offers: eligibleOffers,
        count: eligibleOffers.length
      }
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
