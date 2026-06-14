import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { cacheGet, cacheSet } from '../../config/redis';

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
  return stores.map((s) => s._id);
}

function getDateRange(period: string): Date {
  const now = new Date();
  if (period === 'week') return new Date(now.getTime() - 7 * 86400000);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1); // month default
}

// GET /analytics/overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'month';
    const storeId = req.query.storeId as string;
    const cacheKey = `analytics:${req.merchantId}:overview:${storeId || 'all'}:${period}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const storeIds = storeId
      ? [new mongoose.Types.ObjectId(storeId)]
      : await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange(period);

    const [revenue, orderStats, productStats] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$totals.total' }, payout: { $sum: '$totals.merchantPayout' }, fees: { $sum: '$totals.platformFee' }, count: { $sum: 1 }, avg: { $avg: '$totals.total' } } },
      ]),
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: { merchant: new mongoose.Types.ObjectId(req.merchantId!) } },
        { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      ]),
    ]);

    const result = {
      success: true,
      data: {
        revenue: revenue[0] || { total: 0, payout: 0, fees: 0, count: 0, avg: 0 },
        ordersByStatus: Object.fromEntries(orderStats.map((s) => [s._id, s.count])),
        products: productStats[0] || { total: 0, active: 0 },
      },
    };
    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
