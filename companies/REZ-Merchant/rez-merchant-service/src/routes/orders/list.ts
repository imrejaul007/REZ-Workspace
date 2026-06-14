import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { redis } from '../../config/redis';
import { cacheGet, cacheSet } from '../../config/redis';
import { errorResponse, errors } from '../../utils/response';

const router = Router();
router.use(merchantAuth);

// Suspension check middleware
router.use(async (req: Request, res: Response, next) => {
  if (!req.merchantId) { next(); return; }
  try {
    const isSuspended = await redis.get(`merchant:suspended:${req.merchantId}`);
    if (isSuspended) {
      errorResponse(res, errors.forbidden('Your merchant account has been suspended.'));
      return;
    }
  } catch { /* Redis failure — don't block */ }
  next();
});

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find(
    { $or: [{ merchant: merchantId }, { merchantId: merchantId }] }, '_id'
  ).lean();
  return stores.map((s) => s._id);
}

function errMsg(req: Request, err: unknown): string {
  const requestId = (req as unknown).res?.locals?.requestId;
  return process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err instanceof Error ? err.message : 'Unknown error';
}

// GET /orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string;
    const pageParsed = parseInt(req.query.page as string, 10);
    const limitParsed = parseInt(req.query.limit as string, 10);
    const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(100, limitParsed) : 20;
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    let storeIds: mongoose.Types.ObjectId[];
    if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
      }
      storeIds = [new mongoose.Types.ObjectId(storeId)];
    } else {
      storeIds = await getMerchantStoreIds(req.merchantId!);
    }
    if (storeIds.length === 0) {
      res.json({ success: true, data: { orders: [], total: 0, totalCount: 0, page, limit, totalPages: 0, hasMore: false } }); return;
    }

    const filter: unknown = { store: { $in: storeIds } };
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (isNaN(d.getTime())) { res.status(400).json({ success: false, message: 'Invalid dateFrom format.' }); return; }
        filter.createdAt.$gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (isNaN(d.getTime())) { res.status(400).json({ success: false, message: 'Invalid dateTo format.' }); return; }
        filter.createdAt.$lte = d;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('store', 'name logo').lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, data: { orders, total, totalCount: total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

// GET /orders/analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.dateStart as string || req.query.dateFrom as string;
    const dateTo = req.query.dateEnd as string || req.query.dateTo as string;
    const storeIds = await getMerchantStoreIds(req.merchantId!);

    const filter: unknown = { store: { $in: storeIds } };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) { const d = new Date(dateFrom); if (isNaN(d.getTime())) { res.status(400).json({ success: false, message: 'Invalid dateStart format.' }); return; } filter.createdAt.$gte = d; }
      if (dateTo) { const d = new Date(dateTo); if (isNaN(d.getTime())) { res.status(400).json({ success: false, message: 'Invalid dateEnd format.' }); return; } filter.createdAt.$lte = d; }
    }

    const [totalAgg, statusAgg] = await Promise.all([
      Order.aggregate([{ $match: { ...filter, 'payment.status': 'paid' } }, { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totals.total' }, avgOrderValue: { $avg: '$totals.total' } } }]),
      Order.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const totals = totalAgg[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
    const breakdown: Record<string, number> = {};
    statusAgg.forEach((s) => { breakdown[s._id] = s.count; });

    res.json({ success: true, data: {
      totalOrders: totals.totalOrders || 0, totalRevenue: totals.totalRevenue || 0,
      averageOrderValue: (totals.avgOrderValue ?? 0) > 0 ? totals.avgOrderValue : 0,
      statusBreakdown: { pending: breakdown['placed'] || 0, confirmed: breakdown['confirmed'] || 0, preparing: breakdown['preparing'] || 0, ready: breakdown['ready'] || 0, dispatched: breakdown['dispatched'] || 0, out_for_delivery: breakdown['out_for_delivery'] || 0, delivered: breakdown['delivered'] || 0, cancelling: breakdown['cancelling'] || 0, cancelled: breakdown['cancelled'] || 0, returned: breakdown['returned'] || 0, refunded: breakdown['refunded'] || 0 },
      revenueGrowth: 0, orderGrowth: 0, topProducts: [],
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

// GET /orders/stats/summary
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const cacheKey = `orderstats:${req.merchantId}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, pendingOrders, revenue] = await Promise.all([
      Order.countDocuments({ store: { $in: storeIds } }),
      Order.countDocuments({ store: { $in: storeIds }, createdAt: { $gte: today } }),
      Order.countDocuments({ store: { $in: storeIds }, status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      Order.aggregate([{ $match: { store: { $in: storeIds }, 'payment.status': 'paid' } }, { $group: { _id: null, total: { $sum: '$totals.total' }, merchantPayout: { $sum: '$totals.merchantPayout' } } }]),
    ]);

    const result = { success: true, data: { totalOrders, todayOrders, pendingOrders, totalRevenue: revenue[0]?.total || 0, merchantPayout: revenue[0]?.merchantPayout || 0 } };
    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

export default router;
