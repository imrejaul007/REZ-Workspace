import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { redis } from '../../config/redis';
import { cacheDel } from '../../config/redis';
import { captureIntent } from '../../utils/intentCapture';
import { createServiceLogger } from '../../config/logger';

const logger = createServiceLogger('orders-status');
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

// PUT /orders/:id/status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, notes, note } = req.body;
    const resolvedNote = notes || note;
    const { isValidMerchantTransition, getMerchantNextStatuses } = await import('../../utils/orderStateMachine');
    const storeIds = await getMerchantStoreIds(req.merchantId!);

    const order = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } }, 'status');
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    if (!isValidMerchantTransition(order.status, status)) {
      res.status(400).json({ success: false, message: `Invalid status transition: "${order.status}" → "${status}". Allowed: [${getMerchantNextStatuses(order.status).join(', ')}]`, currentStatus: order.status, validNextStatuses: getMerchantNextStatuses(order.status) }); return;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, store: { $in: storeIds }, status: order.status },
      { $set: { status }, $push: { statusHistory: { status, timestamp: new Date(), note: resolvedNote } } },
      { new: true },
    );
    if (!updatedOrder) { const current = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } }, 'status').lean(); res.status(409).json({ success: false, message: 'Order status was modified concurrently.', currentStatus: current?.status }); return; }

    // Intent capture for merchant order received (when order is confirmed/accepted)
    const merchantId = req.merchantId;
    if (merchantId && (status === 'confirmed' || status === 'accepted')) {
      captureIntent({
        userId: merchantId,
        appType: 'restaurant',
        eventType: 'fulfilled' as unknown,
        intentKey: `merchant_order_${updatedOrder._id}_${Date.now()}`,
        category: 'DINING',
        metadata: {
          orderId: String(updatedOrder._id),
          merchantId,
          status,
          previousStatus: order.status,
          total: (updatedOrder as unknown).total || (updatedOrder as unknown).amount,
        },
      }).catch((err: unknown) => logger.warn('[Intent] Merchant order intent failed', { orderId: String(updatedOrder._id), error: err instanceof Error ? err.message : String(err) }));
    }

    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

// PATCH /orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const { isValidMerchantTransition, getMerchantNextStatuses } = await import('../../utils/orderStateMachine');
    const storeIds = await getMerchantStoreIds(req.merchantId!);

    const order = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } }, 'status');
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    if (!isValidMerchantTransition(order.status, status)) {
      res.status(400).json({ success: false, message: `Invalid status transition: "${order.status}" → "${status}". Allowed: [${getMerchantNextStatuses(order.status).join(', ')}]`, currentStatus: order.status, validNextStatuses: getMerchantNextStatuses(order.status) }); return;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, store: { $in: storeIds }, status: order.status },
      { $set: { status }, $push: { statusHistory: { status, timestamp: new Date(), note } } },
      { new: true },
    );
    if (!updatedOrder) { const current = await Order.findOne({ _id: req.params.id, store: { $in: storeIds } }, 'status').lean(); res.status(409).json({ success: false, message: 'Order status was modified concurrently.', currentStatus: current?.status }); return; }

    await cacheDel(`dashboard:${req.merchantId}:*`);
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

export default router;
