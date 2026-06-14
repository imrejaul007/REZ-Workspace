import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AutomationRule } from '../models/AutomationRule';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// Field allowlist for mass assignment protection
const ALLOWED_FIELDS = [
  'name', 'status', 'trigger', 'action', 'storeId'
];

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

// GET /automation-rules - List all rules
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [rules, total] = await Promise.all([
      AutomationRule.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AutomationRule.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        rules,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /automation-rules/:id - Get single rule
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    }).lean();

    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }

    res.json({ success: true, data: rule });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /automation-rules - Create new rule
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = pickFields(req.body);

    if (!data.name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    const rule = await AutomationRule.create({
      ...data,
      merchantId: req.merchantId,
    });

    res.status(201).json({ success: true, data: rule });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /automation-rules/:id - Update rule
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const data = pickFields(req.body);

    const rule = await AutomationRule.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: data },
      { new: true }
    );

    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }

    res.json({ success: true, data: rule });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PATCH /automation-rules/:id/toggle - Toggle rule status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }

    rule.status = rule.status === 'active' ? 'paused' : 'active';
    await rule.save();

    res.json({ success: true, data: { status: rule.status } });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /automation-rules/:id - Delete rule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const rule = await AutomationRule.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }

    res.json({ success: true, message: 'Rule deleted' });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
