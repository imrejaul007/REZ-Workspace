import config from '../config';
import logger from '../utils/logger';

// Types for RABTUL integration
export interface RABTULNotification {
  type: 'appointment_reminder' | 'service_reminder' | 'payment_reminder' | 'custom';
  title: string;
  message: string;
  recipientId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  data?: Record<string, unknown>;
  scheduledAt?: Date;
  priority?: 'low' | 'medium' | 'high';
}

export interface RABTULIntent {
  type: 'vehicle_inquiry' | 'service_booking' | 'part_search' | 'test_drive' | 'custom';
  customerId: string;
  customerPhone?: string;
  customerName?: string;
  merchantId: string;
  vehicleId?: string;
  data?: Record<string, unknown>;
  source: 'web' | 'mobile' | 'phone' | 'walk-in' | 'other';
  timestamp?: Date;
}

export interface RABTULResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

class RABTULIntegration {
  private baseUrl: string;
  private apiKey: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = config.rabtul.baseUrl;
    this.apiKey = config.rabtul.apiKey;
    this.isConfigured = !!(this.apiKey && this.baseUrl);

    if (!this.isConfigured) {
      logger.warn('RABTUL integration not configured. Set RABTUL_API_KEY and RABTUL_BASE_URL');
    } else {
      logger.info('RABTUL integration initialized', { baseUrl: this.baseUrl });
    }
  }

  /**
   * Send a notification via RABTUL
   */
  async sendNotification(notification: RABTULNotification): Promise<RABTULResponse> {
    if (!this.isConfigured) {
      logger.debug('RABTUL notification skipped (not configured)', { type: notification.type });
      return { success: false, error: 'RABTUL not configured' };
    }

    try {
      const payload = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipient: {
          id: notification.recipientId,
          phone: notification.recipientPhone,
          email: notification.recipientEmail,
        },
        data: notification.data,
        scheduledAt: notification.scheduledAt?.toISOString(),
        priority: notification.priority || 'medium',
      };

      logger.info('Sending RABTUL notification', {
        type: notification.type,
        recipientId: notification.recipientId,
      });

      // In production, this would make an actual HTTP request
      // For now, simulate successful response
      const response = await this.makeRequest('/notifications', 'POST', payload);

      logger.info('RABTUL notification sent successfully', {
        id: response.id,
        type: notification.type,
      });

      return {
        success: true,
        id: response.id,
        message: 'Notification sent',
      };
    } catch (error) {
      logger.error('Failed to send RABTUL notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: notification.type,
        recipientId: notification.recipientId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Track customer intent/interaction
   */
  async trackIntent(intent: RABTULIntent): Promise<RABTULResponse> {
    if (!this.isConfigured) {
      logger.debug('RABTUL intent tracking skipped (not configured)', { type: intent.type });
      return { success: false, error: 'RABTUL not configured' };
    }

    try {
      const payload = {
        type: intent.type,
        customer: {
          id: intent.customerId,
          phone: intent.customerPhone,
          name: intent.customerName,
        },
        merchantId: intent.merchantId,
        vehicleId: intent.vehicleId,
        data: intent.data,
        source: intent.source,
        timestamp: (intent.timestamp || new Date()).toISOString(),
      };

      logger.info('Tracking RABTUL intent', {
        type: intent.type,
        customerId: intent.customerId,
        merchantId: intent.merchantId,
      });

      const response = await this.makeRequest('/intents', 'POST', payload);

      logger.info('RABTUL intent tracked successfully', {
        id: response.id,
        type: intent.type,
      });

      return {
        success: true,
        id: response.id,
        message: 'Intent tracked',
      };
    } catch (error) {
      logger.error('Failed to track RABTUL intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: intent.type,
        customerId: intent.customerId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track intent',
      };
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    appointmentId: string,
    customerId: string,
    customerPhone: string,
    appointmentDate: Date,
    appointmentTime: string,
    serviceType: string
  ): Promise<RABTULResponse> {
    const reminderDate = new Date(appointmentDate);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM reminder

    return this.sendNotification({
      type: 'appointment_reminder',
      title: 'Service Appointment Reminder',
      message: `Your ${serviceType} service is scheduled for ${appointmentDate.toLocaleDateString()} at ${appointmentTime}. Please be on time.`,
      recipientId: customerId,
      recipientPhone: customerPhone,
      data: {
        appointmentId,
        date: appointmentDate.toISOString(),
        time: appointmentTime,
        serviceType,
      },
      scheduledAt: reminderDate,
      priority: 'medium',
    });
  }

  /**
   * Track vehicle inquiry intent
   */
  async trackVehicleInquiry(
    customerId: string,
    customerPhone: string,
    customerName: string,
    merchantId: string,
    vehicleId: string,
    source: 'web' | 'mobile' | 'phone' | 'walk-in' = 'web'
  ): Promise<RABTULResponse> {
    return this.trackIntent({
      type: 'vehicle_inquiry',
      customerId,
      customerPhone,
      customerName,
      merchantId,
      vehicleId,
      source,
    });
  }

  /**
   * Track test drive booking
   */
  async trackTestDriveBooking(
    customerId: string,
    customerPhone: string,
    customerName: string,
    merchantId: string,
    vehicleId: string
  ): Promise<RABTULResponse> {
    return this.trackIntent({
      type: 'test_drive',
      customerId,
      customerPhone,
      customerName,
      merchantId,
      vehicleId,
      source: 'web',
    });
  }

  /**
   * Track service booking
   */
  async trackServiceBooking(
    customerId: string,
    customerPhone: string,
    customerName: string,
    merchantId: string,
    appointmentId: string,
    serviceType: string
  ): Promise<RABTULResponse> {
    return this.trackIntent({
      type: 'service_booking',
      customerId,
      customerPhone,
      customerName,
      merchantId,
      data: { appointmentId, serviceType },
      source: 'web',
    });
  }

  /**
   * Make HTTP request to RABTUL API
   */
  private async makeRequest(
    endpoint: string,
    method: string,
    payload: Record<string, unknown>
  ): Promise<{ id: string }> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Service-Name': 'rez-automotive-service',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`RABTUL API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check for RABTUL connection
   */
  async healthCheck(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    if (!this.isConfigured) {
      return { connected: false, error: 'Not configured' };
    }

    const startTime = Date.now();

    try {
      await this.makeRequest('/health', 'GET', {});
      return {
        connected: true,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        connected: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }
}

// Export singleton instance
export const rabtul = new RABTULIntegration();
export default rabtul;