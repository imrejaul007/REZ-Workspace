import { Router, Request, Response } from 'express';
import { tierService } from '../services/tierService';
import { LoyaltyTierModel } from '../models';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all tiers
 * GET /api/v1/tiers
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const tiers = await tierService.getAllTiers();

    res.json({
      success: true,
      data: {
        tiers,
        count: tiers.length
      }
    });
  })
);

/**
 * Get tier by name
 * GET /api/v1/tiers/:tierName
 */
router.get('/:tierName',
  asyncHandler(async (req: Request, res: Response) => {
    const { tierName } = req.params;

    const validTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    if (!validTiers.includes(tierName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier name. Valid options: bronze, silver, gold, platinum, diamond'
      });
    }

    const tier = await tierService.getTierByName(tierName);

    if (!tier) {
      return res.status(404).json({
        success: false,
        error: 'Tier not found'
      });
    }

    res.json({
      success: true,
      data: tier
    });
  })
);

/**
 * Calculate tier based on points
 * POST /api/v1/tiers/calculate
 */
router.post('/calculate',
  validateBody(schemas.calculateTier),
  asyncHandler(async (req: Request, res: Response) => {
    const { totalPoints } = req.body;

    const currentTier = await tierService.getUserTier(totalPoints);
    const progression = await tierService.getTierProgression(totalPoints);

    res.json({
      success: true,
      data: {
        totalPoints,
        currentTier,
        progression,
        benefits: currentTier?.benefits || []
      }
    });
  })
);

/**
 * Get tier benefits
 * GET /api/v1/tiers/:tierName/benefits
 */
router.get('/:tierName/benefits',
  asyncHandler(async (req: Request, res: Response) => {
    const { tierName } = req.params;

    const benefits = await tierService.getTierBenefits(tierName);

    res.json({
      success: true,
      data: {
        tierName,
        benefits,
        count: benefits.length
      }
    });
  })
);

/**
 * Compare tiers
 * POST /api/v1/tiers/compare
 */
router.post('/compare',
  asyncHandler(async (req: Request, res: Response) => {
    const { tier1, tier2 } = req.body;

    const tierData1 = await tierService.getTierByName(tier1);
    const tierData2 = await tierService.getTierByName(tier2);

    if (!tierData1 || !tierData2) {
      return res.status(404).json({
        success: false,
        error: 'One or both tiers not found'
      });
    }

    res.json({
      success: true,
      data: {
        tier1: {
          name: tierData1.name,
          multiplier: tierData1.multiplier,
          benefits: tierData1.benefits.length
        },
        tier2: {
          name: tierData2.name,
          multiplier: tierData2.multiplier,
          benefits: tierData2.benefits.length
        },
        multiplierDifference: tierData2.multiplier - tierData1.multiplier,
        additionalBenefits: tierData2.benefits.filter(
          (b: string) => !tierData1.benefits.includes(b)
        )
      }
    });
  })
);

/**
 * Initialize/seeds default tiers
 * POST /api/v1/tiers/seed
 */
router.post('/seed',
  asyncHandler(async (req: Request, res: Response) => {
    await tierService.initializeDefaultTiers();

    const tiers = await tierService.getAllTiers();

    logger.info('Default tiers seeded');

    res.json({
      success: true,
      data: {
        tiers,
        count: tiers.length
      },
      message: 'Default tiers seeded successfully'
    });
  })
);

/**
 * Get tier distribution statistics
 * GET /api/v1/tiers/stats
 */
router.get('/stats/distribution',
  asyncHandler(async (req: Request, res: Response) => {
    const { UnifiedAccount } = await import('../models');

    const distribution = await UnifiedAccount.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          avgPoints: { $avg: '$totalPoints' },
          totalPoints: { $sum: '$totalPoints' }
        }
      },
      { $sort: { '_id.minPoints': 1 } }
    ]);

    const totalAccounts = distribution.reduce((sum: number, d: any) => sum + d.count, 0);

    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const orderedDistribution = tierOrder.map(tierName => {
      const tierData = distribution.find((d: any) => d._id === tierName);
      return {
        tier: tierName,
        count: tierData?.count || 0,
        percentage: tierData ? ((tierData.count / totalAccounts) * 100).toFixed(2) : '0.00',
        avgPoints: tierData?.avgPoints || 0,
        totalPoints: tierData?.totalPoints || 0
      };
    });

    res.json({
      success: true,
      data: {
        distribution: orderedDistribution,
        totalAccounts,
        summary: {
          mostCommonTier: orderedDistribution.reduce(
            (max: any, t: any) => (t.count > max.count ? t : max),
            { tier: 'none', count: 0 }
          ).tier
        }
      }
    });
  })
);

export default router;