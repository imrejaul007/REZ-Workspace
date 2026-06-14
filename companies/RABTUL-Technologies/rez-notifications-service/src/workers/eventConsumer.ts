import logger from './utils/logger';

/**
 * Event Consumer Worker
 *
 * Listens to loyalty events and triggers notifications
 */

import { redis } from '../config/redis';
import { NotificationService } from '../services/NotificationService';

const CHANNELS = [
  'events.streak.milestone_reached',
  'events.score.tier_changed',
  'events.cross_merchant.badge_earned',
  'events.loyalty.tier_updated',
  'events.karma.level_up',
];

export async function startEventConsumer(notificationService: NotificationService): Promise<void> {
  logger.info('Starting event consumer...');

  const subscriber = redis.duplicate();

  subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err);
  });

  await subscriber.subscribe(...CHANNELS);

  subscriber.on('message', async (channel: string, message: string) => {
    try {
      const event = JSON.parse(message);
      logger.info(Received event: ${channel}`, event.eventId);

      await handleEvent(notificationService, channel, event);
    } catch (error) {
      console.error('Error processing event:', error);
    }
  });

  logger.info(`Subscribed to channels: ${CHANNELS.join(', ')}`);
}

async function handleEvent(
  notificationService: NotificationService,
  channel: string,
  event: unknown
): Promise<void> {
  const { userId, data } = event;

  if (!userId) return;

  switch (channel) {
    case 'events.streak.milestone_reached':
      await notificationService.sendLoyaltyNotification({
        userId,
        type: 'streak_milestone',
        data: {
          streakDays: data.streakDays,
          rewardCoins: data.reward?.coins || 0,
          nextMilestone: getNextMilestone(data.streakDays),
        },
      });
      break;

    case 'events.score.tier_changed':
      await notificationService.sendLoyaltyNotification({
        userId,
        type: 'tier_upgrade',
        data: {
          newTier: data.newTier,
          oldTier: data.oldTier,
        },
      });
      break;

    case 'events.cross_merchant.badge_earned':
      await notificationService.sendLoyaltyNotification({
        userId,
        type: 'badge_earned',
        data: {
          badgeName: data.badgeName,
          badgeId: data.badgeId,
        },
      });
      break;

    case 'events.loyalty.tier_updated':
      await notificationService.sendLoyaltyNotification({
        userId,
        type: 'tier_upgrade',
        data: {
          newTier: data.newTier,
          oldTier: data.oldTier,
        },
      });
      break;

    case 'events.karma.level_up':
      await notificationService.send({
        userId,
        type: 'karma_level_up',
        channel: ['push', 'inApp'],
        title: '⭐ Karma Level Up!',
        body: `You've reached ${data.newLevel}!`,
        data,
        priority: 'high',
      });
      break;
  }
}

function getNextMilestone(currentDays: number): number {
  const milestones = [3, 7, 14, 30, 60, 90];
  for (const m of milestones) {
    if (m > currentDays) return m;
  }
  return 90;
}
