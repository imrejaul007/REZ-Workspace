import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { asyncHandler, AppError } from '../middleware';
import { logger } from 'utils/logger.js';

const router = Router();

// GET /api/analytics - Overall analytics
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const loggerCtx = logger.child({ action: 'get_analytics' });

    try {
      const summary = await analyticsService.getAnalyticsSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      loggerCtx.error('Failed to get analytics', { error });
      throw error;
    }
  })
);

// GET /api/analytics/platform/:platform - Platform-specific analytics
router.get(
  '/platform/:platform',
  asyncHandler(async (req: Request, res: Response) => {
    const { platform } = req.params;

    const validPlatforms = ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      throw new AppError('Invalid platform', 400);
    }

    const analytics = await analyticsService.getPlatformAnalytics(platform);

    res.json({
      success: true,
      data: {
        platform,
        ...analytics,
      },
    });
  })
);

// GET /api/analytics/summary - Quick summary (lighter query)
router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    const [profileCount, checkCount, alertStats] = await Promise.all([
      // Count profiles
      import('../models/InfluencerProfile').then((m) => m.InfluencerProfile.countDocuments()),
      // Count checks
      import('../models/AuthenticityCheck').then((m) => m.AuthenticityCheck.countDocuments()),
      // Get alert stats
      alertService.getAlertStats(),
    ]);

    res.json({
      success: true,
      data: {
        totalProfiles: profileCount,
        totalChecks: checkCount,
        activeAlerts: alertStats.total,
        criticalAlerts: alertStats.critical,
      },
    });
  })
);

export default router;