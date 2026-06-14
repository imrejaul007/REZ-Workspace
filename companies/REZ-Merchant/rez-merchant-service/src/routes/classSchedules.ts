import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ClassSchedule } from '../models/ClassSchedule';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// Field allowlist for mass assignment protection
const ALLOWED_FIELDS = [
  'name', 'description', 'instructorName', 'duration', 'capacity', 'price',
  'startTime', 'endTime', 'recurring', 'recurringDays', 'color', 'active', 'storeId'
];

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

// GET /class-schedules - List all schedules
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const [schedules, total] = await Promise.all([
      ClassSchedule.find(query).sort({ startTime: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      ClassSchedule.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        schedules,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /class-schedules/:id - Get single schedule
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const schedule = await ClassSchedule.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    }).lean();

    if (!schedule) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }

    res.json({ success: true, data: schedule });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /class-schedules - Create new schedule
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = pickFields(req.body);

    if (!data.name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    if (!data.storeId) {
      res.status(400).json({ success: false, message: 'Store ID is required' });
      return;
    }

    if (!data.startTime || !data.endTime) {
      res.status(400).json({ success: false, message: 'Start and end time are required' });
      return;
    }

    // Verify store belongs to merchant
    const store = await Store.findOne(
      { _id: data.storeId, merchantId: req.merchantId },
      '_id'
    ).lean();

    if (!store) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const schedule = await ClassSchedule.create({
      ...data,
      merchantId: req.merchantId,
    });

    res.status(201).json({ success: true, data: schedule });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /class-schedules/:id - Update schedule
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const data = pickFields(req.body);

    const schedule = await ClassSchedule.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: data },
      { new: true }
    );

    if (!schedule) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }

    res.json({ success: true, data: schedule });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /class-schedules/:id - Delete schedule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const schedule = await ClassSchedule.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!schedule) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }

    res.json({ success: true, message: 'Schedule deleted' });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
