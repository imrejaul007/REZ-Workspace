import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/feedback', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [orders, total] = await Promise.all([
      Order.find({ store: { $in: storeIds }, 'feedback.rating': { $exists: true } }).sort({ 'feedback.createdAt': -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments({ store: { $in: storeIds }, 'feedback.rating': { $exists: true } }),
    ]);
    res.json({ success: true, data: { feedback: orders.map((o) => ({ orderId: o._id, rating: o.feedback?.rating, comment: o.feedback?.comment, createdAt: o.feedback?.createdAt })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const stats = await Order.aggregate([
      { $match: { store: { $in: storeIds }, 'feedback.rating': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, total: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: stats[0] || { avgRating: 0, total: 0 } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /post-purchase/rules
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const rules = await Order.aggregate([
      { $match: { merchant: new mongoose.Types.ObjectId(req.merchantId) } },
      { $group: { _id: '$store', orderCount: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: rules });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /post-purchase/rules
router.post('/rules', async (req: Request, res: Response) => {
  try {
    res.status(501).json({ success: false, message: 'Post-purchase rules not yet configured' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
