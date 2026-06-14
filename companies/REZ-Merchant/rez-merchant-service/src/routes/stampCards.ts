
import { Router, Request, Response } from 'express';
import { StampCard } from '../models/StampCard';
import { merchantAuth } from '../middleware/auth';

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
      StampCard.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StampCard.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await StampCard.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const STAMP_CARD_ALLOWED = ['name', 'description', 'requiredStamps', 'reward', 'isActive', 'expiresAt', 'storeId', 'termsAndConditions', 'images'];
    const safe: Record<string, unknown> = {};
    for (const f of STAMP_CARD_ALLOWED) { if ((req.body as unknown)[f] !== undefined) safe[f] = (req.body as unknown)[f]; }
    const item = await StampCard.create({ ...safe, merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    // MS-10: Field whitelist prevents overwriting internal counters (totalStamps, redemptionCount)
    const STAMP_CARD_ALLOWED = ['name', 'description', 'requiredStamps', 'reward', 'isActive', 'expiresAt', 'storeId', 'termsAndConditions', 'images'];
    const update: Record<string, unknown> = {};
    for (const f of STAMP_CARD_ALLOWED) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }
    const item = await StampCard.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await StampCard.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
