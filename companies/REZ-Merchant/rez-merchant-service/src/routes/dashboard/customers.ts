import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { merchantAuth } from '../../middleware/auth';

const AGG_OPTIONS = { maxTimeMS: 30000 };

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const { Store } = await import('../../models/Store');
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

// GET /dashboard/customer-payments
router.get('/customer-payments', async (req: Request, res: Response) => {
  try {
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const [payments, totalItems] = await Promise.all([
      Order.find({ store: { $in: storeIds }, 'payment.status': 'paid' })
        .sort({ 'payment.paidAt': -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('orderNumber user store totals.total totals.merchantPayout totals.cashback payment status createdAt deliveryType')
        .populate('user', 'name phone avatar')
        .populate('store', 'name')
        .lean(),
      Order.countDocuments({ store: { $in: storeIds }, 'payment.status': 'paid' }),
    ]);
    res.json({
      success: true,
      data: {
        payments: payments.map((payment) => ({
          type: 'order',
          id: payment._id,
          orderNumber: payment.orderNumber || null,
          customerName: payment.user?.name || 'Customer',
          customerPhone: payment.user?.phone || '',
          customerImage: payment.user?.avatar || null,
          storeName: payment.store?.name || 'Store',
          storeId: payment.store?._id || payment.store,
          amount: payment.totals?.total || 0,
          merchantPayout: payment.totals?.merchantPayout || 0,
          paymentMethod: payment.payment?.method || 'unknown',
          coinsUsed: payment.totals?.cashback || 0,
          status: payment.status || payment.payment?.status || 'paid',
          fulfillmentType: payment.deliveryType || 'order',
          createdAt: payment.payment?.paidAt || payment.createdAt,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          hasNextPage: page * limit < totalItems,
          hasPrevPage: page > 1,
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

// GET /dashboard/customer-retention
router.get('/customer-retention', async (req: Request, res: Response) => {
  try {
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const [todayCustomers, weekCustomers] = await Promise.all([
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: today }, 'payment.status': 'paid' } },
        { $group: { _id: '$user', orderCount: { $sum: 1 } } },
        {
          $lookup: {
            from: 'orders',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $in: ['$store', storeIds] },
                      { $eq: ['$payment.status', 'paid'] },
                    ],
                  },
                },
              },
              { $count: 'orderCount' },
            ],
            as: 'history',
          },
        },
        {
          $project: {
            isReturning: {
              $gt: [{ $ifNull: [{ $arrayElemAt: ['$history.orderCount', 0] }, 0] }, 1],
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { store: { $in: storeIds }, createdAt: { $gte: weekAgo }, 'payment.status': 'paid' } },
        { $group: { _id: '$user', orderCount: { $sum: 1 } } },
      ], AGG_OPTIONS),
    ]);

    const totalCustomersToday = todayCustomers.length;
    const returningCustomersToday = todayCustomers.filter((customer) => customer.isReturning).length;
    const weeklyReturning = weekCustomers.filter((customer) => (customer.orderCount || 0) > 1).length;

    res.json({
      success: true,
      data: {
        returningCustomersToday,
        totalCustomersToday,
        returnRatePercent: totalCustomersToday
          ? (returningCustomersToday / totalCustomersToday) * 100
          : 0,
        weeklyReturnRate: weekCustomers.length ? (weeklyReturning / weekCustomers.length) * 100 : 0,
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
