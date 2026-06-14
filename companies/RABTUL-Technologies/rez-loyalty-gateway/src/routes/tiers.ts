/**
 * Tiers Routes - Hybrid tier management endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TierManager } from '../services/TierManager.js';
import { TierLevel, PriveTier, TIER_BENEFITS, PRIVE_TIER_CONFIG } from '../types/index.js';

const router = Router();
const tierManager = new TierManager();

// Query params schema
const TierQuerySchema = z.object({
  refresh: z.enum(['true', 'false']).optional().default('false'),
});

/**
 * GET /api/v1/loyalty/tiers/:userId
 * Get hybrid tier info (REZ + Prive overlay)
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { refresh } = TierQuerySchema.parse(req.query);
    const forceRefresh = refresh === 'true';

    const tierInfo = await tierManager.getHybridTierInfo(userId, forceRefresh);

    res.json({
      success: true,
      data: tierInfo,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tier info',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/tiers/:userId/upgrade-preview
 * Preview tier upgrade opportunity
 */
router.get('/:userId/upgrade-preview', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = z.object({
      amount: z.coerce.number().positive().optional(),
    }).parse(req.query);

    const currentTier = await tierManager.getHybridTierInfo(userId);

    let upgradePreview = null;
    if (amount) {
      upgradePreview = await tierManager.checkTierUpgrade(userId, amount);
    }

    res.json({
      success: true,
      data: {
        currentTier: currentTier.rezTier,
        currentCoins: currentTier.benefits.maxCoinHolding,
        combinedMultiplier: currentTier.combinedMultiplier,
        tierProgress: currentTier.tierProgress,
        coinsToNextTier: currentTier.coinsToNextTier,
        nextTier: currentTier.nextTier,
        upgradePreview,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upgrade preview',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/tiers/:userId/prive
 * Get Prive eligibility details
 */
router.get('/:userId/prive', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const eligibility = await tierManager.getPriveEligibility(userId);

    res.json({
      success: true,
      data: {
        eligible: eligibility.eligible,
        currentTier: eligibility.currentTier,
        score: eligibility.score,
        pillars: eligibility.pillars,
        missingRequirements: eligibility.missingRequirements,
        tierConfig: eligibility.currentTier !== PriveTier.NONE
          ? PRIVE_TIER_CONFIG[eligibility.currentTier]
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Prive eligibility',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/tiers/all
 * Get all tier configurations (REZ tiers)
 */
router.get('/all/rez', async (req: Request, res: Response) => {
  try {
    const tiers = tierManager.getAllTierBenefits();

    res.json({
      success: true,
      data: {
        tiers: tiers.map(t => ({
          name: t.tier,
          earningMultiplier: t.earningMultiplier,
          redemptionMultiplier: t.redemptionMultiplier,
          birthdayBonus: t.birthdayBonus,
          anniversaryBonus: t.anniversaryBonus,
          exclusiveRewards: t.exclusiveRewards,
          prioritySupport: t.prioritySupport,
          freeDelivery: t.freeDelivery,
          earlyAccess: t.earlyAccess,
          maxCoinHolding: t.maxCoinHolding,
        })),
        thresholds: {
          bronze: 0,
          silver: 1000,
          gold: 5000,
          platinum: 20000,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tier configurations',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/tiers/all/prive
 * Get all Prive tier configurations
 */
router.get('/all/prive', async (req: Request, res: Response) => {
  try {
    const priveTiers = tierManager.getAllPriveTiers();

    res.json({
      success: true,
      data: {
        pillars: [
          { id: 'engagement', name: 'Engagement', weight: '25%', icon: 'activity' },
          { id: 'trust', name: 'Trust', weight: '20%', icon: 'shield' },
          { id: 'influence', name: 'Influence', weight: '20%', icon: 'star' },
          { id: 'economic', name: 'Economic', weight: '15%', icon: 'trending-up' },
          { id: 'brand_affinity', name: 'Brand Affinity', weight: '10%', icon: 'heart' },
          { id: 'network', name: 'Network', weight: '10%', icon: 'users' },
        ],
        tiers: priveTiers.map(t => ({
          name: t.tier,
          scoreRange: `${t.config.minScore}-${t.config.maxScore}`,
          coinMultiplier: `${t.config.multiplier}x`,
          monthlyBonus: t.config.monthlyBonus,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Prive configurations',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/tiers/compare
 * Compare two tiers
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const CompareSchema = z.object({
      tier1: z.nativeEnum(TierLevel),
      tier2: z.nativeEnum(TierLevel),
      includePrive: z.enum(['true', 'false']).optional().default('false'),
      priveTier: z.nativeEnum(PriveTier).optional(),
    });

    const { tier1, tier2, includePrive, priveTier } = CompareSchema.parse(req.query);

    const benefits1 = TIER_BENEFITS[tier1];
    const benefits2 = TIER_BENEFITS[tier2];

    let priveConfig1 = null;
    let priveConfig2 = null;
    let combinedMultiplier1 = benefits1.earningMultiplier;
    let combinedMultiplier2 = benefits2.earningMultiplier;

    if (includePrive === 'true' && priveTier) {
      priveConfig1 = PRIVE_TIER_CONFIG[priveTier];
      priveConfig2 = PRIVE_TIER_CONFIG[priveTier];
      combinedMultiplier1 = benefits1.earningMultiplier * priveConfig1.multiplier;
      combinedMultiplier2 = benefits2.earningMultiplier * priveConfig2.multiplier;
    }

    res.json({
      success: true,
      data: {
        tier1: {
          name: tier1,
          earningMultiplier: benefits1.earningMultiplier,
          combinedMultiplier: combinedMultiplier1,
          birthdayBonus: benefits1.birthdayBonus,
          anniversaryBonus: benefits1.anniversaryBonus,
          priveConfig: priveConfig1,
        },
        tier2: {
          name: tier2,
          earningMultiplier: benefits2.earningMultiplier,
          combinedMultiplier: combinedMultiplier2,
          birthdayBonus: benefits2.birthdayBonus,
          anniversaryBonus: benefits2.anniversaryBonus,
          priveConfig: priveConfig2,
        },
        difference: {
          earningMultiplier: benefits2.earningMultiplier - benefits1.earningMultiplier,
          combinedMultiplier: combinedMultiplier2 - combinedMultiplier1,
          birthdayBonus: benefits2.birthdayBonus - benefits1.birthdayBonus,
          anniversaryBonus: benefits2.anniversaryBonus - benefits1.anniversaryBonus,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
});

export default router;