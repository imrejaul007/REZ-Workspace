/**
 * Expo Notifications Type Definitions
 * Provides TypeScript types for Expo push notifications
 */

export interface ExpoNotification {
  notificationId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  subtitle?: string;
  badge?: number;
  sound?: string;
  categoryId?: string;
  contentAvailable?: number;
  mutableContent?: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  importance: 1 | 2 | 3 | 4 | 5;
  sound?: string;
  vibrationPattern?: number[];
  lightColor?: string;
  lockScreenVisibility?: 0 | 1;
}

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

export interface NotificationPermission {
  status: 'granted' | 'denied' | 'undetermined';
  ios?: {
    scope: 'all' | 'badge' | 'sound' | 'alert';
  };
  android?: {
    scope: number;
  };
}

export interface NotificationContent {
  title: string;
  body: string;
  subtitle?: string;
  sound?: string;
  badge?: number;
  data?: Record<string, unknown>;
  categoryId?: string;
  mutableContent?: boolean;
}

export interface NotificationTrigger {
  type: 'push' | 'push-knockout-pattern' | 'email' | 'sms' | 'calendar' | 'location' | 'timeinterval' | 'daily' | 'weekly' | 'yearly' | 'monthly';
}

export interface ScheduledNotification {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger;
  status: 'scheduled' | 'canceled';
}

export interface NotificationResponse {
  notification: ExpoNotification;
  actionIdentifier: string;
  userText?: string;
}

export interface NotificationBehavior {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}
