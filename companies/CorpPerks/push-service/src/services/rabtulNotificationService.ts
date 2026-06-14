import axios, { AxiosInstance } from 'axios';

// ==================== TYPES ====================

export interface RABTULNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  deepLink?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('push' | 'in_app' | 'email' | 'sms')[];
  scheduledAt?: string;
  expiresAt?: string;
  badge?: number;
  sound?: string;
  mutableContent?: boolean;
  category?: string;
  threadId?: string;
}

export interface RABTULNotificationResponse {
  success: boolean;
  notificationId?: string;
  messageId?: string;
  error?: string;
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  isActive: boolean;
}

// ==================== RABTUL NOTIFICATION SERVICE CLIENT ====================

const RABTUL_NOTIFICATION_URL = process.env.RABTUL_NOTIFICATION_URL || 'http://localhost:4011';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpperks-push-service-token';

/**
 * RABTUL Notification Service Integration
 * Connects to RABTUL Notifications Service (4011) for actual push delivery
 */
export class RABTULNotificationService {
  private client: AxiosInstance;
  private static instance: RABTULNotificationService;

  private constructor() {
    this.client = axios.create({
      baseURL: RABTUL_NOTIFICATION_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        'X-Service-Name': 'corpperks-push-service',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('RABTUL Notification Service Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): RABTULNotificationService {
    if (!RABTULNotificationService.instance) {
      RABTULNotificationService.instance = new RABTULNotificationService();
    }
    return RABTULNotificationService.instance;
  }

  /**
   * Send push notification through RABTUL
   */
  async sendPushNotification(payload: RABTULNotificationPayload): Promise<RABTULNotificationResponse> {
    try {
      const response = await this.client.post<RABTULNotificationResponse>(
        '/api/notifications/send',
        payload
      );
      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: RABTULNotificationResponse }; message?: string };
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      return {
        success: false,
        error: axiosError.message || 'Failed to send notification',
      };
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatchNotifications(
    notifications: RABTULNotificationPayload[]
  ): Promise<{ success: boolean; results: RABTULNotificationResponse[]; failed: number }> {
    const results: RABTULNotificationResponse[] = [];
    let failed = 0;

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      try {
        const response = await this.client.post<{ success: boolean; results: RABTULNotificationResponse[] }>(
          '/api/notifications/batch',
          { notifications: batch }
        );
        results.push(...response.data.results);
        failed += response.data.results.filter((r) => !r.success).length;
      } catch {
        // Mark entire batch as failed
        batch.forEach(() => {
          results.push({ success: false, error: 'Batch send failed' });
          failed++;
        });
      }
    }

    return {
      success: failed === 0,
      results,
      failed,
    };
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    token: DeviceToken
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.post('/api/devices/register', {
        userId,
        ...token,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } }; message?: string };
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message,
      };
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(
    userId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.post('/api/devices/unregister', {
        userId,
        token,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } }; message?: string };
      return {
        success: false,
        error: axiosError.response?.data?.error || axiosError.message,
      };
    }
  }

  /**
   * Get user's device tokens
   */
  async getUserDevices(userId: string): Promise<DeviceToken[]> {
    try {
      const response = await this.client.get<{ success: boolean; devices: DeviceToken[] }>(
        `/api/devices/user/${userId}`
      );
      return response.data.devices || [];
    } catch {
      return [];
    }
  }

  /**
   * Check if RABTUL service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Send notification via specific channel
   */
  async sendViaChannel(
    userId: string,
    channel: 'push' | 'email' | 'sms',
    payload: RABTULNotificationPayload
  ): Promise<RABTULNotificationResponse> {
    try {
      const { userId: _, ...restPayload } = payload;
      const response = await this.client.post<RABTULNotificationResponse>(
        `/api/notifications/send/${channel}`,
        { userId, ...restPayload }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: RABTULNotificationResponse }; message?: string };
      return axiosError.response?.data || {
        success: false,
        error: axiosError.message || 'Failed to send notification',
      };
    }
  }
}

// Export singleton instance
export const rabtulNotificationService = RABTULNotificationService.getInstance();
