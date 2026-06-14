
/**
 * Loyalty configuration routes.
 *
 * GET  /loyalty-config  — fetch current config for a store (or defaults)
 * POST /loyalty-config  — create or update config for a store
 *
 * Mirrors the monolith's merchantroutes/loyaltyConfig.ts.
 */
import { Router, Request, Response } from 'express';
import { MerchantLoyaltyConfig } from '../models/MerchantLoyaltyConfig';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

const VALID_BONUS_CATEGORIES = ['hair', 'nails', 'spa', 'skin', 'makeup', 'massage', 'beard'] as const;

/**
 * GET /loyalty-config?storeId=<id>
 * Returns saved config or default values when not yet configured.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = (req.query.storeId as string) || req.merchantId;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }

    // SEC-005 FIX: Verify store belongs to this merchant
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
    }).lean();
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const config = await MerchantLoyaltyConfig.findOne({ storeId }).lean();

    if (!config) {
      res.json({
        success: true,
        data: {
          storeId,
          pointsPerRupee: 0.1,
          expiryDays: 365,
          bonusCategories: [],
          isActive: true,
          isDefault: true,
        },
      });
      return;
    }

    res.json({ success: true, data: config });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /loyalty-config
 * Creates or updates the loyalty config for the store.
 * Body: { storeId, pointsPerRupee, expiryDays, bonusCategories[], isActive }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { storeId, pointsPerRupee, expiryDays, bonusCategories, isActive } = req.body;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }

    // SEC-005 FIX: Verify store belongs to this merchant
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      merchantId: new mongoose.Types.ObjectId(merchantId as string),
    }).lean();
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const ppr = parseFloat(pointsPerRupee);
    const exp = parseInt(expiryDays, 10);

    if (isNaN(ppr) || ppr < 0) {
      res.status(400).json({ success: false, message: 'pointsPerRupee must be a non-negative number' });
      return;
    }

    if (isNaN(exp) || exp < 1) {
      res.status(400).json({ success: false, message: 'expiryDays must be at least 1' });
      return;
    }

    const cats: string[] = Array.isArray(bonusCategories)
      ? bonusCategories.filter((c: string) => (VALID_BONUS_CATEGORIES as readonly string[]).includes(c))
      : [];

    const config = await MerchantLoyaltyConfig.findOneAndUpdate(
      { storeId },
      {
        $set: {
          merchantId,
          pointsPerRupee: ppr,
          expiryDays: exp,
          bonusCategories: cats,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({ success: true, data: config, message: 'Loyalty config saved' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
