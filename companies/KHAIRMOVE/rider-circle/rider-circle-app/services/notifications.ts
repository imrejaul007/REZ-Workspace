/**
 * Push Notifications Service
 * Handles push notifications using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification types
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  importance: 'low' | 'default' | 'high' | 'critical';
  sound?: string;
  vibrationPattern?: number[];
}

// Notification channels
export const CHANNELS: Record<string, NotificationChannel> = {
  sos: {
    id: 'sos',
    name: 'SOS Alerts',
    importance: 'critical',
    sound: 'sos_alert',
  },
  ride: {
    id: 'ride',
    name: 'Ride Updates',
    importance: 'high',
    sound: 'ride_update',
  },
  group: {
    id: 'group',
    name: 'Group Activity',
    importance: 'default',
    sound: 'group_update',
  },
  event: {
    id: 'event',
    name: 'Event Reminders',
    importance: 'default',
    sound: 'event_reminder',
  },
  promo: {
    id: 'promo',
    name: 'Promotions',
    importance: 'low',
  },
};

class NotificationService {
  private permissionGranted = false;
  private expoPushToken: string | null = null;

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

      this.permissionGranted = finalStatus === 'granted';

      if (this.permissionGranted) {
        await this.setupChannels();
        await this.registerForPushNotifications();
      }

      return this.permissionGranted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Setup notification channels (Android)
   */
  private async setupChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync('sos', {
        channelId: 'sos',
        name: 'SOS Alerts',
        importance: Notifications.AndroidImportance.CRITICAL,
        sound: 'sos_alert',
        vibrationPattern: [0, 500, 200, 500],
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('ride', {
        channelId: 'ride',
        name: 'Ride Updates',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'ride_update',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('group', {
        channelId: 'group',
        name: 'Group Activity',
        importance: Notifications.AndroidImportance.DEFAULT,
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('event', {
        channelId: 'event',
        name: 'Event Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'event_reminder',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('promo', {
        channelId: 'promo',
        name: 'Promotions',
        importance: Notifications.AndroidImportance.LOW,
        enableVibrate: false,
        showBadge: false,
      });
    } catch (error) {
      console.error('Failed to setup notification channels:', error);
    }
  }

  /**
   * Register for push notifications
   */
  private async registerForPushNotifications(): Promise<void> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.expoPushToken = tokenData.data;

      // Send token to server
      if (this.expoPushToken) {
        await this.sendTokenToServer(this.expoPushToken);
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  }

  /**
   * Send push token to server
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // This would be an API call to register the token
      console.log('Push token:', token);
    } catch (error) {
      console.error('Failed to send token to server:', error);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    payload: NotificationPayload,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          categoryId: payload.categoryId,
        },
        trigger,
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Send immediate notification
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          categoryId: payload.categoryId,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Add notification response listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  /**
   * Schedule SOS reminder
   */
  async scheduleSOSReminder(): Promise<void> {
    // Check every 30 minutes if rider hasn't moved
    await this.scheduleNotification(
      {
        title: 'Are you okay?',
        body: "We noticed you haven't moved in a while. Tap to confirm you're safe.",
        data: { type: 'sos_check' },
        categoryId: 'sos',
      },
      {
        type: Notifications.TriggerTypes.TIME_INTERVAL,
        intervalSeconds: 30 * 60, // 30 minutes
      }
    );
  }

  /**
   * Schedule ride reminder
   */
  async scheduleRideReminder(time: Date, rideTitle: string): Promise<void> {
    await this.scheduleNotification(
      {
        title: 'Ride Starting Soon! 🏍️',
        body: `Your ride "${rideTitle}" is starting soon. Get ready!`,
        data: { type: 'ride_reminder' },
        categoryId: 'ride',
      },
      {
        type: Notifications.TriggerTypes.DATE,
        date: new Date(time.getTime() - 30 * 60 * 1000), // 30 minutes before
      }
    );
  }

  /**
   * Schedule event reminder
   */
  async scheduleEventReminder(time: Date, eventTitle: string): Promise<void> {
    await this.scheduleNotification(
      {
        title: 'Event Reminder 📅',
        body: `"${eventTitle}" starts in 1 hour. Don't miss it!`,
        data: { type: 'event_reminder' },
        categoryId: 'event',
      },
      {
        type: Notifications.TriggerTypes.DATE,
        date: new Date(time.getTime() - 60 * 60 * 1000), // 1 hour before
      }
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
