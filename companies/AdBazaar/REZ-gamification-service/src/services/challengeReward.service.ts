/**
 * Challenge Reward Service
 *
 * Handles reward calculation and distribution for challenge completion.
 * Manages challenge types: visit milestones, spend milestones, reviews, referrals,
 * daily check-ins, weekly streaks, and category challenges.
 */

import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { createServiceLogger } from '../config/logger';
import {
  creditWalletSync,
  enqueueWalletCredit,
  VISIT_CHALLENGE_REWARDS,
  SPEND_CHALLENGE_REWARDS,
  REVIEW_CHALLENGE_REWARDS,
  REFERRAL_CHALLENGE_REWARDS,
  DAILY_CHECKIN_REWARD,
  WEEKLY_STREAK_BONUS,
  WEEKEND_SPECIAL_BONUS,
  RewardSource,
} from './walletIntegration.service';

const logger = createServiceLogger('challenge-reward-service');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChallengeProgress {
  visitCount: number;
  spendAmount: number;
  reviewCount: number;
  referralCount: number;
  categoryCounts: Record<string, number>;
  lastCheckInDate?: string;
  weeklyStreak: number;
}

export interface ChallengeCompletionResult {
  success: boolean;
  coinsAwarded: number;
  xpAwarded: number;
  rewardSource: RewardSource;
  milestone?: string;
  error?: string;
}

export interface ChallengeRewardEvent {
  userId: string;
  challengeType: ChallengeType;
  currentProgress: ChallengeProgress;
  timestamp?: string;
  eventId?: string;
}

export type ChallengeType =
  | 'visit_milestone'
  | 'spend_milestone'
  | 'review_milestone'
  | 'referral_milestone'
  | 'daily_checkin'
  | 'weekly_streak'
  | 'weekend_special'
  | 'category_challenge';

// ── Challenge Reward Configuration ─────────────────────────────────────────────

export interface CategoryChallengeReward {
  category: string;
  coins: number;
  xp: number;
}

// Default category challenges (coins for trying new categories)
export const CATEGORY_CHALLENGE_REWARDS: CategoryChallengeReward[] = [
  { category: 'food', coins: 15, xp: 10 },
  { category: 'fashion', coins: 20, xp: 15 },
  { category: 'electronics', coins: 25, xp: 20 },
  { category: 'grocery', coins: 10, xp: 5 },
  { category: 'beauty', coins: 20, xp: 15 },
  { category: 'home', coins: 25, xp: 20 },
  { category: 'sports', coins: 15, xp: 10 },
  { category: 'other', coins: 10, xp: 5 },
];

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Processes a challenge completion event and awards rewards.
 * Can be called synchronously or enqueued for async processing.
 */
export async function processChallengeReward(
  event: ChallengeRewardEvent,
  asyncProcessing: boolean = false,
): Promise<ChallengeCompletionResult> {
  const { userId, challengeType, currentProgress } = event;

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    logger.error('[ChallengeReward] Invalid userId format', { userId });
    return {
      success: false,
      coinsAwarded: 0,
      xpAwarded: 0,
      rewardSource: challengeType,
      error: 'Invalid userId format',
    };
  }

  // Calculate reward based on challenge type
  const reward = calculateChallengeReward(challengeType, currentProgress);

  if (!reward) {
    logger.debug('[ChallengeReward] No reward applicable', { userId, challengeType });
    return {
      success: true,
      coinsAwarded: 0,
      xpAwarded: 0,
      rewardSource: challengeType,
    };
  }

  const idempotencyKey = `challenge-${challengeType}-${userId}-${event.eventId || randomUUID()}`;

  if (asyncProcessing) {
    // Enqueue for async processing
    await enqueueWalletCredit({
      userId,
      amount: reward.coins,
      source: challengeType,
      description: reward.description,
      xpAmount: reward.xp,
      idempotencyKey,
    });

    logger.info('[ChallengeReward] Reward enqueued for async processing', {
      userId,
      challengeType,
      coins: reward.coins,
      xp: reward.xp,
    });

    return {
      success: true,
      coinsAwarded: reward.coins,
      xpAwarded: reward.xp,
      rewardSource: challengeType,
      milestone: reward.milestone,
    };
  }

  // Process synchronously
  const result = await creditWalletSync({
    userId,
    amount: reward.coins,
    source: challengeType,
    description: reward.description,
    xpAmount: reward.xp,
    idempotencyKey,
  });

  if (result.success && result.credited) {
    logger.info('[ChallengeReward] Challenge reward credited', {
      userId,
      challengeType,
      coins: reward.coins,
      xp: reward.xp,
      milestone: reward.milestone,
    });
  }

  return {
    success: result.success,
    coinsAwarded: result.success ? reward.coins : 0,
    xpAwarded: result.success ? reward.xp : 0,
    rewardSource: challengeType,
    milestone: reward.milestone,
    error: result.error,
  };
}

/**
 * Calculates the reward for a challenge based on its type and current progress.
 */
export function calculateChallengeReward(
  challengeType: ChallengeType,
  progress: ChallengeProgress,
): { coins: number; xp: number; description: string; milestone?: string } | null {
  switch (challengeType) {
    case 'visit_milestone':
      return calculateVisitMilestoneReward(progress.visitCount);
    case 'spend_milestone':
      return calculateSpendMilestoneReward(progress.spendAmount);
    case 'review_milestone':
      return calculateReviewMilestoneReward(progress.reviewCount);
    case 'referral_milestone':
      return calculateReferralMilestoneReward(progress.referralCount);
    case 'daily_checkin':
      return calculateDailyCheckinReward(progress);
    case 'weekly_streak':
      return calculateWeeklyStreakReward(progress.weeklyStreak);
    case 'weekend_special':
      return calculateWeekendSpecialReward(progress);
    case 'category_challenge':
      return calculateCategoryChallengeReward(progress.categoryCounts);
    default:
      return null;
  }
}

// ── Milestone Calculations ─────────────────────────────────────────────────────

function calculateVisitMilestoneReward(visitCount: number): { coins: number; xp: number; description: string; milestone: string } | null {
  // Find the highest applicable milestone
  const milestones = [...VISIT_CHALLENGE_REWARDS].reverse();
  const milestone = milestones.find((m) => visitCount >= m.visits);

  if (!milestone) {
    return null;
  }

  return {
    coins: milestone.coins,
    xp: milestone.xp,
    description: `${milestone.visits}-visit milestone bonus`,
    milestone: `${milestone.visits} visits`,
  };
}

function calculateSpendMilestoneReward(spendAmount: number): { coins: number; xp: number; description: string; milestone: string } | null {
  // Find the highest applicable spend milestone
  const milestones = [...SPEND_CHALLENGE_REWARDS].reverse();
  const milestone = milestones.find((m) => spendAmount >= m.amount);

  if (!milestone) {
    return null;
  }

  return {
    coins: milestone.coins,
    xp: milestone.xp,
    description: `Rs${milestone.amount} spend milestone bonus`,
    milestone: `Rs${milestone.amount} spent`,
  };
}

function calculateReviewMilestoneReward(reviewCount: number): { coins: number; xp: number; description: string; milestone: string } | null {
  const milestones = [...REVIEW_CHALLENGE_REWARDS].reverse();
  const milestone = milestones.find((m) => reviewCount >= m.count);

  if (!milestone) {
    return null;
  }

  return {
    coins: milestone.coins,
    xp: milestone.xp,
    description: `${milestone.count}-review milestone bonus`,
    milestone: `${milestone.count} reviews`,
  };
}

function calculateReferralMilestoneReward(referralCount: number): { coins: number; xp: number; description: string; milestone: string } | null {
  const milestones = [...REFERRAL_CHALLENGE_REWARDS].reverse();
  const milestone = milestones.find((m) => referralCount >= m.count);

  if (!milestone) {
    return null;
  }

  return {
    coins: milestone.coins,
    xp: milestone.xp,
    description: `${milestone.count}-referral milestone bonus`,
    milestone: `${milestone.count} referrals`,
  };
}

function calculateDailyCheckinReward(progress: ChallengeProgress): { coins: number; xp: number; description: string } | null {
  const today = new Date().toISOString().split('T')[0];

  // Only award if not already checked in today
  if (progress.lastCheckInDate === today) {
    return null;
  }

  return {
    coins: DAILY_CHECKIN_REWARD.coins,
    xp: DAILY_CHECKIN_REWARD.xp,
    description: 'Daily check-in bonus',
  };
}

function calculateWeeklyStreakReward(weeklyStreak: number): { coins: number; xp: number; description: string; milestone: string } | null {
  // Award bonus every 7 days of weekly streak
  if (weeklyStreak > 0 && weeklyStreak % 7 === 0) {
    return {
      coins: WEEKLY_STREAK_BONUS.coins,
      xp: WEEKLY_STREAK_BONUS.xp,
      description: `${weeklyStreak}-day weekly streak bonus`,
      milestone: `${weeklyStreak} day weekly streak`,
    };
  }
  return null;
}

function calculateWeekendSpecialReward(progress: ChallengeProgress): { coins: number; xp: number; description: string } | null {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Weekend: Saturday (6) or Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Check if already claimed today
    const todayStr = today.toISOString().split('T')[0];
    if (progress.lastCheckInDate === todayStr) {
      return null;
    }

    return {
      coins: WEEKEND_SPECIAL_BONUS.coins,
      xp: WEEKEND_SPECIAL_BONUS.xp,
      description: 'Weekend special bonus',
    };
  }

  return null;
}

function calculateCategoryChallengeReward(categoryCounts: Record<string, number>): { coins: number; xp: number; description: string; milestone: string } | null {
  // Find newly explored categories
  const newCategories = Object.keys(categoryCounts).filter((cat) => categoryCounts[cat] === 1);

  if (newCategories.length === 0) {
    return null;
  }

  // Calculate reward based on category
  const totalCoins = newCategories.reduce((sum, cat) => {
    const categoryReward = CATEGORY_CHALLENGE_REWARDS.find((c) => c.category === cat);
    return sum + (categoryReward?.coins || 10);
  }, 0);

  const totalXp = newCategories.reduce((sum, cat) => {
    const categoryReward = CATEGORY_CHALLENGE_REWARDS.find((c) => c.category === cat);
    return sum + (categoryReward?.xp || 5);
  }, 0);

  return {
    coins: totalCoins,
    xp: totalXp,
    description: `New category exploration: ${newCategories.join(', ')}`,
    milestone: `Tried ${newCategories.length} new categories`,
  };
}

// ── Challenge Progress Management ─────────────────────────────────────────────

/**
 * Gets user's current challenge progress from the database.
 */
export async function getUserChallengeProgress(userId: string): Promise<ChallengeProgress> {
  const UserChallengeProgress = mongoose.connection.collection('userchallengeprogresses');

  const doc = await UserChallengeProgress.findOne({ userId });

  if (!doc) {
    return {
      visitCount: 0,
      spendAmount: 0,
      reviewCount: 0,
      referralCount: 0,
      categoryCounts: {},
      weeklyStreak: 0,
    };
  }

  return {
    visitCount: (doc.visitCount as number) || 0,
    spendAmount: (doc.spendAmount as number) || 0,
    reviewCount: (doc.reviewCount as number) || 0,
    referralCount: (doc.referralCount as number) || 0,
    categoryCounts: (doc.categoryCounts as Record<string, number>) || {},
    lastCheckInDate: doc.lastCheckInDate as string | undefined,
    weeklyStreak: (doc.weeklyStreak as number) || 0,
  };
}

/**
 * Updates user's challenge progress in the database.
 */
export async function updateUserChallengeProgress(
  userId: string,
  updates: Partial<ChallengeProgress>,
): Promise<void> {
  const UserChallengeProgress = mongoose.connection.collection('userchallengeprogresses');

  const updateDoc: Record<string, unknown> = { updatedAt: new Date() };

  if (updates.visitCount !== undefined) {
    updateDoc.visitCount = updates.visitCount;
  }
  if (updates.spendAmount !== undefined) {
    updateDoc.spendAmount = updates.spendAmount;
  }
  if (updates.reviewCount !== undefined) {
    updateDoc.reviewCount = updates.reviewCount;
  }
  if (updates.referralCount !== undefined) {
    updateDoc.referralCount = updates.referralCount;
  }
  if (updates.categoryCounts !== undefined) {
    // Merge category counts
    const currentProgress = await getUserChallengeProgress(userId);
    const mergedCategories = { ...currentProgress.categoryCounts, ...updates.categoryCounts };
    updateDoc.categoryCounts = mergedCategories;
  }
  if (updates.lastCheckInDate !== undefined) {
    updateDoc.lastCheckInDate = updates.lastCheckInDate;
  }
  if (updates.weeklyStreak !== undefined) {
    updateDoc.weeklyStreak = updates.weeklyStreak;
  }

  await UserChallengeProgress.updateOne(
    { userId },
    {
      $set: updateDoc,
      $setOnInsert: {
        userId,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

/**
 * Records a completed challenge in the gamification history.
 */
export async function recordChallengeCompletion(
  userId: string,
  challengeType: ChallengeType,
  coinsAwarded: number,
  xpAwarded: number,
  milestone?: string,
): Promise<void> {
  const GamificationHistory = mongoose.connection.collection('gamificationhistory');

  await GamificationHistory.insertOne({
    userId,
    type: 'challenge_completion',
    challengeType,
    coinsAwarded,
    xpAwarded,
    milestone,
    completedAt: new Date(),
    createdAt: new Date(),
  });
}

// ── Service Interface ─────────────────────────────────────────────────────────

export class ChallengeRewardService {
  /**
   * Process a challenge completion event.
   * Automatically determines the reward based on challenge type and current progress.
   */
  async processChallenge(event: ChallengeRewardEvent): Promise<ChallengeCompletionResult> {
    return processChallengeReward(event, false);
  }

  /**
   * Enqueue a challenge completion event for async processing.
   */
  async enqueueChallengeReward(event: ChallengeRewardEvent): Promise<ChallengeCompletionResult> {
    return processChallengeReward(event, true);
  }

  /**
   * Get available rewards for a user based on their current progress.
   */
  async getAvailableRewards(userId: string): Promise<{
    challenges: Array<{
      type: ChallengeType;
      description: string;
      progress: number;
      target: number;
      reward: { coins: number; xp: number };
    }>;
  }> {
    const progress = await getUserChallengeProgress(userId);

    const availableRewards = new Array<{
      type: ChallengeType;
      description: string;
      progress: number;
      target: number;
      reward: { coins: number; xp: number };
    }>();

    // Visit milestones
    for (const milestone of VISIT_CHALLENGE_REWARDS) {
      if (progress.visitCount < milestone.visits) {
        availableRewards.push({
          type: 'visit_milestone',
          description: `Visit ${milestone.visits} stores`,
          progress: progress.visitCount,
          target: milestone.visits,
          reward: { coins: milestone.coins, xp: milestone.xp },
        });
      }
    }

    // Spend milestones
    for (const milestone of SPEND_CHALLENGE_REWARDS) {
      if (progress.spendAmount < milestone.amount) {
        availableRewards.push({
          type: 'spend_milestone',
          description: `Spend Rs${milestone.amount}`,
          progress: progress.spendAmount,
          target: milestone.amount,
          reward: { coins: milestone.coins, xp: milestone.xp },
        });
      }
    }

    // Review milestones
    for (const milestone of REVIEW_CHALLENGE_REWARDS) {
      if (progress.reviewCount < milestone.count) {
        availableRewards.push({
          type: 'review_milestone',
          description: `Write ${milestone.count} reviews`,
          progress: progress.reviewCount,
          target: milestone.count,
          reward: { coins: milestone.coins, xp: milestone.xp },
        });
      }
    }

    // Referral milestones
    for (const milestone of REFERRAL_CHALLENGE_REWARDS) {
      if (progress.referralCount < milestone.count) {
        availableRewards.push({
          type: 'referral_milestone',
          description: `Refer ${milestone.count} friends`,
          progress: progress.referralCount,
          target: milestone.count,
          reward: { coins: milestone.coins, xp: milestone.xp },
        });
      }
    }

    return { challenges: availableRewards };
  }

  /**
   * Get user's challenge history.
   */
  async getChallengeHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    history: Array<{
      challengeType: ChallengeType;
      coinsAwarded: number;
      xpAwarded: number;
      milestone?: string;
      completedAt: Date;
    }>;
    total: number;
  }> {
    const GamificationHistory = mongoose.connection.collection('gamificationhistory');

    const [history, total] = await Promise.all([
      GamificationHistory.find({ userId, type: 'challenge_completion' })
        .sort({ completedAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      GamificationHistory.countDocuments({ userId, type: 'challenge_completion' }),
    ]);

    return {
      history: history.map((h) => ({
        challengeType: h.challengeType as ChallengeType,
        coinsAwarded: h.coinsAwarded as number,
        xpAwarded: h.xpAwarded as number,
        milestone: h.milestone as string | undefined,
        completedAt: h.completedAt as Date,
      })),
      total,
    };
  }
}

// Export singleton instance
export const challengeRewardService = new ChallengeRewardService();
