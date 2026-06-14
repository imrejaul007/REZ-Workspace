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

// GET /analytics/forecast/sales — sales forecast (stub; real ML forecast would be async job)
router.get('/forecast/sales', async (req: Request, res: Response) => {
  try {
    // ROUTE-SEC-022/036 FIX: Cap day count to prevent unbounded DB queries.
    const rawDays = parseInt(req.query.days as string || req.query.forecastDays as string) || 30;
    const days = Math.min(Math.max(rawDays, 1), 365);
    const storeId = req.query.storeId as string;
    const storeIds = storeId
      ? [new mongoose.Types.ObjectId(storeId)]
      : await getMerchantStoreIds(req.merchantId!);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const historicalAgg = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const avgDailyRevenue = historicalAgg.length > 0
      ? historicalAgg.reduce((sum: number, d) => sum + d.revenue, 0) / historicalAgg.length
      : 0;

    const forecastData = Array.from({ length: Math.min(days, 90) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toISOString().split('T')[0],
        forecastRevenue: Math.round(avgDailyRevenue * 0.95),
        confidence: 0.75,
      };
    });

    res.json({
      success: true,
      data: {
        forecastDays: days,
        avgDailyRevenue: Math.round(avgDailyRevenue),
        forecast: forecastData,
        generatedAt: new Date().toISOString(),
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
