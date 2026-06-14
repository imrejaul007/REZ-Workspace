/**
 * REZ Go Notification Service
 *
 * Sends push notifications for:
 * - Session events
 * - Cashback credits
 * - Checkout status
 * - Recovery transfers
 */

import { config } from '../config/index.js';

export type NotificationType =
  | 'session.started'
  | 'session.completed'
  | 'session.expired'
  | 'cashback.credited'
  | 'checkout.failed'
  | 'recovery.initiated'
  | 'recovery.completed'
  | 'fraud.alert'
  | 'savings.milestone';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
}

interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

class NotificationService {
  private notificationServiceUrl: string;
  private internalToken: string;

  constructor() {
    this.notificationServiceUrl = config.NOTIFICATION_SERVICE_URL;
    this.internalToken = config.INTERNAL_SERVICE_TOKEN;
  }

  /**
   * Send push notification
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const response = await fetch(`${this.notificationServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          userId: payload.userId,
          type: 'push',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          priority: payload.priority || 'normal',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to send notification' };
      }

      const data = await response.json();
      return { success: true, notificationId: data.notificationId };
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false, error: 'Notification service unavailable' };
    }
  }

  /**
   * Send session started notification
   */
  async sessionStarted(userId: string, storeName: string): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'session.started',
      title: 'Shopping Started 🛒',
      body: `Your shopping session at ${storeName} has started. Happy shopping!`,
      data: { type: 'session' },
    });
  }

  /**
   * Send session completed notification
   */
  async sessionCompleted(
    userId: string,
    total: number,
    cashback: number,
    savings: number
  ): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'session.completed',
      title: 'Purchase Complete! 🎉',
      body: `You saved ₹${savings.toFixed(0)}! ₹${cashback.toFixed(0)} cashback credited.`,
      data: { type: 'receipt', total, cashback, savings },
      priority: 'high',
    });
  }

  /**
   * Send session expired notification
   */
  async sessionExpired(userId: string, reason?: string): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'session.expired',
      title: 'Session Expired ⏰',
      body: reason === 'timeout'
        ? 'Your shopping session expired. Start a new session to continue.'
        : 'Your shopping session has expired.',
      data: { type: 'session', reason },
    });
  }

  /**
   * Send cashback credited notification
   */
  async cashbackCredited(userId: string, amount: number): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'cashback.credited',
      title: 'Cashback Credited! 💰',
      body: `₹${amount.toFixed(0)} cashback has been added to your wallet.`,
      data: { type: 'cashback', amount },
      priority: 'high',
    });
  }

  /**
   * Send checkout failed notification
   */
  async checkoutFailed(userId: string, reason: string): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'checkout.failed',
      title: 'Payment Issue 💳',
      body: `Your payment could not be processed: ${reason}. Visit the counter for assistance.`,
      data: { type: 'checkout', reason },
      priority: 'high',
    });
  }

  /**
   * Send recovery initiated notification
   */
  async recoveryInitiated(userId: string, transferId: string): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'recovery.initiated',
      title: 'Move to Counter 📋',
      body: 'Your cart has been transferred to the counter. Show the QR to the cashier.',
      data: { type: 'recovery', transferId },
      priority: 'high',
    });
  }

  /**
   * Send recovery completed notification
   */
  async recoveryCompleted(userId: string, total: number): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'recovery.completed',
      title: 'Purchase Complete! ✅',
      body: `Your purchase of ₹${total.toFixed(0)} has been completed at the counter.`,
      data: { type: 'receipt', total },
    });
  }

  /**
   * Send fraud alert notification (to merchant)
   */
  async fraudAlert(merchantId: string, sessionId: string, score: number): Promise<NotificationResult> {
    return this.send({
      userId: merchantId,
      type: 'fraud.alert',
      title: 'Fraud Alert ⚠️',
      body: `High-risk session detected. Score: ${score}%. Review immediately.`,
      data: { type: 'fraud', sessionId, score },
      priority: 'high',
    });
  }

  /**
   * Send savings milestone notification
   */
  async savingsMilestone(userId: string, milestone: number, totalSavings: number): Promise<NotificationResult> {
    return this.send({
      userId,
      type: 'savings.milestone',
      title: `You Saved ₹${milestone}! 🎯`,
      body: `Great job! You've saved ₹${totalSavings.toFixed(0)} on REZ Go so far.`,
      data: { type: 'savings', milestone, totalSavings },
    });
  }

  /**
   * Send bulk notification (for marketing)
   */
  async sendBulk(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.send({ ...payload, userId }))
    );

    const success = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - success;

    return { success, failed };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
