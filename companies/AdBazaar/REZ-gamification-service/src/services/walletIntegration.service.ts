/**
 * Wallet Integration Service
 *
 * Handles auto-crediting coins to user wallets via the Wallet Service API.
 * Provides a unified interface for crediting coins from various gamification events.
 *
 * Pattern: Credit wallet FIRST via Wallet Service API, then write audit ledger SECOND.
 * This prevents orphaned credits when the wallet service is unavailable.
 */

import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { createServiceLogger } from '../config/logger';
import { creditCoinsViaWalletService } from '../httpServer';
import { Queue } from 'bullmq';
import { bullmqRedis } from '../config/redis';
import { track } from './intentCaptureService';

const logger = createServiceLogger('wallet-integration');

export const WALLET_CREDIT_QUEUE = 'wallet-credit-events';

// ── Challenge Reward Configuration ───────────────────────────────────────────

/** Visit milestone challenges */
export const VISIT_CHALLENGE_REWARDS: ReadonlyArray<{ readonly visits: number; readonly coins: number; readonly xp: number }> = [
  Object.freeze({ visits: 7, coins: 50, xp: 25 }),
  Object.freeze({ visits: 30, coins: 200, xp: 100 }),
  Object.freeze({ visits: 100, coins: 500, xp: 250 }),
] as const;

/** Spend milestone challenges (amount in Rs) */
export const SPEND_CHALLENGE_REWARDS: ReadonlyArray<{ readonly amount: number; readonly coins: number; readonly xp: number }> = [
  Object.freeze({ amount: 1000, coins: 50, xp: 25 }),
  Object.freeze({ amount: 5000, coins: 200, xp: 100 }),
  Object.freeze({ amount: 10000, coins: 500, xp: 250 }),
] as const;

/** Review challenges */
export const REVIEW_CHALLENGE_REWARDS: ReadonlyArray<{ readonly count: number; readonly coins: number; readonly xp: number }> = [
  Object.freeze({ count: 5, coins: 100, xp: 50 }),
  Object.freeze({ count: 10, coins: 250, xp: 125 }),
] as const;

/** Referral challenges */
export const REFERRAL_CHALLENGE_REWARDS: ReadonlyArray<{ readonly count: number; readonly coins: number; readonly xp: number }> = [
  Object.freeze({ count: 3, coins: 300, xp: 150 }),
  Object.freeze({ count: 10, coins: 1000, xp: 500 }),
] as const;

/** Daily challenge rewards */
export const DAILY_CHECKIN_REWARD = { coins: 5, xp: 5 };
export const WEEKLY_STREAK_BONUS = { coins: 50, xp: 25 };
export const WEEKEND_SPECIAL_BONUS = { coins: 25, xp: 10 };

// ── Queue Singleton ───────────────────────────────────────────────────────────

let _walletCreditQueue: Queue | null = null;

export function getWalletCreditQueue(): Queue {
  if (!_walletCreditQueue) {
    _walletCreditQueue = new Queue(WALLET_CREDIT_QUEUE, { connection: bullmqRedis });
  }
  return _walletCreditQueue;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type RewardSource =
  | 'visit_milestone'
  | 'spend_milestone'
  | 'review_milestone'
  | 'referral_milestone'
  | 'daily_checkin'
  | 'weekly_streak'
  | 'weekend_special'
  | 'category_challenge'
  | 'achievement'
  | 'challenge_completion';

export interface WalletCreditRequest {
  userId: string;
  amount: number;
  coinType?: string;
  source: RewardSource;
  description: string;
  xpAmount?: number;
  achievementId?: string;
  challengeId?: string;
  idempotencyKey?: string;
}

export interface WalletCreditResult {
  success: boolean;
  credited: boolean;
  amount: number;
  xpAwarded: number;
  transactionId?: string;
  error?: string;
}

// ── Core Functions ───────────────────────────────────────────────────────────

/**
 * Enqueues an async wallet credit request via BullMQ.
 * Use this for background processing when immediate response is not needed.
 */
export async function enqueueWalletCredit(request: WalletCreditRequest): Promise<string> {
  const jobId = request.idempotencyKey || `wallet-credit-${request.userId}-${Date.now()}-${randomUUID()}`;

  await getWalletCreditQueue().add(
    'credit',
    {
      ...request,
      idempotencyKey: jobId,
    },
    {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 3600, count: 10000 },
      removeOnFail: { age: 86400, count: 5000 },
    },
  );

  logger.debug('[WalletIntegration] Credit enqueued', {
    userId: request.userId,
    amount: request.amount,
    source: request.source,
    jobId,
  });

  return jobId;
}

/**
 * Credits coins to a user's wallet synchronously.
 * Calls Wallet Service API, then writes audit ledger entry.
 *
 * @returns WalletCreditResult with success status and details
 */
export async function creditWalletSync(
  request: WalletCreditRequest,
): Promise<WalletCreditResult> {
  const { userId, amount, coinType = 'rez', source, description, xpAmount = 0 } = request;

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    logger.error('[WalletIntegration] Invalid userId format', { userId });
    return { success: false, credited: false, amount: 0, xpAwarded: 0, error: 'Invalid userId format' };
  }

  // Validate amount
  if (!Number.isFinite(amount) || amount <= 0) {
    logger.error('[WalletIntegration] Invalid coin amount', { userId, amount });
    return { success: false, credited: false, amount: 0, xpAwarded: 0, error: 'Invalid coin amount' };
  }

  const idempotencyKey = request.idempotencyKey || `${source}-${userId}-${randomUUID()}`;

  try {
    // Step 1: Credit wallet via Wallet Service API
    const credited = await creditCoinsViaWalletService(
      userId,
      amount,
      idempotencyKey,
      description,
      coinType,
      'gamification',
    );

    if (!credited) {
      logger.error('[WalletIntegration] Wallet credit failed', { userId, amount, source });
      return { success: false, credited: false, amount, xpAwarded: 0, error: 'Wallet service credit failed' };
    }

    // Step 2: Write audit ledger entry (only after confirmed credit)
    await writeGamificationLedger({
      userId,
      amount,
      coinType,
      source,
      description,
      idempotencyKey,
    });

    // Step 3: Award XP if specified
    let xpAwarded = 0;
    if (xpAmount > 0) {
      xpAwarded = await awardXP(userId, xpAmount, source, idempotencyKey);
    }

    // Step 4: Publish gamification.reward_credited event
    await publishRewardCreditedEvent(userId, amount, source, description, xpAwarded);

    // Step 5: Track analytics intent
    track({
      userId,
      event: 'reward_credited',
      intentKey: `gamification_${source}`,
      properties: { amount, source, xp: xpAwarded },
    }).catch(() => {});

    logger.info('[WalletIntegration] Wallet credited successfully', {
      userId,
      amount,
      xpAwarded,
      source,
      idempotencyKey,
    });

    return {
      success: true,
      credited: true,
      amount,
      xpAwarded,
      transactionId: idempotencyKey,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[WalletIntegration] Credit failed', {
      userId,
      amount,
      source,
      error: errorMessage,
    });
    return { success: false, credited: false, amount, xpAwarded: 0, error: errorMessage };
  }
}

/**
 * Writes an audit entry to the gamification ledger for reconciliation.
 */
async function writeGamificationLedger(params: {
  userId: string;
  amount: number;
  coinType: string;
  source: RewardSource;
  description: string;
  idempotencyKey: string;
}): Promise<void> {
  const GamificationLedger = mongoose.connection.collection('gamificationledger');

  await GamificationLedger.updateOne(
    { dedupKey: params.idempotencyKey },
    {
      $setOnInsert: {
        userId: params.userId,
        amount: params.amount,
        coinType: params.coinType,
        type: 'credit',
        source: params.source,
        description: params.description,
        dedupKey: params.idempotencyKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

/**
 * Awards XP to a user and updates their ReZ Score.
 */
async function awardXP(userId: string, amount: number, source: string, idempotencyKey: string): Promise<number> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  try {
    // Update user's XP in userprofiles collection
    const UserProfiles = mongoose.connection.collection('userprofiles');
    await UserProfiles.updateOne(
      { userId },
      {
        $inc: { xp: amount, totalXpEarned: amount },
        $set: { lastXpUpdate: new Date() },
        $setOnInsert: { userId, xp: amount, totalXpEarned: amount, createdAt: new Date() },
      },
      { upsert: true },
    );

    // Update ReZ Score (XP-based tier calculation)
    await updateReZScore(userId, amount, idempotencyKey);

    // Publish XP gained event
    await publishXPGainedEvent(userId, amount, source);

    logger.debug('[WalletIntegration] XP awarded', { userId, amount, source });
    return amount;
  } catch (error) {
    logger.error('[WalletIntegration] XP award failed', {
      userId,
      amount,
      source,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Updates the user's ReZ Score based on XP earned.
 */
async function updateReZScore(userId: string, xpGained: number, idempotencyKey: string): Promise<void> {
  try {
    const UserProfiles = mongoose.connection.collection('userprofiles');
    const userProfile = await UserProfiles.findOne({ userId });

    if (!userProfile) {
      return;
    }

    const currentXp = (userProfile.xp as number) || 0;
    const currentScore = (userProfile.rezScore as number) || 0;

    // ReZ Score calculation: Base score + (XP * multiplier)
    // Tier multipliers: Bronze (1x), Silver (1.5x), Gold (2x), Platinum (3x), Diamond (5x)
    const tier = getReZTier(currentXp);
    const tierMultiplier = getTierMultiplier(tier);
    const newScore = currentScore + Math.floor(xpGained * tierMultiplier);

    await UserProfiles.updateOne(
      { userId },
      {
        $set: {
          rezScore: newScore,
          currentTier: tier,
          lastScoreUpdate: new Date(),
        },
      },
    );

    // Publish achievement_unlocked event if tier changed
    if (tier !== (userProfile.currentTier as string)) {
      await publishAchievementUnlockedEvent(userId, `tier_${tier}`, `Reached ${tier} tier!`);
    }

    logger.debug('[WalletIntegration] ReZ Score updated', { userId, newScore, tier });
  } catch (error) {
    logger.error('[WalletIntegration] ReZ Score update failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getReZTier(xp: number): string {
  if (xp >= 10000) return 'diamond';
  if (xp >= 5000) return 'platinum';
  if (xp >= 2500) return 'gold';
  if (xp >= 1000) return 'silver';
  return 'bronze';
}

function getTierMultiplier(tier: string): number {
  const multipliers: Record<string, number> = {
    bronze: 1,
    silver: 1.5,
    gold: 2,
    platinum: 3,
    diamond: 5,
  };
  return multipliers[tier] || 1;
}

// ── Event Publishing ─────────────────────────────────────────────────────────

/**
 * Publishes a reward_credited event to the notification queue.
 */
async function publishRewardCreditedEvent(
  userId: string,
  amount: number,
  source: string,
  description: string,
  xpEarned: number,
): Promise<void> {
  const { getNotificationQueue } = await import('./notificationService');
  const notifQueue = getNotificationQueue();

  try {
    await notifQueue.add(
      'reward_credited',
      {
        eventId: `reward-credited-${userId}-${Date.now()}`,
        eventType: 'gamification.reward_credited',
        userId,
        channels: ['push', 'in_app'],
        payload: {
          title: 'Coins Earned!',
          body: `+${amount} REZ coins from ${source}!`,
          channelId: 'gamification',
          priority: 'default',
          data: {
            coins: amount,
            xp: xpEarned,
            source,
            description,
          },
        },
        category: 'gamification',
        source: 'wallet-integration-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  } catch (error) {
    logger.error('[WalletIntegration] Failed to publish reward_credited event', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Publishes an XP gained event.
 */
async function publishXPGainedEvent(userId: string, xp: number, source: string): Promise<void> {
  const { getNotificationQueue } = await import('./notificationService');
  const notifQueue = getNotificationQueue();

  try {
    await notifQueue.add(
      'xp_gained',
      {
        eventId: `xp-gained-${userId}-${Date.now()}`,
        eventType: 'gamification.xp_gained',
        userId,
        channels: ['in_app'],
        payload: {
          title: 'XP Earned!',
          body: `+${xp} XP from ${source}!`,
          channelId: 'gamification',
          priority: 'low',
          data: { xp, source },
        },
        category: 'gamification',
        source: 'wallet-integration-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  } catch (error) {
    logger.error('[WalletIntegration] Failed to publish xp_gained event', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Publishes an achievement unlocked event.
 */
async function publishAchievementUnlockedEvent(
  userId: string,
  achievementId: string,
  achievementName: string,
): Promise<void> {
  const { getNotificationQueue } = await import('./notificationService');
  const notifQueue = getNotificationQueue();

  try {
    await notifQueue.add(
      'achievement_unlocked',
      {
        eventId: `achievement-unlocked-${userId}-${achievementId}`,
        eventType: 'gamification.achievement_unlocked',
        userId,
        channels: ['push', 'in_app'],
        payload: {
          title: 'Achievement Unlocked!',
          body: achievementName,
          channelId: 'gamification',
          priority: 'high',
          data: { achievementId, achievementName },
        },
        category: 'gamification',
        source: 'wallet-integration-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  } catch (error) {
    logger.error('[WalletIntegration] Failed to publish achievement_unlocked event', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Gets the reward for a visit milestone.
 */
export function getVisitMilestoneReward(visits: number): { coins: number; xp: number } | null {
  const milestone = VISIT_CHALLENGE_REWARDS.find((m) => m.visits === visits);
  return milestone ? { coins: milestone.coins, xp: milestone.xp } : null;
}

/**
 * Gets the reward for a spend milestone.
 */
export function getSpendMilestoneReward(amount: number): { coins: number; xp: number } | null {
  const milestone = SPEND_CHALLENGE_REWARDS.find((m) => m.amount === amount);
  return milestone ? { coins: milestone.coins, xp: milestone.xp } : null;
}

/**
 * Gets the reward for a review milestone.
 */
export function getReviewMilestoneReward(count: number): { coins: number; xp: number } | null {
  const milestone = REVIEW_CHALLENGE_REWARDS.find((m) => m.count === count);
  return milestone ? { coins: milestone.coins, xp: milestone.xp } : null;
}

/**
 * Gets the reward for a referral milestone.
 */
export function getReferralMilestoneReward(count: number): { coins: number; xp: number } | null {
  const milestone = REFERRAL_CHALLENGE_REWARDS.find((m) => m.count === count);
  return milestone ? { coins: milestone.coins, xp: milestone.xp } : null;
}

/**
 * Closes the wallet credit queue connection.
 */
export async function closeWalletCreditQueue(): Promise<void> {
  if (_walletCreditQueue) {
    await _walletCreditQueue.close();
    _walletCreditQueue = null;
  }
}
