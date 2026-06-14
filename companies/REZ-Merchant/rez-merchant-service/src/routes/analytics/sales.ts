import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
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

// GET /analytics/sales/trends
router.get('/sales/trends', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'month';
    const storeId = req.query.storeId as string;
    const cacheKey = `analytics:${req.merchantId}:salestrends:${storeId || 'all'}:${period}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const storeIds = storeId
      ? [new mongoose.Types.ObjectId(storeId)]
      : await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange(period);

    const trends = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const result = { success: true, data: trends };
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

// GET /analytics/sales/by-time
router.get('/sales/by-time', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange((req.query.period as string) || 'month');

    const byHour = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: { $hour: '$createdAt' }, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: byHour });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/revenue/breakdown
router.get('/revenue/breakdown', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange((req.query.period as string) || 'month');

    const breakdown = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: '$payment.method', revenue: { $sum: '$totals.total' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/comparison — period-over-period comparison
router.get('/comparison', async (req: Request, res: Response) => {
  try {
    const currentStart = req.query.currentStart as string;
    const currentEnd = req.query.currentEnd as string;
    const previousStart = req.query.previousStart as string;
    const previousEnd = req.query.previousEnd as string;
    const storeId = req.query.storeId as string;

    // ROUTE-SEC-018 FIX: Validate all date strings before use.
    // new Date('garbage') produces Invalid Date (epoch 1970) which silently
    // returns empty results instead of reporting an error to the caller.
    const ISODATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    const parseDate = (val: string, name: string) => {
      if (!ISODATE_REGEX.test(val)) {
        throw Object.assign(new Error(`${name} must be a valid ISO date string`), { status: 400 });
      }
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) {
        throw Object.assign(new Error(`${name} is not a valid date`), { status: 400 });
      }
      return d;
    };

    let currentStartDate: Date, currentEndDate: Date, previousStartDate: Date, previousEndDate: Date;
    try {
      currentStartDate = parseDate(currentStart, 'currentStart');
      currentEndDate = parseDate(currentEnd, 'currentEnd');
      previousStartDate = parseDate(previousStart, 'previousStart');
      previousEndDate = parseDate(previousEnd, 'previousEnd');
    } catch (e) {
      res.status(e.status || 400).json({ success: false, message: e.message });
      return;
    }

    const storeIds = storeId
      ? [new mongoose.Types.ObjectId(storeId)]
      : await getMerchantStoreIds(req.merchantId!);

    const [currentAgg, previousAgg] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: currentStartDate, $lte: currentEndDate }, 'payment.status': 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 }, customers: { $addToSet: '$user' } } },
      ]),
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: previousStartDate, $lte: previousEndDate }, 'payment.status': 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 }, customers: { $addToSet: '$user' } } },
      ]),
    ]);

    const curr = currentAgg[0] || { revenue: 0, orders: 0, customers: [] };
    const prev = previousAgg[0] || { revenue: 0, orders: 0, customers: [] };
    const pct = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;

    res.json({
      success: true,
      data: {
        current: { revenue: curr.revenue, orders: curr.orders, customers: curr.customers?.length || 0 },
        previous: { revenue: prev.revenue, orders: prev.orders, customers: prev.customers?.length || 0 },
        changes: {
          revenue: pct(curr.revenue, prev.revenue),
          orders: pct(curr.orders, prev.orders),
          customers: pct(curr.customers?.length || 0, prev.customers?.length || 0),
        },
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

// GET /analytics/realtime — live metrics for current day
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
        todayRevenue: t.revenue || 0,
        todayOrders: t.orders || 0,
        todayCustomers: t.customers?.length || 0,
        pendingOrders: activePending,
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
