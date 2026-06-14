import { Router, Request, Response } from 'express';
import { pacingService } from '../services/index.js';
import { asyncHandler, authMiddleware, NotFoundError, ValidationError } from '../middleware/index.js';

const router = Router();

/**
 * GET /api/pacing/:campaignId
 * Get pacing status for a campaign
 */
router.get('/:campaignId', asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;

  // Try cache first
  const cached = await pacingService.getCachedPacingStatus(campaignId);
  if (cached) {
    res.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Get fresh pacing status
  const pacing = await pacingService.getPacingStatus(campaignId);

  if (!pacing) {
    throw new NotFoundError('Campaign not found');
  }

  // Cache the result
  await pacingService.cachePacingStatus(campaignId);

  res.json({
    success: true,
    data: pacing,
    cached: false,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/pacing/:campaignId/pace
 * Adjust campaign pacing
 */
router.post('/:campaignId/pace', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const { type, percent, reason } = req.body;

  if (!type) {
    throw new ValidationError('Adjustment type is required');
  }

  if (!['increase', 'decrease', 'pause', 'resume'].includes(type)) {
    throw new ValidationError('Invalid adjustment type. Valid types: increase, decrease, pause, resume');
  }

  if ((type === 'increase' || type === 'decrease') && (!percent || percent <= 0)) {
    throw new ValidationError('Percent is required for increase/decrease adjustments');
  }

  const result = await pacingService.adjustPacing(campaignId, {
    type,
    percent,
    reason,
  });

  if (!result.success) {
    throw new NotFoundError(result.message);
  }

  // Invalidate cache
  // Note: Would need to add cache invalidation to redis service

  res.json({
    success: true,
    message: result.message,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/pacing/:campaignId/analytics
 * Get pacing analytics for a campaign
 */
router.get('/:campaignId/analytics', asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const { days = '7' } = req.query;

  const analytics = await pacingService.getPacingAnalytics(campaignId, parseInt(days as string, 10));

  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString(),
  });
}));

export default router;