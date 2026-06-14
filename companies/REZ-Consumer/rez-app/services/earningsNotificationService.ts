// @ts-nocheck
/**
 * Earnings Notification Service
 * CARLOS: retention — dynamic notification copy based on reward context
 *
 * Every notification is a habit loop opportunity. Generic "You earned 50 coins"
 * creates no emotional response. Instead:
 * - First reward: 🎉 "Your wallet is growing" (celebrate milestone)
 * - Big reward: 💰 "That's worth ₹500!" (concrete value)
 * - Referral: 🤝 "Sarah used your code" (social proof)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';
import apiClient from '@/services/apiClient';

// Configure notification behavior (wrapped in try-catch for emulator compatibility)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } as unknown),
  });
} catch (_e) {
  // silently handle
}

interface EarningsNotificationData {
  type: 'earnings' | 'project_approved' | 'project_rejected' | 'withdrawal' | 'milestone' | 'first_reward' | 'big_reward' | 'referral_reward';
  title: string;
  body: string;
  data?;
}

interface RewardContext {
  isFirstReward?: boolean;
  isBigReward?: boolean;
  referrerName?: string;
}

class EarningsNotificationService {
  private static instance: EarningsNotificationService;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  private constructor() {}

  static getInstance(): EarningsNotificationService {
    if (!EarningsNotificationService.instance) {
      EarningsNotificationService.instance = new EarningsNotificationService();
    }
    return EarningsNotificationService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Get push token (best-effort, don't block on failure)
      if (Platform.OS !== 'web') {
        try {
          const projectId =
            process.env.EXPO_PUBLIC_PROJECT_ID ||
            Constants.expoConfig?.extra?.eas?.projectId ||
            Constants.easConfig?.projectId;
          const token = await Notifications.getExpoPushTokenAsync({
            ...(projectId ? { projectId } : {}),
          });

          // Send token to backend to register for push notifications
          await apiClient.post<unknown>('/notifications/register-token', {
            token: token.data,
            platform: Platform.OS,
          }).catch(error => {
            logger.warn('[EarningsNotificationService] Failed to register push token:', error);
          });
        } catch (_tokenError) {
          // silently handle
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(notification: EarningsNotificationData): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Show earnings notification
   * CARLOS: retention — dynamic copy based on reward type and timing
   */
  async showEarningsNotification(amount: number, source: string, context?: RewardContext) {
    // CARLOS: retention — first reward hook triggers habit loop
    if (context?.isFirstReward) {
      await this.scheduleLocalNotification({
        type: 'first_reward',
        title: '🎉 Welcome Bonus!',
        body: 'You just earned your first REZ coins! Your wallet is growing.',
        data: { type: 'first_reward', amount, source },
      });
      return;
    }

    // CARLOS: retention — big reward triggers excitement + urgency to use coins
    if (context?.isBigReward) {
      const coinValue = Math.round(amount / 10); // Assume 1 coin = ~10 INR value
      await this.scheduleLocalNotification({
        type: 'big_reward',
        title: '💰 Big Win!',
        body: `You earned ${amount} coins — that's worth ₹${coinValue}!`,
        data: { type: 'big_reward', amount, source, coinValue },
      });
      return;
    }

    // CARLOS: retention — referral reward creates social proof
    if (context?.referrerName) {
      await this.scheduleLocalNotification({
        type: 'referral_reward',
        title: '🤝 Referral Earned',
        body: `${context.referrerName} just used your code! You earned ${amount} coins.`,
        data: { type: 'referral_reward', amount, referrerName: context.referrerName },
      });
      return;
    }

    // Default earnings notification
    await this.scheduleLocalNotification({
      type: 'earnings',
      title: '💰 New Earnings!',
      body: `You earned ${amount} coins from ${source}`,
      data: { type: 'earnings', amount, source },
    });
  }

  /**
   * Show project approved notification
   * CARLOS: retention — celebrate wins to drive habit formation
   */
  async showProjectApprovedNotification(projectTitle: string, amount: number) {
    // Check if this is a big win (high amount → big reward context)
    const isBigReward = amount >= 500; // Threshold for "big reward"
    await this.scheduleLocalNotification({
      type: 'project_approved',
      title: isBigReward ? '💰 BIG WIN!' : '✅ Project Approved!',
      body: isBigReward
        ? `${projectTitle} approved! You earned ${amount} coins — amazing!`
        : `${projectTitle} has been approved. You earned ${amount} coins`,
      data: { type: 'project_approved', projectTitle, amount, isBigReward },
    });
  }

  /**
   * Show project rejected notification
   */
  async showProjectRejectedNotification(projectTitle: string, reason?: string) {
    await this.scheduleLocalNotification({
      type: 'project_rejected',
      title: '❌ Project Rejected',
      body: reason 
        ? `${projectTitle} was rejected: ${reason}`
        : `${projectTitle} was rejected. Please check the requirements.`,
      data: { type: 'project_rejected', projectTitle, reason },
    });
  }

  /**
   * Show withdrawal notification
   */
  async showWithdrawalNotification(amount: number, status: 'pending' | 'completed' | 'failed') {
    const statusText = {
      pending: 'is pending',
      completed: 'has been processed',
      failed: 'failed',
    };

    await this.scheduleLocalNotification({
      type: 'withdrawal',
      title: `💸 Withdrawal ${status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Pending'}`,
      body: `Your withdrawal of ₹${amount} ${statusText[status]}`,
      data: { type: 'withdrawal', amount, status },
    });
  }

  /**
   * Show milestone notification
   */
  async showMilestoneNotification(milestone: string, reward: number) {
    await this.scheduleLocalNotification({
      type: 'milestone',
      title: '🎯 Milestone Reached!',
      body: `You reached ${milestone} and earned ₹${reward}`,
      data: { type: 'milestone', milestone, reward },
    });
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // Remove existing listeners
    this.removeListeners();

    // Listen for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listen for notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default EarningsNotificationService.getInstance();

