import twilio, { Twilio, TwilioResponse } from 'twilio';
import {
  SMSTemplate,
  DeliveryRecord,
  UnsubscribeRecord,
  isContactUnsubscribed,
} from '../models/Automation';
import { parseTemplate, normalizePhone, formatPhoneForTwilio, maskSensitiveData } from '../utils/helpers';
import logger from '../utils/logger';
import { SMSDeliveryResult, SMSConfig, SMSSendOptions } from '../types/smsTypes';
import { randomUUID } from 'crypto';

interface TwilioClient {
  messages: {
    create: (options: {
      body: string;
      to: string;
      from: string;
      statusCallback?: string;
    }) => Promise<{
      sid: string;
      status: string;
      to: string;
      from: string;
      dateCreated: Date;
      dateSent: Date;
      price?: string;
      errorMessage?: string;
    }>;
  };
}

class SMSService {
  private client: TwilioClient | null = null;
  private config: SMSConfig | null = null;
  private isInitialized: boolean = false;
  private fromNumber: string = '';

  /**
   * Initialize the SMS service with Twilio configuration
   */
  async initialize(config: SMSConfig): Promise<void> {
    try {
      this.config = config;

      // Create Twilio client
      if (config.accountSid && config.authToken) {
        this.client = twilio(config.accountSid, config.authToken) as unknown as TwilioClient;
      } else {
        // Mock client for testing without Twilio credentials
        this.client = this.createMockClient();
      }

      this.fromNumber = config.phoneNumber;
      this.isInitialized = true;

      logger.info('SMS service initialized successfully', {
        from: this.maskPhoneNumber(this.fromNumber),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize SMS service', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Create a mock client for testing
   */
  private createMockClient(): TwilioClient {
    return {
      messages: {
        create: async (options: {
          body: string;
          to: string;
          from: string;
          statusCallback?: string;
        }) => {
          logger.info('Mock SMS sent', {
            to: this.maskPhoneNumber(options.to),
            from: this.maskPhoneNumber(options.from),
            bodyLength: options.body.length,
          });

          return {
            sid: `mock_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`,
            status: 'queued',
            to: options.to,
            from: options.from,
            dateCreated: new Date(),
            dateSent: new Date(),
            price: '0.00',
          };
        },
      },
    };
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Send an SMS message
   */
  async sendSMS(options: SMSSendOptions): Promise<SMSDeliveryResult> {
    if (!this.isReady() || !this.client) {
      throw new Error('SMS service is not initialized');
    }

    const {
      to,
      content,
      from,
      campaignId,
      contact,
      templateId,
      variables,
      statusCallback,
    } = options;

    const normalizedTo = formatPhoneForTwilio(normalizePhone(to));
    const sender = from || this.fromNumber;

    // Check if contact is unsubscribed
    if (contact) {
      const isUnsubscribed = await isContactUnsubscribed({ phone: normalizedTo }, 'sms');
      if (isUnsubscribed) {
        logger.info('Skipping SMS - contact is unsubscribed', {
          to: this.maskPhoneNumber(normalizedTo),
        });
        return {
          success: false,
          messageSid: '',
          error: 'Contact is unsubscribed from SMS',
        };
      }
    }

    // Parse template variables
    let parsedContent = parseTemplate(content, variables || {});

    // Add opt-out instruction if not present
    const optOutText = 'Reply STOP to unsubscribe';
    if (!parsedContent.toLowerCase().includes('stop') && !parsedContent.toLowerCase().includes('opt-out')) {
      parsedContent = `${parsedContent}\n\n${optOutText}`;
    }

    // Check message length
    const segmentCount = Math.ceil(parsedContent.length / 160);
    if (segmentCount > 10) {
      logger.warn('SMS message exceeds recommended length', {
        length: parsedContent.length,
        segments: segmentCount,
      });
    }

    try {
      const message = await this.client.messages.create({
        body: parsedContent,
        to: normalizedTo,
        from: sender,
        statusCallback: statusCallback || `${process.env.APP_URL || 'https://rezapp.com'}/api/sms/status`,
      });

      // Log delivery record
      if (campaignId && contact) {
        await DeliveryRecord.create({
          campaignId,
          contact: { phone: normalizedTo, ...contact },
          channel: 'sms',
          templateId,
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            messageSid: message.sid,
            status: message.status,
            segmentCount,
          },
        });
      }

      logger.info('SMS sent successfully', {
        to: this.maskPhoneNumber(normalizedTo),
        messageSid: message.sid,
        status: message.status,
        campaignId,
      });

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        segmentCount,
        response: message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      if (campaignId && contact) {
        await DeliveryRecord.create({
          campaignId,
          contact: { phone: normalizedTo, ...contact },
          channel: 'sms',
          templateId,
          status: 'failed',
          failedAt: new Date(),
          errorMessage,
          metadata: {
            originalContent: content,
          },
        });
      }

      logger.error('Failed to send SMS', {
        to: this.maskPhoneNumber(normalizedTo),
        error: errorMessage,
        campaignId,
      });

      return {
        success: false,
        messageSid: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Send SMS using a template
   */
  async sendWithTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string | number | boolean | null | undefined>,
    options?: {
      campaignId?: string;
      contact?: { firstName?: string; lastName?: string; userId?: string; metadata?: Record<string, unknown> };
      scheduledFor?: Date;
    }
  ): Promise<SMSDeliveryResult> {
    // Fetch template
    const template = await SMSTemplate.findById(templateId);
    if (!template) {
      return {
        success: false,
        messageSid: '',
        error: 'Template not found',
      };
    }

    if (!template.isActive) {
      return {
        success: false,
        messageSid: '',
        error: 'Template is not active',
      };
    }

    return this.sendSMS({
      to,
      content: template.content,
      campaignId: options?.campaignId,
      contact: options?.contact,
      templateId,
      variables,
    });
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulk(
    recipients: Array<{
      to: string;
      variables?: Record<string, string | number | boolean | null | undefined>;
    }>,
    templateId: string,
    options?: {
      campaignId?: string;
      rateLimit?: number; // SMS per second
    }
  ): Promise<{
    successful: number;
    failed: number;
    results: SMSDeliveryResult[];
  }> {
    const template = await SMSTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const results: SMSDeliveryResult[] = [];
    let successful = 0;
    let failed = 0;

    const rateLimit = options?.rateLimit || 5; // Default 5 SMS per second
    const delay = 1000 / rateLimit;

    for (const recipient of recipients) {
      const result = await this.sendWithTemplate(recipient.to, templateId, recipient.variables || {}, {
        campaignId: options?.campaignId,
      });

      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Rate limiting delay
      if (delay > 0 && results.length < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    logger.info('Bulk SMS send completed', {
      campaignId: options?.campaignId,
      total: recipients.length,
      successful,
      failed,
    });

    return { successful, failed, results };
  }

  /**
   * Handle unsubscribe request (STOP keyword)
   */
  async handleUnsubscribe(
    phone: string,
    keyword: string = 'STOP'
  ): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = formatPhoneForTwilio(normalizePhone(phone));

    // Check if already unsubscribed
    const existing = await UnsubscribeRecord.findOne({
      'contact.phone': normalizedPhone,
      channel: 'sms',
    });

    if (existing) {
      return {
        success: true,
        message: 'Already unsubscribed from SMS',
      };
    }

    // Create unsubscribe record
    await UnsubscribeRecord.create({
      contact: { phone: normalizedPhone },
      channel: 'sms',
      reason: `User replied ${keyword}`,
      source: 'reply',
      unsubscribedAt: new Date(),
    });

    logger.info('Contact unsubscribed from SMS', {
      phone: this.maskPhoneNumber(normalizedPhone),
      keyword,
    });

    // Optionally send confirmation
    await this.sendConfirmation(phone, 'You have been successfully unsubscribed from SMS messages.');

    return {
      success: true,
      message: 'Successfully unsubscribed from SMS',
    };
  }

  /**
   * Handle opt-in request (START/UNSTOP)
   */
  async handleOptIn(
    phone: string
  ): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = formatPhoneForTwilio(normalizePhone(phone));

    // Remove from unsubscribe list if present
    const result = await UnsubscribeRecord.findOneAndDelete({
      'contact.phone': normalizedPhone,
      channel: 'sms',
    });

    if (!result) {
      return {
        success: true,
        message: 'Already subscribed to SMS messages',
      };
    }

    logger.info('Contact re-subscribed to SMS', {
      phone: this.maskPhoneNumber(normalizedPhone),
    });

    // Send welcome message
    await this.sendConfirmation(
      phone,
      'Thank you! You are now subscribed to receive SMS updates from us.'
    );

    return {
      success: true,
      message: 'Successfully re-subscribed to SMS',
    };
  }

  /**
   * Send a confirmation message
   */
  private async sendConfirmation(to: string, message: string): Promise<void> {
    if (!this.isReady()) return;

    try {
      await this.sendSMS({
        to,
        content: message,
      });
    } catch (error) {
      logger.error('Failed to send confirmation SMS', {
        to: this.maskPhoneNumber(to),
        error,
      });
    }
  }

  /**
   * Handle Twilio status callback
   */
  async handleStatusCallback(
    messageSid: string,
    status: string,
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const statusMapping: Record<string, string> = {
        queued: 'queued',
        sent: 'sent',
        delivered: 'delivered',
        undelivered: 'failed',
        failed: 'failed',
      };

      const mappedStatus = statusMapping[status.toLowerCase()] || 'sent';

      await DeliveryRecord.updateOne(
        { 'metadata.messageSid': messageSid },
        {
          status: mappedStatus,
          ...(mappedStatus === 'delivered' && { deliveredAt: new Date() }),
          ...(mappedStatus === 'failed' && {
            failedAt: new Date(),
            errorMessage: errorMessage || `Error code: ${errorCode}`,
          }),
        }
      );

      logger.info('SMS status callback processed', {
        messageSid,
        status,
        errorCode,
      });
    } catch (error) {
      logger.error('Failed to process SMS status callback', {
        messageSid,
        error,
      });
    }
  }

  /**
   * Handle incoming SMS (webhook)
   */
  async handleIncomingSMS(
    from: string,
    to: string,
    body: string,
    messageSid: string
  ): Promise<{ action: string; message?: string }> {
    const normalizedBody = body.trim().toUpperCase();

    // Handle STOP/UNSUBSCRIBE
    if (['STOP', 'UNSUBSCRIBE', 'STOPALL', 'CANCEL', 'END', 'QUIT'].includes(normalizedBody)) {
      await this.handleUnsubscribe(from, body);
      return { action: 'unsubscribed' };
    }

    // Handle START/UNSTOP
    if (['START', 'UNSTOP', 'YES', 'ON', 'SUBSCRIBE'].includes(normalizedBody)) {
      await this.handleOptIn(from);
      return { action: 'subscribed' };
    }

    // Handle HELP
    if (['HELP', 'INFO'].includes(normalizedBody)) {
      return {
        action: 'help',
        message: 'For support, please contact us at support@rezapp.com',
      };
    }

    // Log for other messages
    logger.info('Received SMS response', {
      from: this.maskPhoneNumber(from),
      body: body.substring(0, 50),
      messageSid,
    });

    return { action: 'no_action' };
  }

  /**
   * Get SMS service status
   */
  getStatus(): {
    initialized: boolean;
    from?: string;
  } {
    return {
      initialized: this.isInitialized,
      from: this.maskPhoneNumber(this.fromNumber),
    };
  }

  /**
   * Get phone number validation info
   */
  validatePhoneNumber(phone: string): {
    isValid: boolean;
    formatted?: string;
    error?: string;
  } {
    try {
      const normalized = formatPhoneForTwilio(normalizePhone(phone));

      // Basic validation
      if (normalized.length < 10 || normalized.length > 15) {
        return {
          isValid: false,
          error: 'Phone number must be between 10 and 15 digits',
        };
      }

      return {
        isValid: true,
        formatted: normalized,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
      };
    }
  }

  /**
   * Mask phone number for logging
   */
  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    return phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
  }

  /**
   * Close the SMS service
   */
  async close(): Promise<void> {
    this.client = null;
    this.isInitialized = false;
    logger.info('SMS service closed');
  }
}

// Import Campaign for tracking
import { Campaign } from '../models/Automation';

// Export singleton instance
export const smsService = new SMSService();
export default smsService;
