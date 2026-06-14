/**
 * Rewards Routes
 *
 * REST API endpoints for querying gamification rewards and achievements.
 * Routes:
 *   GET /rewards/earned/:userId     — Total rewards earned by user
 *   GET /rewards/history/:userId    — Reward history with pagination
 *   GET /rewards/available/:userId  — Available rewards for user
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createServiceLogger } from '../config/logger';
import { requireAuth } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import { err, success } from '../utils/response';
import { ChallengeRewardService, ChallengeType } from '../services/challengeReward.service';

const logger = createServiceLogger('rewards-routes');

export const rewardsRouter = Router();

const challengeRewardService = new ChallengeRewardService();

// GAM-HIGH-01 FIX: Strict 24-character hex ObjectId regex
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// ── GET /rewards/earned/:userId ─────────────────────────────────────────────
//
// Returns total rewards earned by user across all gamification activities.
// Includes: total coins, total XP, total achievements, and breakdown by category.

rewardsRouter.get('/rewards/earned/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.userId!;
    const { userId: requestedUserId } = req.params;

    // GAM-SEC-01 FIX: IDOR protection — users can only view their own rewards
    if (requestedUserId !== authenticatedUserId) {
      res.status(403).json(err('SRV_001', 'Access denied'));
      return;
    }

    const userId = authenticatedUserId;

    // Validate ObjectId format
    if (!OBJECT_ID_REGEX.test(userId)) {
      res.status(400).json(err('RES_NOT_FOUND', 'Invalid user ID format'));
      return;
    }

    // Aggregate total rewards from gamification history
    const GamificationHistory = mongoose.connection.collection('gamificationhistory');
    const UserAchievements = mongoose.connection.collection('userachievements');
    const UserProfiles = mongoose.connection.collection('userprofiles');

    const [historyAgg, achievementCount, userProfile] = await Promise.all([
      // Total coins and XP from history
      GamificationHistory.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalCoins: { $sum: '$coinsAwarded' },
            totalXp: { $sum: '$xpAwarded' },
            challengeCompletions: {
              $sum: { $cond: [{ $eq: ['$type', 'challenge_completion'] }, 1, 0] },
            },
          },
        },
      ]).toArray(),

      // Count achievements
      UserAchievements.countDocuments({ userId }),

      // Get user profile for tier info
      UserProfiles.findOne({ userId }, { projection: { xp: 1, rezScore: 1, currentTier: 1 } }),
    ]);

    const totals = historyAgg[0] || { totalCoins: 0, totalXp: 0, challengeCompletions: 0 };

    // Get breakdown by source
    const breakdownAgg = await GamificationHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$challengeType',
          coins: { $sum: '$coinsAwarded' },
          xp: { $sum: '$xpAwarded' },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const breakdown: Record<string, { coins: number; xp: number; count: number }> = {};
    for (const item of breakdownAgg) {
      breakdown[item._id as string] = {
        coins: item.coins,
        xp: item.xp,
        count: item.count,
      };
    }

    res.json(success({
      userId,
      totals: {
        coins: totals.totalCoins,
        xp: totals.totalXp,
        achievements: achievementCount,
        challengeCompletions: totals.challengeCompletions,
      },
      breakdown,
      profile: {
        xp: (userProfile?.xp as number) || 0,
        rezScore: (userProfile?.rezScore as number) || 0,
        currentTier: userProfile?.currentTier || 'bronze',
      },
    }));
  } catch (error) {
    logger.error('[RewardsRoutes] GET /rewards/earned error', error);
    res.status(500).json(err('SRV_001', 'Internal server error'));
  }
});

// ── GET /rewards/history/:userId ─────────────────────────────────────────────
//
// Returns paginated reward history for a user.
// Query params: limit (default 20), offset (default 0), type (optional filter)

rewardsRouter.get('/rewards/history/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.userId!;
    const { userId: requestedUserId } = req.params;

    // GAM-SEC-01 FIX: IDOR protection — users can only view their own history
    if (requestedUserId !== authenticatedUserId) {
      res.status(403).json(err('SRV_001', 'Access denied'));
      return;
    }

    const userId = authenticatedUserId;

    // Validate ObjectId format
    if (!OBJECT_ID_REGEX.test(userId)) {
      res.status(400).json(err('RES_NOT_FOUND', 'Invalid user ID format'));
      return;
    }

    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10));
    const typeFilter = req.query.type as string | undefined;

    // Build match criteria
    const match: Record<string, unknown> = { userId };
    if (typeFilter) {
      match.type = typeFilter;
    }

    // Get history with pagination
    const GamificationHistory = mongoose.connection.collection('gamificationhistory');

    const [history, total] = await Promise.all([
      GamificationHistory.find(match)
        .sort({ completedAt: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      GamificationHistory.countDocuments(match),
    ]);

    const formattedHistory = history.map((h) => ({
      id: h._id,
      type: h.type,
      challengeType: h.challengeType as ChallengeType | undefined,
      coinsAwarded: h.coinsAwarded,
      xpAwarded: h.xpAwarded,
      milestone: h.milestone,
      description: h.description,
      completedAt: h.completedAt,
      createdAt: h.createdAt,
    }));

    res.json(success({
      history: formattedHistory,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    }));
  } catch (error) {
    logger.error('[RewardsRoutes] GET /rewards/history error', error);
    res.status(500).json(err('SRV_001', 'Internal server error'));
  }
});

// ── GET /rewards/available/:userId ───────────────────────────────────────────
//
// Returns available rewards/challenges for a user based on their current progress.

rewardsRouter.get('/rewards/available/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.userId!;
    const { userId: requestedUserId } = req.params;

    // GAM-SEC-01 FIX: IDOR protection — users can only view their own available rewards
    if (requestedUserId !== authenticatedUserId) {
      res.status(403).json(err('SRV_001', 'Access denied'));
      return;
    }

    const userId = authenticatedUserId;

    // Validate ObjectId format
    if (!OBJECT_ID_REGEX.test(userId)) {
      res.status(400).json(err('RES_NOT_FOUND', 'Invalid user ID format'));
      return;
    }

    const availableRewards = await challengeRewardService.getAvailableRewards(userId);

    res.json(success({
      userId,
      challenges: availableRewards.challenges.map((c) => ({
        type: c.type,
        description: c.description,
        progress: c.progress,
        target: c.target,
        percentComplete: c.target > 0 ? Math.round((c.progress / c.target) * 100) : 0,
        reward: {
          coins: c.reward.coins,
          xp: c.reward.xp,
        },
      })),
    }));
  } catch (error) {
    logger.error('[RewardsRoutes] GET /rewards/available error', error);
    res.status(500).json(err('SRV_001', 'Internal server error'));
  }
});

// ── GET /rewards/summary/:userId ─────────────────────────────────────────────
//
// Returns a summary of user's gamification status including current stats.

rewardsRouter.get('/rewards/summary/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.userId!;
    const { userId: requestedUserId } = req.params;

    // GAM-SEC-01 FIX: IDOR protection
    if (requestedUserId !== authenticatedUserId) {
      res.status(403).json(err('SRV_001', 'Access denied'));
      return;
    }

    const userId = authenticatedUserId;

    // Validate ObjectId format
    if (!OBJECT_ID_REGEX.test(userId)) {
      res.status(400).json(err('RES_NOT_FOUND', 'Invalid user ID format'));
      return;
    }

    // Get user profile
    const UserProfiles = mongoose.connection.collection('userprofiles');
    const userProfile = await UserProfiles.findOne({ userId }, {
      projection: {
        xp: 1,
        rezScore: 1,
        currentTier: 1,
        streakDays: 1,
        lastCheckIn: 1,
      },
    });

    // Get challenge progress
    const progress = await challengeRewardService.getAvailableRewards(userId);

    // Get totals
    const GamificationHistory = mongoose.connection.collection('gamificationhistory');
    const totals = await GamificationHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$coinsAwarded' },
          totalXp: { $sum: '$xpAwarded' },
          totalRewards: { $sum: 1 },
        },
      },
    ]).toArray();

    const totalData = totals[0] || { totalCoins: 0, totalXp: 0, totalRewards: 0 };

    res.json(success({
      userId,
      profile: {
        xp: (userProfile?.xp as number) || 0,
        rezScore: (userProfile?.rezScore as number) || 0,
        currentTier: userProfile?.currentTier || 'bronze',
        streakDays: (userProfile?.streakDays as number) || 0,
        lastCheckIn: userProfile?.lastCheckIn,
      },
      totals: {
        coins: totalData.totalCoins,
        xp: totalData.totalXp,
        rewards: totalData.totalRewards,
      },
      nextMilestones: progress.challenges.slice(0, 5),
    }));
  } catch (error) {
    logger.error('[RewardsRoutes] GET /rewards/summary error', error);
    res.status(500).json(err('SRV_001', 'Internal server error'));
  }
});

// ── Internal Endpoints ────────────────────────────────────────────────────────
// These endpoints are for internal service-to-service communication

// POST /rewards/internal/process — Process a challenge reward (internal only)
rewardsRouter.post('/rewards/internal/process', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId, challengeType, currentProgress, asyncProcessing } = req.body;

    if (!userId || !challengeType || !currentProgress) {
      res.status(400).json({ success: false, error: 'userId, challengeType, and currentProgress are required' });
      return;
    }

    if (!OBJECT_ID_REGEX.test(userId)) {
      res.status(400).json({ success: false, error: 'Invalid userId format' });
      return;
    }

    const result = await challengeRewardService.processChallenge({
      userId,
      challengeType: challengeType as ChallengeType,
      currentProgress,
    });

    // Record in history if successful
    if (result.success && result.coinsAwarded > 0) {
      const { recordChallengeCompletion } = await import('../services/challengeReward.service');
      await recordChallengeCompletion(
        userId,
        challengeType as ChallengeType,
        result.coinsAwarded,
        result.xpAwarded,
        result.milestone,
      );
    }

    res.json(success(result));
  } catch (error) {
    logger.error('[RewardsRoutes] POST /rewards/internal/process error', error);
    res.status(500).json(err('SRV_001', 'Internal server error'));
  }
});

// GET /rewards/internal/progress/:userId — Get user challenge progress (internal only)
rewardsRouter.get('/rewards/internal/progress/:userId', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!OBJECT_ID_REGEX.test(userId)) {
      res.status(400).json({ success: false, error: 'Invalid userId format' });
      return;
    }

    const { getUserChallengeProgress } = await import('../services/challengeReward.service');
    const progress = await getUserChallengeProgress(userId);

    res.json(success({ userId, progress }));
  } catch (error) {
    logger.error('[RewardsRoutes] GET /rewards/internal/progress error', error);
    res.status(500).json(err('SRV_001', 'Internal server error'));
  }
});

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Registers rewards routes with an Express app.
 */
export function registerRewardsRoutes(app: ReturnType<Router['get']> & Router): void {
  // Routes are registered via the rewardsRouter which is exported
  // and should be used in httpServer.ts
  logger.info('[RewardsRoutes] Routes registered');
}
