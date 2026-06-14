/**
 * ReZ Score Routes
 *
 * ReZ Score tier management, progress tracking, and leaderboard endpoints.
 * Routes to ReZ Score Service (port 4026).
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
const REZ_SCORE_SERVICE_URL = process.env.REZ_SCORE_SERVICE_URL || 'http://localhost:4026';

// ============================================
// TYPES
// ============================================

interface ReZScore {
  userId: string;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tierRank: number;
  lastUpdated: string;
}

interface ScoreProgress {
  userId: string;
  currentScore: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
  tierThresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
  progressPercent: number;
  projectedCompletionDate: string | null;
}

interface NextTierInfo {
  userId: string;
  currentTier: string;
  nextTier: string;
  pointsRequired: number;
  currentPoints: number;
  progressPercent: number;
  benefits: string[];
  estimatedTimeToAchieve: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
  tier: string;
  avatarUrl?: string;
}

interface Leaderboard {
  type: 'global' | 'weekly' | 'monthly' | 'tier';
  entries: LeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
  lastUpdated: string;
}

interface UserRank {
  userId: string;
  rank: number;
  score: number;
  percentile: number;
  tier: string;
  totalUsers: number;
}

// ============================================
// IN-MEMORY STORE (Demo)
const scoresStore = new Map<string, ReZScore>();
const leaderboardsStore = new Map<string, Leaderboard>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const leaderboardTypeSchema = z.object({
  type: z.enum(['global', 'weekly', 'monthly', 'tier']),
});

// ============================================
// REZ SCORE SERVICE CALL
// ============================================

async function callReZScoreService<T>(
  endpoint: string,
  userId: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'rez-score-service',
    async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      };

      const response = await fetch(`${REZ_SCORE_SERVICE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`ReZ Score service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// SCORE ENDPOINTS
// ============================================

/**
 * Get ReZ Score
 * GET /api/v1/score/:userId
 */
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
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
    let score: ReZScore;
    try {
      score = await callReZScoreService<ReZScore>(
        `/api/score/${userId}`,
        userId
      );
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        return res.status(503).json({
          success: false,
          error: 'ReZ Score service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
      }

      // Fallback to demo data
      score = scoresStore.get(userId) || generateDemoScore(userId);
      scoresStore.set(userId, score);
    }

    logger.info('[ReZ Score] Get score', { userId });

    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get score';
    logger.error('[ReZ Score] Get score failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get score progress
 * GET /api/v1/score/:userId/progress
 */
router.get('/:userId/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Generate demo progress
    const progress: ScoreProgress = {
      userId,
      currentScore: 7500,
      currentTier: 'gold',
      nextTier: 'platinum',
      pointsToNextTier: 2500,
      tierThresholds: {
        bronze: 0,
        silver: 1000,
        gold: 5000,
        platinum: 10000,
        diamond: 25000,
      },
      progressPercent: 75,
      projectedCompletionDate: null,
    };

    logger.info('[ReZ Score] Get progress', { userId });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get progress';
    logger.error('[ReZ Score] Get progress failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get next tier info
 * GET /api/v1/score/:userId/next-tier
 */
router.get('/:userId/next-tier', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Generate demo next tier info
    const nextTierInfo: NextTierInfo = {
      userId,
      currentTier: 'gold',
      nextTier: 'platinum',
      pointsRequired: 10000,
      currentPoints: 7500,
      progressPercent: 75,
      benefits: [
        '2x points multiplier on all purchases',
        'Priority customer support',
        'Exclusive platinum-only offers',
        'Free delivery on all orders',
        'Birthday bonus points (500)',
      ],
      estimatedTimeToAchieve: '2 months',
    };

    logger.info('[ReZ Score] Get next tier info', { userId });

    res.json({
      success: true,
      data: nextTierInfo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get next tier info';
    logger.error('[ReZ Score] Get next tier failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================

/**
 * Get leaderboard
 * GET /api/v1/score/leaderboard/:type
 */
router.get('/leaderboard/:type', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    const validation = leaderboardTypeSchema.safeParse({ type });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leaderboard type. Must be: global, weekly, monthly, or tier',
      });
    }

    // Get or generate demo leaderboard
    const leaderboard = leaderboardsStore.get(type) || generateDemoLeaderboard(type);
    leaderboardsStore.set(type, leaderboard);

    logger.info('[ReZ Score] Get leaderboard', { type });

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get leaderboard';
    logger.error('[ReZ Score] Get leaderboard failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get user rank
 * GET /api/v1/score/leaderboard/:userId/rank
 */
router.get('/leaderboard/:userId/rank', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type = 'global' } = req.query;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    // Generate demo user rank
    const userRank: UserRank = {
      userId,
      rank: 42,
      score: 7500,
      percentile: 95,
      tier: 'gold',
      totalUsers: 10000,
    };

    logger.info('[ReZ Score] Get user rank', { userId, type });

    res.json({
      success: true,
      data: userRank,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user rank';
    logger.error('[ReZ Score] Get user rank failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoScore(userId: string): ReZScore {
  return {
    userId,
    score: 7500,
    tier: 'gold',
    tierRank: 42,
    lastUpdated: new Date().toISOString(),
  };
}

function generateDemoLeaderboard(type: string): Leaderboard {
  const entries: LeaderboardEntry[] = [
    { rank: 1, userId: 'USER001', score: 25000, tier: 'diamond', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { rank: 2, userId: 'USER002', score: 23500, tier: 'diamond', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    { rank: 3, userId: 'USER003', score: 22000, tier: 'diamond', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
    { rank: 4, userId: 'USER004', score: 19500, tier: 'platinum', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
    { rank: 5, userId: 'USER005', score: 18000, tier: 'platinum', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
    { rank: 6, userId: 'USER006', score: 16500, tier: 'platinum', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6' },
    { rank: 7, userId: 'USER007', score: 15000, tier: 'gold', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7' },
    { rank: 8, userId: 'USER008', score: 14000, tier: 'gold', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8' },
    { rank: 9, userId: 'USER009', score: 13000, tier: 'gold', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9' },
    { rank: 10, userId: 'USER010', score: 12000, tier: 'gold', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10' },
  ];

  return {
    type: type as 'global' | 'weekly' | 'monthly' | 'tier',
    entries,
    totalParticipants: 10000,
    lastUpdated: new Date().toISOString(),
  };
}

export default router;
