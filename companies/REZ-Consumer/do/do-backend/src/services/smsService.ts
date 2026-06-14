// SMS Service - Multi-provider support (Twilio, MSG91)

import { logger } from '../utils/logger.js';

interface SMSOptions {
  to: string;
  message: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

type SMSProvider = 'twilio' | 'msg91' | 'mock';

export class SMSService {
  private provider: SMSProvider;
  private config: Record<string, string>;

  constructor() {
    // Load configuration from environment
    this.config = {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      msg91ApiKey: process.env.MSG91_API_KEY || '',
      msg91SenderId: process.env.MSG91_SENDER_ID || 'DOAPP',
    };

    // Determine provider
    if (this.config.twilioAccountSid && this.config.twilioAuthToken) {
      this.provider = 'twilio';
      logger.info('SMS Service: Using Twilio');
    } else if (this.config.msg91ApiKey) {
      this.provider = 'msg91';
      logger.info('SMS Service: Using MSG91');
    } else {
      this.provider = 'mock';
      logger.warn('SMS Service: No SMS provider configured, using mock mode');
    }
  }

  async send({ to, message }: SMSOptions): Promise<SMSResult> {
    const formattedPhone = this.formatPhone(to);

    switch (this.provider) {
      case 'twilio':
        return this.sendTwilio(formattedPhone, message);
      case 'msg91':
        return this.sendMSG91(formattedPhone, message);
      case 'mock':
        return this.sendMock(formattedPhone, message);
    }
  }

  private formatPhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return '+' + digits;
  }

  private async sendTwilio(to: string, message: string): Promise<SMSResult> {
    try {
      const auth = Buffer.from(
        `${this.config.twilioAccountSid}:${this.config.twilioAuthToken}`
      ).toString('base64');

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.config.twilioPhoneNumber,
            To: to,
            Body: message,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        logger.info('Twilio SMS sent', { messageId: data.sid });
        return { success: true, messageId: data.sid };
      } else {
        logger.error('Twilio SMS failed', { error: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      logger.error('Twilio SMS error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  private async sendMSG91(to: string, message: string): Promise<SMSResult> {
    try {
      const phone = to.replace('+', '');

      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.config.msg91ApiKey,
        },
        body: JSON.stringify({
          mobile: phone,
          message,
          sender: this.config.msg91SenderId,
        }),
      });

      const data = await response.json();

      if (data.type === 'success') {
        logger.info('MSG91 SMS sent', { messageId: data.id });
        return { success: true, messageId: data.id };
      } else {
        logger.error('MSG91 SMS failed', { error: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      logger.error('MSG91 SMS error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  private sendMock(to: string, message: string): SMSResult {
    logger.info(`[MOCK SMS] To: ${to}, Message: ${message}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  // Convenience methods
  async sendOTP(phone: string, otp: string): Promise<SMSResult> {
    const message = `Your Do verification code is: ${otp}. This code expires in 10 minutes.`;
    return this.send({ to: phone, message });
  }

  async sendBookingConfirmation(phone: string, details: {
    entityName: string;
    dateTime: string;
    confirmationCode: string;
  }): Promise<SMSResult> {
    const message = `Your booking at ${details.entityName} is confirmed for ${details.dateTime}. Code: ${details.confirmationCode}`;
    return this.send({ to: phone, message });
  }

  async sendReminder(phone: string, details: {
    entityName: string;
    timeUntil: string;
  }): Promise<SMSResult> {
    const message = `Reminder: Your booking at ${details.entityName} is in ${details.timeUntil}`;
    return this.send({ to: phone, message });
  }
}

export const smsService = new SMSService();
export default smsService;
