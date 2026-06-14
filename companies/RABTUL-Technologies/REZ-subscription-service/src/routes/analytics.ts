import { Router, Request, Response } from 'express';
import { subscriptionManager, billingEngine } from '../services';
import { asyncHandler, authenticateInternal } from '../middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateInternal);

/**
 * GET /api/v1/analytics/subscriptions
 * Get subscription analytics
 */
router.get(
  '/subscriptions',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.query;

    const analytics = await subscriptionManager.getAnalytics(customerId as string);

    res.json({
      success: true,
      data: analytics
    });
  })
);

/**
 * GET /api/v1/analytics/billing
 * Get billing analytics
 */
router.get(
  '/billing',
  asyncHandler(async (req: Request, res: Response) => {
    const metrics = await billingEngine.calculateBillingMetrics();

    res.json({
      success: true,
      data: metrics
    });
  })
);

/**
 * GET /api/v1/analytics/billing/report
 * Get billing report for a date range
 */
router.get(
  '/billing/report',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const report = await billingEngine.generateBillingReport(start, end);

    res.json({
      success: true,
      data: report
    });
  })
);

export default router;
