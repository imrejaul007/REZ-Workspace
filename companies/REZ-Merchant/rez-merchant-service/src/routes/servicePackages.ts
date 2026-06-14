import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ServicePackage } from '../models/ServicePackage';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// Field allowlist for mass assignment protection
const ALLOWED_FIELDS = [
  'name', 'description', 'services', 'price', 'validityDays', 'active', 'storeId'
];

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

// GET /service-packages - List all packages
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const [packages, total] = await Promise.all([
      ServicePackage.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ServicePackage.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        packages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /service-packages/:id - Get single package
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const pkg = await ServicePackage.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    }).lean();

    if (!pkg) {
      res.status(404).json({ success: false, message: 'Package not found' });
      return;
    }

    res.json({ success: true, data: pkg });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /service-packages - Create new package
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

    if (!data.services || data.services.length === 0) {
      res.status(400).json({ success: false, message: 'At least one service is required' });
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

    const pkg = await ServicePackage.create({
      ...data,
      merchantId: req.merchantId,
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /service-packages/:id - Update package
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const data = pickFields(req.body);

    if (data.services && data.services.length === 0) {
      res.status(400).json({ success: false, message: 'At least one service is required' });
      return;
    }

    const pkg = await ServicePackage.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: data },
      { new: true }
    );

    if (!pkg) {
      res.status(404).json({ success: false, message: 'Package not found' });
      return;
    }

    res.json({ success: true, data: pkg });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /service-packages/:id - Delete package
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const pkg = await ServicePackage.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!pkg) {
      res.status(404).json({ success: false, message: 'Package not found' });
      return;
    }

    res.json({ success: true, message: 'Package deleted' });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
