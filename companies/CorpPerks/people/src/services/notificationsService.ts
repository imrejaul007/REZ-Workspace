// ==========================================
// MyTalent - RABTUL Notifications Service Integration
// Port: 4011
// ==========================================

import * as Notifications from 'expo-notifications';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  timestamp: string;
}

/**
 * Configure notification handler
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    logger.error('Notification permission error:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger,
    });
    return id;
  } catch (error) {
    logger.error('Schedule notification error:', error);
    return null;
  }
}

/**
 * Send immediate notification
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
    return true;
  } catch (error) {
    logger.error('Immediate notification error:', error);
    return false;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    logger.error('Cancel notification error:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error('Cancel all notifications error:', error);
  }
}

/**
 * Get all delivered notifications
 */
export async function getDeliveredNotifications(): Promise<Notifications.Notification[]> {
  try {
    return await Notifications.getPresentedNotificationsAsync();
  } catch (error) {
    logger.error('Get delivered notifications error:', error);
    return [];
  }
}

/**
 * Add notification listeners
 */
export function addNotificationListeners(
  onReceived: (notification: Notifications.Notification) => void,
  onResponseReceived: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription[] {
  const receivedSubscription = Notifications.addNotificationReceivedListener(onReceived);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    onResponseReceived
  );

  return [receivedSubscription, responseSubscription];
}

/**
 * Schedule daily check-in reminder
 */
export async function scheduleCheckInReminder(hour = 9, minute = 0): Promise<string | null> {
  return scheduleNotification(
    'Good Morning!',
    "Don't forget to check in today!",
    { hour, minute, type: Notifications.SchedulableTriggerInputTypes.DAILY }
  );
}

/**
 * Schedule payday reminder
 */
export async function schedulePaydayReminder(
  dayOfMonth: number,
  hour = 10,
  minute = 0
): Promise<string | null> {
  return scheduleNotification(
    'Payday!',
    'Your salary has been credited. Check your payslip!',
    { dayOfMonth, hour, minute, type: Notifications.SchedulableTriggerInputTypes.MONTHLY }
  );
}

/**
 * Schedule leave reminder
 */
export async function scheduleLeaveReminder(
  title: string,
  body: string,
  date: Date
): Promise<string | null> {
  const trigger: Notifications.DateTriggerInput = {
    date,
    type: Notifications.SchedulableTriggerInputTypes.DATE,
  };

  return scheduleNotification(title, body, trigger);
}

/**
 * Push notification to server (for cloud notifications)
 */
export async function pushToServer(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.NOTIFICATION_SERVICE_URL) {
      return { success: true };
    }

    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, ...payload }),
    });

    return { success: response.ok };
  } catch (error) {
    logger.error('Push to server error:', error);
    return { success: false };
  }
}

/**
 * Get notification history from server
 */
export async function getNotificationHistory(
  userId: string,
  limit = 50
): Promise<{ success: boolean; notifications?: NotificationRecord[] }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.NOTIFICATION_SERVICE_URL) {
      return {
        success: true,
        notifications: [],
      };
    }

    const response = await fetch(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/history/${userId}?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, notifications: data.notifications };
    }

    return { success: false };
  } catch (error) {
    logger.error('Get notification history error:', error);
    return { success: true, notifications: [] };
  }
}

/**
 * Mark notification as read on server
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.NOTIFICATION_SERVICE_URL) {
      return { success: true };
    }

    await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, notificationId }),
    });

    return { success: true };
  } catch (error) {
    logger.error('Mark as read error:', error);
    return { success: false };
  }
}
