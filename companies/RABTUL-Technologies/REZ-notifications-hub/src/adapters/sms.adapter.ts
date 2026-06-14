import twilio from 'twilio';
import { BaseAdapter } from './base.adapter';
import { Notification, SendResult } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

export class SmsAdapter extends BaseAdapter {
  readonly channel = 'sms';
  private client: twilio.Twilio | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      logger.warn('SMS adapter: Twilio not configured');
      return;
    }

    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info('SMS adapter initialized');
  }

  async send(notification: Notification): Promise<SendResult> {
    if (!this.client) {
      return this.createFailureResult('SMS service not configured');
    }

    const recipientPhone = this.getRecipientPhone(notification);
    if (!recipientPhone) {
      return this.createFailureResult('No recipient phone provided');
    }

    const message = this.extractMessage(notification.renderedContent);

    try {
      const result = await this.client.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: recipientPhone,
      });

      logger.info('SMS sent successfully', {
        notificationId: notification.id,
        messageSid: result.sid,
        status: result.status,
      });

      return this.createSuccessResult(result.sid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('SMS send failed', {
        notificationId: notification.id,
        error: errorMessage,
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private getRecipientPhone(notification: Notification): string | undefined {
    return notification.metadata?.recipientPhone as string | undefined;
  }

  private extractMessage(content: string): string {
    // Extract plain text from content
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.substring(0, 1600); // SMS limit
  }

  async getStatus(notificationId: string): Promise<string> {
    if (!this.client) return 'unknown';

    try {
      const message = await this.client.messages(notificationId).fetch();
      return message.status;
    } catch {
      return 'unknown';
    }
  }
}
