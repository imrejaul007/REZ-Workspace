/**
 * Decision Routes
 *
 * REE (Reward Evaluation Engine) decision endpoints for loyalty rewards.
 * Processes decisions for loyalty points, cashback, tier upgrades, etc.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import {
  circuitBreaker,
  getCircuitBreaker,
  CircuitOpenError,
} from '../utils/circuitBreaker';

const router = Router();

// Service URL (shared decision service)
const DECISION_SERVICE_URL = process.env.DECISION_SERVICE_URL || 'http://localhost:4029';

// ============================================
// TYPES
// ============================================

interface LoyaltyPointsDecision {
  userId: string;
  transactionId: string;
  transactionAmount: number;
  category: string;
  decision: {
    action: 'award' | 'deny' | 'modify';
    pointsAwarded: number;
    multiplier: number;
    reason: string;
    tierBonus: number;
    promotionalBonus: number;
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

interface CashbackDecision {
  userId: string;
  transactionId: string;
  transactionAmount: number;
  decision: {
    action: 'award' | 'deny' | 'partial';
    cashbackAmount: number;
    cashbackPercent: number;
    maxCap: number;
    reason: string;
    eligibleCategories: string[];
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

interface TierUpgradeDecision {
  userId: string;
  currentTier: string;
  decision: {
    action: 'upgrade' | 'deny' | 'pending';
    newTier: string | null;
    pointsRequired: number;
    currentPoints: number;
    reason: string;
    benefits: string[];
    effectiveDate: string | null;
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

interface StreakRewardDecision {
  userId: string;
  currentStreak: number;
  decision: {
    action: 'award' | 'milestone_reached' | 'none';
    rewardType: 'points' | 'badge' | 'multiplier' | 'none';
    rewardValue: number;
    rewardDescription: string;
    nextMilestone: number;
    reason: string;
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

interface BadgeRewardDecision {
  userId: string;
  triggerEvent: string;
  decision: {
    action: 'award' | 'already_owned' | 'not_eligible';
    badge?: {
      id: string;
      name: string;
      description: string;
      icon: string;
    };
    reason: string;
    nextBadge?: {
      name: string;
      criteria: string;
    };
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

interface ReZScoreDecision {
  userId: string;
  transactionId: string;
  decision: {
    action: 'award' | 'deny' | 'bonus';
    scoreAwarded: number;
    breakdown: {
      baseScore: number;
      categoryBonus: number;
      tierBonus: number;
      streakBonus: number;
    };
    reason: string;
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

interface FullEconomicDecision {
  userId: string;
  transactionId: string;
  transactionAmount: number;
  decisions: {
    loyaltyPoints: LoyaltyPointsDecision['decision'];
    cashback: CashbackDecision['decision'];
    rezScore: ReZScoreDecision['decision'];
    streakReward: StreakRewardDecision['decision'];
  };
  summary: {
    totalPoints: number;
    totalCashback: number;
    totalScore: number;
    effectiveRewardPercent: number;
  };
  metadata: {
    processingTime: number;
    engine: string;
    version: string;
  };
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const loyaltyPointsSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  transactionAmount: z.number().positive(),
  category: z.string().optional(),
  merchantId: z.string().optional(),
});

const cashbackSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  transactionAmount: z.number().positive(),
  category: z.string().optional(),
});

const tierUpgradeSchema = z.object({
  userId: z.string().min(1),
});

const streakRewardSchema = z.object({
  userId: z.string().min(1),
  activityType: z.string().min(1),
});

const badgeRewardSchema = z.object({
  userId: z.string().min(1),
  triggerEvent: z.string().min(1),
  eventData: z.record(z.any()).optional(),
});

const rezScoreSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  transactionAmount: z.number().positive(),
  category: z.string().optional(),
});

const fullEconomicSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  transactionAmount: z.number().positive(),
  category: z.string().optional(),
  merchantId: z.string().optional(),
});

// ============================================
// DECISION SERVICE CALL
// ============================================

async function callDecisionService<T>(
  endpoint: string,
  userId: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'decision-service',
    async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      };

      const response = await fetch(`${DECISION_SERVICE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Decision service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// DECISION ENDPOINTS
// ============================================

/**
 * Loyalty Points Decision
 * POST /api/v1/decisions/loyalty-points
 */
router.post('/loyalty-points', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = loyaltyPointsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId, transactionId, transactionAmount, category, merchantId } = validation.data;

    // Try service call, fall back to demo decision
    let decision: LoyaltyPointsDecision['decision'];
    try {
      const result = await callDecisionService<LoyaltyPointsDecision>(
        `/api/decisions/loyalty-points`,
        userId,
        'POST',
        { transactionId, transactionAmount, category, merchantId }
      );
      decision = result.decision;
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        return res.status(503).json({
          success: false,
          error: 'Decision service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
      }

      // Demo decision
      const basePoints = Math.floor(transactionAmount * 0.05);
      const tierMultiplier = 1.5; // Gold tier
      const categoryBonus = category === 'food' ? 1.2 : 1.0;

      decision = {
        action: 'award',
        pointsAwarded: Math.floor(basePoints * tierMultiplier * categoryBonus),
        multiplier: tierMultiplier * categoryBonus,
        reason: `Base points (${basePoints}) x Tier multiplier (${tierMultiplier}) x Category bonus (${categoryBonus})`,
        tierBonus: Math.floor(basePoints * (tierMultiplier - 1)),
        promotionalBonus: 0,
      };
    }

    const result: LoyaltyPointsDecision = {
      userId,
      transactionId,
      transactionAmount,
      category: category || 'general',
      decision,
      metadata: {
        processingTime: Math.floor(Math.random() * 50) + 10,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] Loyalty points', { userId, transactionId, action: decision.action });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] Loyalty points failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Cashback Decision
 * POST /api/v1/decisions/cashback
 */
router.post('/cashback', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = cashbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId, transactionId, transactionAmount, category } = validation.data;

    // Demo decision
    const eligibleCategories = ['food', 'travel', 'shopping'];
    const isEligible = !category || eligibleCategories.includes(category);

    let decision: CashbackDecision['decision'];
    if (isEligible) {
      const cashbackPercent = category === 'food' ? 3 : category === 'travel' ? 5 : 2;
      const cashbackAmount = Math.floor(transactionAmount * (cashbackPercent / 100));
      const maxCap = 100;

      decision = {
        action: 'award',
        cashbackAmount: Math.min(cashbackAmount, maxCap),
        cashbackPercent,
        maxCap,
        reason: `${cashbackPercent}% cashback on ${category || 'general'} category`,
        eligibleCategories,
      };
    } else {
      decision = {
        action: 'deny',
        cashbackAmount: 0,
        cashbackPercent: 0,
        maxCap: 100,
        reason: `Category '${category}' is not eligible for cashback`,
        eligibleCategories,
      };
    }

    const result: CashbackDecision = {
      userId,
      transactionId,
      transactionAmount,
      decision,
      metadata: {
        processingTime: Math.floor(Math.random() * 50) + 10,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] Cashback', { userId, transactionId, action: decision.action });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] Cashback failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Tier Upgrade Decision
 * POST /api/v1/decisions/tier-upgrade
 */
router.post('/tier-upgrade', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = tierUpgradeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId } = validation.data;

    // Demo decision
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const tierThresholds = { bronze: 0, silver: 1000, gold: 5000, platinum: 10000, diamond: 25000 };

    const currentTier = 'gold';
    const currentPoints = 7500;
    const currentTierIndex = tiers.indexOf(currentTier);

    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
    const pointsRequired = nextTier ? tierThresholds[nextTier] : 0;

    let decision: TierUpgradeDecision['decision'];

    if (currentPoints >= pointsRequired && nextTier) {
      decision = {
        action: 'upgrade',
        newTier: nextTier,
        pointsRequired,
        currentPoints,
        reason: `User has reached ${pointsRequired} points. Eligible for ${nextTier} tier upgrade.`,
        benefits: getTierBenefits(nextTier),
        effectiveDate: new Date().toISOString(),
      };
    } else if (nextTier) {
      decision = {
        action: 'deny',
        newTier: null,
        pointsRequired,
        currentPoints,
        reason: `${pointsRequired - currentPoints} more points needed for ${nextTier} tier`,
        benefits: [],
        effectiveDate: null,
      };
    } else {
      decision = {
        action: 'deny',
        newTier: null,
        pointsRequired: 0,
        currentPoints,
        reason: 'User is already at the highest tier (diamond)',
        benefits: [],
        effectiveDate: null,
      };
    }

    const result: TierUpgradeDecision = {
      userId,
      currentTier,
      decision,
      metadata: {
        processingTime: Math.floor(Math.random() * 50) + 10,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] Tier upgrade', { userId, action: decision.action });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] Tier upgrade failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Streak Reward Decision
 * POST /api/v1/decisions/streak-reward
 */
router.post('/streak-reward', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = streakRewardSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId, activityType } = validation.data;

    const currentStreak = 15;
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const nextMilestone = milestones.find(m => m > currentStreak) || 365;
    const milestoneData: Record<number, { type: 'points' | 'badge' | 'multiplier'; value: number; description: string }> = {
      7: { type: 'points', value: 100, description: '100 bonus points' },
      14: { type: 'badge', value: 1, description: 'Week Warrior badge' },
      30: { type: 'points', value: 500, description: '500 bonus points + 1.5x multiplier' },
      60: { type: 'tier_bonus', value: 10, description: '10% tier bonus for 7 days' },
      90: { type: 'badge', value: 1, description: 'Silver streak badge' },
      180: { type: 'points', value: 2000, description: '2000 bonus points' },
      365: { type: 'exclusive_offer', value: 1, description: 'Year Legend exclusive benefits' },
    };

    let decision: StreakRewardDecision['decision'];

    if (currentStreak === nextMilestone) {
      const milestone = milestoneData[currentStreak] || milestoneData[365];
      decision = {
        action: 'milestone_reached',
        rewardType: milestone.type,
        rewardValue: milestone.value,
        rewardDescription: milestone.description,
        nextMilestone: nextMilestone,
        reason: `Milestone reached: ${currentStreak} days streak!`,
      };
    } else if (currentStreak % 7 === 0) {
      decision = {
        action: 'award',
        rewardType: 'points',
        rewardValue: 50,
        rewardDescription: '50 bonus points for weekly activity',
        nextMilestone,
        reason: `${currentStreak} day streak milestone activity`,
      };
    } else {
      decision = {
        action: 'none',
        rewardType: 'none',
        rewardValue: 0,
        rewardDescription: '',
        nextMilestone,
        reason: 'No milestone reward available at this time',
      };
    }

    const result: StreakRewardDecision = {
      userId,
      currentStreak,
      decision,
      metadata: {
        processingTime: Math.floor(Math.random() * 50) + 10,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] Streak reward', { userId, action: decision.action });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] Streak reward failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Badge Reward Decision
 * POST /api/v1/decisions/badge-reward
 */
router.post('/badge-reward', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = badgeRewardSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId, triggerEvent, eventData } = validation.data;

    // Badge definitions
    const badges: Record<string, { name: string; description: string; icon: string; criteria: string }> = {
      first_purchase: { name: 'First Purchase', description: 'Completed first transaction', icon: 'star', criteria: 'Make your first purchase' },
      ten_purchases: { name: 'Loyal Customer', description: 'Made 10 purchases', icon: 'heart', criteria: 'Make 10 purchases' },
      streak_30: { name: 'Streak Master', description: 'Maintained 30-day streak', icon: 'fire', criteria: 'Maintain a 30-day streak' },
      cross_merchant_5: { name: 'Cross-Explorer', description: 'Visited 5 different merchants', icon: 'compass', criteria: 'Visit 5 different merchants' },
      spend_10000: { name: 'Big Spender', description: 'Total spend exceeded 10,000', icon: 'gem', criteria: 'Spend 10,000 total' },
    };

    let decision: BadgeRewardDecision['decision'];
    const badge = badges[triggerEvent];

    if (!badge) {
      decision = {
        action: 'not_eligible',
        reason: `Unknown trigger event: ${triggerEvent}`,
      };
    } else {
      decision = {
        action: 'award',
        badge: {
          id: `BADGE_${triggerEvent}`,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
        reason: `Trigger event '${triggerEvent}' qualifies for badge`,
        nextBadge: getNextBadge(triggerEvent),
      };
    }

    const result: BadgeRewardDecision = {
      userId,
      triggerEvent,
      decision,
      metadata: {
        processingTime: Math.floor(Math.random() * 50) + 10,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] Badge reward', { userId, triggerEvent, action: decision.action });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] Badge reward failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * ReZ Score Decision
 * POST /api/v1/decisions/rez-score
 */
router.post('/rez-score', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = rezScoreSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId, transactionId, transactionAmount, category } = validation.data;

    // Demo decision
    const baseScore = Math.floor(transactionAmount / 100);
    const categoryBonus = category === 'food' ? 10 : category === 'travel' ? 15 : 5;
    const tierBonus = 20; // Gold tier
    const streakBonus = 10; // 15-day streak

    decision = {
      action: 'award',
      scoreAwarded: baseScore + categoryBonus + tierBonus + streakBonus,
      breakdown: {
        baseScore,
        categoryBonus,
        tierBonus,
        streakBonus,
      },
      reason: `Base (${baseScore}) + Category (${categoryBonus}) + Tier (${tierBonus}) + Streak (${streakBonus})`,
    };

    const result: ReZScoreDecision = {
      userId,
      transactionId,
      decision,
      metadata: {
        processingTime: Math.floor(Math.random() * 50) + 10,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] ReZ Score', { userId, transactionId, scoreAwarded: decision.scoreAwarded });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] ReZ Score failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Full Economic Decision
 * POST /api/v1/decisions/full-economic
 */
router.post('/full-economic', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = fullEconomicSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const { userId, transactionId, transactionAmount, category, merchantId } = validation.data;

    // Calculate all decisions
    const basePoints = Math.floor(transactionAmount * 0.05);
    const tierMultiplier = 1.5;
    const categoryBonus = category === 'food' ? 1.2 : 1.0;
    const totalPoints = Math.floor(basePoints * tierMultiplier * categoryBonus);

    const eligibleCategories = ['food', 'travel', 'shopping'];
    const isEligible = !category || eligibleCategories.includes(category);
    const cashbackPercent = isEligible ? (category === 'travel' ? 5 : category === 'food' ? 3 : 2) : 0;
    const totalCashback = Math.min(Math.floor(transactionAmount * (cashbackPercent / 100)), 100);

    const baseScore = Math.floor(transactionAmount / 100);
    const scoreCategoryBonus = category === 'food' ? 10 : category === 'travel' ? 15 : 5;
    const totalScore = baseScore + scoreCategoryBonus + 20 + 10;

    const streakReward = totalPoints > 100 ? Math.floor(totalPoints * 0.1) : 0;

    const result: FullEconomicDecision = {
      userId,
      transactionId,
      transactionAmount,
      decisions: {
        loyaltyPoints: {
          action: 'award',
          pointsAwarded: totalPoints,
          multiplier: tierMultiplier * categoryBonus,
          reason: `Points calculation: base (${basePoints}) x multipliers`,
          tierBonus: Math.floor(basePoints * (tierMultiplier - 1)),
          promotionalBonus: 0,
        },
        cashback: {
          action: isEligible ? 'award' : 'deny',
          cashbackAmount: totalCashback,
          cashbackPercent,
          maxCap: 100,
          reason: isEligible ? `${cashbackPercent}% cashback awarded` : 'Category not eligible',
          eligibleCategories,
        },
        rezScore: {
          action: 'award',
          scoreAwarded: totalScore,
          breakdown: {
            baseScore,
            categoryBonus: scoreCategoryBonus,
            tierBonus: 20,
            streakBonus: 10,
          },
          reason: 'Score awarded based on transaction and user profile',
        },
        streakReward: {
          action: streakReward > 0 ? 'award' : 'none',
          rewardType: streakReward > 0 ? 'points' : 'none',
          rewardValue: streakReward,
          rewardDescription: streakReward > 0 ? `${streakReward} bonus points for activity` : '',
          nextMilestone: 30,
          reason: streakReward > 0 ? 'Streak bonus applied' : 'No streak bonus',
        },
      },
      summary: {
        totalPoints,
        totalCashback,
        totalScore,
        effectiveRewardPercent: Math.round(((totalPoints + totalCashback) / transactionAmount) * 100 * 100) / 100,
      },
      metadata: {
        processingTime: Math.floor(Math.random() * 100) + 20,
        engine: 'REE-v2',
        version: '1.0.0',
      },
    };

    logger.info('[Decision] Full economic', {
      userId,
      transactionId,
      totalPoints,
      totalCashback,
      totalScore,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process decision';
    logger.error('[Decision] Full economic failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    silver: [
      '1.25x points multiplier on all purchases',
      'Priority customer support',
      'Birthday bonus points (100)',
    ],
    gold: [
      '1.5x points multiplier on all purchases',
      'Priority customer support',
      'Exclusive gold-only offers',
      'Free delivery on orders above 500',
      'Birthday bonus points (250)',
    ],
    platinum: [
      '2x points multiplier on all purchases',
      'VIP customer support',
      'Exclusive platinum-only offers',
      'Free delivery on all orders',
      'Birthday bonus points (500)',
      'Early access to sales',
    ],
    diamond: [
      '3x points multiplier on all purchases',
      'Concierge customer support',
      'Exclusive diamond-only offers',
      'Free delivery + express shipping',
      'Birthday bonus points (1000)',
      'Priority reservations',
      'Exclusive events access',
    ],
  };

  return benefits[tier] || [];
}

function getNextBadge(currentBadge: string): { name: string; criteria: string } | undefined {
  const nextBadgeMap: Record<string, string> = {
    first_purchase: 'ten_purchases',
    ten_purchases: 'spend_10000',
    streak_30: 'cross_merchant_5',
    cross_merchant_5: 'spend_10000',
    spend_10000: undefined,
  };

  const nextId = nextBadgeMap[currentBadge];
  if (!nextId) return undefined;

  const badgeNames: Record<string, string> = {
    ten_purchases: 'Loyal Customer',
    streak_30: 'Streak Master',
    cross_merchant_5: 'Cross-Explorer',
    spend_10000: 'Big Spender',
  };

  const badgeCriteria: Record<string, string> = {
    ten_purchases: 'Make 10 purchases',
    streak_30: 'Maintain a 30-day streak',
    cross_merchant_5: 'Visit 5 different merchants',
    spend_10000: 'Spend 10,000 total',
  };

  return {
    name: badgeNames[nextId],
    criteria: badgeCriteria[nextId],
  };
}

export default router;
