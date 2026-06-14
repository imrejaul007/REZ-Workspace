import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { randomInt } from 'crypto';

/**
 * OTP Service - Twilio/msg91 Integration
 */

@Injectable()
export class OTPService {
  private readonly logger = new Logger(OTPService.name);

  private readonly TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  private readonly TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  private readonly TWILIO_PHONE = process.env.TWILIO_PHONE;

  private readonly MSG91_API_KEY = process.env.MSG91_API_KEY;
  private readonly MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;

  // OTP Store (use Redis in production)
  private otps = new Map<string, { otp: string; expires: number }>();

  async sendOTP(phone: string, type: 'login' | 'verify'): Promise<{ success: boolean; messageId: string }> {
    const otp = randomInt(1000, 9999).toString();

    // Store OTP
    this.otps.set(phone, { otp, expires: Date.now() + 300000 });

    const message = `Your ReZ Ride OTP is ${otp}. Valid for 5 minutes.`;

    // Send SMS
    if (this.TWILIO_ACCOUNT_SID) {
      await this.sendTwilio(phone, message);
    } else if (this.MSG91_API_KEY) {
      await this.sendMsg91(phone, message);
    } else {
      this.logger.warn(`OTP for ${phone}: ${otp} (SMS provider not configured`);
    }

    return { success: true, messageId: `msg_${Date.now()}` };
  }

  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    const stored = this.otps.get(phone);

    if (!stored) return false;
    if (Date.now() > stored.expires) return false;
    if (stored.otp !== otp) return false;

    this.otps.delete(phone);
    return true;
  }

  private async sendTwilio(phone: string, message: string): Promise<void> {
    try {
      const client = require('twilio')(this.TWILIO_ACCOUNT_SID, this.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: message,
        from: this.TWILIO_PHONE,
        to: phone,
      });
    } catch (error) {
      this.logger.error(`Twilio failed: ${error.message}`);
    }
  }

  private async sendMsg91(phone: string, message: string): Promise<void> {
    try {
      await axios.post('https://control.msg91.com/api/v5/otp', {
        mobile: phone,
        message,
        template_id: process.env.MSG91_TEMPLATE_ID,
        authkey: this.MSG91_API_KEY,
      });
    } catch (error) {
      this.logger.error(`Msg91 failed: ${error.message}`);
    }
  }
}
