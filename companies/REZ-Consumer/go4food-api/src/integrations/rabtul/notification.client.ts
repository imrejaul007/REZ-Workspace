/**
 * RABTUL Notification Service Client
 * Port: 4011
 *
 * Handles SMS, Email, and Push notifications.
 */

import axios, { AxiosInstance } from 'axios';

export interface SMSPayload {
  phone: string;
  message: string;
  senderId?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, unknown>;
  html?: string;
}

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  push: boolean;
}

export class RabtulNotificationClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.RABTUL_NOTIFY_URL || 'http://localhost:4011',
    private readonly apiKey: string = process.env.RABTUL_NOTIFY_API_KEY || '',
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[RabtulNotification] API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Send SMS
   */
  async sendSMS(phone: string, message: string, senderId?: string): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    const response = await this.client.post('/sms/send', {
      phone,
      message,
      senderId,
    });
    return response.data;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTPSMS(phone: string, otp: string): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    const response = await this.client.post('/sms/send', {
      phone,
      message: `Your OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      template: 'otp',
    });
    return response.data;
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(messages: SMSPayload[]): Promise<{
    success: boolean;
    sent: number;
    failed: number;
  }> {
    const response = await this.client.post('/sms/bulk', { messages });
    return response.data;
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    options: {
      template?: string;
      data?: Record<string, unknown>;
      html?: string;
    } = {}
  ): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    const response = await this.client.post('/email/send', {
      to,
      subject,
      ...options,
    });
    return response.data;
  }

  /**
   * Send templated email
   */
  async sendTemplatedEmail(
    to: string,
    template: string,
    data: Record<string, unknown>
  ): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    const response = await this.client.post('/email/send', {
      to,
      template,
      data,
    });
    return response.data;
  }

  /**
   * Send push notification
   */
  async sendPush(payload: PushPayload): Promise<{
    success: boolean;
    notificationId?: string;
  }> {
    const response = await this.client.post('/push/send', payload);
    return response.data;
  }

  /**
   * Send push to multiple users
   */
  async sendBulkPush(pushes: PushPayload[]): Promise<{
    success: boolean;
    sent: number;
    failed: number;
  }> {
    const response = await this.client.post('/push/bulk', { pushes });
    return response.data;
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const response = await this.client.get(`/users/${userId}/preferences`);
    return response.data;
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await this.client.patch(`/users/${userId}/preferences`, preferences);
    return response.data;
  }

  /**
   * Get notification history
   */
  async getHistory(
    userId: string,
    params?: { page?: number; limit?: number; type?: 'sms' | 'email' | 'push' }
  ): Promise<{
    notifications: Array<{
      id: string;
      type: 'sms' | 'email' | 'push';
      title?: string;
      body?: string;
      read: boolean;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const response = await this.client.get(`/users/${userId}/history`, { params });
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/notifications/read-all`);
  }
}

// Singleton instance
let notificationClientInstance: RabtulNotificationClient | null = null;

export function getRabtulNotificationClient(): RabtulNotificationClient {
  if (!notificationClientInstance) {
    notificationClientInstance = new RabtulNotificationClient();
  }
  return notificationClientInstance;
}
