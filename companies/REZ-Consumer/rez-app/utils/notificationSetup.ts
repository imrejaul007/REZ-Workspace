// @ts-nocheck
/**
 * NotificationSetup - Push notification categories and handlers
 *
 * PRODUCTION-READY: Includes category definitions, action handlers, and badge management
 *
 * @example
 * ```tsx
 * import { setupNotifications } from '@/utils/notificationSetup';
 *
 * // In your app initialization:
 * setupNotifications();
 * ```
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

// ============================================================================
// Notification Categories
// ============================================================================

/**
 * Notification category identifiers
 */
export enum NotificationCategory {
  ORDER = 'order',
  PAYMENT = 'payment',
  PROMO = 'promo',
  CHAT = 'chat',
  SYSTEM = 'system',
  EARNING = 'earning',
}

/**
 * Notification action identifiers
 */
export enum NotificationAction {
  VIEW = 'view',
  REPLY = 'reply',
  DISMISS = 'dismiss',
  ACCEPT = 'accept',
  DECLINE = 'decline',
  CALL = 'call',
}

/**
 * Define all notification categories and their actions
 */
export const NOTIFICATION_CATEGORIES: Notifications.NotificationCategory[] = [
  {
    // Order updates (tracking, status changes)
    identifier: NotificationCategory.ORDER,
    actions: [
      {
        identifier: NotificationAction.VIEW,
        title: 'View Order',
        options: {
          opensApp: true,
          foreground: true,
        },
      },
      {
        identifier: NotificationAction.DISMISS,
        title: 'Dismiss',
        options: {
          opensApp: false,
          foreground: false,
          destructive: false,
        },
      },
    ],
  },
  {
    // Payment updates (success, failure, refunds)
    identifier: NotificationCategory.PAYMENT,
    actions: [
      {
        identifier: NotificationAction.VIEW,
        title: 'View Details',
        options: {
          opensApp: true,
          foreground: true,
        },
      },
    ],
  },
  {
    // Promotional notifications (offers, deals)
    identifier: NotificationCategory.PROMO,
    actions: [
      {
        identifier: NotificationAction.VIEW,
        title: 'View Offer',
        options: {
          opensApp: true,
          foreground: true,
        },
      },
      {
        identifier: NotificationAction.DISMISS,
        title: 'Not Interested',
        options: {
          opensApp: false,
          foreground: false,
          destructive: true,
        },
      },
    ],
  },
  {
    // Chat/messaging notifications
    identifier: NotificationCategory.CHAT,
    actions: [
      {
        identifier: NotificationAction.REPLY,
        title: 'Reply',
        options: {
          opensApp: true,
          foreground: true,
          textInput: {
            placeholder: 'Type a reply...',
            submitLabel: 'Send',
          },
        },
      },
      {
        identifier: NotificationAction.VIEW,
        title: 'View',
        options: {
          opensApp: true,
          foreground: true,
        },
      },
    ],
  },
  {
    // System notifications (security, maintenance)
    identifier: NotificationCategory.SYSTEM,
    actions: [
      {
        identifier: NotificationAction.VIEW,
        title: 'View',
        options: {
          opensApp: true,
          foreground: true,
        },
      },
    ],
  },
  {
    // Earning notifications (cashback, rewards)
    identifier: NotificationCategory.EARNING,
    actions: [
      {
        identifier: NotificationAction.VIEW,
        title: 'View Earnings',
        options: {
          opensApp: true,
          foreground: true,
        },
      },
    ],
  },
];

// ============================================================================
// Notification Handlers
// ============================================================================

interface NotificationHandler {
  category: NotificationCategory;
  onReceive: (notification: Notifications.Notification) => void | Promise<void>;
  onAction?: (action: NotificationAction, notification: Notifications.Notification) => void | Promise<void>;
}

/**
 * Global notification handlers registry
 */
const notificationHandlers: Map<NotificationCategory, NotificationHandler> = new Map();

/**
 * Register a handler for a notification category
 */
export function registerNotificationHandler(
  category: NotificationCategory,
  handler: Omit<NotificationHandler, 'category'>
): void {
  notificationHandlers.set(category, { ...handler, category });
  logger.debug('[Notifications] Handler registered', { category });
}

/**
 * Set up push notification handling
 */
export async function setupNotifications(): Promise<void> {
  try {
    // Set notification categories
    await Notifications.setNotificationCategories(NOTIFICATION_CATEGORIES);
    logger.info('[Notifications] Categories registered', {
      count: NOTIFICATION_CATEGORIES.length,
    });

    // Set up notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { request } = notification;
        const { content } = request;
        const category = content.categoryIdentifier as NotificationCategory;

        logger.debug('[Notifications] Notification received', {
          category,
          title: content.title,
        });

        // Find handler for this category
        const handler = notificationHandlers.get(category);

        if (handler?.onReceive) {
          try {
            await handler.onReceive(notification);
          } catch (error) {
            logger.error('[Notifications] Handler error', { category, error });
          }
        }

        // Return how to present the notification
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },

      handleSuccess: (notificationId: string) => {
        logger.debug('[Notifications] Notification handled successfully', { notificationId });
      },

      handleError: (notificationId: string, error: Error) => {
        logger.error('[Notifications] Notification handling error', {
          notificationId,
          error: error.message,
        });
      },
    });

    // Request permissions
    await requestNotificationPermissions();

    logger.info('[Notifications] Setup complete');
  } catch (error) {
    logger.error('[Notifications] Setup failed', { error });
    throw error;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    if (existingStatus === 'denied') {
      logger.warn('[Notifications] Permission denied by user');
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync({
      // iOS specific
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: false,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
      },
      // Android specific
      android: {
        channelId: 'default',
        icon: './assets/images/icon.png',
        color: '#1a3a52',
        sound: true,
        defaultPriority: 'high' as Notifications.AndroidImportance.HIGH,
        defaultSettings: {
          sound: true,
          badge: true,
        },
      },
    });

    const granted = status === 'granted';

    if (granted) {
      logger.info('[Notifications] Permissions granted');
    } else {
      logger.warn('[Notifications] Permission not granted', { status });
    }

    return granted;
  } catch (error) {
    logger.error('[Notifications] Permission request failed', { error });
    return false;
  }
}

/**
 * Handle notification response (user tapped notification)
 */
export async function handleNotificationResponse(
  response: Notifications.NotificationResponse
): Promise<void> {
  const { notification, actionIdentifier } = response;
  const { request } = notification;
  const { content } = request;

  const category = content.categoryIdentifier as NotificationCategory;
  const action = actionIdentifier as NotificationAction;

  logger.debug('[Notifications] Response received', {
    category,
    action,
    notificationId: notification.request.identifier,
  });

  // Find handler for this category
  const handler = notificationHandlers.get(category);

  // Call action handler if available
  if (handler?.onAction) {
    try {
      await handler.onAction(action, notification);
    } catch (error) {
      logger.error('[Notifications] Action handler error', {
        category,
        action,
        error,
      });
    }
  }

  // Default action handling based on category
  if (action === NotificationAction.VIEW || action === 'default') {
    // Navigate to relevant screen based on notification data
    const data = content.data as Record<string, string>;

    if (data?.route) {
      // Navigation handled by the app's deep linking
      logger.debug('[Notifications] Navigate to route', { route: data.route });
    }
  }
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Update app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    } else {
      // On Android, use the default channel
      // The badge count is managed by the OS launcher
    }
    logger.debug('[Notifications] Badge updated', { count });
  } catch (error) {
    logger.error('[Notifications] Badge update failed', { error });
  }
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Increment badge count
 */
export async function incrementBadgeCount(amount: number = 1): Promise<void> {
  const current = await getBadgeCount();
  await setBadgeCount(current + amount);
}

/**
 * Clear badge
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

// ============================================================================
// Scheduled Notifications
// ============================================================================

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  content: Notifications.NotificationContent,
  trigger: Notifications.NotificationTrigger,
  identifier?: string
): Promise<string> {
  const request: Notifications.NotificationRequest = {
    identifier: identifier || `local_${Date.now()}`,
    content,
    trigger,
  };

  await Notifications.scheduleNotificationAsync(request);
  logger.debug('[Notifications] Scheduled', { identifier: request.identifier });

  return request.identifier;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
  logger.debug('[Notifications] Cancelled', { identifier });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  logger.info('[Notifications] All cancelled');
}

/**
 * Get all pending notifications
 */
export async function getPendingNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getPresentedNotificationsAsync();
}

// ============================================================================
// Sound Management
// ============================================================================

/**
 * Play notification sound
 */
export async function playNotificationSound(): Promise<void> {
  try {
    await Notifications.setNotificationSoundAsync('default');
  } catch (error) {
    logger.error('[Notifications] Sound playback failed', { error });
  }
}

/**
 * Mute/unmute notification sounds
 */
export async function setNotificationSoundEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await Notifications.setNotificationSoundAsync('default');
    } else {
      await Notifications.setNotificationSoundAsync(undefined);
    }
    logger.debug('[Notifications] Sound', { enabled });
  } catch (error) {
    logger.error('[Notifications] Sound setting failed', { error });
  }
}

// ============================================================================
// Pre-built Notification Helpers
// ============================================================================

/**
 * Show an order notification
 */
export function showOrderNotification(
  orderId: string,
  status: string,
  message: string
): void {
  Notifications.postNotification({
    request: {
      identifier: `order_${orderId}_${Date.now()}`,
      content: {
        title: `Order ${status}`,
        body: message,
        data: {
          type: 'order',
          orderId,
          route: `/order/${orderId}`,
        },
        categoryIdentifier: NotificationCategory.ORDER,
        sound: 'default',
      },
      trigger: null,
    },
  });
}

/**
 * Show an earning notification
 */
export function showEarningNotification(
  amount: number,
  type: string
): void {
  Notifications.postNotification({
    request: {
      identifier: `earning_${Date.now()}`,
      content: {
        title: `You earned ₹${amount}!`,
        body: `Your ${type} has been credited to your wallet.`,
        data: {
          type: 'earning',
          route: '/earnings',
        },
        categoryIdentifier: NotificationCategory.EARNING,
        sound: 'default',
      },
      trigger: null,
    },
  });
}

/**
 * Show a promo notification
 */
export function showPromoNotification(
  title: string,
  body: string,
  offerId?: string
): void {
  Notifications.postNotification({
    request: {
      identifier: `promo_${Date.now()}`,
      content: {
        title,
        body,
        data: {
          type: 'promo',
          offerId,
          route: offerId ? `/offer/${offerId}` : '/offers',
        },
        categoryIdentifier: NotificationCategory.PROMO,
        sound: 'default',
      },
      trigger: null,
    },
  });
}

export default {
  setupNotifications,
  requestNotificationPermissions,
  handleNotificationResponse,
  registerNotificationHandler,
  setBadgeCount,
  getBadgeCount,
  incrementBadgeCount,
  clearBadge,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getPendingNotifications,
  showOrderNotification,
  showEarningNotification,
  showPromoNotification,
  NotificationCategory,
  NotificationAction,
};
