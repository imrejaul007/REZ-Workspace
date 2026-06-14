import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { LTVCalculator, LTVMetrics, LTVSegmentProfile, LTTSegment } from '../../services/ltvCalculator';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * GET /merchant/analytics/ltv
 * Analyze LTV for all customers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 365;
    const minOrdersForAnalysis = parseInt(req.query.minOrdersForAnalysis as string) || 1;

    const analysis = await LTVCalculator.analyzeLTV(merchantId, {
      lookbackDays,
      minOrdersForAnalysis,
    });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/ltv/summary
 * Get quick LTV summary for dashboard
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;

    const analysis = await LTVCalculator.analyzeLTV(merchantId);

    res.json({
      success: true,
      data: {
        totalCustomers: analysis.totalCustomers,
        totalLTV: analysis.summary.totalLTV,
        averageLTV: analysis.summary.averageLTV,
        medianLTV: analysis.summary.medianLTV,
        segmentDistribution: analysis.segmentDistribution,
        vipPercentage: analysis.summary.vipPercentage,
        vipTotalLTV: analysis.summary.vipTotalLTV,
        analyzedAt: analysis.analyzedAt,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/ltv/segments
 * Get LTV segment profiles with recommendations
 */
router.get('/segments', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;

    const profiles = await LTVCalculator.getSegmentProfiles(merchantId);

    res.json({
      success: true,
      data: {
        segments: profiles,
        analyzedAt: new Date(),
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/ltv/segment/:segment
 * Get customers by LTV segment
 */
router.get('/segment/:segment', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { segment } = req.params;
    const validSegments: LTTSegment[] = ['Low', 'Medium', 'High', 'VIP'];

    if (!validSegments.includes(segment as LTTSegment)) {
      res.status(400).json({
        success: false,
        message: 'Invalid segment. Must be: Low, Medium, High, or VIP',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const customers = await LTVCalculator.getCustomersBySegment(merchantId, segment as LTTSegment);
    const paginatedCustomers = customers.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        segment,
        total: customers.length,
        limit,
        offset,
        customers: paginatedCustomers,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/ltv/customer/:userId
 * Get LTV for a specific customer
 */
router.get('/customer/:userId', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ success: false, message: 'Valid userId is required' });
      return;
    }

    const ltvMetrics: LTVMetrics | null = await LTVCalculator.getCustomerLTV(merchantId, userId);

    if (!ltvMetrics) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    // Store/update LTV in customer profile
    await LTVCalculator.storeLTVInProfile(merchantId, userId, ltvMetrics);

    res.json({
      success: true,
      data: ltvMetrics,
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/ltv/top
 * Get top N customers by LTV
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const topCustomers = await LTVCalculator.getTopLTVCustomers(merchantId, limit);

    res.json({
      success: true,
      data: {
        total: topCustomers.length,
        limit,
        customers: topCustomers,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /merchant/analytics/ltv/refresh-profiles
 * Refresh LTV scores in customer profiles
 */
router.post('/refresh-profiles', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      res.status(400).json({ success: false, message: 'userIds must be an array' });
      return;
    }

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds.slice(0, 100)) {
      try {
        const ltvMetrics = await LTVCalculator.getCustomerLTV(merchantId, userId);
        if (ltvMetrics) {
          await LTVCalculator.storeLTVInProfile(merchantId, userId, ltvMetrics);
          results.push({ userId, success: true });
        } else {
          results.push({ userId, success: false, error: 'Customer not found' });
        }
      } catch (err) {
        results.push({ userId, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
