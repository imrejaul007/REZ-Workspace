import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const { storeId, campaignType, rewardValue, budgetCap, durationDays, estimatedDailyFootfall = 50, estimatedAvgBill = 500 } = req.body;
    if (!storeId || !campaignType || !rewardValue || !budgetCap || !durationDays) { res.status(400).json({ success: false, message: 'Missing required fields' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(403).json({ success: false, message: 'Store not found' }); return; }
    const dailyFootfall = Number(estimatedDailyFootfall);
    const avgBill = Number(estimatedAvgBill);
    const days = Number(durationDays);
    const reward = Number(rewardValue);
    const budget = Number(budgetCap);
    const totalCustomers = dailyFootfall * days;
    const projectedRevenue = totalCustomers * avgBill;
    let costPerCustomer = 0;
    if (campaignType === 'cashback_percentage') costPerCustomer = avgBill * (reward / 100);
    else if (campaignType === 'flat_bonus') costPerCustomer = reward;
    else if (campaignType === 'multiplier') costPerCustomer = avgBill * 0.05 * (reward - 1);
    const totalCost = Math.min(totalCustomers * costPerCustomer, budget);
    const roi = totalCost > 0 ? (projectedRevenue / totalCost).toFixed(2) : 'N/A';
    res.json({ success: true, data: { campaignType, durationDays: days, projectedRevenue, totalCost, roi: `${roi}x`, totalCustomers, budgetUtilization: `${((totalCost / budget) * 100).toFixed(1)}%` } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
