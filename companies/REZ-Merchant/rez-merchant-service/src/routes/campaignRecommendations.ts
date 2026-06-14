
import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { Store } from '../models/Store';
import { CampaignRule } from '../models/CampaignRule';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    let finalStoreId = storeId;
    if (!finalStoreId) {
      const stores = await Store.find({ merchantId: req.merchantId }, '_id').limit(1).lean();
      if (stores.length > 0) finalStoreId = stores[0]._id.toString();
      else return res.json({ success: true, data: { recommendations: [], storeStats: { avgBill: 0, uniqueCustomers: 0 } } });
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const stats = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(finalStoreId as string), status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, avgBill: { $avg: '$billAmount' }, customers: { $addToSet: '$userId' }, total: { $sum: 1 } } },
    ]);
    const avg = stats[0]?.avgBill || 0;
    const custs = stats[0]?.customers?.length || 0;
    const recs = [];
    if (custs < 50) recs.push({ type: 'cashback_percentage', title: 'New Customer Acquisition', description: 'Offer 10% cashback to attract first-time visitors', rewardValue: 10, budgetCap: 5000, durationDays: 14 });
    if (avg < 500) recs.push({ type: 'flat_bonus', title: 'Increase Basket Size', description: 'Offer ₹50 bonus on orders above ₹500', rewardValue: 50, budgetCap: 3000, durationDays: 7 });
    recs.push({ type: 'multiplier', title: 'Loyalty Booster', description: '2x REZ coins for repeat customers', rewardValue: 2, budgetCap: 2000, durationDays: 30 });
    res.json({ success: true, data: { recommendations: recs, storeStats: { avgBill: Math.round(avg), uniqueCustomers: custs } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/launch-recommendation', async (req: Request, res: Response) => {
  try {
    const { recommendationId, budget, targetSegment, duration } = req.body;
    if (!recommendationId || budget === undefined || !targetSegment) {
      res.status(400).json({ success: false, message: 'recommendationId, budget, and targetSegment are required' });
      return;
    }
    const campaign = await CampaignRule.create({
      merchantId: req.merchantId,
      recommendationId,
      budget: Number(budget),
      targetSegment,
      duration: duration ? Number(duration) : 14,
      status: 'active',
      source: 'recommendation',
      launchedAt: new Date(),
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
