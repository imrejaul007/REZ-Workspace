import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

/**
 * RABTUL Notifications Service Integration
 *
 * Handles SMS and Email delivery via RABTUL Notifications (port 4011):
 * - OTP SMS
 * - Transactional emails
 * - Marketing campaigns
 * - Push notifications
 */

// RABTUL Notifications API
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_URL || 'http://localhost:4011';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

/**
 * Notification types
 */
export enum NotificationType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
}

/**
 * SMS Provider
 */
export enum SMSProvider {
  MSG91 = 'MSG91',
  TWILIO = 'TWILIO',
  BITSMS = 'BITSMS',
  FAST2SMS = 'FAST2SMS',
}

/**
 * Email Provider
 */
export enum EmailProvider {
  SENDGRID = 'SENDGRID',
  RESEND = 'RESEND',
  SES = 'SES',
}

/**
 * Notification payload
 */
export interface SendNotificationPayload {
  type: NotificationType;
  recipient: string; // Phone number or email
  template?: string;
  variables?: Record<string, string>;
  message?: string; // Direct message (overrides template)
  sender?: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Notification delivery result
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  deliveredAt?: Date;
}

/**
 * Notification Delivery Service
 *
 * Centralized notification service that routes through RABTUL:
 * - SMS (via MSG91, Twilio, etc.)
 * - Email (via SendGrid, Resend, AWS SES)
 * - Push notifications
 * - WhatsApp (via Unified Platform)
 */
@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // SMS DELIVERY
  // ==========================================

  /**
   * Send SMS via RABTUL Notifications
   */
  async sendSMS(
    phone: string,
    message: string,
    options: {
      sender?: string;
      template?: string;
      variables?: Record<string, string>;
    } = {}
  ): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `${NOTIFICATIONS_URL}/api/v1/sms/send`,
        {
          phone,
          message,
          template: options.template,
          variables: options.variables,
          sender: options.sender,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.messageId,
          provider: response.data.provider,
          deliveredAt: new Date(),
        };
      }

      return {
        success: false,
        error: response.data.error || 'Failed to send SMS',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`[SMS] RABTUL API error: ${error.message}`);
        return {
          success: false,
          error: `SMS delivery failed: ${error.message}`,
        };
      }
      this.logger.error(`[SMS] Error: ${error}`);
      return {
        success: false,
        error: 'SMS delivery failed',
      };
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTPSMS(phone: string, otp: string, purpose: string): Promise<NotificationResult> {
    return this.sendSMS(phone, `Your ${purpose} verification code is: ${otp}. Valid for 5 minutes. Do not share.`, {
      template: 'OTP_VERIFICATION',
      variables: { otp, purpose },
    });
  }

  // ==========================================
  // EMAIL DELIVERY
  // ==========================================

  /**
   * Send email via RABTUL Notifications
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options: {
      from?: string;
      replyTo?: string;
      template?: string;
      variables?: Record<string, string>;
      attachments?: Array<{ filename: string; content: string }>;
    } = {}
  ): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `${NOTIFICATIONS_URL}/api/v1/email/send`,
        {
          to,
          subject,
          body,
          from: options.from,
          replyTo: options.replyTo,
          template: options.template,
          variables: options.variables,
          attachments: options.attachments,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.messageId,
          provider: response.data.provider,
          deliveredAt: new Date(),
        };
      }

      return {
        success: false,
        error: response.data.error || 'Failed to send email',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`[Email] RABTUL API error: ${error.message}`);
        return {
          success: false,
          error: `Email delivery failed: ${error.message}`,
        };
      }
      this.logger.error(`[Email] Error: ${error}`);
      return {
        success: false,
        error: 'Email delivery failed',
      };
    }
  }

  /**
   * Send transactional email template
   */
  async sendTemplatedEmail(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    options: { subject?: string } = {}
  ): Promise<NotificationResult> {
    return this.sendEmail(to, options.subject || 'Message from REZ', '', {
      template: templateName,
      variables,
    });
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Send push notification
   */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `${NOTIFICATIONS_URL}/api/v1/push/send`,
        {
          userId,
          title,
          body,
          data,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.messageId,
          deliveredAt: new Date(),
        };
      }

      return {
        success: false,
        error: response.data.error || 'Failed to send push',
      };
    } catch (error) {
      this.logger.error(`[Push] Error: ${error}`);
      return {
        success: false,
        error: 'Push notification failed',
      };
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(
    recipients: Array<{ phone: string; message: string }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      recipients.map(r => this.sendSMS(r.phone, r.message))
    );

    let success = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        success++;
      } else {
        errors.push(`${recipients[index].phone}: ${result.status === 'rejected' ? result.reason : (result.value as NotificationResult).error}`);
      }
    });

    return {
      success,
      failed: recipients.length - success,
      errors,
    };
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(
    recipients: Array<{ email: string; subject: string; body: string }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      recipients.map(r => this.sendEmail(r.email, r.subject, r.body))
    );

    let success = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        success++;
      } else {
        errors.push(`${recipients[index].email}: ${result.status === 'rejected' ? result.reason : (result.value as NotificationResult).error}`);
      }
    });

    return {
      success,
      failed: recipients.length - success,
      errors,
    };
  }

  // ==========================================
  // TEMPLATE MANAGEMENT
  // ==========================================

  /**
   * Get notification template
   */
  async getTemplate(templateName: string): Promise<{
    name: string;
    type: NotificationType;
    subject?: string;
    body: string;
    variables: string[];
  } | null> {
    try {
      const response = await axios.get(
        `${NOTIFICATIONS_URL}/api/v1/templates/${templateName}`,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        return response.data.template;
      }

      return null;
    } catch (error) {
      this.logger.error(`[Template] Error getting template: ${error}`);
      return null;
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
      rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return rendered;
  }

  // ==========================================
  // DELIVERY STATUS
  // ==========================================

  /**
   * Get delivery status
   */
  async getDeliveryStatus(messageId: string): Promise<{
    messageId: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
    deliveredAt?: Date;
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${NOTIFICATIONS_URL}/api/v1/status/${messageId}`,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        return {
          messageId,
          status: response.data.status,
          deliveredAt: response.data.deliveredAt ? new Date(response.data.deliveredAt) : undefined,
          error: response.data.error,
        };
      }

      return { messageId, status: 'FAILED', error: 'Status unknown' };
    } catch (error) {
      return { messageId, status: 'FAILED', error: 'Failed to get status' };
    }
  }
}
