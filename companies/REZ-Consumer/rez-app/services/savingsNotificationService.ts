// @ts-nocheck
/**
 * Savings Notification Service
 *
 * Handles push notifications for:
 * - Streak reminders (save today to keep streak)
 * - Goal progress milestones
 * - Savings insights
 * - Achievement unlocks
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { useSavings } from '@/hooks/useSavings';

// Configure notification behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } as unknown),
  });
} catch (_e) {
  // silently handle in test environments
}

export type SavingsNotificationType =
  | 'streak_reminder'
  | 'streak_achieved'
  | 'goal_progress'
  | 'goal_completed'
  | 'savings_milestone'
  | 'insight_available'
  | 'recommendation_action';

interface SavingsNotificationData {
  type: SavingsNotificationType;
  title: string;
  body: string;
  data?: {
    streakDays?: number;
    goalId?: string;
    goalName?: string;
    milestone?: number;
    insightType?: string;
    actionUrl?: string;
    [key: string];
  };
}

class SavingsNotificationService {
  private static instance: SavingsNotificationService;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;
  private lastStreakReminderDate: string | null = null;
  private lastGoalMilestoneDate: Record<string, string> = {};

  private constructor() {}

  static getInstance(): SavingsNotificationService {
    if (!SavingsNotificationService.instance) {
      SavingsNotificationService.instance = new SavingsNotificationService();
    }
    return SavingsNotificationService.instance;
  }

  /**
   * Initialize notification listeners
   */
  async initialize(): Promise<void> {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      logger.warn('[SavingsNotification] Permission not granted');
      return;
    }

    // Handle notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      logger.info('[SavingsNotification] Received', {
        type: notification.request.content.data?.type,
      });
    });

    // Handle notification tap
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as SavingsNotificationData['data'];
      this.handleNotificationTap(data);
    });
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  private handleNotificationTap(data?: SavingsNotificationData['data']): void {
    if (!data) return;

    // Import and call the global deep link handler
    try {
      const { handleNotificationDeepLink } = require('@/utils/notificationDeepLinkHandler');
      handleNotificationDeepLink(data as unknown);
    } catch (e) {
      logger.error('[SavingsNotification] Failed to handle tap', { error: e });
    }
  }

  /**
   * Get deep link path based on notification type
   */
  private getDeepLink(type: SavingsNotificationType, data?: SavingsNotificationData['data']): string {
    switch (type) {
      case 'streak_reminder':
      case 'streak_achieved':
      case 'savings_milestone':
        return '/savings';
      case 'goal_progress':
      case 'goal_completed':
        return data?.goalId ? `/savings/goals/${data.goalId}` : '/savings/goals';
      case 'insight_available':
      case 'recommendation_action':
        return '/savings';
      default:
        return '/savings';
    }
  }

  /**
   * Send a savings notification
   */
  async sendSavingsNotification(notification: SavingsNotificationData): Promise<void> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            deepLink: this.getDeepLink(notification.type, notification.data),
          },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      logger.info('[SavingsNotification] Sent', {
        id: notificationId,
        type: notification.type,
      });
    } catch (error) {
      logger.error('[SavingsNotification] Failed to send', { error, notification });
    }
  }

  /**
   * Schedule streak reminder notification
   * Called when user hasn't saved today and streak is at risk
   */
  async scheduleStreakReminder(streakDays: number): Promise<void> {
    // Don't send multiple reminders in the same day
    const today = new Date().toDateString();
    if (this.lastStreakReminderDate === today) {
      return;
    }

    const notifications: SavingsNotificationData[] = [];

    if (streakDays === 1) {
      notifications.push({
        type: 'streak_reminder',
        title: '🔥 Start Your Savings Streak!',
        body: "You haven't saved today. Make a purchase now to start building your streak!",
        data: { streakDays: 1 },
      });
    } else if (streakDays > 1) {
      notifications.push({
        type: 'streak_reminder',
        title: `🔥 Keep Your ${streakDays}-Day Streak!`,
        body: `Don't lose your amazing ${streakDays}-day savings streak! Save today to keep it going.`,
        data: { streakDays },
      });
    }

    for (const notification of notifications) {
      await this.sendSavingsNotification(notification);
      this.lastStreakReminderDate = today;
    }
  }

  /**
   * Send streak achievement notification
   */
  async sendStreakAchievement(streakDays: number): Promise<void> {
    const milestoneMessages: Record<number, { title: string; body: string }> = {
      7: {
        title: '🎉 1 Week Streak!',
        body: "You're on fire! Keep saving for 30 days to become a savings master.",
      },
      14: {
        title: '🔥 2 Week Streak!',
        body: 'Your savings habit is getting stronger! Just a few more days to a full month.',
      },
      30: {
        title: '🏆 1 Month Streak!',
        body: "Incredible! You've been saving every day for a whole month!",
      },
      60: {
        title: '👑 2 Month Streak!',
        body: "You're a savings champion! Your discipline is paying off.",
      },
      90: {
        title: '🌟 3 Month Streak!',
        body: 'Legendary! 90 days of consistent savings. You inspire us!',
      },
      365: {
        title: '🚀 1 Year Streak!',
        body: "This is incredible! A full year of daily savings. You're a savings legend!",
      },
    };

    const milestone = milestoneMessages[streakDays];
    if (milestone) {
      await this.sendSavingsNotification({
        type: 'streak_achieved',
        title: milestone.title,
        body: milestone.body,
        data: { streakDays },
      });
    }
  }

  /**
   * Send goal progress notification
   */
  async sendGoalProgressNotification(
    goalId: string,
    goalName: string,
    currentAmount: number,
    targetAmount: number,
  ): Promise<void> {
    const percent = Math.round((currentAmount / targetAmount) * 100);

    // Only send at specific milestones
    const milestonePercentages = [25, 50, 75, 90, 95];
    if (!milestonePercentages.includes(percent)) {
      return;
    }

    // Don't send multiple notifications for the same milestone
    const milestoneKey = `${goalId}_${percent}`;
    if (this.lastGoalMilestoneDate[milestoneKey]) {
      const lastDate = new Date(this.lastGoalMilestoneDate[milestoneKey]);
      const today = new Date();
      if (lastDate.toDateString() === today.toDateString()) {
        return;
      }
    }

    const messages: Record<number, { title: string; body: string }> = {
      25: {
        title: '🎯 Goal Progress: 25%',
        body: `You're 25% of the way to ${goalName}! Keep going!`,
      },
      50: {
        title: '🚀 Halfway There!',
        body: `You've reached 50% of your ${goalName} goal! Amazing progress!`,
      },
      75: {
        title: '🔥 75% Complete!',
        body: `Almost there! Just 25% more to reach your ${goalName} goal.`,
      },
      90: {
        title: '💪 90% Complete!',
        body: `So close! Your ${goalName} goal is almost within reach!`,
      },
      95: {
        title: '🎊 95% - Almost Done!',
        body: `Just 5% more to complete your ${goalName} goal! You got this!`,
      },
    };

    const message = messages[percent];
    if (message) {
      await this.sendSavingsNotification({
        type: 'goal_progress',
        title: message.title,
        body: message.body,
        data: { goalId, goalName, percent },
      });
      this.lastGoalMilestoneDate[milestoneKey] = new Date().toISOString();
    }
  }

  /**
   * Send goal completion notification
   */
  async sendGoalCompletedNotification(goalId: string, goalName: string, amount: number): Promise<void> {
    const formattedAmount = amount >= 100000
      ? `₹${(amount / 100000).toFixed(1)}L`
      : amount >= 1000
      ? `₹${(amount / 1000).toFixed(1)}K`
      : `₹${(amount / 100).toFixed(0)}`;

    await this.sendSavingsNotification({
      type: 'goal_completed',
      title: '🎉 Goal Achieved!',
      body: `Congratulations! You've reached your ${goalName} goal of ${formattedAmount}!`,
      data: { goalId, goalName },
    });
  }

  /**
   * Send savings milestone notification
   */
  async sendSavingsMilestoneNotification(totalSavings: number, milestone: number): Promise<void> {
    const formattedTotal = totalSavings >= 100000
      ? `₹${(totalSavings / 100000).toFixed(1)}L`
      : totalSavings >= 1000
      ? `₹${(totalSavings / 1000).toFixed(1)}K`
      : `₹${(totalSavings / 100).toFixed(0)}`;

    const messages: Record<number, { title: string; body: string }> = {
      100: {
        title: '💰 First ₹100 Saved!',
        body: "Great start! Every rupee counts. Keep saving!",
      },
      500: {
        title: '💵 ₹500 Saved!',
        body: "Nice! You're building up your savings. ₹500 is a solid start!",
      },
      1000: {
        title: '💰 ₹1,000 Saved!',
        body: "You've saved ₹1,000! That's a fantastic milestone!",
      },
      5000: {
        title: '🏆 ₹5,000 Saved!',
        body: "Incredible! ₹5,000 saved. You're a natural saver!",
      },
      10000: {
        title: '👑 ₹10,000 Saved!',
        body: "Wow! ₹10,000 saved. You've mastered the art of saving!",
      },
      50000: {
        title: '🚀 ₹50,000 Saved!',
        body: "Amazing! ₹50,000 is a significant achievement. You're unstoppable!",
      },
      100000: {
        title: '🏅 ₹1 Lakh Saved!',
        body: "Legendary saver! ₹1 lakh saved. Your future self thanks you!",
      },
    };

    const message = messages[milestone];
    if (message) {
      await this.sendSavingsNotification({
        type: 'savings_milestone',
        title: message.title,
        body: message.body,
        data: { milestone, totalSavings },
      });
    }
  }

  /**
   * Send insight notification
   */
  async sendInsightNotification(insightType: string, title: string, description: string): Promise<void> {
    await this.sendSavingsNotification({
      type: 'insight_available',
      title,
      body: description,
      data: { insightType },
    });
  }

  /**
   * Check and send streak reminder based on current streak state
   */
  async checkAndSendStreakReminder(): Promise<void> {
    try {
      const { streak } = useSavings();

      if (streak && streak.daysUntilStreakLost === 1) {
        await this.scheduleStreakReminder(streak.currentStreak);
      }
    } catch (error) {
      logger.error('[SavingsNotification] Failed to check streak', { error });
    }
  }

  /**
   * Clean up notification listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export const savingsNotificationService = SavingsNotificationService.getInstance();
export default savingsNotificationService;
