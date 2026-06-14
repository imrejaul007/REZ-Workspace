import logger from './utils/logger';

/**
 * ReZ Merchant - Common Notifications Module
 * Push, SMS, Email, WhatsApp for all industries
 */

export interface Notification {
  userId: string;
  channel: 'push' | 'sms' | 'email' | 'whatsapp';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class CommonNotifications {
  /**
   * Send push notification
   */
  async sendPush(userId: string, notification: Omit<Notification, 'channel'>): Promise<void> {
    logger.info(`Push to ${userId}: ${notification.title}`);
  }

  /**
   * Send SMS
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    logger.info(`SMS to ${phone}: ${message}`);
  }

  /**
   * Send email
   */
  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    logger.info(`Email to ${email}: ${subject}`);
  }

  /**
   * Send WhatsApp
   */
  async sendWhatsApp(phone: string, template: string, data): Promise<void> {
    logger.info(`WhatsApp to ${phone}: ${template}`);
  }

  /**
   * Send multi-channel
   */
  async sendMulti(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case 'push': return this.sendPush(notification.userId, notification);
      case 'sms': return this.sendSMS(notification.userId, notification.body);
      case 'email': return this.sendEmail(notification.userId, notification.title, notification.body);
      case 'whatsapp': return this.sendWhatsApp(notification.userId, notification.title, notification.data);
    }
  }
}

export const commonNotifications = new CommonNotifications();
