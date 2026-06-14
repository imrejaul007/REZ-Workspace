import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { rezApi } from './rezApi';

// Navigation reference (set this when app initializes)
let navigationRef: { push?: (route: string) => void } | null = null;

export function setNavigationRef(nav: { push?: (route: string) => void } | null) {
  navigationRef = nav;
}

// Simple logger for frontend
const logger = {
  info: (msg: string, data?: unknown) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg: string, data?: unknown) => logger.warn(`[WARN] ${msg}`, data || ''),
  error: (msg: string, data?: unknown) => logger.error(`[ERROR] ${msg}`, data || ''),
};

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

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface RichNotificationData {
  type: 'booking' | 'wallet' | 'karma' | 'deal' | 'reminder' | 'general';
  id: string;
  imageUrl?: string;
  actionUrl?: string;
  [key: string]: unknown;
}

// Rich notification templates
const NOTIFICATION_TEMPLATES = {
  booking_confirmed: (data: { entityName: string; dateTime: string; confirmationCode: string }) => ({
    title: 'Booking Confirmed! 🎉',
    body: `${data.entityName} - ${data.confirmationCode}`,
    data: { type: 'booking', subtype: 'confirmed', ...data },
  }),
  booking_reminder: (data: { entityName: string; dateTime: string; bookingId: string }) => ({
    title: 'Reminder: Upcoming Booking',
    body: `Your booking at ${data.entityName} is in 1 hour`,
    data: { type: 'reminder', subtype: 'booking', ...data },
  }),
  wallet_credit: (data: { amount: number; reason: string }) => ({
    title: 'Coins Earned! 🪙',
    body: `+${data.amount} coins for ${data.reason}`,
    data: { type: 'wallet', subtype: 'credit', ...data },
  }),
  wallet_debit: (data: { amount: number; reason: string }) => ({
    title: 'Coins Used 💸',
    body: `-${data.amount} coins for ${data.reason}`,
    data: { type: 'wallet', subtype: 'debit', ...data },
  }),
  karma_upgrade: (data: { newTier: string; multiplier: number }) => ({
    title: 'Karma Level Up! ⭐',
    body: `Welcome to ${data.newTier}! Your new multiplier is ${data.multiplier}x`,
    data: { type: 'karma', subtype: 'upgrade', ...data },
  }),
  deal_of_day: (data: { title: string; discount: number; venueName: string }) => ({
    title: '🔥 Deal of the Day',
    body: `${data.discount}% off at ${data.venueName}!`,
    data: { type: 'deal', subtype: 'daily', ...data },
  }),
};

class NotificationService {
  private hasPermission = false;
  private notificationListeners: ((notification: Notifications.Notification) => void)[] = [];

  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      logger.warn('Push notifications require a physical device');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Push notification permission not granted');
        return false;
      }

      this.hasPermission = true;
      this.setupCategories();

      return true;
    } catch (error) {
      logger.error('Error requesting notification permission', { error });
      return false;
    }
  }

  private setupCategories() {
    // Booking notifications
    Notifications.setNotificationCategoryAsync('booking', [
      {
        actionType: 'view',
        buttonTitle: 'View',
        identifier: 'view',
      },
      {
        actionType: 'dismiss',
        buttonTitle: 'Dismiss',
        identifier: 'dismiss',
      },
    ]);

    // Wallet notifications
    Notifications.setNotificationCategoryAsync('wallet', [
      {
        actionType: 'view',
        buttonTitle: 'View Wallet',
        identifier: 'view',
      },
    ]);

    // Deal notifications
    Notifications.setNotificationCategoryAsync('deal', [
      {
        actionType: 'claim',
        buttonTitle: 'Claim Deal',
        identifier: 'claim',
      },
      {
        actionType: 'dismiss',
        buttonTitle: 'Later',
        identifier: 'dismiss',
      },
    ]);
  }

  async getPushToken(): Promise<string | null> {
    if (!this.hasPermission) {
      await this.requestPermission();
    }

    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      return token;
    } catch (error) {
      logger.error('Failed to get push token', { error });
      return null;
    }
  }

  async registerToken(): Promise<void> {
    const token = await this.getPushToken();
    if (token) {
      try {
        await rezApi.registerPushToken(token);
        logger.info('Push token registered');
      } catch (error) {
        logger.error('Failed to register push token', { error });
      }
    }
  }

  // Send local notification
  async sendLocalNotification(notification: NotificationPayload): Promise<void> {
    if (!this.hasPermission) {
      logger.warn('Notification permission not granted');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      logger.error('Failed to send notification', { error });
    }
  }

  // Send rich notification from template
  async sendFromTemplate<K extends keyof typeof NOTIFICATION_TEMPLATES>(
    template: K,
    data: Parameters<(typeof NOTIFICATION_TEMPLATES)[K]>[0]
  ): Promise<void> {
    const notification = NOTIFICATION_TEMPLATES[template](data as never);
    await this.sendLocalNotification(notification);
  }

  // Schedule notification
  async scheduleNotification(
    notification: NotificationPayload,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: true,
      },
      trigger,
    });
  }

  // Cancel all scheduled notifications
  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Cancel specific notification
  async cancelScheduled(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  // Handle notification tap
  handleNotificationTap(notification: Notifications.Notification) {
    const data = notification.request.content.data as RichNotificationData;

    if (!data) return;

    switch (data.type) {
      case 'booking':
      case 'reminder':
        if (data.bookingId) {
          if (navigationRef?.push) {
            navigationRef.push(`/booking/${data.bookingId}`);
          }
        }
        break;

      case 'wallet':
        if (navigationRef?.push) {
          navigationRef.push('/wallet');
        }
        break;

      case 'deal':
        if (navigationRef?.push) {
          navigationRef.push('/explore');
        }
        break;

      case 'karma':
        if (navigationRef?.push) {
          navigationRef.push('/profile');
        }
        break;

      default:
        if (navigationRef?.push) {
          navigationRef.push('/');
        }
    }
  }

  // Add notification received listener
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== callback);
    };
  }
}

export const notificationService = new NotificationService();

// App state listener for foreground notifications
export function setupNotificationListeners() {
  const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      notificationService.setBadgeCount(0);
    }
  });

  // Add notification received listener
  Notifications.addNotificationReceivedListener((notification) => {
    logger.info('Notification received:', notification.request.content.title);
    notificationService.notificationListeners.forEach((callback) => callback(notification));
  });

  // Add notification response listener
  Notifications.addNotificationResponseReceivedListener((response) => {
    logger.info('Notification tapped:', response.notification.request.content.data);
    notificationService.handleNotificationTap(response.notification);
  });

  return subscription;
}

export default notificationService;
