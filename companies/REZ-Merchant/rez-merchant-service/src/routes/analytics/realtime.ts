import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const { Store } = await import('../../models/Store');
  const stores = await Store.find({ merchantId }, '_id').lean();
  return stores.map((s) => s._id);
}

function errMsg(req: Request, err): string {
  const requestId = (req as unknown).res?.locals?.requestId;
  return process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err.message;
}

// GET /analytics/realtime
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string;
    const storeIds = storeId
      ? [new mongoose.Types.ObjectId(storeId)]
      : await getMerchantStoreIds(req.merchantId!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayAgg, activePending] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: today }, 'payment.status': 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 }, customers: { $addToSet: '$user' } } },
      ]),
      Order.countDocuments({ store: { $in: storeIds }, status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] } }),
    ]);

    const t = todayAgg[0] || { revenue: 0, orders: 0, customers: [] };
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        todayRevenue: t.revenue || 0, todayOrders: t.orders || 0,
        todayCustomers: t.customers?.length || 0, pendingOrders: activePending,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

// GET /analytics/offers/top
router.get('/offers/top', async (req: Request, res: Response) => {
  const limit = Math.min(20, parseInt(req.query.limit as string) || 5);
  res.json({ success: true, data: { offers: [], total: 0, limit } });
});

export default router;
