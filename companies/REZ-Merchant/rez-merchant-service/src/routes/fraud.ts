import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { AnomalyMonitor } from '../models/AnomalyMonitor';
import { Cashback } from '../models/Cashback';
import { cacheGet, cacheSet } from '../config/redis';

const router = Router();
router.use(merchantAuth);

/**
 * GET /fraud/alerts — anomaly alerts scoped to this merchant
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: unknown = { merchantId: new mongoose.Types.ObjectId(merchantId) };
    if (status) query.status = status;
    if (type) query.type = type;

    const [alerts, total] = await Promise.all([
      AnomalyMonitor.find(query)
        .sort({ flaggedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AnomalyMonitor.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: alerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: skip + Number(limit) < total,
          hasPrev: Number(page) > 1,
        },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /fraud/alerts/:id — single alert detail
 */
router.get('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const alert = await AnomalyMonitor.findOne({
      _id: req.params.id,
      merchantId: new mongoose.Types.ObjectId(merchantId),
    }).lean();

    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /fraud/status — fraud summary stats for this merchant
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const merchantOid = new mongoose.Types.ObjectId(merchantId);
    const cacheKey = `merchant:${merchantId}:fraud-status`;

    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [anomalyCounts, cashbackFraud] = await Promise.all([
      AnomalyMonitor.aggregate([
        { $match: { merchantId: merchantOid, flaggedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Cashback.aggregate([
        {
          $match: {
            merchant: merchantOid,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            flaggedRequests: {
              $sum: { $cond: ['$flaggedForReview', 1, 0] },
            },
            highRiskRequests: {
              $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    anomalyCounts.forEach((r) => { statusMap[r._id] = r.count; });

    const cashbackStats = cashbackFraud[0] || { totalRequests: 0, flaggedRequests: 0, highRiskRequests: 0 };

    const result = {
      success: true,
      data: {
        anomalies: {
          monitoring: statusMap.monitoring || 0,
          reviewed: statusMap.reviewed || 0,
          dismissed: statusMap.dismissed || 0,
          escalated: statusMap.escalated || 0,
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        },
        cashback: {
          totalRequests: cashbackStats.totalRequests,
          flaggedRequests: cashbackStats.flaggedRequests,
          highRiskRequests: cashbackStats.highRiskRequests,
          fraudRate: cashbackStats.totalRequests > 0
            ? Math.round((cashbackStats.flaggedRequests / cashbackStats.totalRequests) * 100 * 10) / 10
            : 0,
        },
        period: '30d',
      },
    };

    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
