
import { Router, Request, Response } from 'express';
import { ComboProduct } from '../models/ComboProduct';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const BUNDLE_ALLOWED_FIELDS = [
  'name', 'description', 'items', 'comboPrice', 'storeId',
  'images', 'category', 'isActive', 'validFrom', 'validTo',
  'sortOrder', 'tags', 'metadata',
];

function pickBundleFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of BUNDLE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) filter.storeId = req.query.storeId;
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.active === 'false') filter.isActive = false;
    const bundles = await ComboProduct.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: bundles, count: bundles.length });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const b = await ComboProduct.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!b) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: b });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, items, comboPrice } = req.body;
    if (!name || !items || items.length < 2 || comboPrice == null) { res.status(400).json({ success: false, message: 'name, 2+ items, comboPrice required' }); return; }
    const originalTotal = items.reduce((s: number, i) => s + i.basePrice * (i.quantity || 1), 0);
    const bundle = await ComboProduct.create({ ...pickBundleFields(req.body), merchantId: req.merchantId, originalTotal, savings: Math.round((originalTotal - comboPrice) * 100) / 100 });
    res.status(201).json({ success: true, data: bundle });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickBundleFields(req.body);
    allowedFields.updatedAt = new Date();
    const b = await ComboProduct.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: allowedFields }, { new: true });
    if (!b) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: b });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const b = await ComboProduct.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!b) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const b = await ComboProduct.findOne({ _id: req.params.id, merchantId: req.merchantId }) as unknown;
    if (!b) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    b.isActive = !b.isActive; await b.save();
    res.json({ success: true, data: { isActive: b.isActive } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
