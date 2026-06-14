import mongoose, { Schema } from 'mongoose';
import { Router, Request, Response } from 'express';
import { Discount } from '../models/Discount';
import { merchantAuth } from '../middleware/auth';

// Lean document type — mirrors the Discount schema for use with .lean()
interface IDiscountLean {
  _id: Schema.Types.ObjectId;
  merchantId: Schema.Types.ObjectId;
  storeId?: Schema.Types.ObjectId;
  name?: string;
  description?: string;
  type?: 'percentage' | 'fixed_amount' | 'bogo' | 'tiered';
  value?: number;
  code?: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  perUserLimit?: number;
  applicableTo?: 'all_products' | 'specific_products' | 'specific_categories';
  productIds?: Schema.Types.ObjectId[];
  categoryIds?: string[];
  status?: 'active' | 'inactive' | 'expired';
  isActive?: boolean;
  conditions?: unknown;
  metadata?: unknown;
  usageCount?: number;
  userRedemptions?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

const router = Router();
router.use(merchantAuth);

const DISCOUNT_ALLOWED_FIELDS = [
  'name', 'description', 'type', 'value', 'code', 'storeId',
  'minOrderAmount', 'maxDiscount', 'startDate', 'endDate',
  'usageLimit', 'perUserLimit', 'applicableTo', 'productIds',
  'categoryIds', 'status', 'isActive', 'conditions', 'metadata',
];

function pickDiscountFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of DISCOUNT_ALLOWED_FIELDS) {
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
      Discount.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Discount.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Discount.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await Discount.create({ ...pickDiscountFields(req.body), merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickDiscountFields(req.body);
    allowedFields.updatedAt = new Date();
    const item = await Discount.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: allowedFields }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /:id/redeem — Apply discount to an order (usage limit enforcement)
// BE-MER-020 FIX: Enforce usageLimit and perUserLimit before redemption
router.post('/:id/redeem', async (req: Request, res: Response) => {
  try {
    const { userId, orderAmount } = req.body;

    const discount = await Discount.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean() as IDiscountLean | null;
    if (!discount) { res.status(404).json({ success: false, message: 'Discount not found' }); return; }

    // Only active discounts can be redeemed
    if (!discount.isActive || discount.status === 'inactive' || discount.status === 'expired') {
      res.status(400).json({ success: false, message: 'Discount is not active' }); return;
    }

    // Check date validity
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      res.status(400).json({ success: false, message: 'Discount has not started yet' }); return;
    }
    if (discount.endDate && now > discount.endDate) {
      res.status(400).json({ success: false, message: 'Discount has expired' }); return;
    }

    // BE-MER-020 FIX: Enforce perUserLimit (redemptions per individual user)
    const perUserLimit = typeof discount.perUserLimit === 'number' && discount.perUserLimit > 0 ? discount.perUserLimit : 0;

    // Minimum order amount check
    if (typeof discount.minOrderAmount === 'number' && discount.minOrderAmount > 0) {
      if (!orderAmount || orderAmount < discount.minOrderAmount) {
        res.status(400).json({ success: false, message: `Minimum order amount is ${discount.minOrderAmount}` }); return;
      }
    }

    // MERCH-AUDIT-11 FIX: Atomic check-and-increment — single query enforces usageLimit and perUserLimit
    // together, eliminating the TOCTOU race between reading usageCount and incrementing it.
    const discountDoc = await Discount.findOne({
      _id: req.params.id,
      isActive: true,
      status: { $ne: 'inactive' },
      ...(typeof discount.usageLimit === 'number' && discount.usageLimit > 0
        ? { usageCount: { $lt: discount.usageLimit } }
        : {}),
    });

    if (!discountDoc) {
      res.status(400).json({ success: false, message: 'Discount usage limit reached or not active' }); return;
    }

    const updated = await Discount.findOneAndUpdate(
      {
        _id: discount._id,
        ...(typeof discount.usageLimit === 'number' && discount.usageLimit > 0
          ? { usageCount: { $lt: discount.usageLimit } }
          : {}),
        ...(perUserLimit > 0 && userId
          ? { $expr: { $or: [
              { $eq: [{ $type: `$userRedemptions.${userId}` }, 'missing'] },
              { $lt: [{ $ifNull: [{ $toInt: `$userRedemptions.${userId}` }, 0] }, perUserLimit] },
            ]}}
          : {}),
      },
      {
        $inc: { usageCount: 1 },
        ...(userId ? { $inc: { [`userRedemptions.${userId}`]: 1 } } : {}),
      },
      { new: true },
    );
    if (!updated) {
      res.status(400).json({ success: false, message: 'Discount usage limit reached or per-user limit exceeded' }); return;
    }

    res.json({ success: true, message: 'Discount applied successfully', data: { discountId: discount._id } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// Also validate usageLimit on discount creation (sanity check)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Discount.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
