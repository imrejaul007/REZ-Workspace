import logger from '../utils/logger';

import axios from 'axios';
import { config } from '../config';

/**
 * Firebase Cloud Messaging (FCM) Push Notifications
 * For real-time notifications to mobile apps
 */

interface PushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// FCM Server Key (from Firebase Console)
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

/**
 * Send push notification via FCM
 */
export async function sendPushNotification(
  notification: PushNotification
): Promise<PushResult> {
  // Skip if FCM not configured
  if (!process.env.FIREBASE_SERVER_KEY) {
    logger.info('[Push] FCM not configured, skipping notification');
    return { success: false, error: 'FCM not configured' };
  }

  try {
    const payload = {
      to: notification.token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.image ? { image: notification.image } : {}),
        sound: notification.sound || 'default',
        badge: notification.badge || 1,
        click_action: notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: notification.data || {},
      priority: 'high',
    };

    const response = await axios.post(FCM_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
      },
      timeout: 10000,
    });

    if (response.data.success) {
      return {
        success: true,
        messageId: response.data.results?.[0]?.message_id,
      };
    } else {
      return {
        success: false,
        error: response.data.results?.[0]?.error || 'Unknown error',
      };
    }
  } catch (error) {
    logger.error('[Push] FCM error: ' + String(error));
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Send to multiple tokens
 */
export async function sendPushToMultiple(
  tokens: string[],
  notification: Omit<PushNotification, 'token'>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = await Promise.all(
    tokens.map((token) =>
      sendPushNotification({ ...notification, token })
    )
  );

  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const errors = results
    .filter((r) => !r.success)
    .map((r) => r.error || 'Unknown error');

  return { success, failed, errors };
}

/**
 * Safe QR specific push notifications
 */
export const safeQRPush = {
  /**
   * Notify owner of new message
   */
  async onNewMessage(
    token: string,
    itemName: string,
    messagePreview: string,
    shortcode: string
  ): Promise<PushResult> {
    return sendPushNotification({
      token,
      title: `💬 New message for "${itemName}"`,
      body: messagePreview.length > 100
        ? messagePreview.substring(0, 100) + '...'
        : messagePreview,
      data: {
        type: 'new_message',
        shortcode,
        itemName,
      },
      clickAction: 'SAFE_QR_MESSAGES',
    });
  },

  /**
   * Notify owner when QR is scanned
   */
  async onScan(
    token: string,
    itemName: string,
    shortcode: string
  ): Promise<PushResult> {
    return sendPushNotification({
      token,
      title: `📍 "${itemName}" was scanned`,
      body: 'Someone scanned your Safe QR. Check for messages!',
      data: {
        type: 'scan',
        shortcode,
        itemName,
      },
      clickAction: 'SAFE_QR_DETAIL',
    });
  },

  /**
   * Notify owner of lost mode activation
   */
  async onLostModeActivated(
    token: string,
    itemName: string,
    shortcode: string
  ): Promise<PushResult> {
    return sendPushNotification({
      token,
      title: `⚠️ "${itemName}" marked as lost`,
      body: 'Your item is now visible to helpers. We\'ll notify you when someone finds it!',
      data: {
        type: 'lost_mode',
        shortcode,
        itemName,
      },
      clickAction: 'SAFE_QR_LOST',
    });
  },

  /**
   * Notify owner when item is found
   */
  async onFound(
    token: string,
    itemName: string,
    shortcode: string,
    helperName?: string
  ): Promise<PushResult> {
    return sendPushNotification({
      token,
      title: `🎉 "${itemName}" has been found!`,
      body: helperName
        ? `${helperName} found your item and wants to help!`
        : 'Someone found your lost item!',
      data: {
        type: 'found',
        shortcode,
        itemName,
      },
      clickAction: 'SAFE_QR_FOUND',
    });
  },

  /**
   * Notify helper of karma reward
   */
  async onKarmaEarned(
    token: string,
    points: number,
    reason: string
  ): Promise<PushResult> {
    return sendPushNotification({
      token,
      title: `⭐ You earned ${points} karma points!`,
      body: reason,
      data: {
        type: 'karma',
        points: points.toString(),
      },
      clickAction: 'KARMA_PROFILE',
    });
  },

  /**
   * Generic notification
   */
  async send(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<PushResult> {
    return sendPushNotification({ token, title, body, data });
  },
};

/**
 * Expo Push Notifications (for React Native)
 */
export const expoPush = {
  /**
   * Send via Expo Push API
   */
  async send(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<PushResult> {
    if (!process.env.EXPO_ACCESS_TOKEN) {
      logger.info('[Expo Push] Token not configured');
      return { success: false, error: 'Expo not configured' };
    }

    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        {
          to: token,
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
          },
          timeout: 10000,
        }
      );

      return {
        success: response.data.data?.status === 'ok',
        messageId: response.data.data?.id,
        error: response.data.data?.message || response.data.errors?.[0],
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: String(error),
      };
    }
  },

  /**
   * Send to multiple Expo tokens
   */
  async sendMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<PushResult> {
    if (!process.env.EXPO_ACCESS_TOKEN) {
      return { success: false, error: 'Expo not configured' };
    }

    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        {
          to: tokens,
          title,
          body,
          data,
          sound: 'default',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return {
        success: response.data.data?.status === 'ok',
        messageId: response.data.data?.id,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: String(error),
      };
    }
  },
};
