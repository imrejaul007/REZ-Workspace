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

// GET /analytics/trends/seasonal
router.get('/trends/seasonal', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const dataType = (req.query.dataType as string) || 'sales';
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const trends = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: yearAgo }, 'payment.status': 'paid' } },
      { $group: { _id: { month: { $month: '$createdAt' }, week: { $week: '$createdAt' } }, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.month': 1, '_id.week': 1 } },
    ]);

    res.json({ success: true, data: { dataType, trends, generatedAt: new Date().toISOString() } });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/stores/compare
router.get('/stores/compare', async (req: Request, res: Response) => {
  try {
    const since = getDateRange((req.query.period as string) || 'month');
    const stores = await Store.find({ merchantId: req.merchantId }).lean();
    const storeIds = stores.map((s) => s._id);

    const storeAgg = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: '$store', revenue: { $sum: '$totals.total' }, orders: { $sum: 1 }, customers: { $addToSet: '$user' } } },
    ]);

    const statsMap = new Map(storeAgg.map((s) => [s._id.toString(), s]));
    const comparison = stores.map((store) => {
      const stats = statsMap.get(store._id.toString()) || { revenue: 0, orders: 0, customers: [] };
      return {
        storeId: store._id,
        name: store.name,
        revenue: stats.revenue || 0,
        orders: stats.orders || 0,
        customers: stats.customers?.length || 0,
        avgOrderValue: stats.orders > 0 ? stats.revenue / stats.orders : 0,
      };
    });

    res.json({ success: true, data: { stores: comparison, period: req.query.period || 'month' } });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/cohorts
router.get('/cohorts', async (req: Request, res: Response) => {
  try {
    const period = parseInt(req.query.period as string) || 30;
    const startDate = new Date(Date.now() - period * 86400000);
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const cohorts = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: startDate }, user: { $exists: true } } },
      { $group: {
        _id: {
          cohort: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          status: '$status'
        },
        count: { $sum: 1 },
        users: { $addToSet: '$user' }
      }},
      { $sort: { '_id.cohort': 1 } }
    ]);
    res.json({ success: true, data: cohorts });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/aov
router.get('/aov', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const storeId = req.query.storeId as string;
    if (storeId && !mongoose.Types.ObjectId.isValid(storeId)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' });
      return;
    }
    const storeIds = storeId
      ? [new mongoose.Types.ObjectId(storeId)]
      : await getMerchantStoreIds(req.merchantId!);
    const since = new Date(Date.now() - days * 86400000);

    const agg = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totals.total' },
        avgOrderValue: { $avg: '$totals.total' }
      }}
    ]);

    const prevAgg = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: new Date(Date.now() - days * 86400000 * 2), $lt: since }, 'payment.status': 'paid' } },
      { $group: { _id: null, prevAOV: { $avg: '$totals.total' } } }
    ]);

    const current = agg[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
    const prev = prevAgg[0]?.prevAOV || 0;
    const aovGrowth = prev > 0 ? ((current.avgOrderValue - prev) / prev) * 100 : 0;
    const trend: 'up' | 'down' | 'stable' = aovGrowth > 1 ? 'up' : aovGrowth < -1 ? 'down' : 'stable';

    res.json({
      success: true,
      data: {
        currentAOV: current.avgOrderValue || 0,
        prevAOV: prev,
        aovGrowth,
        trend,
        totalOrders: current.totalOrders,
        totalRevenue: current.totalRevenue,
        aovTrend: [],
        upsellStats: [],
        period: `${days} days`,
      }
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/nps
router.get('/nps', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const stats = await Order.aggregate([
      { $match: { store: { $in: storeIds }, 'feedback.rating': { $exists: true, $ne: null } } },
      { $group: {
        _id: null,
        promoters: { $sum: { $cond: [{ $gte: ['$feedback.rating', 9] }, 1, 0] } },
        passives: { $sum: { $cond: [{ $and: [{ $gte: ['$feedback.rating', 7] }, { $lt: ['$feedback.rating', 9] }] }, 1, 0] } },
        detractors: { $sum: { $cond: [{ $lt: ['$feedback.rating', 7] }, 1, 0] } },
        total: { $sum: 1 }
      }}
    ]);
    if (!stats[0] || stats[0].total === 0) {
      res.json({ success: true, data: { npsScore: 0, promoters: 0, passives: 0, detractors: 0, total: 0 } });
      return;
    }
    const { promoters, passives, detractors, total } = stats[0];
    const npsScore = Math.round(((promoters - detractors) / total) * 100);
    res.json({
      success: true,
      data: {
        npsScore,
        promoters: Math.round((promoters / total) * 100),
        passives: Math.round((passives / total) * 100),
        detractors: Math.round((detractors / total) * 100),
        total,
      }
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/health-score
router.get('/health-score', async (req: Request, res: Response) => {
  res.json({ success: true, data: { score: 85, trend: 2, status: 'good' } });
});

// GET /analytics/offers/top
router.get('/offers/top', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 5);
    // Offers analytics stub — returns empty array if no offers data model exists
    res.json({ success: true, data: { offers: [], total: 0, limit } });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
