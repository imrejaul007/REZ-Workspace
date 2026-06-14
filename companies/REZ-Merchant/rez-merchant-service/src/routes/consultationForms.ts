import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ConsultationForm } from '../models/ConsultationForm';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// Field allowlist for mass assignment protection
const ALLOWED_FIELDS = [
  'name', 'description', 'fields', 'isDefault', 'active', 'storeId'
];

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

// GET /consultation-forms - List all forms
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [forms, total] = await Promise.all([
      ConsultationForm.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ConsultationForm.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        forms,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /consultation-forms/:id - Get single form
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const form = await ConsultationForm.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    }).lean();

    if (!form) {
      res.status(404).json({ success: false, message: 'Form not found' });
      return;
    }

    res.json({ success: true, data: form });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /consultation-forms - Create new form
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = pickFields(req.body);

    if (!data.name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await ConsultationForm.updateMany(
        { merchantId: req.merchantId },
        { $set: { isDefault: false } }
      );
    }

    const form = await ConsultationForm.create({
      ...data,
      merchantId: req.merchantId,
    });

    res.status(201).json({ success: true, data: form });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /consultation-forms/:id - Update form
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const data = pickFields(req.body);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await ConsultationForm.updateMany(
        { merchantId: req.merchantId, _id: { $ne: req.params.id } },
        { $set: { isDefault: false } }
      );
    }

    const form = await ConsultationForm.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: data },
      { new: true }
    );

    if (!form) {
      res.status(404).json({ success: false, message: 'Form not found' });
      return;
    }

    res.json({ success: true, data: form });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /consultation-forms/:id - Delete form
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const form = await ConsultationForm.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!form) {
      res.status(404).json({ success: false, message: 'Form not found' });
      return;
    }

    res.json({ success: true, message: 'Form deleted' });
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' ? 'An error occurred' : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
