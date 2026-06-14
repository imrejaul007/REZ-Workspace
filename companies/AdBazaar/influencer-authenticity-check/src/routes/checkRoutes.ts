import { Router, Request, Response } from 'express';
import { checkService } from '../services/checkService';
import { reportService } from '../services/reportService';
import { asyncHandler, AuthenticatedRequest, AppError } from '../middleware';
import { validateRequest, CheckProfileRequestSchema, BatchCheckRequestSchema } from '../utils/validators';
import { logger } from 'utils/logger.js';

const router = Router();

// POST /api/check/profile - Check influencer profile
router.post(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const loggerCtx = logger.child({ action: 'check_profile' });

    try {
      const request = validateRequest(CheckProfileRequestSchema, req.body);

      loggerCtx.info('Checking profile', {
        platform: request.platform,
        username: request.username,
      });

      const check = await checkService.checkProfile(request);

      res.status(201).json({
        success: true,
        data: {
          checkId: check._id.toString(),
          influencerId: check.influencerId,
          platform: check.platform,
          username: check.username,
          overallScore: check.overallScore,
          riskLevel: check.riskLevel,
          scores: check.scores,
          flags: check.flags,
          recommendations: check.recommendations,
          processingTime: check.processingTime,
          createdAt: check.createdAt,
        },
      });
    } catch (error) {
      loggerCtx.error('Check profile failed', { error });
      throw error;
    }
  })
);

// GET /api/check/:id - Get check results
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const check = await checkService.getCheck(id);

    if (!check) {
      throw new AppError('Check not found', 404);
    }

    res.json({
      success: true,
      data: {
        checkId: check._id.toString(),
        influencerId: check.influencerId,
        platform: check.platform,
        username: check.username,
        status: check.status,
        overallScore: check.overallScore,
        riskLevel: check.riskLevel,
        scores: check.scores,
        breakdown: check.breakdown,
        flags: check.flags,
        recommendations: check.recommendations,
        processingTime: check.processingTime,
        createdAt: check.createdAt,
        updatedAt: check.updatedAt,
      },
    });
  })
);

// POST /api/check/batch - Batch check multiple influencers
router.post(
  '/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const loggerCtx = logger.child({ action: 'batch_check' });

    try {
      const { influencers } = validateRequest(BatchCheckRequestSchema, req.body);

      loggerCtx.info('Starting batch check', { count: influencers.length });

      const results = await checkService.batchCheck(influencers);

      const successful = results.filter((r) => r.status === 'completed');
      const failed = results.filter((r) => r.status === 'failed');

      res.status(201).json({
        success: true,
        data: {
          total: results.length,
          successful: successful.length,
          failed: failed.length,
          results,
        },
      });
    } catch (error) {
      loggerCtx.error('Batch check failed', { error });
      throw error;
    }
  })
);

export default router;