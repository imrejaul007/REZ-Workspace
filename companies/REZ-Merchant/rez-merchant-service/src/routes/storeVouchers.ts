
import { Router, Request, Response } from 'express';
import { StoreVoucher } from '../models/StoreVoucher';
import { merchantAuth } from '../middleware/auth';

// H34 fix: Allow-list of fields that merchants are permitted to set on a voucher.
// Prevents injection of system fields like usageCount, merchantId, isActive manipulation.
function pickVoucherFields(body): Record<string, unknown> {
  const allowed = ['code', 'discountType', 'discountValue', 'validFrom', 'validTo',
    'usageLimit', 'minOrderValue', 'description', 'isActive', 'storeId'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

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
      StoreVoucher.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StoreVoucher.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await StoreVoucher.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await StoreVoucher.create({ ...pickVoucherFields(req.body), merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    // H34 fix: use pickVoucherFields allow-list — prevents overwriting system fields
    const item = await StoreVoucher.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: pickVoucherFields(req.body) }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await StoreVoucher.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
