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

// POST /orders/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const { isValidMerchantTransition, getMerchantNextStatuses } = await import('../../utils/orderStateMachine');

    const order = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } }, 'status');
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    if (!isValidMerchantTransition(order.status, 'cancelled')) {
      res.status(400).json({ success: false, message: `Cannot cancel order in "${order.status}" status`, currentStatus: order.status, validNextStatuses: getMerchantNextStatuses(order.status) }); return;
    }

    const cancelled = await Order.findOneAndUpdate(
      { _id: req.params.id, store: { $in: storeIds }, status: order.status },
      { $set: { status: 'cancelled', cancellationReason: reason || 'Merchant cancelled' } },
      { new: true },
    );
    if (!cancelled) { res.status(409).json({ success: false, message: 'Order status was modified concurrently. Please retry.' }); return; }
    res.json({ success: true, data: cancelled });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

// POST /orders/:id/refund
router.post('/:id/refund', async (req: Request, res: Response) => {
  try {
    const { amount, reason } = req.body;
    const storeIds = await getMerchantStoreIds(req.merchantId!);

    const order = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } }).lean();
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    if ((order as unknown).status === 'refunded' || (order as unknown).refunded) {
      res.status(400).json({ success: false, message: 'Order already refunded', refunded: true }); return;
    }

    if (amount !== undefined && amount !== null) {
      if (typeof amount !== 'number' || !Number.isFinite(amount)) { res.status(400).json({ success: false, message: 'refund amount must be a finite number' }); return; }
      if (amount <= 0) { res.status(400).json({ success: false, message: 'refund amount must be greater than 0' }); return; }
      const orderTotal = (order as unknown).totals?.total ?? 0;
      if (amount > orderTotal) { res.status(400).json({ success: false, message: `refund amount (${amount}) exceeds order total (${orderTotal})` }); return; }
    }

    if (reason !== undefined && reason !== null) {
      if (typeof reason !== 'string' || reason.trim().length === 0) { res.status(400).json({ success: false, message: 'refund reason must be a non-empty string' }); return; }
    }

    const refundAmount = amount ?? (order as unknown).totals?.total ?? 0;
    const refund = await Order.findOneAndUpdate(
      { _id: req.params.id, store: { $in: storeIds }, status: { $ne: 'refunded' }, refunded: { $ne: true } },
      { $set: { status: 'refunded', refundAmount, refundReason: reason || 'Merchant refunded', refundedAt: new Date() } },
      { new: true },
    );
    if (!refund) { res.status(400).json({ success: false, message: 'Order already refunded', refunded: true }); return; }
    res.json({ success: true, data: refund });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

export default router;
