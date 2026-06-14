
import { Router, Request, Response } from 'express';
import { PunchCard } from '../models/PunchCard';
import { StoreVisit } from '../models/StoreVisit';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// GET / — list merchant's punch card rules
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId, isActive: { $ne: false } };
    if (req.query.storeId) query.storeId = req.query.storeId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      PunchCard.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PunchCard.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST / — create punch card rule
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, requiredVisits, rewardDescription, storeId } = req.body;
    if (!name || !requiredVisits || !rewardDescription) {
      res.status(400).json({ success: false, message: 'name, requiredVisits, and rewardDescription are required' });
      return;
    }
    const item = await PunchCard.create({
      merchantId: req.merchantId,
      storeId: storeId || null,
      name,
      requiredVisits: parseInt(requiredVisits, 10),
      rewardDescription,
      isActive: true,
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// PATCH /:id — update (toggle isActive, change reward, etc.)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    // MS-09: Field whitelist prevents overwriting internal fields (e.g. totalRedemptions)
    const { name, requiredVisits, rewardDescription, isActive, storeId } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (requiredVisits !== undefined) update.requiredVisits = parseInt(requiredVisits, 10);
    if (rewardDescription !== undefined) update.rewardDescription = rewardDescription;
    if (isActive !== undefined) update.isActive = !!isActive;
    if (storeId !== undefined) update.storeId = storeId;
    const item = await PunchCard.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: update },
      { new: true }
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// DELETE /:id — soft delete (set isActive: false)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await PunchCard.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deactivated' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /:id/progress — consumer visit progress toward punch card reward
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const card = await PunchCard.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!card) { res.status(404).json({ success: false, message: 'Punch card not found' }); return; }

    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ success: false, message: 'userId query param is required' });
      return;
    }

    const matchQuery: Record<string, unknown> = { userId };
    if ((card as unknown).storeId) matchQuery.storeId = (card as unknown).storeId;

    const visitsCompleted = await StoreVisit.countDocuments(matchQuery);
    const requiredVisits: number = (card as unknown).requiredVisits ?? 1;
    const rewardEarned = visitsCompleted >= requiredVisits;

    res.json({
      success: true,
      data: {
        userId,
        punchCardId: req.params.id,
        visitsCompleted,
        requiredVisits,
        rewardEarned,
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
