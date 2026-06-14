/**
 * Streak Routes
 *
 * Streak tracking, milestones, and rewards endpoints.
 * Routes to Streak Service (port 4027).
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
const STREAK_SERVICE_URL = process.env.STREAK_SERVICE_URL || 'http://localhost:4027';

// ============================================
// TYPES
// ============================================

interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string;
  lastActivityDate: string;
  streakActive: boolean;
  status: 'active' | 'at_risk' | 'broken';
  nextMilestone: number;
  daysUntilMilestone: number;
}

interface StreakMilestone {
  days: number;
  name: string;
  reward: {
    type: 'points' | 'badge' | 'tier_bonus';
    value: number;
    description: string;
  };
  achieved: boolean;
  achievedAt?: string;
}

interface StreakActivity {
  date: string;
  activityType: string;
  pointsEarned: number;
  streakContinued: boolean;
}

interface StreakReward {
  rewardId: string;
  type: 'points' | 'badge' | 'tier_bonus' | 'exclusive_offer';
  value: number;
  description: string;
  milestone: number;
  awardedAt: string;
  expiresAt?: string;
}

interface StreakStatus {
  userId: string;
  streak: Streak;
  nextMilestone: StreakMilestone;
  recentActivities: StreakActivity[];
  availableRewards: StreakReward[];
}

// ============================================
// IN-MEMORY STORE (Demo)
const streaksStore = new Map<string, Streak>();
const milestonesStore = new Map<string, StreakMilestone[]>();
const activitiesStore = new Map<string, StreakActivity[]>();
const rewardsStore = new Map<string, StreakReward[]>();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const streakUpdateSchema = z.object({
  activityType: z.string().min(1),
  pointsEarned: z.number().optional(),
});

// ============================================
// STREAK SERVICE CALL
// ============================================

async function callStreakService<T>(
  endpoint: string,
  userId: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  return circuitBreaker(
    'streak-service',
    async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      };

      const response = await fetch(`${STREAK_SERVICE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Streak service error: ${response.status}`);
      }

      return response.json() as Promise<T>;
    }
  );
}

// ============================================
// STREAK ENDPOINTS
// ============================================

/**
 * Get streak info
 * GET /api/v1/streak/:userId
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
    let streak: Streak;
    try {
      streak = await callStreakService<Streak>(
        `/api/streak/${userId}`,
        userId
      );
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
        return res.status(503).json({
          success: false,
          error: 'Streak service temporarily unavailable',
          circuitState: error.circuitState,
          retryAfterMs: error.retryAfter,
        });
      }

      // Fallback to demo data
      streak = streaksStore.get(userId) || generateDemoStreak(userId);
      streaksStore.set(userId, streak);
    }

    logger.info('[Streak] Get streak', { userId });

    res.json({
      success: true,
      data: streak,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get streak';
    logger.error('[Streak] Get streak failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get streak status (full info)
 * GET /api/v1/streak/:userId/status
 */
router.get('/:userId/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const streak = streaksStore.get(userId) || generateDemoStreak(userId);
    const nextMilestone = getNextMilestone(streak.currentStreak);
    const recentActivities = activitiesStore.get(userId) || generateDemoActivities(userId);
    const availableRewards = rewardsStore.get(userId) || generateDemoRewards(userId);

    const status: StreakStatus = {
      userId,
      streak,
      nextMilestone,
      recentActivities,
      availableRewards,
    };

    logger.info('[Streak] Get streak status', { userId });

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get streak status';
    logger.error('[Streak] Get streak status failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get streak milestones
 * GET /api/v1/streak/:userId/milestones
 */
router.get('/:userId/milestones', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const streak = streaksStore.get(userId) || generateDemoStreak(userId);
    const milestones = getAllMilestones(streak.currentStreak);

    logger.info('[Streak] Get milestones', { userId });

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get milestones';
    logger.error('[Streak] Get milestones failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get streak activity history
 * GET /api/v1/streak/:userId/activity
 */
router.get('/:userId/activity', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '30' } = req.query;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const activities = activitiesStore.get(userId) || generateDemoActivities(userId);
    const limitedActivities = activities.slice(0, parseInt(limit as string));

    logger.info('[Streak] Get activity', { userId });

    res.json({
      success: true,
      data: limitedActivities,
      pagination: {
        total: activities.length,
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get activity';
    logger.error('[Streak] Get activity failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Get streak rewards
 * GET /api/v1/streak/:userId/rewards
 */
router.get('/:userId/rewards', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const rewards = rewardsStore.get(userId) || generateDemoRewards(userId);

    logger.info('[Streak] Get rewards', { userId });

    res.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get rewards';
    logger.error('[Streak] Get rewards failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Record streak activity
 * POST /api/v1/streak/:userId/activity
 */
router.post('/:userId/activity', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = userIdParamSchema.safeParse({ userId });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message,
      });
    }

    const bodyValidation = streakUpdateSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message: bodyValidation.error.errors[0].message,
      });
    }

    const { activityType, pointsEarned } = bodyValidation.data;

    // Update streak
    let streak = streaksStore.get(userId) || generateDemoStreak(userId);
    streak.currentStreak += 1;
    streak.lastActivityDate = new Date().toISOString();
    streak.streakActive = true;
    streak.status = 'active';

    // Update longest streak if needed
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    // Update next milestone info
    streak.nextMilestone = getNextMilestoneDays(streak.currentStreak);
    streak.daysUntilMilestone = streak.nextMilestone - streak.currentStreak;

    streaksStore.set(userId, streak);

    // Add activity
    const activity: StreakActivity = {
      date: new Date().toISOString(),
      activityType,
      pointsEarned: pointsEarned || 10,
      streakContinued: true,
    };

    const activities = activitiesStore.get(userId) || [];
    activities.unshift(activity);
    activitiesStore.set(userId, activities.slice(0, 100)); // Keep last 100

    logger.info('[Streak] Activity recorded', { userId, activityType, currentStreak: streak.currentStreak });

    res.json({
      success: true,
      data: {
        streak,
        activity,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record activity';
    logger.error('[Streak] Record activity failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDemoStreak(userId: string): Streak {
  return {
    userId,
    currentStreak: 15,
    longestStreak: 45,
    streakStartDate: '2024-01-15',
    lastActivityDate: new Date().toISOString(),
    streakActive: true,
    status: 'active',
    nextMilestone: 30,
    daysUntilMilestone: 15,
  };
}

function getNextMilestone(currentStreak: number): StreakMilestone {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  const next = milestones.find(m => m > currentStreak) || 365;

  const milestoneData: Record<number, { name: string; reward: StreakMilestone['reward'] }> = {
    7: { name: 'Week Warrior', reward: { type: 'points', value: 100, description: '100 bonus points' } },
    14: { name: 'Fortnight Fighter', reward: { type: 'badge', value: 1, description: 'Bronze streak badge' } },
    30: { name: 'Monthly Master', reward: { type: 'points', value: 500, description: '500 bonus points + 1.5x multiplier' } },
    60: { name: 'Double Diamond', reward: { type: 'tier_bonus', value: 10, description: '10% tier bonus for 7 days' } },
    90: { name: 'Quarter Champion', reward: { type: 'badge', value: 1, description: 'Silver streak badge' } },
    180: { name: 'Half-Year Hero', reward: { type: 'points', value: 2000, description: '2000 bonus points' } },
    365: { name: 'Year Legend', reward: { type: 'exclusive_offer', value: 1, description: 'Exclusive year-long benefits' } },
  };

  const data = milestoneData[next] || milestoneData[365];

  return {
    days: next,
    name: data.name,
    reward: data.reward,
    achieved: false,
  };
}

function getNextMilestoneDays(currentStreak: number): number {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  return milestones.find(m => m > currentStreak) || 365;
}

function getAllMilestones(currentStreak: number): StreakMilestone[] {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  return milestones.map(days => {
    const milestone = getNextMilestone(days);
    return {
      ...milestone,
      days,
      achieved: currentStreak >= days,
      achievedAt: currentStreak >= days ? new Date(Date.now() - (currentStreak - days) * 86400000).toISOString() : undefined,
    };
  });
}

function generateDemoActivities(userId: string): StreakActivity[] {
  const activities: StreakActivity[] = [];
  const types = ['purchase', 'review', 'share', 'checkin'];

  for (let i = 0; i < 15; i++) {
    activities.push({
      date: new Date(Date.now() - i * 86400000).toISOString(),
      activityType: types[Math.floor(Math.random() * types.length)],
      pointsEarned: Math.floor(Math.random() * 50) + 10,
      streakContinued: true,
    });
  }

  return activities;
}

function generateDemoRewards(userId: string): StreakReward[] {
  return [
    {
      rewardId: 'REWARD001',
      type: 'points',
      value: 100,
      description: '100 bonus points for 7-day streak',
      milestone: 7,
      awardedAt: '2024-01-22',
    },
    {
      rewardId: 'REWARD002',
      type: 'badge',
      value: 1,
      description: 'Week Warrior badge',
      milestone: 7,
      awardedAt: '2024-01-22',
    },
    {
      rewardId: 'REWARD003',
      type: 'points',
      value: 500,
      description: '500 bonus points + 1.5x multiplier for 30-day streak',
      milestone: 30,
      awardedAt: '2024-02-15',
      expiresAt: '2024-03-15',
    },
  ];
}

export default router;
