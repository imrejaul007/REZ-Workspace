/**
 * Notification Connector - RABTUL Notification Service Client
 *
 * Handles all notification-related operations including:
 * - Push notifications (FCM, APNs)
 * - SMS notifications
 * - WhatsApp messages
 * - Email notifications
 * - Bulk messaging
 * - Notification preferences
 *
 * @example
 * ```typescript
 * import { NotificationConnector } from '@rez/connector-sdk/notification';
 *
 * const notification = new NotificationConnector({
 *   baseUrl: 'http://localhost:4011',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Send a push notification
 * await notification.push('user-123', 'Order Confirmed', 'Your order is on the way!');
 * ```
 */

import { BaseConnector } from '../core';
import {
  ApiError,
  SendResponse,
  BulkSendResponse,
  NotificationHistoryResponse,
  UpdatePreferencesResponse,
  NotificationPreferences,
  PushSchema,
  SMSSchema,
  WhatsAppSchema,
  EmailSchema,
  BulkSMSchema,
  BulkPushSchema,
  NotificationHistorySchema,
  UpdatePreferencesSchema,
} from '../types';

// ============================================================================
// Connector Configuration
// ============================================================================

export interface NotificationConnectorConfig {
  /** Notification service URL (defaults to NOTIFICATION_SERVICE_URL env var or http://localhost:4011) */
  baseUrl?: string;
  /** Internal service token for inter-service communication */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Connector Class
// ============================================================================

export class NotificationConnector extends BaseConnector<NotificationConnectorConfig> {
  private static readonly SERVICE_NAME = 'notification';
  private static readonly DEFAULT_PORT = 4011;
  private static readonly ENV_VAR = 'NOTIFICATION_SERVICE_URL';

  constructor(config: NotificationConnectorConfig = {}) {
    const completeConfig: NotificationConnectorConfig = {
      baseUrl: config.baseUrl || process.env[NotificationConnector.ENV_VAR] || `http://localhost:${NotificationConnector.DEFAULT_PORT}`,
      internalServiceToken: config.internalServiceToken || process.env.INTERNAL_SERVICE_TOKEN,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    super(completeConfig, NotificationConnector.SERVICE_NAME);
  }

  // ============================================================================
  // Push Notifications
  // ============================================================================

  /**
   * Send a push notification to a user
   *
   * @param userId - Target user's unique identifier
   * @param title - Notification title
   * @param body - Notification body/message
   * @param data - Optional additional data payload
   * @returns Message delivery confirmation with message ID
   *
   * @example
   * ```typescript
   * const result = await notification.push(
   *   'user-123',
   *   'Order Confirmed',
   *   'Your order #12345 is confirmed and being prepared.',
   *   { orderId: '12345', type: 'order_confirmation' }
   * );
   * if (result) {
   *   console.log('Message ID:', result.messageId);
   * }
   * ```
   */
  async push(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<SendResponse | null> {
    // Validate input with Zod
    const parsed = PushSchema.safeParse({ userId, title, body, data });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/push/send', {
        userId,
        title,
        body,
        data,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Send push notification with full options
   *
   * @param params - Notification parameters
   * @returns Message delivery confirmation
   */
  async pushWithOptions(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    priority?: 'high' | 'normal' | 'low';
    imageUrl?: string;
    clickAction?: string;
    badge?: number;
    sound?: string;
    expiry?: number;
  }): Promise<SendResponse | null> {
    return this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/push/send', params);
    });
  }

  // ============================================================================
  // SMS Notifications
  // ============================================================================

  /**
   * Send an SMS to a phone number
   *
   * @param phone - Target phone number in E.164 format (e.g., +919876543210)
   * @param message - SMS content (max 1600 characters)
   * @returns Message delivery confirmation with message ID
   *
   * @example
   * ```typescript
   * const result = await notification.sms(
   *   '+919876543210',
   *   'Your OTP is 123456. Valid for 10 minutes.'
   * );
   * if (result) {
   *   console.log('SMS sent:', result.messageId);
   * }
   * ```
   */
  async sms(phone: string, message: string): Promise<SendResponse | null> {
    // Validate input with Zod
    const parsed = SMSSchema.safeParse({ phone, message });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/sms/send', {
        phone,
        message,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Send SMS with sender ID
   *
   * @param phone - Target phone number
   * @param message - SMS content
   * @param senderId - Custom sender ID (6 characters)
   * @returns Message delivery confirmation
   */
  async smsWithSender(
    phone: string,
    message: string,
    senderId: string
  ): Promise<SendResponse | null> {
    return this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/sms/send', {
        phone,
        message,
        senderId,
      });
    });
  }

  // ============================================================================
  // WhatsApp Notifications
  // ============================================================================

  /**
   * Send a WhatsApp message using a template
   *
   * @param phone - Target phone number in E.164 format
   * @param template - Template name identifier (e.g., 'order_confirmation')
   * @param variables - Template variable values (e.g., { name: 'John', orderId: '12345' })
   * @param language - Language code for template (default: en)
   * @returns Message delivery confirmation with message ID
   *
   * @example
   * ```typescript
   * const result = await notification.whatsapp(
   *   '+919876543210',
   *   'order_confirmation',
   *   { customerName: 'John', orderId: '12345', estimatedDelivery: '30 mins' }
   * );
   * ```
   */
  async whatsapp(
    phone: string,
    template: string,
    variables?: Record<string, string>
  ): Promise<SendResponse | null> {
    // Validate input with Zod
    const parsed = WhatsAppSchema.safeParse({ phone, template, variables });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/whatsapp/send', {
        phone,
        template,
        variables,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Send WhatsApp with language preference
   *
   * @param phone - Target phone number
   * @param template - Template name
   * @param variables - Template variables
   * @param language - Language code
   * @returns Message delivery confirmation
   */
  async whatsappWithLanguage(
    phone: string,
    template: string,
    variables: Record<string, string>,
    language: string
  ): Promise<SendResponse | null> {
    return this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/whatsapp/send', {
        phone,
        template,
        variables,
        language,
      });
    });
  }

  // ============================================================================
  // Email Notifications
  // ============================================================================

  /**
   * Send an email using a template
   *
   * @param to - Recipient email address
   * @param subject - Email subject line
   * @param template - Template identifier or HTML content
   * @param variables - Template variable values
   * @returns Message delivery confirmation with message ID
   *
   * @example
   * ```typescript
   * const result = await notification.email(
   *   'user@example.com',
   *   'Welcome to ReZ!',
   *   'welcome_email',
   *   { name: 'John', verifyLink: 'https://app.rez.com/verify/abc123' }
   * );
   * ```
   */
  async email(
    to: string,
    subject: string,
    template: string,
    variables?: Record<string, string>
  ): Promise<SendResponse | null> {
    // Validate input with Zod
    const parsed = EmailSchema.safeParse({ to, subject, template, variables });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/email/send', {
        to,
        subject,
        template,
        variables,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Send email with full options
   *
   * @param params - Email parameters including CC, BCC, attachments
   * @returns Message delivery confirmation
   */
  async emailWithOptions(params: {
    to: string;
    subject: string;
    template: string;
    variables?: Record<string, string>;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{ filename: string; url: string }>;
    fromName?: string;
    replyTo?: string;
  }): Promise<SendResponse | null> {
    return this.safeCall<SendResponse>(async () => {
      return this.http.post<SendResponse>('/email/send', params);
    });
  }

  // ============================================================================
  // Bulk Notifications
  // ============================================================================

  /**
   * Send SMS to multiple recipients
   *
   * @param messages - Array of { phone, message } objects
   * @returns Bulk send results with sent/failed counts
   *
   * @example
   * ```typescript
   * const result = await notification.sendBulkSMS([
   *   { phone: '+919876543210', message: 'Your OTP is 123456' },
   *   { phone: '+919876543211', message: 'Your OTP is 654321' },
   * ]);
   * console.log('Sent:', result.sent, 'Failed:', result.failed);
   * ```
   */
  async sendBulkSMS(messages: Array<{ phone: string; message: string }>): Promise<BulkSendResponse | null> {
    // Validate input with Zod
    const parsed = BulkSMSchema.safeParse({ messages });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<BulkSendResponse>(async () => {
      return this.http.post<BulkSendResponse>('/sms/bulk', { messages });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Send push notifications to multiple users
   *
   * @param notifications - Array of notification objects
   * @returns Bulk send results with sent/failed counts
   *
   * @example
   * ```typescript
   * const result = await notification.sendBulkPush([
   *   { userId: 'user-1', title: 'Offer!', body: 'Get 20% off today', data: { promoId: 'P001' } },
   *   { userId: 'user-2', title: 'Offer!', body: 'Get 20% off today', data: { promoId: 'P001' } },
   * ]);
   * console.log('Sent:', result.sent, 'Failed:', result.failed);
   * ```
   */
  async sendBulkPush(
    notifications: Array<{
      userId: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }>
  ): Promise<BulkSendResponse | null> {
    // Validate input with Zod
    const parsed = BulkPushSchema.safeParse({ notifications });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<BulkSendResponse>(async () => {
      return this.http.post<BulkSendResponse>('/push/bulk', { notifications });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Send bulk WhatsApp messages
   *
   * @param messages - Array of message objects
   * @returns Bulk send results
   */
  async sendBulkWhatsApp(messages: Array<{
    phone: string;
    template: string;
    variables?: Record<string, string>;
  }>): Promise<BulkSendResponse | null> {
    return this.safeCall<BulkSendResponse>(async () => {
      return this.http.post<BulkSendResponse>('/whatsapp/bulk', { messages });
    });
  }

  /**
   * Send bulk emails
   *
   * @param emails - Array of email objects
   * @returns Bulk send results
   */
  async sendBulkEmail(emails: Array<{
    to: string;
    subject: string;
    template: string;
    variables?: Record<string, string>;
  }>): Promise<BulkSendResponse | null> {
    return this.safeCall<BulkSendResponse>(async () => {
      return this.http.post<BulkSendResponse>('/email/bulk', { emails });
    });
  }

  // ============================================================================
  // History & Tracking
  // ============================================================================

  /**
   * Get notification history for a user
   *
   * @param userId - User's unique identifier
   * @param type - Optional filter by notification type
   * @returns List of notifications with pagination
   *
   * @example
   * ```typescript
   * const history = await notification.getHistory('user-123');
   * for (const notif of history.notifications) {
   *   console.log(`${notif.type}: ${notif.title} - ${notif.status}`);
   * }
   * ```
   */
  async getHistory(
    userId: string,
    type?: 'push' | 'sms' | 'whatsapp' | 'email'
  ): Promise<NotificationHistoryResponse | null> {
    // Validate input with Zod
    const parsed = NotificationHistorySchema.safeParse({ userId, type });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<NotificationHistoryResponse>(async () => {
      const params = new URLSearchParams({ userId });
      if (type) params.set('type', type);
      return this.http.get<NotificationHistoryResponse>(`/history?${params.toString()}`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get a specific notification by ID
   *
   * @param notificationId - Notification's unique identifier
   * @returns Notification details
   */
  async getNotification(notificationId: string): Promise<{
    id: string;
    type: string;
    title?: string;
    body?: string;
    status: string;
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
    metadata?: Record<string, unknown>;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        id: string;
        type: string;
        title?: string;
        body?: string;
        status: string;
        sentAt: string;
        deliveredAt?: string;
        readAt?: string;
        metadata?: Record<string, unknown>;
      }>(`/notifications/${notificationId}`);
    });
  }

  // ============================================================================
  // Preferences Management
  // ============================================================================

  /**
   * Update user's notification preferences
   *
   * @param userId - User's unique identifier
   * @param preferences - Preferences to update
   * @returns Updated preferences
   *
   * @example
   * ```typescript
   * const result = await notification.updatePreferences('user-123', {
   *   push: true,
   *   sms: false,
   *   email: true,
   *   whatsapp: false,
   * });
   * ```
   */
  async updatePreferences(
    userId: string,
    preferences: {
      push?: boolean;
      sms?: boolean;
      email?: boolean;
      whatsapp?: boolean;
      quietHours?: {
        start: string;
        end: string;
        timezone?: string;
      };
    }
  ): Promise<UpdatePreferencesResponse | null> {
    // Validate input with Zod
    const parsed = UpdatePreferencesSchema.safeParse({ userId, preferences });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<UpdatePreferencesResponse>(async () => {
      return this.http.patch<UpdatePreferencesResponse>(`/users/${userId}/preferences`, {
        preferences,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get user's notification preferences
   *
   * @param userId - User's unique identifier
   * @returns User's notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const result = await this.safeCall<NotificationPreferences>(async () => {
      return this.http.get<NotificationPreferences>(`/users/${userId}/preferences`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Subscribe user to a notification topic
   *
   * @param userId - User's unique identifier
   * @param topic - Topic to subscribe to
   * @returns Success status
   */
  async subscribeToTopic(userId: string, topic: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<void>(`/users/${userId}/topics/${topic}/subscribe`);
    });
  }

  /**
   * Unsubscribe user from a notification topic
   *
   * @param userId - User's unique identifier
   * @param topic - Topic to unsubscribe from
   * @returns Success status
   */
  async unsubscribeFromTopic(userId: string, topic: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<void>(`/users/${userId}/topics/${topic}/unsubscribe`);
    });
  }

  // ============================================================================
  // Device Management
  // ============================================================================

  /**
   * Register a device for push notifications
   *
   * @param userId - User's unique identifier
   * @param deviceToken - Device push token (FCM/APNs)
   * @param platform - Device platform (ios, android, web)
   * @returns Success status
   */
  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web'
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ deviceId: string }>(`/users/${userId}/devices`, {
        token: deviceToken,
        platform,
      });
    });
  }

  /**
   * Unregister a device
   *
   * @param userId - User's unique identifier
   * @param deviceToken - Device push token to unregister
   * @returns Success status
   */
  async unregisterDevice(userId: string, deviceToken: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.delete<void>(`/users/${userId}/devices/${encodeURIComponent(deviceToken)}`);
    });
  }

  // ============================================================================
  // Templates
  // ============================================================================

  /**
   * Create a notification template
   *
   * @param template - Template details
   * @returns Created template
   */
  async createTemplate(template: {
    name: string;
    type: 'push' | 'sms' | 'whatsapp' | 'email';
    subject?: string;
    body: string;
    variables?: Array<{ name: string; type: string; required: boolean }>;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; template?: { id: string; name: string }; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ id: string; name: string }>('/templates', template);
    });
  }

  /**
   * Get all notification templates
   *
   * @param type - Optional filter by type
   * @returns List of templates
   */
  async getTemplates(type?: 'push' | 'sms' | 'whatsapp' | 'email'): Promise<{
    id: string;
    name: string;
    type: string;
    body: string;
  }[] | null> {
    return this.safeCall(async () => {
      const params = type ? `?type=${type}` : '';
      return this.http.get<{ id: string; name: string; type: string; body: string }[]>(`/templates${params}`);
    });
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Check if the notification service is healthy
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.http.get<{ status: string }>('/health');
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let notificationInstance: NotificationConnector | null = null;

/**
 * Get or create a singleton NotificationConnector instance
 *
 * @param config - Optional configuration override
 * @returns NotificationConnector instance
 */
export function createNotificationConnector(config?: NotificationConnectorConfig): NotificationConnector {
  if (!notificationInstance) {
    notificationInstance = new NotificationConnector(config);
  } else if (config) {
    notificationInstance = new NotificationConnector(config);
  }
  return notificationInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetNotificationConnector(): void {
  notificationInstance = null;
}