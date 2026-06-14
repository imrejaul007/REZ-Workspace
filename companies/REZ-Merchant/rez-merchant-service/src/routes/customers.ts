
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CustomerMeta } from '../models/CustomerMeta';
import { StorePayment } from '../models/StorePayment';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import { captureIntent } from '../utils/intentCapture';

const router = Router();
router.use(merchantAuth);

// userId is a string ID from the User service — validate format to prevent malformed IDs.
const VALID_USER_ID = /^[a-zA-Z0-9_-]{1,128}$/;

function validateUserId(userId: string, res: Response): boolean {
  if (!userId || typeof userId !== 'string' || !VALID_USER_ID.test(userId)) {
    res.status(400).json({ success: false, message: 'Invalid userId format' });
    return false;
  }
  return true;
}

// GET /:userId — customer detail: visits, spend, notes, tags
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;

    const mid = new mongoose.Types.ObjectId(req.merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s: { _id: mongoose.Types.ObjectId }) => s._id);

    const [paymentStats, meta] = await Promise.all([
      StorePayment.aggregate([
        { $match: { storeId: { $in: storeIds }, userId } },
        {
          $group: {
            _id: null,
            visitCount: { $sum: 1 },
            totalSpent: { $sum: { $ifNull: ['$amount', 0] } },
            lastVisit: { $max: '$createdAt' },
          },
        },
      ]),
      CustomerMeta.findOne({ merchantId: mid, userId }).lean(),
    ]);

    const stats = paymentStats[0] || { visitCount: 0, totalSpent: 0, lastVisit: null };

    res.json({
      success: true,
      data: {
        userId,
        visitCount: stats.visitCount,
        totalSpent: stats.totalSpent,
        lastVisit: stats.lastVisit,
        notes: (meta as unknown)?.notes || '',
        internalTags: (meta as unknown)?.internalTags || [],
      },
    });

    // Capture customer insight for REZ Mind
    captureIntent({
      userId,
      appType: 'merchant',
      eventType: 'customer_viewed',
      intentKey: `merchant_viewed_customer_${userId}`,
      category: 'CUSTOMER_ANALYTICS',
      metadata: { merchantId: req.merchantId, visitCount: stats.visitCount, totalSpent: stats.totalSpent },
    }).catch(() => {});
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PATCH /:userId — update notes and/or internalTags
router.patch('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;
    const mid = new mongoose.Types.ObjectId(req.merchantId);
    const { notes, internalTags } = req.body;

    const update: unknown = {};
    if (notes !== undefined) update.notes = String(notes).slice(0, 1000);

    // MERCH-AUDIT-3 FIX: Validate internalTags — must be an array of strings with max 20 elements
    if (internalTags !== undefined) {
      if (!Array.isArray(internalTags)) {
        res.status(400).json({ success: false, message: 'internalTags must be an array' });
        return;
      }
      if (!internalTags.every((t) => typeof t === 'string')) {
        res.status(400).json({ success: false, message: 'all internalTags elements must be strings' });
        return;
      }
      if (internalTags.length > 20) {
        res.status(400).json({ success: false, message: 'internalTags cannot have more than 20 elements' });
        return;
      }
      update.internalTags = internalTags;
    }

    const meta = await CustomerMeta.findOneAndUpdate(
      { merchantId: mid, userId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    res.json({ success: true, data: meta });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /:userId/health-profile — return full health profile
router.get('/:userId/health-profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;
    const mid = new mongoose.Types.ObjectId(req.merchantId);

    const meta = await CustomerMeta.findOne({ merchantId: mid, userId })
      .select('healthProfile')
      .lean();

    res.json({ success: true, data: (meta as unknown)?.healthProfile || {} });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /:userId/health-profile — upsert all health profile fields
router.put('/:userId/health-profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;
    const mid = new mongoose.Types.ObjectId(req.merchantId);
    const {
      allergies,
      medicalConditions,
      medicalNotes,
      dietaryPreferences,
      preferredProducts,
      skinHairType,
      freeTextNotes,
    } = req.body;

    const hp: unknown = {};
    if (allergies !== undefined)         hp['healthProfile.allergies']         = String(allergies).slice(0, 500);
    if (medicalConditions !== undefined) hp['healthProfile.medicalConditions'] = String(medicalConditions).slice(0, 500);
    if (medicalNotes !== undefined)      hp['healthProfile.medicalNotes']      = String(medicalNotes).slice(0, 500);
    if (dietaryPreferences !== undefined)hp['healthProfile.dietaryPreferences']= String(dietaryPreferences).slice(0, 500);
    if (preferredProducts !== undefined) hp['healthProfile.preferredProducts'] = String(preferredProducts).slice(0, 500);
    if (skinHairType !== undefined)      hp['healthProfile.skinHairType']      = String(skinHairType).slice(0, 100);
    if (freeTextNotes !== undefined)     hp['healthProfile.freeTextNotes']     = String(freeTextNotes).slice(0, 1000);

    const meta = await CustomerMeta.findOneAndUpdate(
      { merchantId: mid, userId },
      { $set: hp },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    res.json({ success: true, data: (meta as unknown)?.healthProfile || {} });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /:userId/tags — add a tag (max 20, no duplicates)
router.post('/:userId/tags', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!validateUserId(userId, res)) return;
    const mid = new mongoose.Types.ObjectId(req.merchantId);
    const { tag } = req.body;

    if (!tag || typeof tag !== 'string') {
      res.status(400).json({ success: false, message: 'tag is required' });
      return;
    }

    const existing = await CustomerMeta.findOne({ merchantId: mid, userId }).lean();
    const currentTags: string[] = (existing as unknown)?.internalTags || [];

    if (currentTags.length >= 20) {
      res.status(400).json({ success: false, message: 'Maximum 20 tags allowed' });
      return;
    }

    const meta = await CustomerMeta.findOneAndUpdate(
      { merchantId: mid, userId },
      { $addToSet: { internalTags: tag.trim() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    res.json({ success: true, data: meta });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /:userId/tags/:tag — remove a tag
router.delete('/:userId/tags/:tag', async (req: Request, res: Response) => {
  try {
    const { userId, tag } = req.params;
    if (!validateUserId(userId, res)) return;
    const mid = new mongoose.Types.ObjectId(req.merchantId);

    const meta = await CustomerMeta.findOneAndUpdate(
      { merchantId: mid, userId },
      { $pull: { internalTags: tag } },
      { new: true },
    ).lean();

    res.json({ success: true, data: meta });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
