
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { LoyaltyTier } from '../models/LoyaltyTier';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

// Backend service URL for loyalty member counts
const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || process.env.REZ_BACKEND_URL || 'https://api.rezapp.com';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      LoyaltyTier.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      LoyaltyTier.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await LoyaltyTier.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const LOYALTY_TIER_ALLOWED = ['name', 'description', 'minPoints', 'maxPoints', 'benefits', 'discountPercent', 'isActive', 'storeId', 'color', 'icon', 'multiplier', 'metadata'];
    const safe: Record<string, unknown> = {};
    for (const f of LOYALTY_TIER_ALLOWED) { if ((req.body as unknown)[f] !== undefined) safe[f] = (req.body as unknown)[f]; }
    const item = await LoyaltyTier.create({ ...safe, merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const LOYALTY_TIER_ALLOWED = ['name', 'description', 'minPoints', 'maxPoints', 'benefits', 'discountPercent', 'isActive', 'storeId', 'color', 'icon', 'multiplier', 'metadata'];
    const update: Record<string, unknown> = {};
    for (const f of LOYALTY_TIER_ALLOWED) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }
    const item = await LoyaltyTier.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await LoyaltyTier.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /loyalty-tiers/members
// Returns tiers with member counts fetched from rez-backend User model
router.get('/members', async (req: Request, res: Response) => {
  try {
    const { storeId, tierId } = req.query;
    const query: unknown = { merchantId: req.merchantId };
    if (storeId) query.storeId = storeId;
    const tiers = tierId
      ? await LoyaltyTier.find({ _id: tierId, merchantId: req.merchantId }).lean()
      : await LoyaltyTier.find(query).lean();

    // Fetch actual member counts from rez-backend
    let memberCountMap = new Map<string, number>();
    try {
      const memberCounts = await axios.get(`${BACKEND_URL}/api/loyalty/members/count-by-tier`, {
        params: { merchantId: req.merchantId, storeId },
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      });
      if (memberCounts.data?.counts) {
        memberCounts.data.counts.forEach((item: { tierId: string; count: number }) => {
          memberCountMap.set(item.tierId, item.count);
        });
      }
      logger.info('Fetched member counts from rez-backend', { merchantId: req.merchantId, storeId, count: memberCountMap.size });
    } catch (fetchError) {
      // Log error but don't fail the request - return 0 counts as fallback
      logger.warn('Failed to fetch member counts from rez-backend, using 0', {
        merchantId: req.merchantId,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
    }

    res.json({
      success: true,
      data: tiers.map((t) => ({
        ...t,
        memberCount: memberCountMap.get(t._id.toString()) || 0
      })),
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
