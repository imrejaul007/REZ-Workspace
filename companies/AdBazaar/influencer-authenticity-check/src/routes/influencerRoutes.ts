import { Router, Request, Response } from 'express';
import { checkService } from '../services/checkService';
import { asyncHandler, AppError } from '../middleware';
import { logger } from 'utils/logger.js';

const router = Router();

// GET /api/influencers/:id/history - Check history
router.get(
  '/:id/history',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const history = await checkService.getCheckHistory(id);

    if (!history) {
      throw new AppError('History not found', 404);
    }

    res.json({
      success: true,
      data: {
        influencerId: history.influencerId,
        platform: history.platform,
        username: history.username,
        totalChecks: history.totalChecks,
        averageScore: Math.round(history.averageScore * 100) / 100,
        firstCheckDate: history.firstCheckDate,
        lastCheckDate: history.lastCheckDate,
        checks: history.checks.map((c) => ({
          checkId: c.checkId,
          date: c.date,
          overallScore: c.overallScore,
          riskLevel: c.riskLevel,
          keyFlags: c.keyFlags,
        })),
        trend: history.trend,
      },
    });
  })
);

// GET /api/influencers/:id/trend - Authenticity trend
router.get(
  '/:id/trend',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const trend = await checkService.getTrend(id);

    if (!trend) {
      throw new AppError('Trend not found', 404);
    }

    res.json({
      success: true,
      data: {
        influencerId: id,
        trend: trend.trend,
        history: trend.history,
      },
    });
  })
);

// GET /api/influencers/:id/profile - Get influencer profile
router.get(
  '/:id/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const profile = await checkService.getInfluencerProfileById(id);

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    res.json({
      success: true,
      data: profile,
    });
  })
);

export default router;