
import { Router, Request, Response } from 'express';
import { StoreVisit } from '../models/StoreVisit';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [visits, total] = await Promise.all([
      StoreVisit.find({ storeId: { $in: storeIds } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StoreVisit.countDocuments({ storeId: { $in: storeIds } }),
    ]);
    res.json({ success: true, data: { visits, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const stats = await StoreVisit.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      { $group: { _id: null, total: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
    ]);
    res.json({ success: true, data: { totalVisits: stats[0]?.total || 0, uniqueVisitors: stats[0]?.uniqueUsers?.length || 0 } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.put('/:visitId/status', async (req: Request, res: Response) => {
  try {
    const visit = await StoreVisit.findByIdAndUpdate(req.params.visitId, { $set: { status: req.body.status } }, { new: true });
    if (!visit) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: visit });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
