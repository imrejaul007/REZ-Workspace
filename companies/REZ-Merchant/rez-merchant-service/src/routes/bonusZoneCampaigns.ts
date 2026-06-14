
import { Router, Request, Response } from 'express';
import { Offer } from '../models/Offer';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// GET /merchant/bonus-zone/campaigns
// NOTE: Offer model uses strictQuery: true with a minimal schema (owned by rez-backend).
// .lean() bypasses strictQuery to read full rez-backend document shape.
// Filtering by createdBy (merchantId) to maintain data isolation.
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.merchantId) filter.createdBy = req.merchantId;
    if (req.query.storeId) filter['store.id'] = req.query.storeId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      Offer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Offer.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: {
        campaigns: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /merchant/bonus-zone/campaigns/:slug
router.get('/campaigns/:slug', async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = { slug: req.params.slug };
    if (req.merchantId) filter.createdBy = req.merchantId;
    const item = await Offer.findOne(filter).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
