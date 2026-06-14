
/**
 * Merchant trial offer routes.
 *
 * GET    /trials               — list merchant's trial offers
 * POST   /trials               — create a new trial offer
 * PATCH  /trials/:id           — update trial status (active/paused)
 * GET    /trials/analytics     — merchant aggregate trial analytics
 * GET    /trials/:id/analytics — per-trial analytics
 *
 * Mirrors the monolith's src/routes/trialMerchantRoutes.ts.
 * scan QR is omitted here — it requires the trialQR JWT middleware that
 * lives in the monolith. The scan endpoint continues to be served by the
 * monolith backend until the JWT middleware is ported.
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { TrialOffer } from '../models/TrialOffer';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const TRIAL_ALLOWED_FIELDS = [
  'title', 'category', 'originalPrice', 'coinPrice', 'commitmentFee',
  'slotConfig', 'rewardConfig', 'upsellLinks', 'images', 'terms',
  'status',
];

function pickTrialFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of TRIAL_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  // Map flat fields from monolith create schema to nested model shape
  if (body.trialCoinPrice !== undefined) filtered.coinPrice = body.trialCoinPrice;
  if (body.dailySlots !== undefined || body.qrWindowMinutes !== undefined || body.qrWindowType !== undefined) {
    filtered.slotConfig = {
      dailySlots: body.dailySlots ?? 10,
      qrWindowMinutes: body.qrWindowMinutes ?? 60,
      windowType: body.qrWindowType ?? 'relative',
    };
  }
  if (body.rewardCoins !== undefined || body.brandedCoins !== undefined) {
    filtered.rewardConfig = {
      rezCoins: body.rewardCoins ?? 0,
      brandedCoins: body.brandedCoins ?? 0,
      brandedCoinLabel: body.brandedCoinLabel ?? '',
    };
  }
  return filtered;
}

/**
 * GET /trials
 * Fetch merchant's own trial offers with optional status filter.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      TrialOffer.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TrialOffer.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * GET /trials/analytics
 * Aggregate analytics across all trials for this merchant.
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.merchantId as string);
    const agg = await TrialOffer.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: null,
          totalTrials: { $sum: 1 },
          activeTrials: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalBookings: { $sum: '$totalBookings' },
          totalCompletions: { $sum: '$totalCompletions' },
          avgRating: { $avg: '$avgRating' },
        },
      },
    ]);
    const stats = agg[0] || { totalTrials: 0, activeTrials: 0, totalBookings: 0, totalCompletions: 0, avgRating: 0 };
    delete stats._id;
    res.json({ success: true, data: stats });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * GET /trials/:id/analytics
 * Per-trial analytics for a specific trial offer.
 */
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid trial id' });
      return;
    }
    const trial = await TrialOffer.findOne({ _id: req.params.id, merchantId: req.merchantId })
      .select('title status totalBookings totalCompletions avgRating createdAt')
      .lean();
    if (!trial) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: trial });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * POST /trials
 * Create a new trial offer (status starts as pending_approval).
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const fields = pickTrialFields(req.body);
    // freshnessBoostedUntil is required by the monolith schema — default to now + 7 days
    if (!fields.freshnessBoostedUntil) {
      fields.freshnessBoostedUntil = new Date(Date.now() + 7 * 86400000);
    }
    const item = await TrialOffer.create({ ...fields, merchantId: req.merchantId, status: 'pending_approval' });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

/**
 * PATCH /trials/:id
 * Update trial status (pause / resume).
 * Body: { status: 'paused' | 'active' }
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid trial id' });
      return;
    }
    const { status } = req.body;
    if (!['paused', 'active'].includes(status)) {
      res.status(400).json({ success: false, message: 'status must be paused or active' });
      return;
    }
    const item = await TrialOffer.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { status, updatedAt: new Date() } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
