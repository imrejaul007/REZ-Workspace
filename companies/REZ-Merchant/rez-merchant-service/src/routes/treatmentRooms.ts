import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { TreatmentRoom } from '../models/TreatmentRoom';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// Field allowlist for mass assignment protection
const ALLOWED_FIELDS = [
  'name', 'type', 'capacity', 'description', 'active', 'color', 'storeId'
];

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

// GET /treatment-rooms - List all rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const [rooms, total] = await Promise.all([
      TreatmentRoom.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TreatmentRoom.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        rooms,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /treatment-rooms/:id - Get single room
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const room = await TreatmentRoom.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    }).lean();

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({ success: true, data: room });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /treatment-rooms - Create new room
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

    // Verify store belongs to merchant
    const store = await Store.findOne(
      { _id: data.storeId, merchantId: req.merchantId },
      '_id'
    ).lean();

    if (!store) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const room = await TreatmentRoom.create({
      ...data,
      merchantId: req.merchantId,
    });

    res.status(201).json({ success: true, data: room });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /treatment-rooms/:id - Update room
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const data = pickFields(req.body);

    const room = await TreatmentRoom.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: data },
      { new: true }
    );

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({ success: true, data: room });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /treatment-rooms/:id - Delete room
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const room = await TreatmentRoom.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({ success: true, message: 'Room deleted' });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
