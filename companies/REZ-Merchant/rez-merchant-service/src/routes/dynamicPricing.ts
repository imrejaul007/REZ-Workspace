
import { Router, Request, Response } from 'express';
import { DynamicPricingRule } from '../models/DynamicPricingRule';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

const DYNAMIC_PRICING_ALLOWED_FIELDS = [
  'name', 'description', 'storeId', 'productIds', 'categoryIds',
  'type', 'adjustmentType', 'adjustmentValue', 'conditions',
  'schedule', 'startDate', 'endDate', 'priority', 'isActive',
  'minPrice', 'maxPrice', 'metadata',
];

function pickDynamicPricingFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of DYNAMIC_PRICING_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    if (!mongoose.Types.ObjectId.isValid(storeId as string)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
    }
    const rules = await DynamicPricingRule.find({ merchantId: new mongoose.Types.ObjectId(req.merchantId), storeId: new mongoose.Types.ObjectId(storeId as string) }).lean();
    res.json({ success: true, data: rules });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const rule = await DynamicPricingRule.create({ ...pickDynamicPricingFields(req.body), merchantId: new mongoose.Types.ObjectId(req.merchantId), isActive: true });
    res.status(201).json({ success: true, data: rule });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickDynamicPricingFields(req.body);
    allowedFields.updatedAt = new Date();
    const rule = await DynamicPricingRule.findOneAndUpdate({ _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId) }, { $set: allowedFields }, { new: true });
    if (!rule) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rule });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const rule = await DynamicPricingRule.findOneAndDelete({ _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId) });
    if (!rule) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
