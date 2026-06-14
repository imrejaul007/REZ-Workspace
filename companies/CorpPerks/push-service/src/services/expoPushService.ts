import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ExpoToken, IExpoToken, ExpoDelivery, IExpoDelivery } from '../models';

// ==================== TYPES ====================

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | 'none' | string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
  expiration?: number;
  badge?: number;
  categoryId?: string;
  mutableContent?: boolean;
  channelId?: string;
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message: string;
  details?: {
    errorCode?: string;
    errorMessage?: string;
    expoPushTicket?: string;
  };
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id: string;
  expoPushToken?: string;
  expoPushTicket?: string;
  message?: string;
  details?: {
    errorCode?: string;
    errorMessage?: string;
  };
}

export interface SendExpoPushInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | 'none' | string;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  deepLink?: string;
}

export interface RegisterTokenInput {
  userId: string;
  companyId: string;
  expoPushToken: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  metadata?: Record<string, unknown>;
}

// ==================== EXPO PUSH SERVICE ====================

export class ExpoPushService {
  private readonly EXPO_API_URL = 'https://exp.host/--/api/v2/push';
  private readonly EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;
  private receiptCheckInterval: NodeJS.Timeout | null = null;

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Register a device token for push notifications
   */
  async registerToken(input: RegisterTokenInput): Promise<IExpoToken> {
    const {
      userId,
      companyId,
      expoPushToken,
      platform,
      deviceId,
      deviceName,
      deviceModel,
      osVersion,
      appVersion,
      metadata,
    } = input;

    // Validate token format (ExponentPushToken[xxx] or ExponentPushToken[])
    if (!this.isValidExpoToken(expoPushToken)) {
      throw new Error('Invalid Expo push token format');
    }

    // Check if token already exists
    const existing = await ExpoToken.findOne({ expoPushToken });
    if (existing) {
      // Update existing token
      existing.userId = userId;
      existing.companyId = companyId;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      existing.deviceName = deviceName;
      existing.deviceModel = deviceModel;
      existing.osVersion = osVersion;
      existing.appVersion = appVersion;
      if (metadata) {
        existing.metadata = { ...existing.metadata, ...metadata };
      }
      await existing.save();
      return existing;
    }

    // Create new token
    const token = new ExpoToken({
      tokenId: `exp_${uuidv4()}`,
      userId,
      companyId,
      expoPushToken,
      platform,
      deviceId,
      deviceName,
      deviceModel,
      osVersion,
      appVersion,
      isActive: true,
      lastUsedAt: new Date(),
      notificationCount: 0,
      failedCount: 0,
      metadata,
    });

    await token.save();
    return token;
  }

  /**
   * Unregister a device token
   */
  async unregisterToken(expoPushToken: string): Promise<boolean> {
    const result = await ExpoToken.updateOne(
      { expoPushToken },
      { $set: { isActive: false } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Unregister all tokens for a user
   */
  async unregisterAllUserTokens(userId: string): Promise<number> {
    const result = await ExpoToken.updateMany(
      { userId },
      { $set: { isActive: false } }
    );
    return result.modifiedCount;
  }

  /**
   * Get all active tokens for a user
   */
  async getUserTokens(userId: string): Promise<IExpoToken[]> {
    return ExpoToken.find({ userId, isActive: true }).exec();
  }

  /**
   * Get tokens by company
   */
  async getCompanyTokens(companyId: string): Promise<IExpoToken[]> {
    return ExpoToken.find({ companyId, isActive: true }).exec();
  }

  /**
   * Validate Expo token format
   */
  private isValidExpoToken(token: string): boolean {
    return /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/.test(token);
  }

  // ==================== PUSH NOTIFICATIONS ====================

  /**
   * Send push notification to a user
   */
  async sendToUser(userId: string, input: SendExpoPushInput): Promise<{
    success: boolean;
    notificationId: string;
    deliveryResults?: {
      token: string;
      status: 'sent' | 'failed';
      error?: string;
    }[];
  }> {
    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) {
      return {
        success: false,
        notificationId: `notif_${uuidv4()}`,
        deliveryResults: [],
      };
    }

    const notificationId = `notif_${uuidv4()}`;
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token.expoPushToken,
      title: input.title,
      body: input.body,
      data: {
        ...input.data,
        notificationId,
        deepLink: input.deepLink,
      },
      sound: input.sound || 'default',
      priority: input.priority || 'default',
      badge: input.badge,
    }));

    const results = await this.sendBatch(messages, notificationId);

    return {
      success: results.some((r) => r.status === 'sent'),
      notificationId,
      deliveryResults: results,
    };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], input: SendExpoPushInput): Promise<{
    success: boolean;
    notificationId: string;
    deliveryResults: {
      userId: string;
      token: string;
      status: 'sent' | 'failed';
      error?: string;
    }[];
  }> {
    const notificationId = `notif_${uuidv4()}`;
    const allResults: {
      userId: string;
      token: string;
      status: 'sent' | 'failed';
      error?: string;
    }[] = [];

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, input);
      if (result.deliveryResults) {
        allResults.push(
          ...result.deliveryResults.map((r) => ({
            userId,
            token: r.token,
            status: r.status,
            error: r.error,
          }))
        );
      }
    }

    return {
      success: allResults.some((r) => r.status === 'sent'),
      notificationId,
      deliveryResults: allResults,
    };
  }

  /**
   * Send push notification to a specific token
   */
  async sendToToken(
    expoPushToken: string,
    input: Omit<SendExpoPushInput, 'userId'>
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    const message: ExpoPushMessage = {
      to: expoPushToken,
      title: input.title,
      body: input.body,
      data: {
        ...input.data,
        deepLink: input.deepLink,
      },
      sound: input.sound || 'default',
      priority: input.priority || 'default',
      badge: input.badge,
    };

    try {
      const ticket = await this.sendToExpo([message]);
      if (ticket.status === 'ok' && ticket.id) {
        return { success: true, ticketId: ticket.id };
      }
      return { success: false, error: ticket.details?.errorMessage || 'Failed to send' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send batch of messages to Expo
   */
  private async sendBatch(
    messages: ExpoPushMessage[],
    notificationId: string
  ): Promise<{ token: string; status: 'sent' | 'failed'; error?: string }[]> {
    try {
      const tickets = await this.sendToExpo(messages);
      const results: { token: string; status: 'sent' | 'failed'; error?: string }[] = [];

      // Store tickets for receipt checking
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const token = messages[i].to;

        // Create delivery record
        const delivery = new ExpoDelivery({
          deliveryId: `del_${uuidv4()}`,
          notificationId,
          expoPushToken: token,
          expoTicketId: ticket.id,
          status: 'pending',
          retryCount: 0,
        });

        if (ticket.status === 'ok') {
          delivery.status = 'sent';
          delivery.sentAt = new Date();
          results.push({ token, status: 'sent' });
        } else {
          delivery.status = 'failed';
          delivery.error = {
            code: ticket.details?.errorCode,
            message: ticket.details?.errorMessage || ticket.message,
          };
          results.push({ token, status: 'failed', error: ticket.details?.errorMessage });
        }

        await delivery.save();

        // Update token stats
        const tokenDoc = await ExpoToken.findOne({ expoPushToken: token });
        if (tokenDoc) {
          if (ticket.status === 'ok') {
            await tokenDoc.recordSuccess();
          } else {
            await tokenDoc.recordFailure();
          }
        }
      }

      // Schedule receipt check
      this.scheduleReceiptCheck(notificationId, tickets.filter((t) => t.status === 'ok').map((t) => t.id));

      return results;
    } catch (error) {
      logger.error('Failed to send batch:', error);
      return messages.map((m) => ({
        token: m.to,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  /**
   * Send messages to Expo Push API
   */
  private async sendToExpo(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.EXPO_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${this.EXPO_ACCESS_TOKEN}`;
    }

    const response = await axios.post(`${this.EXPO_API_URL}/send`, messages, { headers });

    if (Array.isArray(response.data)) {
      return response.data as ExpoPushTicket[];
    }

    // Handle single ticket response
    return [response.data as ExpoPushTicket];
  }

  /**
   * Schedule receipt check for sent notifications
   */
  private scheduleReceiptCheck(notificationId: string, ticketIds: string[]): void {
    if (ticketIds.length === 0) return;

    // Check receipts after 1 minute
    setTimeout(async () => {
      await this.checkReceipts(notificationId, ticketIds);
    }, 60000);
  }

  /**
   * Check delivery receipts from Expo
   */
  async checkReceipts(notificationId: string, ticketIds: string[]): Promise<void> {
    if (ticketIds.length === 0) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.EXPO_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${this.EXPO_ACCESS_TOKEN}`;
      }

      const response = await axios.post(
        `${this.EXPO_API_URL}/getReceipts`,
        { ids: ticketIds },
        { headers }
      );

      const receipts = response.data as Record<string, ExpoPushReceipt>;

      for (const [ticketId, receipt] of Object.entries(receipts)) {
        const delivery = await ExpoDelivery.findOne({ expoTicketId: ticketId });
        if (!delivery) continue;

        if (receipt.status === 'ok') {
          await delivery.markDelivered();
        } else if (receipt.details?.errorCode) {
          if (receipt.details.errorCode === 'DeviceNotRegistered' || receipt.details.errorCode === 'InvalidCredentials') {
            // Deactivate the token
            await ExpoToken.deactivateByToken(delivery.expoPushToken);
            await delivery.markBounced(
              receipt.details.errorCode,
              receipt.details.errorMessage || receipt.message
            );
          } else {
            // Schedule retry
            if (delivery.retryCount < 3) {
              await delivery.scheduleRetry();
            } else {
              await delivery.markFailed(
                receipt.details.errorCode,
                receipt.details.errorMessage || receipt.message
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check receipts:', error);
    }
  }

  // ==================== SCHEDULED NOTIFICATIONS ====================

  /**
   * Schedule a push notification for future delivery
   */
  async scheduleNotification(
    userId: string,
    input: SendExpoPushInput,
    scheduledAt: Date
  ): Promise<{ success: boolean; scheduleId: string }> {
    // Store scheduled notification
    // This would integrate with the scheduler service
    return {
      success: true,
      scheduleId: `sched_${uuidv4()}`,
    };
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(scheduleId: string): Promise<boolean> {
    // Cancel scheduled notification
    return true;
  }

  // ==================== ANALYTICS ====================

  /**
   * Get delivery statistics for a notification
   */
  async getDeliveryStats(notificationId: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
    pending: number;
  }> {
    const deliveries = await ExpoDelivery.find({ notificationId });
    const stats = {
      total: deliveries.length,
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      pending: 0,
    };

    for (const delivery of deliveries) {
      stats[delivery.status]++;
    }

    return stats;
  }

  /**
   * Get user notification history
   */
  async getUserNotificationHistory(
    userId: string,
    limit = 50
  ): Promise<{ notificationId: string; status: string; sentAt: Date; deliveredAt?: Date }[]> {
    const tokens = await this.getUserTokens(userId);
    const tokenStrings = tokens.map((t) => t.expoPushToken);

    const deliveries = await ExpoDelivery.find({ expoPushToken: { $in: tokenStrings } })
      .sort({ sentAt: -1 })
      .limit(limit)
      .exec();

    return deliveries.map((d) => ({
      notificationId: d.notificationId,
      status: d.status,
      sentAt: d.sentAt || d.createdAt,
      deliveredAt: d.deliveredAt,
    }));
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<boolean> {
    try {
      // Test Expo API connectivity
      const response = await axios.get('https://exp.host/--/api/v2/push/health', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const expoPushService = new ExpoPushService();
