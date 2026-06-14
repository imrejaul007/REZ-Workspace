/**
 * Marketing Service Integration
 *
 * Handles integration with rez-marketing-service for:
 * - Voucher rewards for gamification milestones
 * - Campaign triggers for achievements
 * - Segment-based broadcasts for leaderboard celebrations
 */

import { Queue } from 'bullmq';
import { bullmqRedis } from '../config/redis';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('marketing-service');

const MARKETING_QUEUE = 'notification-events';

let _marketingQueue: Queue | null = null;

function getMarketingQueue(): Queue {
  if (!_marketingQueue) {
    _marketingQueue = new Queue(MARKETING_QUEUE, { connection: bullmqRedis });
  }
  return _marketingQueue;
}

export interface VoucherRewardData {
  userId: string;
  voucherCode: string;
  voucherType: 'percentage' | 'fixed' | 'bogo' | 'free_delivery';
  voucherValue: number;
  description: string;
  validHours?: number;
  email?: string;
  phone?: string;
}

export interface AchievementRewardData {
  userId: string;
  achievementId: string;
  achievementName: string;
  coins: number;
  email?: string;
  phone?: string;
}

export interface LeaderboardCelebrationData {
  userId: string;
  rank: number;
  previousRank?: number;
  channel?: 'top_10' | 'top_100' | 'top_500';
}

/**
 * Sends a voucher notification for gamification milestone rewards.
 * Sends via push, email, and SMS based on available user data.
 */
export async function sendVoucherRewardNotification(data: VoucherRewardData): Promise<void> {
  const channels: ('push' | 'email' | 'sms' | 'in_app')[] = ['push', 'in_app'];
  if (data.email) channels.push('email');
  if (data.phone) channels.push('sms');

  const payload: Record<string, unknown> = {
    title: 'REZ Reward Unlocked!',
    body: `${data.description} — Code: ${data.voucherCode}`,
    channelId: 'rewards',
    priority: 'default',
    voucherCode: data.voucherCode,
    voucherType: data.voucherType,
    voucherValue: data.voucherValue,
    description: data.description,
  };

  if (data.email) {
    payload.emailSubject = `Your REZ Reward: ${data.description}`;
    payload.smsMessage = `REZ reward! Use code ${data.voucherCode} to claim your ${data.description}. Valid for ${data.validHours || 24} hours.`;
  }

  if (data.phone) {
    payload.smsMessage = `REZ: ${data.description}. Code ${data.voucherCode}. Valid ${data.validHours || 24}h.`;
  }

  try {
    await getMarketingQueue().add(
      'voucher_reward',
      {
        eventId: `voucher-reward-${data.userId}-${data.voucherCode}-${Date.now()}`,
        eventType: 'marketing_voucher',
        userId: data.userId,
        channels,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload,
        },
        category: 'gamification',
        source: 'gamification-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    logger.info('[MarketingService] Voucher reward notification queued', {
      userId: data.userId,
      voucherCode: data.voucherCode,
    });
  } catch (error) {
    logger.error('[MarketingService] Failed to queue voucher notification', {
      userId: data.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Sends a multi-channel notification for achievement unlocks.
 * Includes push, email, and SMS for major achievements.
 */
export async function sendAchievementNotification(data: AchievementRewardData): Promise<void> {
  const channels: ('push' | 'email' | 'sms' | 'in_app')[] = ['push', 'in_app'];
  if (data.email) channels.push('email');
  if (data.phone) channels.push('sms');

  const payload: Record<string, unknown> = {
    title: `Achievement Unlocked: ${data.achievementName}`,
    body: `You earned ${data.coins} REZ coins for ${data.achievementName}!`,
    channelId: 'gamification',
    priority: 'high',
    achievementId: data.achievementId,
    achievementName: data.achievementName,
    coins: data.coins,
  };

  if (data.email) {
    payload.emailSubject = `Achievement Unlocked: ${data.achievementName}!`;
  }

  if (data.phone) {
    payload.smsMessage = `REZ: Achievement unlocked! ${data.achievementName} — +${data.coins} coins!`;
  }

  try {
    await getMarketingQueue().add(
      'achievement_unlocked',
      {
        eventId: `achievement-${data.userId}-${data.achievementId}-${Date.now()}`,
        eventType: 'achievement_unlocked',
        userId: data.userId,
        channels,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload,
        },
        category: 'gamification',
        source: 'gamification-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    logger.info('[MarketingService] Achievement notification queued', {
      userId: data.userId,
      achievementId: data.achievementId,
    });
  } catch (error) {
    logger.error('[MarketingService] Failed to queue achievement notification', {
      userId: data.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Sends a leaderboard celebration notification when user enters top rankings.
 */
export async function sendLeaderboardCelebrationNotification(data: LeaderboardCelebrationData): Promise<void> {
  const channels: ('push' | 'in_app')[] = ['push', 'in_app'];

  const rankEmoji = data.rank === 1 ? '🏆' : data.rank <= 3 ? '🎉' : '⭐';
  const rankChange = data.previousRank !== undefined
    ? data.previousRank > data.rank ? ` (up from #${data.previousRank})` : ''
    : '';

  try {
    await getMarketingQueue().add(
      'leaderboard_celebration',
      {
        eventId: `leaderboard-${data.userId}-rank${data.rank}-${Date.now()}`,
        eventType: 'leaderboard_rank_changed',
        userId: data.userId,
        channels,
        payload: {
          title: `${rankEmoji} You're Rank #${data.rank}!`,
          body: `Congratulations! You're now #${data.rank} on the REZ Leaderboard${rankChange}. Keep it up!`,
          channelId: 'leaderboard',
          priority: data.rank <= 10 ? 'high' : 'default',
          data: {
            rank: data.rank,
            previousRank: data.previousRank,
            channel: data.channel,
          },
        },
        category: 'gamification',
        source: 'gamification-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    logger.info('[MarketingService] Leaderboard celebration queued', {
      userId: data.userId,
      rank: data.rank,
    });
  } catch (error) {
    logger.error('[MarketingService] Failed to queue leaderboard notification', {
      userId: data.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Sends a streak milestone notification with multi-channel support.
 */
export async function sendStreakMilestoneNotification(
  userId: string,
  streakDays: number,
  rewardCoins: number,
  email?: string,
  phone?: string,
): Promise<void> {
  const channels: ('push' | 'email' | 'sms' | 'in_app')[] = ['push', 'in_app'];
  if (email) channels.push('email');
  if (phone) channels.push('sms');

  const milestoneMessage = streakDays === 7
    ? 'Week Warrior!'
    : streakDays === 30
      ? 'Month Master!'
      : `${streakDays}-Day Champion!`;

  const payload: Record<string, unknown> = {
    title: `${streakDays}-Day Streak! ${milestoneMessage}`,
    body: `Amazing! You've maintained a ${streakDays}-day streak and earned ${rewardCoins} bonus REZ coins!`,
    channelId: 'streaks',
    priority: streakDays >= 7 ? 'high' : 'default',
    streakDays,
    rewardCoins,
  };

  if (email) {
    payload.emailSubject = `Incredible ${streakDays}-Day Streak! 🏆`;
  }

  if (phone) {
    payload.smsMessage = `REZ: ${streakDays}-day streak! ${milestoneMessage} +${rewardCoins} bonus coins!`;
  }

  try {
    await getMarketingQueue().add(
      'streak_milestone',
      {
        eventId: `streak-milestone-${userId}-${streakDays}-${Date.now()}`,
        eventType: 'streak_milestone',
        userId,
        channels,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload,
        },
        category: 'gamification',
        source: 'gamification-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    logger.info('[MarketingService] Streak milestone notification queued', {
      userId,
      streakDays,
      rewardCoins,
    });
  } catch (error) {
    logger.error('[MarketingService] Failed to queue streak notification', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Sends a challenge completion notification.
 */
export async function sendChallengeCompletionNotification(
  userId: string,
  challengeName: string,
  rewardCoins: number,
  rank?: number,
  email?: string,
  phone?: string,
): Promise<void> {
  const channels: ('push' | 'email' | 'sms' | 'in_app')[] = ['push', 'in_app'];
  if (email) channels.push('email');
  if (phone) channels.push('sms');

  const rankText = rank !== undefined ? ` You ranked #${rank}!` : '';

  const payload: Record<string, unknown> = {
    title: `Challenge Complete: ${challengeName}`,
    body: `Congratulations! You completed "${challengeName}" and earned ${rewardCoins} REZ coins!${rankText}`,
    channelId: 'challenges',
    priority: 'high',
    challengeName,
    rewardCoins,
    rank,
  };

  if (email) {
    payload.emailSubject = `Challenge Complete: ${challengeName}`;
  }

  if (phone) {
    payload.smsMessage = `REZ: Challenge "${challengeName}" complete! +${rewardCoins} coins!${rankText}`;
  }

  try {
    await getMarketingQueue().add(
      'challenge_complete',
      {
        eventId: `challenge-complete-${userId}-${challengeName}-${Date.now()}`,
        eventType: 'challenge_completed',
        userId,
        channels,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload,
        },
        category: 'gamification',
        source: 'gamification-service',
        createdAt: new Date().toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    logger.info('[MarketingService] Challenge completion notification queued', {
      userId,
      challengeName,
      rewardCoins,
    });
  } catch (error) {
    logger.error('[MarketingService] Failed to queue challenge notification', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function closeMarketingService(): Promise<void> {
  if (_marketingQueue) {
    await _marketingQueue.close();
    _marketingQueue = null;
  }
}
