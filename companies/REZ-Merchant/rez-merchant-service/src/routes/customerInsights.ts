import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { StoreVisit } from '../models/StoreVisit';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// GET /customers/insights — top customers, visit frequency, new vs returning, peak hours
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query as unknown;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' });
      return;
    }

    // CRITICAL FIX: Verify store ownership before accessing customer data
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) {
      res.status(403).json({ success: false, message: 'Access denied: store not found or not owned by you' });
      return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const storeObjId = new mongoose.Types.ObjectId(storeId);

    // Top customers: top 10 by visit count using StoreVisit collection
    const topCustomersAgg = await StoreVisit.aggregate([
      { $match: { storeId: storeObjId } },
      {
        $group: {
          _id: '$userId',
          visitCount: { $sum: 1 },
          coinsEarned: { $sum: { $ifNull: ['$coinsEarned', 0] } },
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $sort: { visitCount: -1 } },
      { $limit: 10 },
    ]);

    // Visit frequency: avg visits per user over last 30 days per day/week/month
    const recentVisits = await StoreVisit.aggregate([
      { $match: { storeId: storeObjId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const totalUsers = recentVisits.length || 1;
    const totalVisits = recentVisits.reduce((sum: number, u) => sum + u.count, 0);
    const visitFrequency = {
      daily: parseFloat((totalVisits / 30).toFixed(2)),
      weekly: parseFloat((totalVisits / 4.3).toFixed(2)),
      monthly: parseFloat((totalVisits / totalUsers).toFixed(2)),
    };

    // New vs returning: 1 visit = new, 2+ = returning in last 30 days
    const newCount = recentVisits.filter((u) => u.count === 1).length;
    const returningCount = recentVisits.filter((u) => u.count > 1).length;

    // Peak hours: visit count per hour of day for last 30 days
    const peakHoursAgg = await StoreVisit.aggregate([
      { $match: { storeId: storeObjId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $hour: '$createdAt' }, visitCount: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);

    // Fill all 24 hours (missing hours = 0)
    const peakHoursMap: Record<number, number> = {};
    peakHoursAgg.forEach((h) => { peakHoursMap[h._id] = h.visitCount; });
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visitCount: peakHoursMap[hour] || 0,
    }));

    res.json({
      success: true,
      data: {
        topCustomers: topCustomersAgg.map((c) => ({
          userId: c._id,
          visitCount: c.visitCount,
          coinsEarned: c.coinsEarned,
          lastVisit: c.lastVisit,
        })),
        visitFrequency,
        newVsReturning: { new: newCount, returning: returningCount },
        peakHours,
      },
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { storeId, days = '30' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    if (!mongoose.Types.ObjectId.isValid(storeId)) { res.status(400).json({ success: false, message: 'Invalid storeId' }); return; }
    // CRITICAL FIX: Verify store ownership
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    const start = new Date(Date.now() - parseInt(days) * 86400000);
    const stats = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: start } } },
      { $group: { _id: '$userId', visits: { $sum: 1 }, totalSpent: { $sum: '$billAmount' }, lastVisit: { $max: '$createdAt' } } },
    ]);
    const newCustomers = stats.filter(s => s.visits === 1).length;
    const returning = stats.filter(s => s.visits > 1).length;
    const avgSpend = stats.length > 0 ? stats.reduce((a, s) => a + s.totalSpent, 0) / stats.length : 0;
    res.json({ success: true, data: { totalCustomers: stats.length, newCustomers, returningCustomers: returning, avgSpendPerCustomer: Math.round(avgSpend) } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/top-spenders', async (req: Request, res: Response) => {
  try {
    const { storeId, limit = '20' } = req.query as unknown;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    if (!mongoose.Types.ObjectId.isValid(storeId)) { res.status(400).json({ success: false, message: 'Invalid storeId' }); return; }
    // CRITICAL FIX: Verify store ownership
    const store = await Store.findOne({
      _id: new mongoose.Types.ObjectId(storeId),
      $or: [{ merchantId: req.merchantId }, { merchant: req.merchantId }],
    }).lean();
    if (!store) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    const spenders = await StorePayment.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed' } },
      { $group: { _id: '$userId', totalSpent: { $sum: '$billAmount' }, visits: { $sum: 1 }, lastVisit: { $max: '$createdAt' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
    ]);
    res.json({ success: true, data: spenders });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
