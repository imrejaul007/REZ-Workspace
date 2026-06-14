import twilio from 'twilio';
import { BaseAdapter } from './base.adapter';
import { Notification, SendResult } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

export class WhatsAppAdapter extends BaseAdapter {
  readonly channel = 'whatsapp';
  private client: twilio.Twilio | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      logger.warn('WhatsApp adapter: Twilio not configured');
      return;
    }

    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info('WhatsApp adapter initialized');
  }

  async send(notification: Notification): Promise<SendResult> {
    if (!this.client) {
      return this.createFailureResult('WhatsApp service not configured');
    }

    const recipientPhone = this.getRecipientPhone(notification);
    if (!recipientPhone) {
      return this.createFailureResult('No recipient phone provided');
    }

    const content = this.parseWhatsAppContent(notification.renderedContent);

    try {
      const result = await this.client.messages.create({
        body: content.body,
        from: `whatsapp:${config.twilio.whatsappFrom}`,
        to: `whatsapp:${recipientPhone}`,
        mediaUrl: content.mediaUrl ? [content.mediaUrl] : undefined,
      });

      logger.info('WhatsApp message sent successfully', {
        notificationId: notification.id,
        messageSid: result.sid,
        status: result.status,
      });

      return this.createSuccessResult(result.sid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('WhatsApp send failed', {
        notificationId: notification.id,
        error: errorMessage,
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private getRecipientPhone(notification: Notification): string | undefined {
    return notification.metadata?.recipientPhone as string | undefined;
  }

  private parseWhatsAppContent(
    content: string
  ): { body: string; mediaUrl?: string } {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '').trim();

    // Check for media URL in metadata
    const mediaMatch = content.match(/!\[.*?\]\((.*?)\)/);

    return {
      body: plainText.substring(0, 4096), // WhatsApp limit
      mediaUrl: mediaMatch?.[1],
    };
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
