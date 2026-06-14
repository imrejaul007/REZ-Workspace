import config from '../config';
import logger from '../utils/logger';
import crypto from 'crypto';

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSManager {
  private static readonly CODE_LENGTH = 6;

  /**
   * Send an SMS message
   */
  static async send(message: SMSMessage): Promise<SMSResult> {
    if (config.sms.provider === 'mock') {
      return this.sendMock(message);
    }

    switch (config.sms.provider) {
      case 'twilio':
        return this.sendTwilio(message);
      default:
        logger.error('Unknown SMS provider', { provider: config.sms.provider });
        return { success: false, error: 'Unknown SMS provider' };
    }
  }

  /**
   * Generate a TOTP code for SMS verification
   */
  static generateCode(): string {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt16BE(0) % (10 ** this.CODE_LENGTH);
    return num.toString().padStart(this.CODE_LENGTH, '0');
  }

  /**
   * Send TOTP code via SMS
   */
  static async sendTOTPCode(phone: string, code: string): Promise<SMSResult> {
    return this.send({
      to: phone,
      body: `Your REZ verification code is: ${code}. This code expires in 5 minutes. Do not share this code with anyone.`,
    });
  }

  /**
   * Send backup code notification via SMS
   */
  static async sendBackupCodeUsed(phone: string): Promise<SMSResult> {
    return this.send({
      to: phone,
      body: `A backup code was used to sign in to your REZ account. If this wasn't you, please secure your account immediately.`,
    });
  }

  /**
   * Send suspicious activity alert via SMS
   */
  static async sendSuspiciousActivityAlert(phone: string, details: {
    ipAddress?: string;
    location?: string;
    timestamp?: Date;
  }): Promise<SMSResult> {
    const detailParts: string[] = [];
    if (details.location) detailParts.push(`location: ${details.location}`);
    if (details.ipAddress) detailParts.push(`IP: ${details.ipAddress}`);

    const detailsStr = detailParts.length > 0 ? ` (${detailParts.join(', ')})` : '';

    return this.send({
      to: phone,
      body: `Security alert: Suspicious login attempt detected on your REZ account${detailsStr}. If this wasn't you, please secure your account immediately.`,
    });
  }

  /**
   * Mock SMS sending (for development)
   */
  private static async sendMock(message: SMSMessage): Promise<SMSResult> {
    logger.info('Mock SMS sent', {
      to: this.maskPhone(message.to),
      bodyLength: message.body.length,
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }

  /**
   * Send SMS via Twilio
   */
  private static async sendTwilio(message: SMSMessage): Promise<SMSResult> {
    try {
      // Dynamic import to avoid errors when twilio is not configured
      const twilio = (await import('twilio')).default;

      const client = twilio(
        config.sms.twilio.accountSid,
        config.sms.twilio.authToken
      );

      const result = await client.messages.create({
        body: message.body,
        from: message.from || config.sms.twilio.phoneNumber,
        to: message.to,
      });

      logger.info('SMS sent via Twilio', {
        to: this.maskPhone(message.to),
        messageId: result.sid,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      logger.error('Failed to send SMS via Twilio', {
        to: this.maskPhone(message.to),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  /**
   * Mask phone number for logging
   */
  private static maskPhone(phone: string): string {
    if (phone.length <= 4) {
      return '***' + phone;
    }
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }
}
