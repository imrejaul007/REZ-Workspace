import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { WebOrder } from '../models/WebOrder';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string, requestedStoreId?: string): Promise<mongoose.Types.ObjectId[]> {
  const query: Record<string, unknown> = { merchant: new mongoose.Types.ObjectId(merchantId) };
  if (requestedStoreId && mongoose.Types.ObjectId.isValid(requestedStoreId)) {
    query._id = new mongoose.Types.ObjectId(requestedStoreId);
  }
  const stores = await Store.find(query, '_id').lean();
  return stores.map((s) => s._id);
}

// GET /web-orders — paginated list of web QR orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    if (!merchantId) {
      res.status(400).json({ success: false, message: 'Merchant ID required' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const storeIdParam = req.query.storeId as string | undefined;
    const statusParam = req.query.status as string | undefined;

    const storeIds = await getMerchantStoreIds(merchantId, storeIdParam);

    if (storeIds.length === 0) {
      res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
      });
      return;
    }

    const filter: Record<string, unknown> = { storeId: { $in: storeIds } };
    if (statusParam) filter.status = statusParam;

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate as string);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate as string);
    }

    const [orders, total] = await Promise.all([
      WebOrder.find(filter)
        .select(
          'orderNumber items total tipAmount tipPercentage totalWithTip billSplits status ' +
          'customerPhone customerName tableNumber storeName storeSlug paymentStatus ' +
          'specialInstructions channel createdAt updatedAt',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WebOrder.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /web-orders/:orderNumber — single web order detail
router.get('/:orderNumber', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    if (!merchantId) {
      res.status(400).json({ success: false, message: 'Merchant ID required' });
      return;
    }

    const { orderNumber } = req.params;
    const storeIds = await getMerchantStoreIds(merchantId);

    if (storeIds.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const order = await WebOrder.findOne({
      orderNumber,
      storeId: { $in: storeIds },
    }).lean();

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
