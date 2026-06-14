import logger from './utils/logger';

import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM;

export class TWilioClient {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    }
  }

  async sendWhatsApp(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client) {
      logger.warn('Twilio client not configured, simulating WhatsApp send');
      logger.info(`[SIMULATED] WhatsApp to ${to}: ${message}`);
      return { success: true, messageId: `sim-${Date.now()}` };
    }

    try {
      const result = await this.client.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${this.formatPhoneNumber(to)}`,
        body: message,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`WhatsApp send failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client) {
      logger.warn('Twilio client not configured, simulating SMS send');
      logger.info(`[SIMULATED] SMS to ${to}: ${message}`);
      return { success: true, messageId: `sim-${Date.now()}` };
    }

    try {
      const result = await this.client.messages.create({
        from: TWILIO_SMS_FROM,
        to: this.formatPhoneNumber(to),
        body: message,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`SMS send failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Add country code if not present (assuming India +91)
    if (digits.length === 10) {
      return `+91${digits}`;
    }

    // If already has country code
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    }

    // If just has +91
    if (phone.startsWith('+91')) {
      return phone;
    }

    return `+${digits}`;
  }
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailClient {
  async send(
    to: string,
    subject: string,
    body: string,
    config?: EmailConfig
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Email implementation placeholder
    // In production, use nodemailer or similar
    logger.info(`[EMAIL] To: ${to}, Subject: ${subject}`);
    logger.info(`[EMAIL] Body: ${body}`);

    return { success: true, messageId: `email-${Date.now()}` };
  }
}

export const twilioClient = new TWilioClient();
export const emailClient = new EmailClient();
