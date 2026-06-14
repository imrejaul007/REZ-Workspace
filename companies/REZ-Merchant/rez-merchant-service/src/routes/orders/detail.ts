import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { redis } from '../../config/redis';

const router = Router();
router.use(merchantAuth);

// Suspension check
router.use(async (req: Request, res: Response, next) => {
  if (!req.merchantId) { next(); return; }
  try {
    const isSuspended = await redis.get(`merchant:suspended:${req.merchantId}`);
    if (isSuspended) { res.status(403).json({ success: false, message: 'Your merchant account has been suspended.' }); return; }
  } catch { /* Redis failure */ }
  next();
});

function errMsg(req: Request, err): string {
  const requestId = (req as unknown).res?.locals?.requestId;
  return process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err.message;
}

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find({ $or: [{ merchant: merchantId }, { merchantId: merchantId }] }, '_id').lean();
  return stores.map((s) => s._id);
}

// GET /orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const order = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } })
      .populate('store', 'name logo location')
      .populate('items.product', 'name images pricing')
      .lean();
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

export default router;
