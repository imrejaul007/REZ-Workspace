
import { Router, Request, Response } from 'express';
import { VoucherRedemption } from '../models/VoucherRedemption';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      VoucherRedemption.find({ storeId: { $in: storeIds } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      VoucherRedemption.countDocuments({ storeId: { $in: storeIds } }),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const stats = await VoucherRedemption.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      { $group: { _id: null, total: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$discountAmount', 0] } } } },
    ]);
    res.json({ success: true, data: stats[0] || { total: 0, totalValue: 0 } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
