import { Router, Request, Response } from 'express';
import { crossIndustryService } from '../services/crossIndustryService';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Cross-industry redemption
 * POST /api/v1/redemption/cross-industry
 */
router.post('/cross-industry',
  validateBody(schemas.crossIndustryRedemption),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      accountId,
      fromVertical,
      toVertical,
      points,
      targetMerchantId
    } = req.body;

    // Get conversion rate
    const conversionRate = crossIndustryService.getConversionRate(fromVertical, toVertical);
    const convertedValue = Math.floor(points * conversionRate);

    // Create redemption record
    const result = await crossIndustryService.redeemCrossIndustry(
      accountId,
      fromVertical,
      toVertical,
      points,
      targetMerchantId
    );

    logger.info(
      `Cross-industry redemption: ${points} ${fromVertical} -> ${convertedValue} ${toVertical} for account ${accountId}`
    );

    res.status(201).json({
      success: true,
      data: {
        redemptionId: result.redemptionId,
        accountId,
        fromVertical,
        toVertical,
        originalPoints: points,
        conversionRate,
        convertedValue,
        targetVertical: toVertical,
        targetMerchantId,
        status: result.status,
        createdAt: result.createdAt
      },
      message: 'Cross-industry redemption initiated successfully'
    });
  })
);

/**
 * Complete a cross-industry redemption
 * POST /api/v1/redemption/:redemptionId/complete
 */
router.post('/:redemptionId/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const { redemptionId } = req.params;

    const result = await crossIndustryService.completeRedemption(redemptionId);

    logger.info(`Cross-industry redemption completed: ${redemptionId}`);

    res.json({
      success: true,
      data: result,
      message: 'Redemption completed successfully'
    });
  })
);

/**
 * Cancel a cross-industry redemption
 * POST /api/v1/redemption/:redemptionId/cancel
 */
router.post('/:redemptionId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { redemptionId } = req.params;

    const result = await crossIndustryService.cancelRedemption(redemptionId);

    logger.info(`Cross-industry redemption cancelled: ${redemptionId}`);

    res.json({
      success: true,
      data: result,
      message: 'Redemption cancelled successfully'
    });
  })
);

/**
 * Get redemption history for an account
 * GET /api/v1/redemption/history/:accountId
 */
router.get('/history/:accountId',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    const history = await crossIndustryService.getRedemptionHistory(accountId, limit);

    const filteredHistory = status
      ? history.filter(h => h.status === status)
      : history;

    res.json({
      success: true,
      data: {
        accountId,
        redemptions: filteredHistory,
        count: filteredHistory.length,
        totalPointsTransferred: filteredHistory.reduce(
          (sum: number, r: any) => sum + r.points,
          0
        ),
        totalConvertedValue: filteredHistory.reduce(
          (sum: number, r: any) => sum + r.convertedValue,
          0
        )
      }
    });
  })
);

/**
 * Get conversion rate between verticals
 * GET /api/v1/redemption/conversion-rate
 */
router.get('/conversion-rate',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as { from?: string; to?: string };

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" vertical parameters are required'
      });
    }

    const conversionRate = crossIndustryService.getConversionRate(from, to);

    res.json({
      success: true,
      data: {
        fromVertical: from,
        toVertical: to,
        conversionRate,
        example: {
          points: 100,
          convertedValue: Math.floor(100 * conversionRate)
        }
      }
    });
  })
);

/**
 * Get cross-industry statistics
 * GET /api/v1/redemption/stats
 */
router.get('/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await crossIndustryService.getCrossIndustryStats();

    res.json({
      success: true,
      data: {
        stats,
        summary: {
          totalVerticalPairs: stats.length,
          totalRedemptions: stats.reduce((sum: number, s: any) => sum + s.totalRedemptions, 0),
          totalPointsTransferred: stats.reduce((sum: number, s: any) => sum + s.totalPoints, 0)
        }
      }
    });
  })
);

/**
 * Get pending redemptions
 * GET /api/v1/redemption/pending
 */
router.get('/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const { CrossIndustryRedemptionModel } = await import('../models');

    const pendingRedemptions = await CrossIndustryRedemptionModel.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        pendingRedemptions,
        count: pendingRedemptions.length
      }
    });
  })
);

/**
 * Update conversion rate for a vertical pair (admin)
 * PUT /api/v1/redemption/conversion-rate
 */
router.put('/conversion-rate',
  asyncHandler(async (req: Request, res: Response) => {
    const { fromVertical, toVertical, rate } = req.body;

    if (!fromVertical || !toVertical || rate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'fromVertical, toVertical, and rate are required'
      });
    }

    if (rate <= 0 || rate > 10) {
      return res.status(400).json({
        success: false,
        error: 'Rate must be between 0 and 10'
      });
    }

    await crossIndustryService.updateConversionRate(fromVertical, toVertical, rate);

    logger.info(`Conversion rate updated: ${fromVertical} -> ${toVertical} = ${rate}`);

    res.json({
      success: true,
      data: {
        fromVertical,
        toVertical,
        conversionRate: rate
      },
      message: 'Conversion rate updated successfully'
    });
  })
);

export default router;