/**
 * Loyalty Notifications
 *
 * Handles push notifications and in-app alerts for loyalty events:
 * - Milestone unlocked
 * - Badge earned
 * - Streak at risk
 * - Tier upgrade
 * - Streak maintained
 */

import { logger } from '@/lib/utils/logger';
import type { UnlockedMilestone } from '@/lib/api/loyalty';
import { TIER_DISPLAY } from '@/lib/loyalty';
import type { LoyaltyTier } from '@/lib/loyalty';
import { randomBytes } from 'crypto';

// ── Notification Types ───────────────────────────────────────────────────────────

export type LoyaltyNotificationType =
  | 'milestone_unlocked'
  | 'badge_earned'
  | 'streak_at_risk'
  | 'streak_maintained'
  | 'tier_upgrade'
  | 'coins_earned'
  | 'points_earned';

export interface LoyaltyNotification {
  id: string;
  type: LoyaltyNotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// ── Notification Templates ───────────────────────────────────────────────────────

function createNotification(
  type: LoyaltyNotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  actionUrl?: string
): LoyaltyNotification {
  // Use crypto.randomUUID for secure ID generation
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `notif_${Date.now()}_${randomBytes(8).toString('hex')}`;

  return {
    id,
    type,
    title,
    body,
    data,
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl,
  };
}

// ── Milestone Notifications ──────────────────────────────────────────────────────

/**
 * Create notification for milestone unlock
 */
export function createMilestoneUnlockedNotification(
  milestone: UnlockedMilestone
): LoyaltyNotification {
  const rewardMessages: string[] = [];

  if ((milestone.reward.coins ?? 0) > 0) {
    rewardMessages.push(`${milestone.reward.coins} coins`);
  }
  if (milestone.reward.discount) {
    rewardMessages.push(`${milestone.reward.discount} discount`);
  }
  if (milestone.reward.badge) {
    rewardMessages.push('a new badge');
  }

  const rewardText =
    rewardMessages.length > 0
      ? ` You earned ${rewardMessages.join(' and ')}.`
      : '';

  return createNotification(
    'milestone_unlocked',
    `🎉 ${milestone.name} Unlocked!`,
    `${milestone.description}.${rewardText}`,
    {
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      rewards: milestone.reward,
    },
    '/loyalty?tab=milestones'
  );
}

/**
 * Create notification for badge earned
 */
export function createBadgeEarnedNotification(
  badgeId: string,
  badgeName: string,
  icon: string
): LoyaltyNotification {
  return createNotification(
    'badge_earned',
    `🏅 New Badge: ${badgeName}`,
    `You've earned the ${badgeName} badge! Keep up the great work.`,
    {
      badgeId,
      badgeName,
      icon,
    },
    '/loyalty?tab=badges'
  );
}

// ── Tier Helpers ─────────────────────────────────────────────────────────────────

const TIER_PERKS: Record<LoyaltyTier, string[]> = {
  bronze: ['Basic rewards', 'Birthday bonus'],
  silver: ['3% cashback', 'Priority support', 'Exclusive offers'],
  gold: ['5% cashback', 'Free delivery', 'Early access', 'VIP events'],
  platinum: ['7% cashback', 'Free delivery always', 'Personal concierge', 'Platinum events'],
  diamond: ['10% cashback', 'All platinum perks', 'Dedicated account manager', 'Diamond events'],
};

function getTierPerks(tier: LoyaltyTier): string[] {
  return TIER_PERKS[tier] || TIER_PERKS.bronze;
}

// ── Tier Notifications ───────────────────────────────────────────────────────────

/**
 * Create notification for tier upgrade
 */
export function createTierUpgradeNotification(
  previousTier: LoyaltyTier,
  newTier: LoyaltyTier
): LoyaltyNotification {

  const tierPerks = getTierPerks(newTier);

  return createNotification(
    'tier_upgrade',
    `⭐ You've been upgraded to ${TIER_DISPLAY[newTier].name}!`,
    `Congratulations! You're now a ${TIER_DISPLAY[newTier].name} member with better rewards and perks.`,
    {
      previousTier,
      newTier,
      perks: tierPerks,
    },
    '/loyalty?tab=tier'
  );
}

// ── Streak Notifications ─────────────────────────────────────────────────────────

/**
 * Create notification for streak at risk
 */
export function createStreakAtRiskNotification(
  currentStreak: number,
  daysRemaining: number
): LoyaltyNotification {
  return createNotification(
    'streak_at_risk',
    `🔥 Your ${currentStreak}-day streak is at risk!`,
    `Visit within ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} to keep your streak alive.`,
    {
      currentStreak,
      daysRemaining,
    },
    '/menu'
  );
}

/**
 * Create notification for streak maintained
 */
export function createStreakMaintainedNotification(
  currentStreak: number
): LoyaltyNotification {
  let message = '';
  if (currentStreak === 7) {
    message = "You've earned the Week Warrior badge!";
  } else if (currentStreak === 14) {
    message = "You've earned the Two Week Champion badge!";
  } else if (currentStreak === 30) {
    message = "You've earned the Monthly Master badge!";
  } else {
    message = `Keep it up! You're on a ${currentStreak}-day streak.`;
  }

  return createNotification(
    'streak_maintained',
    `🔥 Streak maintained: ${currentStreak} days!`,
    message,
    {
      currentStreak,
    },
    '/loyalty?tab=streak'
  );
}

// ── Points & Coins Notifications ─────────────────────────────────────────────────

/**
 * Create notification for coins earned
 */
export function createCoinsEarnedNotification(
  coins: number,
  source: string
): LoyaltyNotification {
  return createNotification(
    'coins_earned',
    `🪙 +${coins} Coins!`,
    `You earned ${coins} coins from ${source}.`,
    {
      coins,
      source,
    }
  );
}

/**
 * Create notification for points earned
 */
export function createPointsEarnedNotification(
  points: number,
  source: string
): LoyaltyNotification {
  return createNotification(
    'points_earned',
    `✨ +${points} Points!`,
    `You earned ${points} points from ${source}.`,
    {
      points,
      source,
    }
  );
}

// ── Notification Queue ───────────────────────────────────────────────────────────

// In-memory queue for demo; in production, use Redis or similar
let notificationQueue: LoyaltyNotification[] = [];

/**
 * Add notification to queue
 */
export function enqueueNotification(notification: LoyaltyNotification): void {
  notificationQueue.push(notification);
  logger.info('Loyalty notification enqueued', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
  });

  // In production, this would trigger push notification service
  triggerPushNotification(notification);
}

/**
 * Get pending notifications
 */
export function getPendingNotifications(): LoyaltyNotification[] {
  return notificationQueue.filter((n) => !n.read);
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notificationId: string): void {
  const notification = notificationQueue.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
    logger.info('Notification marked as read', { id: notificationId });
  }
}

/**
 * Clear all notifications
 */
export function clearNotifications(): void {
  notificationQueue = [];
  logger.info('All notifications cleared');
}

// ── Push Notification Integration ────────────────────────────────────────────────

/**
 * Trigger push notification (stub - would integrate with FCM/APNs)
 */
async function triggerPushNotification(notification: LoyaltyNotification): Promise<void> {
  // In production, this would call FCM or APNs
  // Example with Firebase Cloud Messaging:
  // await sendPushNotification({
  //   token: user.fcmToken,
  //   notification: {
  //     title: notification.title,
  //     body: notification.body,
  //   },
  //   data: notification.data,
  // });

  logger.info('Push notification triggered', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
  });

  // For demo, log to console with SSR-safe browser check
  if (isBrowser() && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icons/loyalty.png',
        });
      } catch (err) {
        logger.error('Failed to show browser notification', { error: err });
      }
    }
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      logger.error('Failed to request notification permission', { error: err });
      return false;
    }
  }

  return false;
}

// ── Event Handlers ──────────────────────────────────────────────────────────────

/**
 * Handle milestone unlock event
 */
export function handleMilestoneUnlocked(event: { milestone: UnlockedMilestone }): void {
  const notification = createMilestoneUnlockedNotification(event.milestone);
  enqueueNotification(notification);
}

/**
 * Handle tier upgrade event
 */
export function handleTierUpgrade(event: { previousTier: LoyaltyTier; newTier: LoyaltyTier }): void {
  const notification = createTierUpgradeNotification(
    event.previousTier,
    event.newTier
  );
  enqueueNotification(notification);
}

/**
 * Handle streak at risk
 */
export function handleStreakAtRisk(
  currentStreak: number,
  daysRemaining: number
): void {
  const notification = createStreakAtRiskNotification(currentStreak, daysRemaining);
  enqueueNotification(notification);
}

/**
 * Handle streak maintained
 */
export function handleStreakMaintained(currentStreak: number): void {
  const notification = createStreakMaintainedNotification(currentStreak);
  enqueueNotification(notification);
}
