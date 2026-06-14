/**
 * Dashboard Routes
 */

import { Router, Response } from 'express';
import { analyticsService } from '../services';
import { verifyAuth, AuthenticatedRequest, asyncHandler } from '../middleware';
import logger from 'utils/logger.js';

const router = Router();

/**
 * GET /api/brand/dashboard
 * Get brand dashboard data
 */
router.get('/brand/dashboard',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get brand ID from query or user
    const brandId = req.query.brandId as string;

    if (!brandId) {
      res.status(400).json({
        success: false,
        error: 'Brand ID required'
      });
      return;
    }

    const dashboard = await analyticsService.getBrandDashboard(brandId);
    res.json({
      success: true,
      data: dashboard
    });
  })
);

/**
 * GET /api/influencer/dashboard
 * Get influencer dashboard data
 */
router.get('/influencer/dashboard',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const influencerId = req.query.influencerId as string || req.userId;

    const dashboard = await analyticsService.getInfluencerDashboard(influencerId);
    res.json({
      success: true,
      data: dashboard
    });
  })
);

/**
 * GET /api/analytics
 * Get portal analytics
 */
router.get('/analytics',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analytics = await analyticsService.getPortalAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  })
);

/**
 * GET /api/analytics/campaign/:id
 * Get campaign metrics
 */
router.get('/analytics/campaign/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const metrics = await analyticsService.getCampaignMetrics(req.params.id);
    res.json({
      success: true,
      data: metrics
    });
  })
);

export default router;