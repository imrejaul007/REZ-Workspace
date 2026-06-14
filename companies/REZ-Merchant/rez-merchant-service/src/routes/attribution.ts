import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { storeId, period } = req.query;
    const days = parseInt(((period as string) || '30').replace('d', '')) || 30;
    const start = new Date(Date.now() - days * 86400000);
    let sid = storeId as string;
    if (!sid) {
      const s = await Store.findOne({ merchantId: req.merchantId }).select('_id').lean() as unknown;
      if (!s) { res.status(404).json({ success: false, message: 'No store' }); return; }
      sid = s._id.toString();
    }
    const store = await Store.findOne({ _id: sid, merchantId: req.merchantId });
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    const agg = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(sid), status: 'completed', createdAt: { $gte: start } } },
      { $group: { _id: null, revenue: { $sum: '$billAmount' }, users: { $addToSet: '$userId' }, coins: { $sum: { $ifNull: ['$rewards.coinsEarned', 0] } } } },
    ]);
    res.json({ success: true, data: { period: days + 'd', revenue: agg[0]?.revenue || 0, customers: agg[0]?.users?.length || 0, coinsIssued: agg[0]?.coins || 0 } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
