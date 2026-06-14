import logger from './utils/logger';

/**
 * SMS Service
 *
 * Twilio-based SMS delivery
 */

import twilio from 'twilio';

interface SMSPayload {
  to: string;
  message: string;
}

export class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async initialize(): Promise<void> {
    logger.info('SMS Service initialized');
  }

  /**
   * Send SMS via Twilio
   */
  async send(payload: SMSPayload): Promise<boolean> {
    if (!this.client) {
      logger.warn('Twilio not configured');
      // Mock send for development
      logger.info(`[SMS Mock] To: ${payload.to}, Message: ${payload.message}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: payload.message,
        from: this.fromNumber,
        to: payload.to,
      });

      logger.info(`SMS sent to ${payload.to}`);
      return true;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    return this.send({
      to: phone,
      message: `Your ReZ verification code is: ${otp}. Valid for 10 minutes.`,
    });
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(recipients: SMSPayload[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.send(recipient);
      if (result) success++;
      else failed++;
    }

    return { success, failed };
  }
}
