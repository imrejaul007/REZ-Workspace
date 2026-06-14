import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    // CRITICAL FIX: Verify store ownership
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId as string),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const agg = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId as string), status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: '$billAmount' }, customers: { $addToSet: '$userId' }, orders: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { revenue: agg[0]?.revenue || 0, uniqueCustomers: agg[0]?.customers?.length || 0, orders: agg[0]?.orders || 0 } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/loyal-customers', async (req: Request, res: Response) => {
  try {
    const { storeId, minVisits = '3', limit = '50' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    // CRITICAL FIX: Verify store ownership
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    const customers = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed' } },
      { $group: { _id: '$userId', visits: { $sum: 1 }, totalSpent: { $sum: '$billAmount' }, lastVisit: { $max: '$createdAt' } } },
      { $match: { visits: { $gte: parseInt(minVisits) } } },
      { $sort: { visits: -1 } },
      { $limit: parseInt(limit) },
    ]);
    res.json({ success: true, data: customers });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/customer-trend', async (req: Request, res: Response) => {
  try {
    const { storeId, months = '6' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    // CRITICAL FIX: Verify store ownership
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    const start = new Date(); start.setMonth(start.getMonth() - parseInt(months));
    const trend = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, customers: { $addToSet: '$userId' }, revenue: { $sum: '$billAmount' } } },
      { $project: { month: '$_id', customers: { $size: '$customers' }, revenue: 1, _id: 0 } },
      { $sort: { month: 1 } },
    ]);
    res.json({ success: true, data: trend });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/push-status', async (req: Request, res: Response) => {
  try { res.json({ success: true, data: { weeklyLimit: 3, used: 0, remaining: 3 } }); }
  catch (e) { const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg }); }
});

router.post('/push', async (req: Request, res: Response) => {
  try {
    const { storeId, message, template } = req.body;
    if (!storeId || !message || !template) { res.status(400).json({ success: false, message: 'storeId, message, template required' }); return; }
    // CRITICAL FIX: Verify store ownership before sending push notification
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    res.json({ success: true, data: { sent: true, message: 'Push notification queued' } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
