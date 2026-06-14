
import { Router, Request, Response } from 'express';
import { CorporateAccount } from '../models/CorporateAccount';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const CORPORATE_ALLOWED_FIELDS = [
  'companyName', 'contactPerson', 'email', 'phone', 'address',
  'storeId', 'gstNumber', 'pan', 'creditLimit', 'paymentTerms',
  'discount', 'status', 'isActive', 'notes', 'metadata',
];

function pickCorporateFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of CORPORATE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      CorporateAccount.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CorporateAccount.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await CorporateAccount.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await CorporateAccount.create({ ...pickCorporateFields(req.body), merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickCorporateFields(req.body);
    allowedFields.updatedAt = new Date();
    const item = await CorporateAccount.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: allowedFields }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await CorporateAccount.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
