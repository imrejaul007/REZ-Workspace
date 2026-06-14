import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { cacheGet, cacheSet } from '../../config/redis';

const AGG_OPTIONS = { maxTimeMS: 30000 };

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
  return stores.map((s) => s._id);
}

async function getScopedStoreIds(
  merchantId: string,
  storeId?: string
): Promise<mongoose.Types.ObjectId[]> {
  if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
    return [new mongoose.Types.ObjectId(storeId)];
  }
  return getMerchantStoreIds(merchantId);
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// GET /dashboard — main overview (cached 2 min)
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const cacheKey = `dashboard:${req.merchantId}:overview:${storeId || 'all'}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const storeIds = await getScopedStoreIds(req.merchantId!, storeId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(monthStart.getTime() - 1);

    const storeFilter = { store: { $in: storeIds } };

    const [
      allTimeAgg,
      monthAgg,
      lastMonthAgg,
      pendingOrders,
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalCustomers,
      monthlyCustomers,
      previousMonthlyCustomers,
      recentOrders,
      topProducts,
      stores,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { ...storeFilter, 'payment.status': 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totals.total' },
            totalOrders: { $sum: 1 },
            totalPayout: { $sum: '$totals.merchantPayout' },
            totalCashbackPaid: { $sum: '$totals.cashback' },
            completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            ...storeFilter,
            createdAt: { $gte: monthStart },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totals.total' },
            totalOrders: { $sum: 1 },
          },
        },
      ], AGG_OPTIONS),
      Order.aggregate([
        {
          $match: {
            ...storeFilter,
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totals.total' },
            totalOrders: { $sum: 1 },
          },
        },
      ], AGG_OPTIONS),
      Order.countDocuments({
        ...storeFilter,
        status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] },
      }),
      Product.countDocuments({ merchant: req.merchantId }),
      Product.countDocuments({ merchant: req.merchantId, isActive: true, 'inventory.isAvailable': true }),
      Product.countDocuments({
        merchant: req.merchantId,
        isActive: true,
        'inventory.unlimited': { $ne: true },
        $expr: { $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 10] }] },
      }),
      Order.distinct('user', { ...storeFilter, 'payment.status': 'paid' }),
      Order.distinct('user', {
        ...storeFilter,
        createdAt: { $gte: monthStart },
        'payment.status': 'paid',
      }),
      Order.distinct('user', {
        ...storeFilter,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        'payment.status': 'paid',
      }),
      Order.find(storeFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status totals.total createdAt')
        .lean(),
      Order.aggregate([
        {
          $match: {
            ...storeFilter,
            createdAt: { $gte: monthStart },
            'payment.status': 'paid',
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            image: { $first: '$items.image' },
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ], AGG_OPTIONS),
      Store.find({ merchantId: req.merchantId }).select('name isActive ratings').lean(),
    ]);

    const allTime = allTimeAgg[0] || {};
    const currentMonth = monthAgg[0] || {};
    const previousMonth = lastMonthAgg[0] || {};

    const result = {
      success: true,
      data: {
        metrics: {
          totalRevenue: {
            value: allTime.totalRevenue || 0,
            change: percentChange(currentMonth.totalRevenue || 0, previousMonth.totalRevenue || 0),
            trend:
              (currentMonth.totalRevenue || 0) >= (previousMonth.totalRevenue || 0) ? 'up' : 'down',
            period: 'vs last month',
          },
          totalOrders: {
            value: allTime.totalOrders || 0,
            change: percentChange(currentMonth.totalOrders || 0, previousMonth.totalOrders || 0),
            trend:
              (currentMonth.totalOrders || 0) >= (previousMonth.totalOrders || 0) ? 'up' : 'down',
            period: 'vs last month',
          },
          totalProducts: {
            value: totalProducts,
            change: 0,
            trend: 'neutral',
            period: 'catalog size',
          },
          totalCustomers: {
            value: totalCustomers.length,
            change: percentChange(monthlyCustomers.length, previousMonthlyCustomers.length),
            trend: monthlyCustomers.length >= previousMonthlyCustomers.length ? 'up' : 'down',
            period: 'vs last month',
          },
          monthlyRevenue: currentMonth.totalRevenue || 0,
          monthlyOrders: currentMonth.totalOrders || 0,
          revenueGrowth: percentChange(currentMonth.totalRevenue || 0, previousMonth.totalRevenue || 0),
          ordersGrowth: percentChange(currentMonth.totalOrders || 0, previousMonth.totalOrders || 0),
          customerGrowth: percentChange(monthlyCustomers.length, previousMonthlyCustomers.length),
          averageOrderValue: currentMonth.totalOrders
            ? (currentMonth.totalRevenue || 0) / currentMonth.totalOrders
            : 0,
          pendingOrders,
          completedOrders: allTime.completedOrders || 0,
          cancelledOrders: 0,
          activeProducts,
          lowStockProducts,
          monthlyCustomers: monthlyCustomers.length,
          returningCustomers: 0,
          totalCashbackPaid: allTime.totalCashbackPaid || 0,
          pendingCashback: 0,
          profitMargin: allTime.totalRevenue
            ? (((allTime.totalPayout || 0) / allTime.totalRevenue) * 100)
            : 0,
        },
        overview: {
          quickStats: {
            totalProducts,
            totalOrders: allTime.totalOrders || 0,
            pendingOrders,
            pendingCashback: 0,
          },
          recentActivity: {
            orders: recentOrders,
            products: [],
          },
        },
        recentActivity: recentOrders.map((order) => ({
          type: 'order',
          title: `Order ${order.orderNumber || ''}`.trim(),
          description: `${order.status} • Rs.${Number(order.totals?.total || 0).toFixed(0)}`,
          timestamp: order.createdAt,
          metadata: { orderId: order._id, status: order.status },
        })),
        topProducts: topProducts.map((item) => ({
          productId: item._id,
          name: item.name || 'Unnamed item',
          sales: item.sales || 0,
          revenue: item.revenue || 0,
          image: item.image || undefined,
        })),
        lowStockAlerts: [],
        salesChart: [],
        stores,
      },
    };
    await cacheSet(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /dashboard/overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);

    const [totalProducts, totalOrders, pendingOrders, recentOrders] = await Promise.all([
      Product.countDocuments({ merchant: req.merchantId }),
      Order.countDocuments({ store: { $in: storeIds } }),
      Order.countDocuments({
        store: { $in: storeIds },
        status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] },
      }),
      Order.find({ store: { $in: storeIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status totals.total createdAt')
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        quickStats: {
          totalProducts,
          totalOrders,
          pendingOrders,
          pendingCashback: 0,
        },
        recentActivity: {
          orders: recentOrders,
          products: [],
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

// GET /dashboard/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const period = (req.query.period as string) || 'month';
    const cacheKey = `dashboard:${req.merchantId}:metrics:${storeId || 'all'}:${period}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const now = new Date();
    const currentStart =
      period === 'week'
        ? new Date(now.getTime() - 7 * 86400000)
        : period === 'year'
          ? new Date(now.getFullYear(), 0, 1)
          : new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart =
      period === 'week'
        ? new Date(currentStart.getTime() - 7 * 86400000)
        : period === 'year'
          ? new Date(now.getFullYear() - 1, 0, 1)
          : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd = new Date(currentStart.getTime() - 1);
    const storeIds = await getScopedStoreIds(req.merchantId!, storeId);

    const [
      allTimeAgg,
      currentAgg,
      previousAgg,
      pendingOrders,
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalCustomers,
      currentCustomers,
      previousCustomers,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, 'payment.status': 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totals.total' },
            totalOrders: { $sum: 1 },
            totalPayout: { $sum: '$totals.merchantPayout' },
            totalCashbackPaid: { $sum: '$totals.cashback' },
            completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            store: { $in: storeIds },
            createdAt: { $gte: currentStart },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totals.total' },
            totalOrders: { $sum: 1 },
          },
        },
      ], AGG_OPTIONS),
      Order.aggregate([
        {
          $match: {
            store: { $in: storeIds },
            createdAt: { $gte: previousStart, $lte: previousEnd },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totals.total' },
            totalOrders: { $sum: 1 },
          },
        },
      ], AGG_OPTIONS),
      Order.countDocuments({
        store: { $in: storeIds },
        status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] },
      }),
      Product.countDocuments({ merchant: req.merchantId }),
      Product.countDocuments({ merchant: req.merchantId, isActive: true, 'inventory.isAvailable': true }),
      Product.countDocuments({
        merchant: req.merchantId,
        isActive: true,
        'inventory.unlimited': { $ne: true },
        $expr: { $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 10] }] },
      }),
      Order.distinct('user', { store: { $in: storeIds }, 'payment.status': 'paid' }),
      Order.distinct('user', {
        store: { $in: storeIds },
        createdAt: { $gte: currentStart },
        'payment.status': 'paid',
      }),
      Order.distinct('user', {
        store: { $in: storeIds },
        createdAt: { $gte: previousStart, $lte: previousEnd },
        'payment.status': 'paid',
      }),
    ]);

    const allTime = allTimeAgg[0] || {};
    const current = currentAgg[0] || {};
    const previous = previousAgg[0] || {};

    const result = {
      success: true,
      data: {
        totalRevenue: allTime.totalRevenue || 0,
        monthlyRevenue: current.totalRevenue || 0,
        revenueGrowth: percentChange(current.totalRevenue || 0, previous.totalRevenue || 0),
        averageOrderValue: current.totalOrders ? (current.totalRevenue || 0) / current.totalOrders : 0,
        totalOrders: allTime.totalOrders || 0,
        monthlyOrders: current.totalOrders || 0,
        ordersGrowth: percentChange(current.totalOrders || 0, previous.totalOrders || 0),
        pendingOrders,
        completedOrders: allTime.completedOrders || 0,
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalCustomers: totalCustomers.length,
        monthlyCustomers: currentCustomers.length,
        customerGrowth: percentChange(currentCustomers.length, previousCustomers.length),
        totalCashbackPaid: allTime.totalCashbackPaid || 0,
        pendingCashback: 0,
        profitMargin: allTime.totalRevenue
          ? (((allTime.totalPayout || 0) / allTime.totalRevenue) * 100)
          : 0,
      },
    };
    await cacheSet(cacheKey, result, 120);
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
