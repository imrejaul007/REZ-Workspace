import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import config from '../config';
import { MFAUser } from '../models';
import logger from '../utils/logger';
import {
  SetupMFAResponse,
  VerifyTOTPResponse,
} from '../types';
import { AppError, NotFoundError, AuthenticationError, ValidationError } from '../../../../shared/rez-errors/src';

export class TOTPManager {
  /**
   * Generate a new TOTP secret for a user
   */
  static async generateSecret(userId: string, email: string): Promise<SetupMFAResponse> {
    try {
      // Generate a new TOTP secret
      const secret = speakeasy.generateSecret({
        name: `${config.totp.issuer}:${email}`,
        issuer: config.totp.issuer,
        length: 20,
      });

      // Create the otpauth URL for QR code
      const otpauthUrl = secret.otpauth_url || '';

      // Generate QR code as data URL
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Encrypt the secret before storing
      const encryptedSecret = this.encryptSecret(secret.base32 || '');

      // Store the encrypted secret in database
      const user = await MFAUser.findOneAndUpdate(
        { userId },
        {
          totpSecret: encryptedSecret,
          totpEnabled: false,
          totpEnabledAt: new Date(),
        },
        { upsert: true, new: true }
      );

      await user.save();

      logger.info('TOTP secret generated', {
        userId,
        email,
        timestamp: new Date().toISOString(),
      });

      return {
        secret: secret.base32 || '',
        qrCodeUrl,
        manualEntryKey: secret.base32 || '',
      };
    } catch (error) {
      logger.error('Failed to generate TOTP secret', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AppError('Failed to generate MFA secret', 'MFA_SECRET_GENERATION_FAILED', 500);
    }
  }

  /**
   * Verify a TOTP token
   */
  static async verifyToken(
    userId: string,
    token: string,
    options: { updateLastVerified?: boolean } = {}
  ): Promise<{ valid: boolean; delta?: number }> {
    try {
      const user = await MFAUser.findOne({ userId });

      if (!user || !user.totpSecret) {
        logger.warn('TOTP verification attempted without secret', { userId });
        return { valid: false };
      }

      // Check if account is locked
      if (user.isLocked()) {
        logger.warn('TOTP verification attempted on locked account', {
          userId,
          lockedUntil: user.lockedUntil,
        });
        return { valid: false };
      }

      // Decrypt the stored secret
      const decryptedSecret = this.decryptSecret(user.totpSecret);

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token.trim(),
        window: config.totp.window,
        step: config.totp.step,
      });

      if (verified) {
        // Update last verified timestamp if requested
        if (options.updateLastVerified) {
          user.totpEnabled = true;
          user.mfaEnabled = true;
          user.mfaEnabledAt = user.mfaEnabledAt || new Date();
          user.failedAttempts = 0;
          await user.save();
        }

        logger.info('TOTP verification successful', {
          userId,
          timestamp: new Date().toISOString(),
        });

        return { valid: true, delta: 0 };
      }

      // Token is invalid
      await user.incrementFailedAttempts();

      logger.warn('TOTP verification failed', {
        userId,
        failedAttempts: user.failedAttempts,
        timestamp: new Date().toISOString(),
      });

      return { valid: false };
    } catch (error) {
      logger.error('TOTP verification error', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { valid: false };
    }
  }

  /**
   * Verify token and enable MFA if not already enabled
   */
  static async verifyAndEnable(
    userId: string,
    token: string,
    trustDevice?: boolean,
    deviceInfo?: { deviceId: string; deviceName: string; userAgent: string; ipAddress: string }
  ): Promise<VerifyTOTPResponse> {
    const user = await MFAUser.findOne({ userId });

    if (!user) {
      throw new NotFoundError('User', 'userId', userId);
    }

    const result = await this.verifyToken(userId, token, { updateLastVerified: !user.totpEnabled });

    if (!result.valid) {
      // Check if user is locked
      if (user.isLocked()) {
        throw new AuthenticationError('Account is temporarily locked due to too many failed attempts', 'ACCOUNT_LOCKED');
      }
      throw new AuthenticationError('Invalid verification code', 'INVALID_TOTP_CODE');
    }

    // If TOTP was not previously enabled, generate backup codes
    let backupCodes: string[] | undefined;
    if (!user.totpEnabled) {
      const { BackupCodeManager } = await import('./backupCodes');
      backupCodes = await BackupCodeManager.generateNewCodes(userId);
    }

    // Handle trusted device if requested
    if (trustDevice && deviceInfo) {
      await user.addTrustedDevice({
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: this.detectDeviceType(deviceInfo.userAgent),
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      });
    }

    const remainingBackupCodes = user.backupCodes.filter(c => !c.usedAt).length;

    logger.info('MFA enabled successfully', {
      userId,
      backupCodesGenerated: !!backupCodes,
      trustedDeviceAdded: !!trustDevice,
    });

    return {
      success: true,
      trustedDeviceToken: trustDevice ? this.generateTrustedDeviceToken(userId, deviceInfo!.deviceId) : undefined,
      backupCodes,
      remainingBackupCodes: backupCodes
        ? remainingBackupCodes + backupCodes.length
        : remainingBackupCodes,
    };
  }

  /**
   * Disable MFA for a user
   */
  static async disableMFA(
    userId: string,
    token: string,
    reason?: string,
    disabledBy?: string
  ): Promise<void> {
    // Verify the token before disabling
    const result = await this.verifyToken(userId, token, { updateLastVerified: false });

    if (!result.valid) {
      const user = await MFAUser.findOne({ userId });
      if (user?.isLocked()) {
        throw new AuthenticationError('Account is temporarily locked', 'ACCOUNT_LOCKED');
      }
      throw new AuthenticationError('Invalid verification code', 'INVALID_TOTP_CODE');
    }

    await MFAUser.findOneAndUpdate(
      { userId },
      {
        totpSecret: null,
        totpEnabled: false,
        totpEnabledAt: undefined,
        mfaEnabled: false,
        mfaEnabledAt: undefined,
        mfaDisabledAt: new Date(),
        mfaDisabledBy: disabledBy,
        mfaDisabledReason: reason,
        backupCodes: [],
      }
    );

    logger.info('MFA disabled', {
      userId,
      reason,
      disabledBy,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Admin disable MFA (bypasses token verification)
   */
  static async adminDisableMFA(userId: string, adminUserId: string, reason?: string): Promise<void> {
    await MFAUser.findOneAndUpdate(
      { userId },
      {
        totpSecret: null,
        totpEnabled: false,
        totpEnabledAt: undefined,
        mfaEnabled: false,
        mfaEnabledAt: undefined,
        mfaDisabledAt: new Date(),
        mfaDisabledBy: adminUserId,
        mfaDisabledReason: reason || 'Disabled by administrator',
        backupCodes: [],
      }
    );

    logger.info('MFA disabled by admin', {
      userId,
      adminUserId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get MFA status for a user
   */
  static async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    totpEnabled: boolean;
    smsEnabled: boolean;
    backupCodesRemaining: number;
    trustedDevicesCount: number;
  }> {
    const user = await MFAUser.findOne({ userId });

    if (!user || !user.mfaEnabled) {
      return {
        enabled: false,
        totpEnabled: false,
        smsEnabled: false,
        backupCodesRemaining: 0,
        trustedDevicesCount: 0,
      };
    }

    return {
      enabled: user.mfaEnabled,
      totpEnabled: user.totpEnabled,
      smsEnabled: user.smsEnabled,
      backupCodesRemaining: user.backupCodes.filter(c => !c.usedAt).length,
      trustedDevicesCount: user.trustedDevices.length,
    };
  }

  /**
   * Generate a trusted device token
   */
  static generateTrustedDeviceToken(userId: string, deviceId: string): string {
    const payload = `${userId}:${deviceId}:${Date.now()}`;
    return crypto
      .createHmac('sha256', config.jwt.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Encrypt TOTP secret using AES-256-GCM
   */
  private static encryptSecret(secret: string): string {
    const key = crypto.scryptSync(config.jwt.secret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt TOTP secret
   */
  private static decryptSecret(encryptedData: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      const key = crypto.scryptSync(config.jwt.secret, 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt TOTP secret', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AppError('Failed to decrypt secret', 'SECRET_DECRYPTION_FAILED', 500);
    }
  }

  /**
   * Detect device type from user agent
   */
  private static detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase();

    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
      if (/tablet|ipad/i.test(ua)) {
        return 'tablet';
      }
      return 'mobile';
    }

    if (/windows|macintosh|linux/i.test(ua)) {
      return 'desktop';
    }

    return 'unknown';
  }
}
