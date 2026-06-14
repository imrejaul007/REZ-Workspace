
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { AuditLog } from '../../models/AuditLog';
import { merchantAuth } from '../../middleware/auth';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { createRateLimiter } from '@rez/shared';

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

const bulkLimiter = createRateLimiter(
  redis.call.bind(redis),
  {
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: 'rl:order:bulk',
    keyGenerator: (req: Request) => `bulk:${req.merchantId || 'unknown'}`,
    message: 'Too many bulk operations.',
  }
);

// POST /orders/bulk-action
router.post('/bulk-action', bulkLimiter, async (req: Request, res: Response) => {
  try {
    const { orderIds, action, notes } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) { res.status(400).json({ success: false, message: 'orderIds array is required' }); return; }
    if (orderIds.length > 100) { res.status(400).json({ success: false, message: 'Cannot process more than 100 orders at once' }); return; }
    const invalidIds = orderIds.filter((id: string) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) { res.status(400).json({ success: false, message: `Invalid orderId format: ${invalidIds.join(', ')}` }); return; }
    if (!action) { res.status(400).json({ success: false, message: 'action is required' }); return; }

    const actionStatusMap: Record<string, string> = { confirm: 'confirmed', prepare: 'preparing', ready: 'ready', deliver: 'delivered', cancel: 'cancelled' };
    const actionExpectedStatus: Record<string, string> = { confirm: 'placed', prepare: 'confirmed', ready: 'preparing', deliver: 'ready', cancel: 'placed' };
    const newStatus = actionStatusMap[action];
    if (!newStatus) { res.status(400).json({ success: false, message: `Unknown action: ${action}` }); return; }

    const stores = await Store.find({ $or: [{ merchant: req.merchantId }, { merchantId: req.merchantId }] }, '_id').lean();
    const storeIds = stores.map((s) => s._id);

    const results: Array<{ success: boolean; orderId: string; message?: string }> = [];
    for (const orderId of orderIds) {
      try {
        const updated = await Order.findOneAndUpdate(
          { _id: orderId, store: { $in: storeIds }, status: actionExpectedStatus[action] },
          { $set: { status: newStatus }, $push: { statusHistory: { status: newStatus, timestamp: new Date(), note: notes } } },
          { new: true },
        );
        if (updated) { results.push({ success: true, orderId }); }
        else { results.push({ success: false, orderId, message: 'Order not found or status changed' }); }
      } catch (e) { results.push({ success: false, orderId, message: e.message }); }
    }

    const successful = results.filter((r) => r.success).length;
    const successfulIds = results.filter((r) => r.success).map((r) => r.orderId);
    if (successfulIds.length > 0) {
      await AuditLog.create({
        merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
        merchantUserId: req.merchantUserId ? new mongoose.Types.ObjectId(req.merchantUserId) : undefined,
        action: 'ORDER_BULK_STATUS_UPDATE', resourceType: 'order', resourceId: successfulIds.join(','),
        severity: newStatus === 'cancelled' ? 'high' : 'medium',
        details: { action, newStatus, notes, affectedOrderIds: successfulIds, failedCount: orderIds.length - successful },
      }).catch((err) => logger.error('[orders] Failed audit log', { action, merchantId: req.merchantId, error: err?.message }));
    }

    res.json({ success: true, data: { results, summary: { total: orderIds.length, successful, failed: orderIds.length - successful } } });
  } catch (err) {
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

// POST /orders/sample-data
router.post('/sample-data', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ success: false, message: 'Sample data creation is not allowed in production' }); return;
  }
  res.json({ success: true, data: { message: 'Sample data creation is a no-op in this environment', merchantId: req.merchantId } });
});

export default router;
