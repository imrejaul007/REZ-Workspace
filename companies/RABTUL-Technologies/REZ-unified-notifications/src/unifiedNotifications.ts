/**
 * REZ Unified Notifications Service
 *
 * Consolidates all notification services into one:
 * - REZ-notifications-hub
 * - REZ-notifications-service
 * - BuzzLocal notification-service
 * - REZ-notification-router
 * - Smart Notifications
 *
 * This is the SINGLE SOURCE OF TRUTH for all notifications.
 *
 * Port: 4063
 */

import axios from 'axios';

// ============================================================================
// Service URLs (Downstream Services)
// ============================================================================

const NOTIFICATIONS_HUB_URL = process.env.NOTIFICATIONS_HUB_URL || 'http://localhost:4011';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-token';

// ============================================================================
// Types
// ============================================================================

export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp' | 'in_app';
export type NotificationPriority = 'high' | 'normal' | 'low';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  image?: string;
  deepLink?: string;
}

export interface NotificationRequest {
  userId: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  payload: NotificationPayload;
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResponse {
  notificationId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  channelResults: {
    channel: NotificationChannel;
    status: 'success' | 'failed';
    messageId?: string;
    error?: string;
  }[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
  active: boolean;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: Partial<Record<NotificationChannel, {
    enabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }>>;
  categories: Partial<Record<string, boolean>>;
}

// ============================================================================
// Unified Notifications Service
// ============================================================================

class UnifiedNotificationsService {

  // ============================================
  // Send Notifications
  // ============================================

  /**
   * Send notification to user
   */
  async send(request: NotificationRequest): Promise<NotificationResponse> {
    const notificationId = `notif_${Date.now()}_${randomBytes(6).toString('hex')}`;

    const channelResults = await Promise.all(
      request.channels.map(async (channel) => {
        try {
          const result = await this.sendToChannel(channel, request, notificationId);
          return { channel, status: 'success' as const, messageId: result };
        } catch (error) {
          return { channel, status: 'failed' as const, error: error.message };
        }
      })
    );

    return {
      notificationId,
      status: channelResults.some(r => r.status === 'success') ? 'queued' : 'failed',
      channelResults
    };
  }

  private async sendToChannel(
    channel: NotificationChannel,
    request: NotificationRequest,
    notificationId: string
  ): Promise<string> {
    switch (channel) {
      case 'push':
        return this.sendPushNotification(request, notificationId);
      case 'sms':
        return this.sendSMS(request, notificationId);
      case 'email':
        return this.sendEmail(request, notificationId);
      case 'whatsapp':
        return this.sendWhatsApp(request, notificationId);
      case 'in_app':
        return this.sendInApp(request, notificationId);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private async sendPushNotification(request: NotificationRequest, notificationId: string): Promise<string> {
    const response = await axios.post(
      `${NOTIFICATIONS_HUB_URL}/api/notifications/push`,
      {
        notificationId,
        userId: request.userId,
        payload: request.payload,
        priority: request.priority
      },
      {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      }
    );
    return response.data.messageId;
  }

  private async sendSMS(request: NotificationRequest, notificationId: string): Promise<string> {
    const response = await axios.post(
      `${NOTIFICATIONS_HUB_URL}/api/notifications/sms`,
      {
        notificationId,
        userId: request.userId,
        message: request.payload.body,
        phone: request.metadata?.phone
      },
      {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      }
    );
    return response.data.messageId;
  }

  private async sendEmail(request: NotificationRequest, notificationId: string): Promise<string> {
    const response = await axios.post(
      `${NOTIFICATIONS_HUB_URL}/api/notifications/email`,
      {
        notificationId,
        userId: request.userId,
        subject: request.payload.title,
        body: request.payload.body,
        email: request.metadata?.email
      },
      {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      }
    );
    return response.data.messageId;
  }

  private async sendWhatsApp(request: NotificationRequest, notificationId: string): Promise<string> {
    const response = await axios.post(
      `${NOTIFICATIONS_HUB_URL}/api/notifications/whatsapp`,
      {
        notificationId,
        userId: request.userId,
        message: request.payload.body,
        phone: request.metadata?.phone
      },
      {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      }
    );
    return response.data.messageId;
  }

  private async sendInApp(request: NotificationRequest, notificationId: string): Promise<string> {
    const response = await axios.post(
      `${NOTIFICATIONS_HUB_URL}/api/notifications/in_app`,
      {
        notificationId,
        userId: request.userId,
        payload: request.payload
      },
      {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      }
    );
    return response.data.messageId;
  }

  // ============================================
  // Smart Notifications (Context-aware)
  // ============================================

  /**
   * Send smart notification based on user context
   */
  async sendSmart(
    userId: string,
    event: {
      type: string;
      data: Record<string, unknown>;
    }
  ): Promise<NotificationResponse> {
    // Determine best channel and timing
    const channel = await this.determineBestChannel(userId);
    const payload = await this.buildPayload(event);

    return this.send({
      userId,
      channels: [channel],
      priority: this.determinePriority(event.type),
      payload,
      metadata: event.data
    });
  }

  private async determineBestChannel(userId: string): Promise<NotificationChannel> {
    // Check user preferences
    const prefs = await this.getUserPreferences(userId);

    // Default to push, fallback to SMS if push disabled
    if (prefs?.channels?.push?.enabled !== false) {
      return 'push';
    }
    if (prefs?.channels?.sms?.enabled !== false) {
      return 'sms';
    }
    if (prefs?.channels?.whatsapp?.enabled !== false) {
      return 'whatsapp';
    }

    return 'push'; // Always have push as fallback
  }

  private determinePriority(eventType: string): NotificationPriority {
    const highPriority = ['order_status', 'payment', 'security', 'support'];
    const lowPriority = ['marketing', 'promotion', 'newsletter'];

    if (highPriority.includes(eventType)) return 'high';
    if (lowPriority.includes(eventType)) return 'low';
    return 'normal';
  }

  private async buildPayload(event: {
    type: string;
    data: Record<string, unknown>;
  }): Promise<NotificationPayload> {
    // Build contextual payload based on event type
    const templates: Record<string, Partial<NotificationPayload>> = {
      'order_delivered': {
        title: 'Your order is here! 🎉',
        body: 'Order #{orderId} from {merchantName} has been delivered.',
        deepLink: 'rez://orders/{orderId}'
      },
      'order_status': {
        title: 'Order Update',
        body: 'Your order status has been updated to: {status}',
        deepLink: 'rez://orders/{orderId}'
      },
      'payment_received': {
        title: 'Payment Confirmed ✅',
        body: '₹{amount} received. Transaction ID: {transactionId}',
        deepLink: 'rez://wallet'
      },
      'cashback': {
        title: 'Cashback Earned! 💰',
        body: 'You received ₹{amount} cashback. New balance: ₹{balance}',
        deepLink: 'rez://wallet'
      },
      'referral': {
        title: 'Friend Joined! 🎁',
        body: 'Your friend {friendName} signed up. You\'ll earn ₹{amount} when they order!',
        deepLink: 'rez://referrals'
      },
      'promotion': {
        title: '{merchantName}: {offer}',
        body: '{description}. Use code: {code}. Valid till {validTill}',
        deepLink: 'rez://offers/{offerId}'
      }
    };

    const template = templates[event.type] || {
      title: 'REZ Update',
      body: event.data.message || 'You have a new notification'
    };

    // Replace variables
    let body = template.body || '';
    let title = template.title || '';

    Object.entries(event.data).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      title = title.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    });

    return {
      userId: event.data.userId || '',
      title,
      body,
      deepLink: template.deepLink?.replace(/\{(\w+)\}/g, (_, k) => String(event.data[k] || '')),
      data: event.data
    };
  }

  // ============================================
  // User Preferences
  // ============================================

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const response = await axios.get(
        `${NOTIFICATIONS_HUB_URL}/api/preferences/${userId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserNotificationPreferences>): Promise<void> {
    await axios.patch(
      `${NOTIFICATIONS_HUB_URL}/api/preferences/${userId}`,
      preferences,
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
    );
  }

  // ============================================
  // Templates
  // ============================================

  /**
   * Get notification templates
   */
  async getTemplates(channel?: NotificationChannel): Promise<NotificationTemplate[]> {
    try {
      const url = channel
        ? `${NOTIFICATIONS_HUB_URL}/api/templates?channel=${channel}`
        : `${NOTIFICATIONS_HUB_URL}/api/templates`;

      const response = await axios.get(url, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 2000
      });
      return response.data;
    } catch (e) {
      return [];
    }
  }

  /**
   * Send using template
   */
  async sendWithTemplate(
    userId: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<NotificationResponse> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let body = template.template;
    let subject = template.subject || '';

    Object.entries(variables).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return this.send({
      userId,
      channels: [template.channel],
      priority: 'normal',
      payload: {
        userId,
        title: subject || template.name,
        body
      }
    });
  }

  // ============================================
  // Scheduled Notifications
  // ============================================

  /**
   * Schedule notification
   */
  async schedule(request: NotificationRequest, scheduledAt: string): Promise<string> {
    const response = await axios.post(
      `${NOTIFICATIONS_HUB_URL}/api/schedule`,
      {
        ...request,
        scheduledAt
      },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
    );
    return response.data.scheduleId;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduled(scheduleId: string): Promise<void> {
    await axios.delete(
      `${NOTIFICATIONS_HUB_URL}/api/schedule/${scheduleId}`,
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
    );
  }

  // ============================================
  // Notifications History
  // ============================================

  /**
   * Get user notification history
   */
  async getHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    notifications: NotificationResponse[];
    total: number;
  }> {
    try {
      const response = await axios.get(
        `${NOTIFICATIONS_HUB_URL}/api/notifications/${userId}/history`,
        {
          params: options,
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );
      return response.data;
    } catch (e) {
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await axios.patch(
      `${NOTIFICATIONS_HUB_URL}/api/notifications/${notificationId}/read`,
      {},
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 2000 }
    );
  }

  // ============================================
  // Bulk Notifications
  // ============================================

  /**
   * Send to multiple users
   */
  async sendBulk(
    requests: Omit<NotificationRequest, 'userId'> & { userIds: string[] }
  ): Promise<{
    successful: number;
    failed: number;
    results: NotificationResponse[];
  }> {
    const results = await Promise.all(
      requests.userIds.map(userId =>
        this.send({ ...requests, userId })
      )
    );

    return {
      successful: results.filter(r => r.status !== 'failed').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const unifiedNotificationsService = new UnifiedNotificationsService();
export default unifiedNotificationsService;
