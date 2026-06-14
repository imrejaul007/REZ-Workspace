import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

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

// GET /analytics/customers/insights
router.get('/customers/insights', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange((req.query.period as string) || 'month');

    const insights = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: '$user', orders: { $sum: 1 }, totalSpent: { $sum: '$totals.total' }, lastOrder: { $max: '$createdAt' } } },
      { $facet: {
        summary: [{ $group: { _id: null, totalCustomers: { $sum: 1 }, avgOrders: { $avg: '$orders' }, avgSpent: { $avg: '$totalSpent' } } }],
        topCustomers: [{ $sort: { totalSpent: -1 } }, { $limit: 10 }],
      }},
    ]);
    res.json({ success: true, data: insights[0] || { summary: [], topCustomers: [] } });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/customers/segments
router.get('/customers/segments', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange((req.query.period as string) || 'month');

    const customerAgg = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: '$user', orders: { $sum: 1 }, totalSpent: { $sum: '$totals.total' } } },
    ]);

    const vip = customerAgg.filter((c) => c.orders >= 5 || c.totalSpent >= 5000);
    const loyal = customerAgg.filter((c) => c.orders >= 2 && c.orders < 5);
    const newCustomers = customerAgg.filter((c) => c.orders === 1);

    res.json({
      success: true,
      data: {
        segments: [
          { name: 'VIP', count: vip.length, avgSpend: vip.reduce((s: number, c) => s + c.totalSpent, 0) / (vip.length || 1) },
          { name: 'Loyal', count: loyal.length, avgSpend: loyal.reduce((s: number, c) => s + c.totalSpent, 0) / (loyal.length || 1) },
          { name: 'New', count: newCustomers.length, avgSpend: newCustomers.reduce((s: number, c) => s + c.totalSpent, 0) / (newCustomers.length || 1) },
        ],
        total: customerAgg.length,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
