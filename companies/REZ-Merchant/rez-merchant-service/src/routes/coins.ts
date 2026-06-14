
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CoinTransaction } from '../models/CoinTransaction';
import { merchantAuth, requireVerifiedMerchant } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);
// HIGH FIX: Gate coin endpoints to verified merchants only
router.use(requireVerifiedMerchant);

const COIN_ALLOWED_FIELDS = [
  'storeId', 'customerId', 'type', 'amount', 'coins', 'description',
  'orderId', 'status', 'expiresAt', 'reason', 'metadata',
];

function pickCoinFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of COIN_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      CoinTransaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CoinTransaction.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await CoinTransaction.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    // MEDIUM FIX: Make orderId required and validate it exists and belongs to merchant
    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'orderId is required',
      });
      return;
    }

    // Validate orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid orderId format',
      });
      return;
    }

    // Accept idempotency key from header or body
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;

    // Idempotency: if an idempotency key is provided, check for an existing transaction
    if (idempotencyKey) {
      const existing = await CoinTransaction.findOne({
        'metadata.idempotencyKey': idempotencyKey,
        merchantId: req.merchantId,
      }).lean();
      if (existing) {
        res.status(200).json({ success: true, data: existing, idempotent: true });
        return;
      }
    }

    // Verify the order exists and belongs to this merchant's store
    const Order = (await import('../models/Order')).Order;
    const order = await Order.findOne({
      _id: orderId,
      merchant: req.merchantId,
    })
      .select('_id')
      .lean();

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to your merchant account',
      });
      return;
    }

    const docData = pickCoinFields(req.body);
    if (idempotencyKey) {
      docData.metadata = { ...(docData.metadata || {}), idempotencyKey };
    }

    const item = await CoinTransaction.create({
      ...docData,
      merchantId: req.merchantId,
      orderId,
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickCoinFields(req.body);
    allowedFields.updatedAt = new Date();
    const item = await CoinTransaction.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: allowedFields }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await CoinTransaction.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /coins/wallet-balance
router.get('/wallet-balance', async (req: Request, res: Response) => {
  try {
    const balance = await CoinTransaction.aggregate([
      { $match: { merchantId: req.merchantId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, data: { available: balance[0]?.total ?? 0, total: balance[0]?.total ?? 0 } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /coins/history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    const [items, total] = await Promise.all([
      CoinTransaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CoinTransaction.countDocuments(query)
    ]);
    res.json({ success: true, data: { transactions: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /coins/recent-customers
router.get('/recent-customers', async (req: Request, res: Response) => {
  try {
    const pipeline = [
      { $match: { merchantId: req.merchantId } },
      { $group: { _id: '$customerId', lastOrderAt: { $max: '$createdAt' as unknown as number }, totalSpent: { $sum: '$amount' }, orderCount: { $sum: 1 } } },
      { $sort: { lastOrderAt: -1 } },
      { $limit: 20 }
    ] as mongoose.PipelineStage[];
    const results = await CoinTransaction.aggregate(pipeline);
    res.json({ success: true, data: results });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /coins/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const match: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) match.storeId = req.query.storeId;
    const [overall, todayAgg, monthlyAgg] = await Promise.all([
      CoinTransaction.aggregate([{ $match: match }, { $group: { _id: null, totalCoinsAwarded: { $sum: '$amount' }, totalAwards: { $sum: 1 }, uniqueCustomers: { $addToSet: '$customerId' } } }]),
      CoinTransaction.aggregate([{ $match: { ...match, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }, { $group: { _id: null, coinsAwarded: { $sum: '$amount' }, awardCount: { $sum: 1 } } }]),
      CoinTransaction.aggregate([{ $match: match }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, coinsAwarded: { $sum: '$amount' }, awardCount: { $sum: 1 } } }, { $sort: { '_id.year': -1, '_id.month': -1 } }, { $limit: 12 }])
    ]);
    res.json({
      success: true,
      data: {
        overall: {
          totalCoinsAwarded: overall[0]?.totalCoinsAwarded ?? 0,
          totalAwards: overall[0]?.totalAwards ?? 0,
          uniqueCustomers: overall[0]?.uniqueCustomers?.length ?? 0,
          avgCoinsPerAward: overall[0]?.totalAwards ? (overall[0].totalCoinsAwarded / overall[0].totalAwards) : 0
        },
        today: {
          coinsAwarded: todayAgg[0]?.coinsAwarded ?? 0,
          awardCount: todayAgg[0]?.awardCount ?? 0
        },
        monthlyBreakdown: monthlyAgg.map((m) => ({ year: m._id.year, month: m._id.month, coinsAwarded: m.coinsAwarded, awardCount: m.awardCount }))
      }
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
