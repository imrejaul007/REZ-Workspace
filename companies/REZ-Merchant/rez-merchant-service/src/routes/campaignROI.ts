import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { Cashback } from '../models/Cashback';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId, days = '30' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const start = new Date(Date.now() - parseInt(days) * 86400000);
    const [revenue, cashback] = await Promise.all([
      StorePayment.aggregate([{ $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: start } } }, { $group: { _id: null, total: { $sum: '$billAmount' }, count: { $sum: 1 } } }]),
      Cashback.aggregate([{ $match: { merchantId: new mongoose.Types.ObjectId(req.merchantId as string), createdAt: { $gte: start } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const rev = revenue[0]?.total || 0;
    const cost = cashback[0]?.total || 0;
    res.json({ success: true, data: { revenue: rev, cashbackCost: cost, roi: cost > 0 ? (rev / cost).toFixed(2) + 'x' : 'N/A', orders: revenue[0]?.count || 0, period: days + 'd' } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
