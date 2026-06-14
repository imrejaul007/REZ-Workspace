import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/index.js';
import {
  authMiddleware,
  validateQuery,
  asyncHandler,
} from '../middleware/index.js';
import { AnalyticsQuerySchema, JwtPayload } from '../types/index.js';

const router = Router();

// Get retail media analytics
router.get(
  '/',
  authMiddleware,
  validateQuery(AnalyticsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const query = req.query as {
      campaignId?: string;
      merchantId?: string;
      startDate?: string;
      endDate?: string;
      groupBy?: 'day' | 'week' | 'month';
    };

    // Ensure merchant can only access their own data
    if (query.merchantId && query.merchantId !== user.merchantId && user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied to view other merchant analytics',
      });
      return;
    }

    // Use merchant's ID if not specified
    const analyticsQuery = {
      ...query,
      merchantId: query.merchantId || user.merchantId,
    };

    const analytics = await analyticsService.getAnalytics(
      user.merchantId,
      analyticsQuery
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

// Get campaign-specific analytics
router.get(
  '/campaign/:campaignId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const analytics = await analyticsService.getCampaignAnalytics(
      campaignId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

// Record metrics (for internal use)
router.post(
  '/record',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId, impressions, clicks, orders, revenue, spend } =
      req.body as {
        campaignId: string;
        impressions?: number;
        clicks?: number;
        orders?: number;
        revenue?: number;
        spend?: number;
      };

    if (!campaignId) {
      res.status(400).json({
        success: false,
        error: 'campaignId is required',
      });
      return;
    }

    await analyticsService.recordMetrics(campaignId, {
      impressions,
      clicks,
      orders,
      revenue,
      spend,
    });

    res.json({
      success: true,
      message: 'Metrics recorded successfully',
    });
  })
);

export default router;