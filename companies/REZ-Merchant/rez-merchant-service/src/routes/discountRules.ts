
import { Router, Request, Response } from 'express';
import { DiscountRule } from '../models/DiscountRule';
import { merchantAuth } from '../middleware/auth';

// M19 fix: Allow-list for PATCH — matches the POST validation fields to prevent
// merchants from overwriting system fields like merchantId, isActive on expired rules, etc.
function pickDiscountRuleFields(body): Record<string, unknown> {
  const allowed = ['name', 'type', 'value', 'validFrom', 'validTo', 'minOrderValue',
    'maxDiscount', 'applicableCategories', 'description', 'storeId'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

const router = Router();
router.use(merchantAuth);

// GET / — list active discount rules for merchant
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      DiscountRule.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      DiscountRule.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST / — create discount rule
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, value, minSpend, validFrom, validTo, storeId, isActive } = req.body;
    if (!name || !type || value === undefined || !validFrom || !validTo) {
      res.status(400).json({ success: false, message: 'name, type, value, validFrom, and validTo are required' });
      return;
    }
    if (!['percent', 'fixed'].includes(type)) {
      res.status(400).json({ success: false, message: 'type must be percent or fixed' });
      return;
    }
    const item = await DiscountRule.create({
      merchantId: req.merchantId,
      storeId: storeId || null,
      name,
      type,
      value: parseFloat(value),
      minSpend: minSpend ? parseFloat(minSpend) : null,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// PATCH /:id — update discount rule
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    // M19 fix: use allow-list to prevent overwriting system fields
    const item = await DiscountRule.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: pickDiscountRuleFields(req.body) },
      { new: true }
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// DELETE /:id — deactivate (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await DiscountRule.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deactivated' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
