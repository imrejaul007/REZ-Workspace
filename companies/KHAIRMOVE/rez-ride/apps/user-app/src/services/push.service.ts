import { logger } from '../../shared/logger';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get API URL from environment
const getApiUrl = (): string => {
  if (Constants.expoConfig?.extra?.API_URL) {
    return Constants.expoConfig.extra.API_URL;
  }
  if (__DEV__) {
    return 'http://localhost:4000';
  }
  return 'https://api.rezride.com';
};

const API_BASE_URL = getApiUrl();

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

class PushNotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<void> {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.info('Push notifications not granted');
      return;
    }

    // Get push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      this.expoPushToken = token.data;
      logger.info('Push token:', token.data);
    } catch (error) {
      logger.info('Error getting push token:', error);
    }

    // Set up notification categories
    this.setupCategories();

    // Handle notifications in foreground
    Notifications.setNotificationChannelAsync('rides', {
      name: 'Ride Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6B4EFF',
    });

    Notifications.setNotificationChannelAsync('promos', {
      name: 'Offers & Promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  private setupCategories(): void {
    Notifications.setNotificationCategoryAsync('ride_update', [
      {
        actionType: 'view',
        buttonTitle: 'View Ride',
        identifier: 'view_ride',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    Notifications.setNotificationCategoryAsync('promo', [
      {
        actionType: 'apply',
        buttonTitle: 'Apply',
        identifier: 'apply_offer',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }

  // Send to server
  async registerToken(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await fetch(`${API_BASE_URL}/api/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.expoPushToken,
          platform: Platform.OS,
        }),
      });
    } catch (error) {
      logger.error('Failed to register token:', error);
    }
  }

  // Local notifications
  async showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    category?: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        ...(category && { categoryIdentifier: category }),
      },
      trigger: null,
    });
  }

  // Ride-specific notifications
  async notifyRideConfirmed(rideId: string, driverName: string): Promise<void> {
    await this.showLocalNotification(
      'Ride Confirmed! 🎉',
      `${driverName} is on the way to pick you up`,
      { type: 'ride_confirmed', rideId },
      'ride_update'
    );
  }

  async notifyDriverArrived(rideId: string, driverName: string): Promise<void> {
    await this.showLocalNotification(
      'Driver Arrived! 🚗',
      `${driverName} is waiting at the pickup location`,
      { type: 'driver_arrived', rideId },
      'ride_update'
    );
  }

  async notifyRideStarted(rideId: string, destination: string): Promise<void> {
    await this.showLocalNotification(
      'Ride Started 🚙',
      `Heading to ${destination}`,
      { type: 'ride_started', rideId },
      'ride_update'
    );
  }

  async notifyRideCompleted(rideId: string, amount: number): Promise<void> {
    await this.showLocalNotification(
      'Ride Completed ✅',
      `₹${amount} charged. +₹${Math.round(amount * 0.1)} cashback earned!`,
      { type: 'ride_completed', rideId },
      'ride_update'
    );
  }

  async notifyOffer(title: string, code: string): Promise<void> {
    await this.showLocalNotification(
      title,
      `Use code ${code} for savings!`,
      { type: 'offer', code },
      'promo'
    );
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Add notification listeners
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const pushService = new PushNotificationService();
export default pushService;
