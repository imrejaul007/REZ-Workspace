import { BaseAdapter } from './base.adapter';
import { Notification, SendResult } from '../types';
import logger from '../utils/logger';

// Firebase Admin is imported conditionally to handle cases where it's not configured
let firebaseAdmin: typeof import('firebase-admin') | null = null;

export class PushAdapter extends BaseAdapter {
  readonly channel = 'push';
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid errors when Firebase is not configured
      firebaseAdmin = await import('firebase-admin');

      if (!firebaseAdmin.apps.length) {
        // Initialize Firebase Admin SDK
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }

      this.isInitialized = true;
      logger.info('Push adapter (Firebase) initialized');
    } catch (error) {
      logger.warn('Push adapter: Firebase not configured', { error });
      this.isInitialized = false;
    }
  }

  async send(notification: Notification): Promise<SendResult> {
    if (!this.isInitialized || !firebaseAdmin) {
      return this.createFailureResult('Push notification service not configured');
    }

    const deviceToken = this.getDeviceToken(notification);
    if (!deviceToken) {
      return this.createFailureResult('No device token provided');
    }

    const content = this.parsePushContent(notification.renderedContent);

    try {
      const message: firebaseAdmin.messaging.Message = {
        token: deviceToken,
        notification: {
          title: content.title,
          body: content.body,
          imageUrl: content.imageUrl,
        },
        data: this.getDataPayload(notification),
        android: {
          priority: this.mapPriority(notification.priority),
          notification: {
            channelId: 'rez_notifications',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const result = await firebaseAdmin!.messaging().send(message);

      logger.info('Push notification sent successfully', {
        notificationId: notification.id,
        messageId: result,
      });

      return this.createSuccessResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific Firebase errors
      if (errorMessage.includes('not-registered') || errorMessage.includes('InvalidArgument')) {
        logger.warn('Device token invalid, may need refresh', {
          notificationId: notification.id,
        });
      }

      logger.error('Push notification send failed', {
        notificationId: notification.id,
        error: errorMessage,
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private getDeviceToken(notification: Notification): string | undefined {
    return notification.metadata?.deviceToken as string | undefined;
  }

  private parsePushContent(
    content: string
  ): { title: string; body: string; imageUrl?: string } {
    // Parse content with format: "Title\n\nBody" or extract from HTML
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const lines = plainText.split('\n').filter((l) => l.trim());

    const title = lines[0] || 'REZ Platform';
    const body = lines.slice(1).join(' ') || 'You have a new notification';

    // Check for image in original content
    const imageMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
    const imageUrl = imageMatch?.[1];

    return { title, body, imageUrl };
  }

  private mapPriority(priority: string): 'high' | 'normal' {
    return priority === 'urgent' || priority === 'high' ? 'high' : 'normal';
  }

  private getDataPayload(notification: Notification): Record<string, string> {
    return {
      notificationId: notification.id,
      templateId: notification.templateId,
      userId: notification.userId,
      ...Object.fromEntries(
        Object.entries(notification.metadata || {}).map(([k, v]) => [
          k,
          String(v),
        ])
      ),
    };
  }

  async sendBatchToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized || !firebaseAdmin) {
      return { successCount: 0, failureCount: tokens.length };
    }

    const message: firebaseAdmin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: { channelId: 'rez_notifications' },
      },
      apns: {
        payload: { aps: { badge: 1, sound: 'default' } },
      },
    };

    const response = await firebaseAdmin!.messaging().sendEachForMulticast(message);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  }
}
