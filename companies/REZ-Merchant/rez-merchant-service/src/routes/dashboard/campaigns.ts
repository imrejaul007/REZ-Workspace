
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { Store } from '../../models/Store';
import { CampaignRule } from '../../models/CampaignRule';
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

// GET /dashboard/sales-data
router.get('/sales-data', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    const cacheKey = `dashboard:${req.merchantId}:sales:${period}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const now = new Date();
    let since: Date;
    let groupFormat: string;
    if (period === 'week') { since = new Date(now.getTime() - 7 * 86400000); groupFormat = '%Y-%m-%d'; }
    else if (period === 'year') { since = new Date(now.getFullYear(), 0, 1); groupFormat = '%Y-%m'; }
    else { since = new Date(now.getFullYear(), now.getMonth(), 1); groupFormat = '%Y-%m-%d'; }

    const salesData = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since }, 'payment.status': 'paid' } },
      { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ], AGG_OPTIONS);

    const result = {
      success: true,
      data: salesData.map((row) => ({
        date: row._id,
        amount: row.revenue || 0,
        orders: row.orders || 0,
      })),
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

// GET /dashboard/store-performance
router.get('/store-performance', async (req: Request, res: Response) => {
  try {
    const cacheKey = `dashboard:${req.merchantId}:storeperf`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const stores = await Store.find({ merchantId: req.merchantId }).lean();
    const storeIds = stores.map((store) => store._id);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [storeAgg, todayAgg, pendingAgg, lowStockAgg] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: monthStart }, 'payment.status': 'paid' } },
        {
          $group: {
            _id: '$store',
            revenue: { $sum: '$totals.total' },
            payout: { $sum: '$totals.merchantPayout' },
            orders: { $sum: 1 },
            avgOrder: { $avg: '$totals.total' },
            customers: { $addToSet: '$user' },
          },
        },
      ], AGG_OPTIONS),
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: today }, 'payment.status': 'paid' } },
        { $group: { _id: '$store', todayRevenue: { $sum: '$totals.total' }, todayOrders: { $sum: 1 } } },
      ], AGG_OPTIONS),
      Order.aggregate([
        {
          $match: {
            store: { $in: storeIds },
            status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] },
          },
        },
        { $group: { _id: '$store', pendingOrders: { $sum: 1 } } },
      ], AGG_OPTIONS),
      Product.aggregate([
        {
          $match: {
            merchant: new mongoose.Types.ObjectId(req.merchantId!),
            isActive: true,
            'inventory.unlimited': { $ne: true },
          },
        },
        {
          $match: {
            $expr: { $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 10] }] },
          },
        },
        { $group: { _id: '$store', lowStockProducts: { $sum: 1 } } },
      ]),
    ]);
    const statsMap = new Map(storeAgg.map((s) => [s._id.toString(), s]));
    const todayMap = new Map(todayAgg.map((s) => [s._id.toString(), s]));
    const pendingMap = new Map(pendingAgg.map((s) => [s._id.toString(), s]));
    const lowStockMap = new Map(lowStockAgg.map((s) => [s._id.toString(), s]));
    const performance = stores.map((store) => {
      const stats = statsMap.get(store._id.toString());
      const todayStats = todayMap.get(store._id.toString());
      const pendingStats = pendingMap.get(store._id.toString());
      const lowStockStats = lowStockMap.get(store._id.toString());
      return {
        storeId: store._id,
        name: store.name,
        logo: store.logo || null,
        slug: store.slug || store._id.toString(),
        isActive: store.isActive,
        rating: store.ratings?.average || 0,
        ratingCount: store.ratings?.count || 0,
        category: store.category || '',
        location: store.location?.city || store.location?.address || '',
        cashbackPercent: store.offers?.cashback || 0,
        monthlyRevenue: stats?.revenue || 0,
        monthlyPayout: stats?.payout || 0,
        monthlyOrders: stats?.orders || 0,
        pendingOrders: pendingStats?.pendingOrders || 0,
        completedOrders: 0,
        cancelledOrders: 0,
        avgOrderValue: stats?.avgOrder || 0,
        uniqueCustomers: stats?.customers?.length || 0,
        todayOrders: todayStats?.todayOrders || 0,
        todayRevenue: todayStats?.todayRevenue || 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: lowStockStats?.lowStockProducts || 0,
        outOfStockProducts: 0,
        pendingCashbackCount: 0,
        pendingCashbackAmount: 0,
      };
    });

    const result = {
      success: true,
      data: {
        stores: performance,
        summary: {
          totalStores: stores.length,
          activeStores: stores.filter((store) => store.isActive).length,
          totalMonthlyRevenue: performance.reduce((sum: number, store) => sum + (store.monthlyRevenue || 0), 0),
          totalMonthlyOrders: performance.reduce((sum: number, store) => sum + (store.monthlyOrders || 0), 0),
          totalPendingOrders: performance.reduce((sum: number, store) => sum + (store.pendingOrders || 0), 0),
        },
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

// GET /dashboard/action-items
router.get('/action-items', async (req: Request, res: Response) => {
  try {
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const [pendingOrders, lowStock, inactiveStores, activeCampaigns] = await Promise.all([
      Order.countDocuments({
        store: { $in: storeIds },
        status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] },
      }),
      Product.countDocuments({
        merchant: req.merchantId, isActive: true, 'inventory.unlimited': { $ne: true },
        $expr: { $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 10] }] },
      }),
      Store.countDocuments({ merchantId: req.merchantId, isActive: false }),
      CampaignRule.countDocuments({ merchantId: req.merchantId, status: 'active' }),
    ]);
    const actionItems: unknown[] = [];
    if (pendingOrders > 0) {
      actionItems.push({
        id: 'pending-orders',
        type: 'orders',
        priority: pendingOrders > 10 ? 'urgent' : 'high',
        title: 'Pending orders need action',
        description: `${pendingOrders} live orders are waiting for confirmation or preparation.`,
        storeName: 'All stores',
        storeId: req.query.storeId || 'all',
        count: pendingOrders,
        deepLink: '/(dashboard)/orders',
        icon: 'receipt-outline',
        color: '#F97316',
      });
    }
    if (lowStock > 0) {
      actionItems.push({
        id: 'low-stock',
        type: 'inventory',
        priority: lowStock > 10 ? 'high' : 'medium',
        title: 'Low stock products',
        description: `${lowStock} items are at or below their low-stock threshold.`,
        storeName: 'All stores',
        storeId: req.query.storeId || 'all',
        count: lowStock,
        deepLink: '/(dashboard)/products',
        icon: 'cube-outline',
        color: '#DC2626',
      });
    }
    if (inactiveStores > 0) {
      actionItems.push({
        id: 'inactive-stores',
        type: 'stores',
        priority: 'medium',
        title: 'Inactive store locations',
        description: `${inactiveStores} stores are inactive and may not be receiving customer traffic.`,
        storeName: 'All stores',
        storeId: 'all',
        count: inactiveStores,
        deepLink: '/stores',
        icon: 'storefront-outline',
        color: '#6366F1',
      });
    }
    if (activeCampaigns === 0) {
      actionItems.push({
        id: 'campaign-opportunity',
        type: 'marketing',
        priority: 'low',
        title: 'No active campaign running',
        description: 'Launch an offer to improve repeat visits and order frequency.',
        storeName: 'All stores',
        storeId: 'all',
        count: 1,
        deepLink: '/(dashboard)/create-offer',
        icon: 'megaphone-outline',
        color: '#10B981',
      });
    }
    res.json({
      success: true,
      data: {
        actionItems,
        summary: {
          total: actionItems.length,
          urgent: actionItems.filter((item) => item.priority === 'urgent').length,
          high: actionItems.filter((item) => item.priority === 'high').length,
          medium: actionItems.filter((item) => item.priority === 'medium').length,
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

// GET /dashboard/campaign-performance
router.get('/campaign-performance', async (req: Request, res: Response) => {
  try {
    const campaigns = await CampaignRule.find({
      merchantId: req.merchantId,
      status: { $in: ['active', 'scheduled'] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: campaigns.map((campaign) => ({
        campaignId: campaign._id,
        campaignName: campaign.title || campaign.name || 'Campaign',
        type: campaign.type || campaign.ruleType || 'promotion',
        status: campaign.status || 'active',
        attributedRevenue: campaign.attributedRevenue || 0,
        customersReached: campaign.customersReached || 0,
        conversionRate: campaign.conversionRate || 0,
        roi: campaign.roi || 0,
        startDate: campaign.startDate || campaign.createdAt,
        endDate: campaign.endDate || undefined,
      })),
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /dashboard/activity
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const orders = await Order.find({ store: { $in: storeIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber status totals.total createdAt')
      .lean();
    res.json({
      success: true,
      data: orders.map((order) => ({
        type: 'order',
        title: `Order ${order.orderNumber || ''}`.trim(),
        description: `${order.status} • Rs.${Number(order.totals?.total || 0).toFixed(0)}`,
        timestamp: order.createdAt,
        metadata: { orderId: order._id, status: order.status },
      })),
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /dashboard/today-revenue
router.get('/today-revenue', async (req: Request, res: Response) => {
  try {
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000);
    const [todayAgg, yesterdayAgg] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: today }, 'payment.status': 'paid' } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totals.total' },
            payout: { $sum: '$totals.merchantPayout' },
            platformFee: { $sum: '$totals.platformFee' },
            orders: { $sum: 1 },
          },
        },
      ], AGG_OPTIONS),
      Order.aggregate([
        {
          $match: {
            store: { $in: storeIds },
            createdAt: { $gte: yesterday, $lt: today },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totals.total' },
            payout: { $sum: '$totals.merchantPayout' },
            orders: { $sum: 1 },
          },
        },
      ], AGG_OPTIONS),
    ]);
    const current = todayAgg[0] || { revenue: 0, payout: 0, platformFee: 0, orders: 0 };
    const previous = yesterdayAgg[0] || { revenue: 0, payout: 0, orders: 0 };
    res.json({
      success: true,
      data: {
        totalGMV: current.revenue || 0,
        totalOrders: current.orders || 0,
        merchantEarnings: current.payout || 0,
        ordersLastDay: previous.orders || 0,
        ordersChange: (current.orders || 0) - (previous.orders || 0),
        commissionRate: current.revenue ? (((current.platformFee || 0) / current.revenue) * 100) : 0,
        vsYesterday: {
          gmv: previous.revenue || 0,
          orders: previous.orders || 0,
          change: (current.revenue || 0) - (previous.revenue || 0),
          percentChange: percentChange(current.revenue || 0, previous.revenue || 0),
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

// GET /dashboard/recent-orders
router.get('/recent-orders', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const orders = await Order.find({ store: { $in: storeIds } })
      .sort({ createdAt: -1 }).limit(limit)
      .populate('store', 'name')
      .select('orderNumber status totals items createdAt deliveryType')
      .lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
