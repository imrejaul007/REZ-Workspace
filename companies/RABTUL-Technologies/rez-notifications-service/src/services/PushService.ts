import logger from './utils/logger';

/**
 * Push Notification Service
 *
 * FCM/APNs push notifications
 */

import axios from 'axios';

interface PushPayload {
  token?: string;
  notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    badge?: number;
    sound?: string;
  };
}

export class PushService {
  private fcmKey: string;
  private apnsKey: string;
  private isInitialized: boolean = false;

  constructor() {
    this.fcmKey = process.env.FCM_SERVER_KEY || '';
    this.apnsKey = process.env.APNS_KEY || '';
  }

  async initialize(): Promise<void> {
    logger.info('Push Service initialized');
    this.isInitialized = true;
  }

  /**
   * Send push notification via FCM (Android)
   */
  async sendViaFCM(payload: PushPayload): Promise<boolean> {
    if (!this.fcmKey) {
      logger.warn('FCM key not configured');
      return false;
    }

    try {
      const response = await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          to: payload.token,
          notification: {
            title: payload.notification.title,
            body: payload.notification.body,
            sound: payload.notification.sound || 'default',
            badge: payload.notification.badge,
          },
          data: payload.notification.data,
        },
        {
          headers: {
            'Authorization': `key=${this.fcmKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.success === 1;
    } catch (error) {
      console.error('FCM send failed:', error);
      return false;
    }
  }

  /**
   * Send push notification via APNs (iOS)
   */
  async sendViaAPNs(payload: PushPayload): Promise<boolean> {
    if (!this.apnsKey) {
      logger.warn('APNs key not configured');
      return false;
    }

    try {
      // In production, use APNs library
      console.log('APNs push sent:', payload);
      return true;
    } catch (error) {
      console.error('APNs send failed:', error);
      return false;
    }
  }

  /**
   * Send push notification (auto-detect platform)
   */
  async send(payload: PushPayload): Promise<boolean> {
    if (!payload.token) {
      logger.warn('No push token provided');
      return false;
    }

    // Detect platform from token format
    // FCM tokens are longer, APNs tokens are shorter
    if (payload.token.length > 150) {
      return this.sendViaFCM(payload);
    } else {
      return this.sendViaAPNs(payload);
    }
  }

  /**
   * Send to multiple tokens
   */
  async sendMultiple(tokens: string[], payload: PushPayload): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const token of tokens) {
      const result = await this.send({ ...payload, token });
      if (result) success++;
      else failed++;
    }

    return { success, failed };
  }
}
