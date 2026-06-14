// @ts-nocheck
// Habixo Push Notifications Service
// Handles push notification setup and handling for consumer app
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { logger } from '@/utils/logger';

// Configure notification behavior
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
export interface HabixoNotification {
  id: string;
  title: string;
  body: string;
  data?: {
    type: 'booking' | 'message' | 'promotion' | 'reminder';
    bookingId?: string;
    deepLink?: string;
  };
  category?: string;
}

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habixo-bookings', {
      name: 'Booking Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habixo-messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habixo-promotions', {
      name: 'Promotions',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) logger.debug('Failed to get push token for push notification!');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'habixo-consumer',
      });
      token = tokenData.data;
    } catch (error) {
      logger.error('Error getting push token:', error);
    }
  } else {
    if (__DEV__) logger.debug('Must use physical device for Push Notifications');
  }

  return token;
}

// Schedule a local notification
export async function scheduleLocalNotification(notification: HabixoNotification): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: 'default',
    },
    trigger: null, // Send immediately
  });

  return identifier;
}

// Schedule booking reminder
export async function scheduleBookingReminder(
  bookingId: string,
  checkInDate: Date,
  guestName: string,
  propertyName: string
): Promise<string[]> {
  const identifiers: string[] = [];

  // Reminder 1 day before
  const oneDayBefore = new Date(checkInDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(10, 0, 0); // 10 AM

  if (oneDayBefore > new Date()) {
    const id1 = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Check-in Tomorrow!',
        body: `Your stay at ${propertyName} starts tomorrow. Get ready, ${guestName}!`,
        data: { type: 'reminder', bookingId, deepLink: `/habixo/bookings/${bookingId}` },
        sound: 'default',
      },
      trigger: oneDayBefore,
    });
    identifiers.push(id1);
  }

  // Reminder on check-in day
  const checkInDay = new Date(checkInDate);
  checkInDay.setHours(8, 0, 0); // 8 AM

  if (checkInDay > new Date()) {
    const id2 = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Check-in Today!',
        body: `Welcome to ${propertyName}, ${guestName}! Your stay begins today.`,
        data: { type: 'reminder', bookingId, deepLink: `/habixo/bookings/${bookingId}` },
        sound: 'default',
      },
      trigger: checkInDay,
    });
    identifiers.push(id2);
  }

  return identifiers;
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel specific notification
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

// Add notification listeners
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add notification response listener (when user taps notification)
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Get all delivered notifications
export async function getDeliveredNotifications(): Promise<Notifications.Notification[]> {
  const delivered = await Notifications.getPresentedNotificationsAsync();
  return delivered;
}

// Dismiss all delivered notifications
export async function dismissAllDeliveredNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

// Set badge count
export async function setBadgeCountAsync(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Get badge count
export async function getBadgeCountAsync(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Handle deep link from notification
export function handleNotificationDeepLink(data: HabixoNotification['data']): string | null {
  if (!data?.deepLink) return null;

  switch (data.type) {
    case 'booking':
      return `/habixo/bookings/${data.bookingId}`;
    case 'message':
      return '/habixo/messages';
    default:
      return data.deepLink;
  }
}

// Request notification permission with explanation
export async function requestNotificationPermissionWithExplanation(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();

  if (status === 'granted') {
    return true;
  }

  if (status === 'denied') {
    Alert.alert(
      'Enable Notifications',
      'Stay updated with booking confirmations, messages, and exclusive deals. Enable notifications in Settings.',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            // Would use expo-linking to open settings
            logger.debug('[NotificationService] Open device settings requested');
          },
        },
      ]
    );
    return false;
  }

  // First time asking - show request
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === 'granted';
}

export default {
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  scheduleBookingReminder,
  cancelAllScheduledNotifications,
  cancelNotification,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getDeliveredNotifications,
  dismissAllDeliveredNotifications,
  setBadgeCountAsync,
  getBadgeCountAsync,
  handleNotificationDeepLink,
  requestNotificationPermissionWithExplanation,
};
