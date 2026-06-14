/**
 * Loyalty Routes
 *
 * Unified loyalty profile, score, streak, cross-merchant, and badge endpoints.
 * Routes to Profile Aggregator Service (port 4025).
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

// Service URL
const PROFILE_SERVICE_URL = process.env.PROFILE_AGGREGATOR_URL || 'http://localhost:4025';

// ============================================
// TYPES
// ============================================

interface LoyaltyProfile {
  userId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  memberSince: string;
  tierProgress: number;
  nextTier: string | null;
  pointsToNextTier: number;
}

interface ProfileSummary {
  userId: string;
  tier: string;
  points: number;
  streak: number;
  badges: number;
  lastActivity: string;
}

interface BehaviorProfile {
  userId: string;
  preferredCategories: string[];
  averageOrderValue: number;
  purchaseFrequency: string;
  preferredPaymentMethod: string;
  peakHours: string[];
  favoriteMerchants: string[];
  engagementScore: number;
}

interface ScoreBreakdown {
  userId: string;
  baseScore: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  bonusScore: number;
  totalScore: number;
  percentile: number;
}

interface StreakInfo {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string;
  lastActivityDate: string;
  streakActive: boolean;
  nextMilestone: number;
  daysUntilMilestone: number;
}

interface CrossMerchantProfile {
  userId: string;
  merchantCount: number;
  merchants: Array<{
    merchantId: string;
    merchantName: string;
    totalSpend: number;
    pointsEarned: number;
    lastVisit: string;
  }>;
  crossMerchantBonus: number;
  mostVisitedMerchant: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  category: string;
  icon: string;
}

// ============================================
// IN-MEMORY STORE (Demo)
const profilesStore = new Map<string, LoyaltyProfile>();
const behaviorsStore = new Map<string, BehaviorProfile>();
const streaksStore = new Map<string, StreakInfo>();
const crossMerchantStore = new Map<string, CrossMerchantProfile>();
const badgesStore = new Map<string, Badge[]>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// ============================================
// PROFILE AGGREGATOR SERVICE CALL
// ============================================

async function callProfileService<T>(
  endpoint: string,
  userId: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'profile-aggregator',
    async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      };

      const response = await fetch(`${PROFILE_SERVICE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Profile service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// PROFILE ENDPOINTS
// ============================================

/**
 * Get unified loyalty profile
 * GET /api/v1/loyalty/profile/:userId
 */
router.get('/profile/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId
    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Try circuit breaker call first, fall back to demo data
    let profile: LoyaltyProfile;
    try {
      profile = await callProfileService<LoyaltyProfile>(
        `/api/profile/${userId}`,
        userId
      );
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        return res.status(503).json({
          success: false,
          error: 'Profile service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
      }

      // Fallback to demo data
      profile = profilesStore.get(userId) || generateDemoProfile(userId);
      profilesStore.set(userId, profile);
    }

    logger.info('[Loyalty] Get profile', { userId });

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    logger.error('[Loyalty] Get profile failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get profile summary
 * GET /api/v1/loyalty/profile/:userId/summary
 */
router.get('/profile/:userId/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Get or generate demo summary
    const profile = profilesStore.get(userId) || generateDemoProfile(userId);
    const streak = streaksStore.get(userId) || generateDemoStreak(userId);
    const badges = badgesStore.get(userId) || generateDemoBadges(userId);

    const summary: ProfileSummary = {
      userId,
      tier: profile.tier,
      points: profile.availablePoints,
      streak: streak.currentStreak,
      badges: badges.length,
      lastActivity: streak.lastActivityDate,
    };

    logger.info('[Loyalty] Get profile summary', { userId });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get summary';
    logger.error('[Loyalty] Get summary failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get behavior profile
 * GET /api/v1/loyalty/profile/:userId/behavior
 */
router.get('/profile/:userId/behavior', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Get or generate demo behavior profile
    const behavior = behaviorsStore.get(userId) || generateDemoBehavior(userId);
    behaviorsStore.set(userId, behavior);

    logger.info('[Loyalty] Get behavior profile', { userId });

    res.json({
      success: true,
      data: behavior,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get behavior profile';
    logger.error('[Loyalty] Get behavior failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// SCORE ENDPOINTS
// ============================================

/**
 * Get ReZ Score
 * GET /api/v1/loyalty/score/:userId
 */
router.get('/score/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Calculate score from profile
    const profile = profilesStore.get(userId) || generateDemoProfile(userId);

    const score: ScoreBreakdown = {
      userId,
      baseScore: 500,
      recencyScore: 200,
      frequencyScore: 150,
      monetaryScore: 100,
      bonusScore: 50,
      totalScore: 1000,
      percentile: 75,
    };

    logger.info('[Loyalty] Get score', { userId });

    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get score';
    logger.error('[Loyalty] Get score failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get score breakdown
 * GET /api/v1/loyalty/score/:userId/breakdown
 */
router.get('/score/:userId/breakdown', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const breakdown: ScoreBreakdown = {
      userId,
      baseScore: 500,
      recencyScore: 200,
      frequencyScore: 150,
      monetaryScore: 100,
      bonusScore: 50,
      totalScore: 1000,
      percentile: 75,
    };

    logger.info('[Loyalty] Get score breakdown', { userId });

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get score breakdown';
    logger.error('[Loyalty] Get score breakdown failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// STREAK ENDPOINTS
// ============================================

/**
 * Get streak info
 * GET /api/v1/loyalty/streak/:userId
 */
router.get('/streak/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Get or generate demo streak
    let streak = streaksStore.get(userId);
    if (!streak) {
      streak = generateDemoStreak(userId);
      streaksStore.set(userId, streak);
    }

    logger.info('[Loyalty] Get streak', { userId });

    res.json({
      success: true,
      data: streak,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get streak';
    logger.error('[Loyalty] Get streak failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// CROSS-MERCHANT ENDPOINTS
// ============================================

/**
 * Get cross-merchant profile
 * GET /api/v1/loyalty/cross-merchant/:userId
 */
router.get('/cross-merchant/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Get or generate demo cross-merchant profile
    let crossMerchant = crossMerchantStore.get(userId);
    if (!crossMerchant) {
      crossMerchant = generateDemoCrossMerchant(userId);
      crossMerchantStore.set(userId, crossMerchant);
    }

    logger.info('[Loyalty] Get cross-merchant profile', { userId });

    res.json({
      success: true,
      data: crossMerchant,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get cross-merchant profile';
    logger.error('[Loyalty] Get cross-merchant failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// BADGES ENDPOINTS
// ============================================

/**
 * Get user badges
 * GET /api/v1/loyalty/badges/:userId
 */
router.get('/badges/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Get or generate demo badges
    let badges = badgesStore.get(userId);
    if (!badges) {
      badges = generateDemoBadges(userId);
      badgesStore.set(userId, badges);
    }

    logger.info('[Loyalty] Get badges', { userId });

    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get badges';
    logger.error('[Loyalty] Get badges failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoProfile(userId: string): LoyaltyProfile {
  return {
    userId,
    tier: 'gold',
    totalPoints: 15000,
    availablePoints: 12500,
    lifetimePoints: 45000,
    memberSince: '2023-06-15',
    tierProgress: 75,
    nextTier: 'platinum',
    pointsToNextTier: 5000,
  };
}

function generateDemoStreak(userId: string): StreakInfo {
  return {
    userId,
    currentStreak: 15,
    longestStreak: 45,
    streakStartDate: '2024-01-15',
    lastActivityDate: new Date().toISOString(),
    streakActive: true,
    nextMilestone: 30,
    daysUntilMilestone: 15,
  };
}

function generateDemoBehavior(userId: string): BehaviorProfile {
  return {
    userId,
    preferredCategories: ['food', 'travel', 'entertainment'],
    averageOrderValue: 2500,
    purchaseFrequency: 'weekly',
    preferredPaymentMethod: 'upi',
    peakHours: ['12:00-14:00', '19:00-21:00'],
    favoriteMerchants: ['Merchant A', 'Merchant B', 'Merchant C'],
    engagementScore: 82,
  };
}

function generateDemoCrossMerchant(userId: string): CrossMerchantProfile {
  return {
    userId,
    merchantCount: 5,
    merchants: [
      {
        merchantId: 'MERCH001',
        merchantName: 'Starbucks',
        totalSpend: 5000,
        pointsEarned: 250,
        lastVisit: new Date().toISOString(),
      },
      {
        merchantId: 'MERCH002',
        merchantName: 'Uber',
        totalSpend: 8000,
        pointsEarned: 400,
        lastVisit: new Date().toISOString(),
      },
      {
        merchantId: 'MERCH003',
        merchantName: 'Swiggy',
        totalSpend: 3500,
        pointsEarned: 175,
        lastVisit: new Date().toISOString(),
      },
    ],
    crossMerchantBonus: 500,
    mostVisitedMerchant: 'Uber',
  };
}

function generateDemoBadges(userId: string): Badge[] {
  return [
    {
      id: 'BADGE001',
      name: 'First Purchase',
      description: 'Completed first transaction',
      earnedAt: '2023-06-15',
      category: 'milestone',
      icon: 'star',
    },
    {
      id: 'BADGE002',
      name: 'Loyal Customer',
      description: 'Made 10 purchases',
      earnedAt: '2023-09-20',
      category: 'milestone',
      icon: 'heart',
    },
    {
      id: 'BADGE003',
      name: 'Streak Master',
      description: 'Maintained 30-day streak',
      earnedAt: '2024-01-15',
      category: 'streak',
      icon: 'fire',
    },
    {
      id: 'BADGE004',
      name: 'Cross-Explorer',
      description: 'Visited 5 different merchants',
      earnedAt: '2024-03-01',
      category: 'cross-merchant',
      icon: 'compass',
    },
  ];
}

export default router;
