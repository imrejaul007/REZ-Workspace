
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';

const GoalSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, index: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['revenue', 'orders', 'customers', 'aov'], required: true },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, default: 'amount' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'achieved', 'missed', 'cancelled'], default: 'active' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const Goal = mongoose.models.Goal ?? mongoose.model('Goal', GoalSchema);

const router = Router();
router.use(merchantAuth);

// GET /goals
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      Goal.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Goal.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /goals
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, type, targetValue, unit, startDate, endDate, storeId, metadata } = req.body;
    if (!title || !type || targetValue === undefined || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Missing required fields' }); return;
    }
    const item = await Goal.create({ merchantId: req.merchantId, title, type, targetValue, unit: unit ?? 'amount', startDate, endDate, storeId, metadata: metadata ?? {}, currentValue: 0 });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// PUT /goals/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['title', 'type', 'targetValue', 'currentValue', 'unit', 'startDate', 'endDate', 'status', 'metadata'];
    const update: Record<string, unknown> = {};
    for (const f of allowed) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }
    const item = await Goal.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// DELETE /goals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Goal.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
