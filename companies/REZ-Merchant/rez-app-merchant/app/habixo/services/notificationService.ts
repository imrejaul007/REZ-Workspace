import logger from './utils/logger';

// Habixo Merchant Push Notifications Service
// Handles push notification setup and handling for merchant app
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// Configure notification behavior for merchant
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification types for merchant
export interface MerchantNotification {
  id: string;
  title: string;
  body: string;
  data?: {
    type: 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'payout' | 'review' | 'message' | 'alert';
    bookingId?: string;
    payoutId?: string;
    deepLink?: string;
  };
  category?: string;
  priority?: 'high' | 'normal' | 'low';
}

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habixo-booking-requests', {
      name: 'Booking Requests',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f59e0b',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habixo-payouts', {
      name: 'Payout Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#10b981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habixo-reviews', {
      name: 'Reviews',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habixo-messages-merchant', {
      name: 'Guest Messages',
      importance: Notifications.AndroidImportance.DEFAULT,
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
      logger.info('Failed to get push token for push notification!');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'habixo-merchant',
      });
      token = tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    logger.info('Must use physical device for Push Notifications');
  }

  return token;
}

// Schedule booking request reminder
export async function scheduleBookingRequestReminder(
  bookingId: string,
  guestName: string,
  propertyName: string,
  expiresIn: number // hours until expiry
): Promise<string[]> {
  const identifiers: string[] = [];

  // Reminder 2 hours before expiry
  const twoHoursBefore = new Date(Date.now() + (expiresIn - 2) * 60 * 60 * 1000);
  if (twoHoursBefore > new Date()) {
    const id1 = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Request Expiring Soon',
        body: `${guestName} requested to book ${propertyName}. Respond before it expires!`,
        data: {
          type: 'booking_request',
          bookingId,
          deepLink: `/habixo/bookings/${bookingId}`,
        },
        sound: 'default',
        categoryIdentifier: 'BOOKING_REQUEST',
      },
      trigger: twoHoursBefore,
    });
    identifiers.push(id1);
  }

  // Reminder at expiry
  const expiryTime = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
  if (expiryTime > new Date()) {
    const id2 = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Request Expired',
        body: `The request from ${guestName} for ${propertyName} has expired.`,
        data: {
          type: 'booking_request',
          bookingId,
          deepLink: `/habixo/bookings`,
        },
        sound: 'default',
        categoryIdentifier: 'BOOKING_EXPIRED',
      },
      trigger: expiryTime,
    });
    identifiers.push(id2);
  }

  return identifiers;
}

// Payout notification
export async function schedulePayoutNotification(
  payoutAmount: number,
  payoutDate: Date
): Promise<string> {
  // Notify 1 day before payout
  const dayBefore = new Date(payoutDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(10, 0, 0); // 10 AM

  if (dayBefore > new Date()) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Payout Tomorrow!',
        body: `Your payout of ₹${payoutAmount.toLocaleString()} will be credited tomorrow.`,
        data: {
          type: 'payout',
          deepLink: '/habixo/earnings',
        },
        sound: 'default',
        categoryIdentifier: 'PAYOUT_REMINDER',
      },
      trigger: dayBefore,
    });
    return identifier;
  }

  return '';
}

// Schedule new booking notification
export async function scheduleNewBookingAlert(
  bookingId: string,
  guestName: string,
  propertyName: string,
  amount: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Booking! 🎉',
      body: `${guestName} booked ${propertyName} for ₹${amount.toLocaleString()}`,
      data: {
        type: 'booking_confirmed',
        bookingId,
        deepLink: `/habixo/bookings/${bookingId}`,
      },
      sound: 'default',
      categoryIdentifier: 'NEW_BOOKING',
    },
    trigger: null,
  });
}

// Schedule review notification
export async function scheduleReviewAlert(
  bookingId: string,
  guestName: string,
  rating: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Review Received',
      body: `${guestName} rated your property ${'⭐'.repeat(rating)}`,
      data: {
        type: 'review',
        bookingId,
        deepLink: `/habixo/properties`,
      },
      sound: 'default',
      categoryIdentifier: 'NEW_REVIEW',
    },
    trigger: null,
  });
}

// Cancel all notifications for a booking
export async function cancelBookingNotifications(bookingId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const bookingNotifications = scheduled.filter(
    (n) => n.content.data?.bookingId === bookingId
  );

  for (const notification of bookingNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
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

// Register notification categories for actions
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('BOOKING_REQUEST', [
    {
      identifier: 'ACCEPT_BOOKING',
      buttonTitle: 'Accept',
      options: { isAuthenticationRequired: false },
    },
    {
      identifier: 'DECLINE_BOOKING',
      buttonTitle: 'Decline',
      options: { isAuthenticationRequired: false },
    },
    {
      identifier: 'VIEW_DETAILS',
      buttonTitle: 'View Details',
      options: { isAuthenticationRequired: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('PAYOUT_REMINDER', [
    {
      identifier: 'VIEW_EARNINGS',
      buttonTitle: 'View Earnings',
      options: { isAuthenticationRequired: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('NEW_BOOKING', [
    {
      identifier: 'VIEW_BOOKING',
      buttonTitle: 'View Booking',
      options: { isAuthenticationRequired: false },
    },
  ]);
}

// Get all delivered notifications
export async function getDeliveredNotifications(): Promise<Notifications.Notification[]> {
  return await Notifications.getPresentedNotificationsAsync();
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

// Handle notification deep link
export function handleNotificationDeepLink(
  data: MerchantNotification['data']
): string | null {
  if (!data?.deepLink) return null;

  switch (data.type) {
    case 'booking_request':
    case 'booking_confirmed':
    case 'booking_cancelled':
      return `/habixo/bookings/${data.bookingId}`;
    case 'payout':
      return '/habixo/earnings';
    case 'review':
      return '/habixo/properties';
    case 'message':
      return '/habixo/settings';
    default:
      return data.deepLink;
  }
}

// Push token manager
let pushToken: string | null = null;

export async function getPushToken(): Promise<string | null> {
  if (pushToken) return pushToken;
  pushToken = await registerForPushNotificationsAsync();
  return pushToken;
}

export function clearPushToken(): void {
  pushToken = null;
}

export default {
  registerForPushNotificationsAsync,
  scheduleBookingRequestReminder,
  schedulePayoutNotification,
  scheduleNewBookingAlert,
  scheduleReviewAlert,
  cancelBookingNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  registerNotificationCategories,
  getDeliveredNotifications,
  dismissAllDeliveredNotifications,
  setBadgeCountAsync,
  getBadgeCountAsync,
  handleNotificationDeepLink,
  getPushToken,
  clearPushToken,
};
