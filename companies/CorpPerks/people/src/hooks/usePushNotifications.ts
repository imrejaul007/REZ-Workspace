import { useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// ==================== TYPES ====================

export interface PushNotification {
  notificationId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: string;
  read: boolean;
}

export interface NotificationHandlers {
  onNotificationReceived?: (notification: PushNotification) => void;
  onNotificationTapped?: (notification: PushNotification) => void;
}

export interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  notifications: PushNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  registerForPushNotifications: () => Promise<string | null>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  scheduleLocalNotification: (title: string, body: string, data?: Record<string, unknown>, seconds?: number) => Promise<string>;
  cancelAllScheduledNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// ==================== CONSTANTS ====================

const PUSH_SERVICE_URL = Constants.expoConfig?.extra?.pushServiceUrl || 'http://localhost:4749';
const INTERNAL_TOKEN = Constants.expoConfig?.extra?.internalServiceToken || '';

// ==================== NOTIFICATION CHANNEL (Android) ====================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==================== HOOK ====================

export function usePushNotifications(handlers?: NotificationHandlers): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ==================== REGISTER FOR PUSH ====================

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      setError('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission for notifications was not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.ios?.bundleId || Constants.expoConfig?.android?.package,
      });

      const token = tokenData.data;
      setExpoPushToken(token);

      // Register token with backend
      if (isAuthenticated && user) {
        await registerTokenWithBackend(token);
      }

      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get push token';
      setError(errorMessage);
      logger.error('Push token error:', err);
      return null;
    }
  }, [isAuthenticated, user]);

  // ==================== REGISTER TOKEN WITH BACKEND ====================

  const registerTokenWithBackend = async (token: string): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch(`${PUSH_SERVICE_URL}/api/push/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || user.userId,
          companyId: user.companyId,
          expoPushToken: token,
          platform: Platform.OS,
          deviceId: Constants.installationTime?.toString(),
          appVersion: Constants.expoConfig?.version,
          osVersion: Platform.Version?.toString(),
        }),
      });

      if (!response.ok) {
        logger.error('Failed to register token with backend:', response.status);
      }
    } catch (err) {
      logger.error('Failed to register token:', err);
    }
  };

  // ==================== UNREGISTER TOKEN ====================

  const unregisterToken = useCallback(async (token: string): Promise<void> => {
    try {
      await fetch(`${PUSH_SERVICE_URL}/api/push/unregister`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expoPushToken: token }),
      });

      await Notifications.deleteNotificationTokenSubscription();
      setExpoPushToken(null);
    } catch (err) {
      logger.error('Failed to unregister token:', err);
    }
  }, []);

  // ==================== NOTIFICATION LISTENERS ====================

  useEffect(() => {
    // Register for push on mount
    if (isAuthenticated) {
      registerForPushNotifications();
    }

    // Notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);

      const pushNotification: PushNotification = {
        notificationId: notif.request.identifier,
        title: notif.request.content.title || '',
        body: notif.request.content.body || '',
        data: notif.request.content.data as Record<string, unknown>,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [pushNotification, ...prev]);
      handlers?.onNotificationReceived?.(pushNotification);
    });

    // Notification tapped
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const notif = response.notification.request.content;

      const pushNotification: PushNotification = {
        notificationId: response.notification.request.identifier,
        title: notif.title || '',
        body: notif.body || '',
        data: notif.data as Record<string, unknown>,
        timestamp: new Date().toISOString(),
        read: false,
      };

      handlers?.onNotificationTapped?.(pushNotification);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, registerForPushNotifications, handlers]);

  // ==================== FETCH NOTIFICATIONS FROM BACKEND ====================

  const fetchNotifications = useCallback(async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const userId = user.id || user.userId;
      const response = await fetch(`${PUSH_SERVICE_URL}/api/notifications?userId=${userId}&limit=50`, {
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.data?.notifications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ==================== MARK AS READ ====================

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!user) return;

    try {
      const userId = user.id || user.userId;
      await fetch(`${PUSH_SERVICE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({ userId }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      logger.error('Failed to mark notification as read:', err);
    }
  }, [user]);

  // ==================== MARK ALL AS READ ====================

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const userId = user.id || user.userId;
      await fetch(`${PUSH_SERVICE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({ userId, companyId: user.companyId }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      logger.error('Failed to mark all as read:', err);
    }
  }, [user]);

  // ==================== CLEAR NOTIFICATIONS ====================

  const clearNotifications = useCallback((): void => {
    setNotifications([]);
  }, []);

  // ==================== SCHEDULE LOCAL NOTIFICATION ====================

  const scheduleLocalNotification = useCallback(
    async (
      title: string,
      body: string,
      data?: Record<string, unknown>,
      seconds = 0
    ): Promise<string> => {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: seconds > 0 ? { seconds } : null,
      });
      return id;
    },
    []
  );

  // ==================== CANCEL ALL SCHEDULED ====================

  const cancelAllScheduledNotifications = useCallback(async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  // ==================== REFRESH ====================

  const refreshNotifications = useCallback(async (): Promise<void> => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // ==================== COMPUTED ====================

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ==================== RETURN ====================

  return {
    expoPushToken,
    notification,
    notifications,
    unreadCount,
    isLoading,
    error,
    registerForPushNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    scheduleLocalNotification,
    cancelAllScheduledNotifications,
    refreshNotifications,
  };
}
