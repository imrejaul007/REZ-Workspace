import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { MFAUser, RecoveryRequest } from '../models';
import { RecoveryRequest as IRecoveryRequest } from '../types';
import logger from '../utils/logger';
import config from '../config';
import { NotFoundError, AuthenticationError, BusinessRuleError, ValidationError } from '../../../../shared/rez-errors/src';

export class RecoveryManager {
  private static readonly REQUEST_EXPIRY_MINUTES = 30;
  private static readonly CODE_LENGTH = 6;

  /**
   * Create a recovery request
   */
  static async createRecoveryRequest(
    userId: string,
    method: 'email' | 'sms' | 'admin',
    metadata?: Record<string, unknown>
  ): Promise<{ requestId: string; verificationCode?: string; expiresAt: Date }> {
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Check if user has MFA enabled
    if (!user.mfaEnabled && !user.totpSecret) {
      throw new AuthenticationError('MFA is not enabled for this user');
    }

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + this.REQUEST_EXPIRY_MINUTES * 60 * 1000);

    // Create recovery request
    const requestId = uuidv4();
    const recoveryRequest = new RecoveryRequest({
      userId,
      requestId,
      method,
      status: 'pending',
      verificationCode: method !== 'admin' ? this.hashCode(verificationCode) : undefined,
      expiresAt,
      metadata,
    });

    await recoveryRequest.save();

    logger.info('Recovery request created', {
      userId,
      requestId,
      method,
      expiresAt,
    });

    // Send verification code based on method
    if (method === 'email') {
      await this.sendEmailCode(user.email, verificationCode);
    } else if (method === 'sms' && user.phone) {
      await this.sendSMSCode(user.phone, verificationCode);
    }
    // For admin method, code is provided through admin dashboard

    return {
      requestId,
      verificationCode: method === 'admin' ? undefined : verificationCode,
      expiresAt,
    };
  }

  /**
   * Verify a recovery request with code
   */
  static async verifyRecoveryRequest(
    userId: string,
    requestId: string,
    verificationCode: string
  ): Promise<{ success: boolean; expiresAt?: Date }> {
    const request = await RecoveryRequest.findOne({ requestId, userId });

    if (!request) {
      logger.warn('Recovery request not found', { userId, requestId });
      throw new NotFoundError('Recovery request', requestId);
    }

    if (request.status !== 'pending') {
      throw new BusinessRuleError(`Recovery request is ${request.status}`);
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      await request.save();
      throw new BusinessRuleError('Recovery request has expired', 'REQUEST_EXPIRED');
    }

    // For admin verification, skip code check
    if (request.method !== 'admin') {
      const hashedCode = this.hashCode(verificationCode);
      if (hashedCode !== request.verificationCode) {
        logger.warn('Invalid verification code for recovery', { userId, requestId });
        throw new ValidationError('Invalid verification code');
      }
    }

    // Mark request as approved
    request.status = 'approved';
    request.verifiedAt = new Date();
    await request.save();

    logger.info('Recovery request verified', { userId, requestId });

    return {
      success: true,
      expiresAt: request.expiresAt,
    };
  }

  /**
   * Complete account recovery - reset MFA
   */
  static async completeRecovery(
    userId: string,
    requestId: string,
    verifiedBy?: string
  ): Promise<{ backupCodes: string[] }> {
    const request = await RecoveryRequest.findOne({ requestId, userId });

    if (!request) {
      throw new NotFoundError('Recovery request', requestId);
    }

    if (request.status !== 'approved') {
      throw new BusinessRuleError(`Cannot complete recovery - request is ${request.status}`);
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      await request.save();
      throw new BusinessRuleError('Recovery request has expired', 'REQUEST_EXPIRED');
    }

    // Reset MFA for the user
    const { BackupCodeManager } = await import('./backupCodes');
    const newBackupCodes = await BackupCodeManager.generateNewCodes(userId);

    // Update MFA user record
    await MFAUser.findOneAndUpdate(
      { userId },
      {
        totpSecret: null,
        totpEnabled: false,
        mfaEnabled: false,
        mfaDisabledAt: new Date(),
        mfaDisabledBy: verifiedBy || 'recovery',
        mfaDisabledReason: 'Account recovery completed',
        backupCodesGeneratedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: undefined,
      }
    );

    // Mark recovery request as completed
    request.status = 'completed';
    request.completedAt = new Date();
    request.verifiedBy = verifiedBy;
    await request.save();

    logger.info('Account recovery completed', {
      userId,
      requestId,
      verifiedBy,
    });

    return { backupCodes: newBackupCodes };
  }

  /**
   * Cancel a pending recovery request
   */
  static async cancelRecoveryRequest(userId: string, requestId: string): Promise<void> {
    const request = await RecoveryRequest.findOne({ requestId, userId });

    if (!request) {
      throw new NotFoundError('Recovery request', requestId);
    }

    if (request.status !== 'pending') {
      throw new BusinessRuleError(`Cannot cancel request - status is ${request.status}`);
    }

    request.status = 'rejected';
    await request.save();

    logger.info('Recovery request cancelled', { userId, requestId });
  }

  /**
   * Get pending recovery requests for a user
   */
  static async getPendingRequests(userId: string): Promise<IRecoveryRequest[]> {
    const requests = await RecoveryRequest.find({
      userId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return requests.map(r => ({
      userId: r.userId,
      requestId: r.requestId,
      method: r.method,
      status: r.status,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Admin: List recovery requests
   */
  static async listRequests(options: {
    status?: IRecoveryRequest['status'];
    page?: number;
    limit?: number;
  }): Promise<{ requests: IRecoveryRequest[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (options.status) {
      filter.status = options.status;
    }

    const [requests, total] = await Promise.all([
      RecoveryRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RecoveryRequest.countDocuments(filter),
    ]);

    return {
      requests: requests.map(r => ({
        userId: r.userId,
        requestId: r.requestId,
        method: r.method,
        status: r.status,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        verifiedBy: r.verifiedBy,
      })),
      total,
    };
  }

  /**
   * Admin: Approve a recovery request (for admin verification method)
   */
  static async adminApproveRequest(
    requestId: string,
    adminUserId: string
  ): Promise<void> {
    const request = await RecoveryRequest.findOne({ requestId });

    if (!request) {
      throw new NotFoundError('Recovery request', requestId);
    }

    if (request.status !== 'pending') {
      throw new BusinessRuleError(`Cannot approve request - status is ${request.status}`);
    }

    if (request.method !== 'admin') {
      throw new BusinessRuleError('This request is not for admin verification', 'WRONG_VERIFICATION_TYPE');
    }

    request.status = 'approved';
    request.verifiedBy = adminUserId;
    request.verifiedAt = new Date();
    await request.save();

    logger.info('Recovery request approved by admin', {
      requestId,
      adminUserId,
    });
  }

  /**
   * Admin: Reject a recovery request
   */
  static async adminRejectRequest(
    requestId: string,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    const request = await RecoveryRequest.findOne({ requestId });

    if (!request) {
      throw new NotFoundError('Recovery request', requestId);
    }

    if (request.status !== 'pending') {
      throw new BusinessRuleError(`Cannot reject request - status is ${request.status}`);
    }

    request.status = 'rejected';
    request.verifiedBy = adminUserId;
    request.verifiedAt = new Date();
    request.metadata = { ...request.metadata, rejectionReason: reason };
    await request.save();

    logger.info('Recovery request rejected by admin', {
      requestId,
      adminUserId,
      reason,
    });
  }

  /**
   * Generate a numeric verification code
   */
  private static generateVerificationCode(): string {
    const bytes = crypto.randomBytes(3);
    const num = bytes.readUInt16BE(0) % (10 ** this.CODE_LENGTH);
    return num.toString().padStart(this.CODE_LENGTH, '0');
  }

  /**
   * Hash verification code for storage
   */
  private static hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Send verification code via email
   */
  private static async sendEmailCode(email: string, code: string): Promise<void> {
    logger.info('Sending recovery code via email', {
      email,
      maskedEmail: this.maskEmail(email),
    });

    const emailServiceUrl = config.email?.serviceUrl || process.env.EMAIL_SERVICE_URL;

    if (!emailServiceUrl) {
      logger.warn('[RecoveryManager] Email service URL not configured, skipping email send');
      return;
    }

    try {
      const emailPayload = {
        to: email,
        subject: 'Your REZ Account Recovery Code',
        template: 'recovery-code',
        variables: {
          recoveryCode: code,
          expiresIn: `${this.REQUEST_EXPIRY_MINUTES} minutes`,
          appName: 'REZ',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch(`${emailServiceUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'mfa-service',
          'X-Request-Id': `recovery-${Date.now()}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Email service returned ${response.status}: ${errorBody}`);
      }

      const result = await response.json() as { success?: boolean; messageId?: string };
      logger.info('[RecoveryManager] Recovery email sent successfully', {
        maskedEmail: this.maskEmail(email),
        messageId: result.messageId,
      });
    } catch (error) {
      logger.error('[RecoveryManager] Failed to send recovery email', {
        maskedEmail: this.maskEmail(email),
        error: error instanceof Error ? error.message : String(error),
      });
      // Re-throw to alert the caller that the recovery request may not be delivered
      throw new Error('Failed to send recovery email. Please try again.');
    }
  }

  /**
   * Send verification code via SMS
   */
  private static async sendSMSCode(phone: string, code: string): Promise<void> {
    logger.info('Sending recovery code via SMS', {
      maskedPhone: this.maskPhone(phone),
    });

    if (config.sms.provider === 'twilio') {
      try {
        const twilioAccountSid = config.sms.twilio?.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = config.sms.twilio?.authToken || process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber = config.sms.twilio?.phoneNumber || process.env.TWILIO_PHONE_NUMBER;

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
          throw new Error('Twilio credentials not fully configured');
        }

        // Use Twilio REST API directly via fetch
        const twilioAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const messageBody = `Your REZ recovery code is: ${code}. Valid for ${this.REQUEST_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`;

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: phone,
              From: twilioPhoneNumber,
              Body: messageBody,
            }),
          }
        );

        const result = await response.json() as { sid?: string; status?: string; error_code?: string; error_message?: string };

        if (!response.ok) {
          throw new Error(`Twilio API error ${result.error_code}: ${result.error_message}`);
        }

        logger.info('[RecoveryManager] Recovery SMS sent via Twilio', {
          maskedPhone: this.maskPhone(phone),
          messageSid: result.sid,
          status: result.status,
        });
      } catch (error) {
        logger.error('[RecoveryManager] Failed to send recovery SMS via Twilio', {
          maskedPhone: this.maskPhone(phone),
          error: error instanceof Error ? error.message : String(error),
        });
        // Re-throw to alert the caller that the recovery request may not be delivered
        throw new Error('Failed to send recovery SMS. Please try again or use email verification.');
      }
    } else if (config.sms.provider === 'msg91') {
      // Alternative: MSG91 SMS integration
      try {
        const msg91AuthKey = process.env.MSG91_AUTH_KEY;
        const msg91SenderId = process.env.MSG91_SENDER_ID;
        const msg91Route = process.env.MSG91_ROUTE || '4';

        if (!msg91AuthKey || !msg91SenderId) {
          throw new Error('MSG91 credentials not configured');
        }

        const messageBody = `Your REZ recovery code is: ${code}. Valid for ${this.REQUEST_EXPIRY_MINUTES} minutes.`;

        const response = await fetch(`https://api.msg91.com/api/v5/otp?authkey=${msg91AuthKey}&mobile=${phone}&sender=${msg91SenderId}&message=${encodeURIComponent(messageBody)}&route=${msg91Route}`, {
          method: 'GET',
        });

        const result = await response.json() as { type?: string; message?: string };

        if (!response.ok || result.type !== 'success') {
          throw new Error(`MSG91 API error: ${result.message}`);
        }

        logger.info('[RecoveryManager] Recovery SMS sent via MSG91', {
          maskedPhone: this.maskPhone(phone),
        });
      } catch (error) {
        logger.error('[RecoveryManager] Failed to send recovery SMS via MSG91', {
          maskedPhone: this.maskPhone(phone),
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error('Failed to send recovery SMS. Please try again or use email verification.');
      }
    } else {
      // No SMS provider configured
      logger.warn('[RecoveryManager] No SMS provider configured', {
        provider: config.sms.provider,
      });
    }
  }

  /**
   * Mask email for logging
   */
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${'*'.repeat(3)}${local[local.length - 1]}@${domain}`;
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
