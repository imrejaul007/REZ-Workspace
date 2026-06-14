import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import config from '../config';
import { MFAUser } from '../models';
import logger from '../utils/logger';
import { AppError, NotFoundError, AuthenticationError, ValidationError } from '../../../../shared/rez-errors/src';

export class BackupCodeManager {
  /**
   * Generate a single backup code
   */
  static generateCode(): string {
    const bytes = crypto.randomBytes(5);
    return bytes.toString('hex').toUpperCase().match(/.{4}/g)?.join('-') || '';
  }

  /**
   * Generate multiple backup codes
   */
  static generateCodes(count: number = config.backupCodes.count): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateCode());
    }
    return codes;
  }

  /**
   * Generate new backup codes for a user (invalidates old ones)
   */
  static async generateNewCodes(userId: string): Promise<string[]> {
    try {
      // Generate new codes
      const newCodes = this.generateCodes();

      // Hash the codes for storage
      const hashedCodes = await Promise.all(
        newCodes.map(async (code) => ({
          codeHash: await bcrypt.hash(code, config.backupCodes.hashRounds),
          createdAt: new Date(),
        }))
      );

      // Update user with new backup codes
      await MFAUser.findOneAndUpdate(
        { userId },
        {
          backupCodes: hashedCodes,
          backupCodesGeneratedAt: new Date(),
        }
      );

      logger.info('New backup codes generated', {
        userId,
        codeCount: newCodes.length,
        timestamp: new Date().toISOString(),
      });

      // Return plain codes (only time they're available)
      return newCodes;
    } catch (error) {
      logger.error('Failed to generate backup codes', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AppError('Failed to generate backup codes', 'BACKUP_CODE_GENERATION_FAILED');
    }
  }

  /**
   * Verify a backup code
   */
  static async verifyCode(userId: string, code: string): Promise<boolean> {
    try {
      const user = await MFAUser.findOne({ userId });

      if (!user || !user.backupCodes || user.backupCodes.length === 0) {
        logger.warn('Backup code verification attempted without codes', { userId });
        return false;
      }

      // Check if account is locked
      if (user.isLocked()) {
        logger.warn('Backup code verification attempted on locked account', {
          userId,
          lockedUntil: user.lockedUntil,
        });
        return false;
      }

      // Normalize the input code
      const normalizedCode = code.toUpperCase().replace(/-/g, '');

      // Find matching unused code
      for (const backupCode of user.backupCodes) {
        if (backupCode.usedAt) continue; // Skip already used codes

        const isMatch = await bcrypt.compare(normalizedCode, backupCode.codeHash);
        if (isMatch) {
          // Mark code as used
          backupCode.usedAt = new Date();
          await user.save();

          // Reset failed attempts on successful verification
          await user.resetFailedAttempts();

          logger.info('Backup code verified and marked as used', {
            userId,
            remainingCodes: user.backupCodes.filter(c => !c.usedAt).length,
          });

          return true;
        }
      }

      // No match found - increment failed attempts
      await user.incrementFailedAttempts();

      logger.warn('Backup code verification failed', {
        userId,
        failedAttempts: user.failedAttempts,
      });

      return false;
    } catch (error) {
      logger.error('Backup code verification error', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get remaining backup codes count (without revealing the codes)
   */
  static async getRemainingCodesCount(userId: string): Promise<number> {
    const user = await MFAUser.findOne({ userId });

    if (!user || !user.backupCodes) {
      return 0;
    }

    return user.backupCodes.filter(code => !code.usedAt).length;
  }

  /**
   * Regenerate backup codes (returns new codes, invalidates old)
   */
  static async regenerateCodes(userId: string): Promise<string[]> {
    return this.generateNewCodes(userId);
  }

  /**
   * Verify a backup code and optionally add trusted device
   */
  static async verifyAndAddTrustedDevice(
    userId: string,
    code: string,
    deviceInfo?: { deviceId: string; deviceName: string; userAgent: string; ipAddress: string }
  ): Promise<{ success: boolean; trustedDeviceToken?: string; remainingCodes?: number }> {
    const isValid = await this.verifyCode(userId, code);

    if (!isValid) {
      const user = await MFAUser.findOne({ userId });
      if (user?.isLocked()) {
        throw new AuthenticationError('Account is temporarily locked due to too many failed attempts');
      }
      throw new ValidationError('Invalid backup code');
    }

    let trustedDeviceToken: string | undefined;

    // Add trusted device if info provided
    if (deviceInfo) {
      const { TOTPManager } = await import('./totpManager');
      const user = await MFAUser.findOne({ userId });
      if (user) {
        await user.addTrustedDevice({
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: TOTPManager['detectDeviceType'](deviceInfo.userAgent),
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
        });
        trustedDeviceToken = TOTPManager.generateTrustedDeviceToken(userId, deviceInfo.deviceId);
      }
    }

    const remainingCodes = await this.getRemainingCodesCount(userId);

    return {
      success: true,
      trustedDeviceToken,
      remainingCodes,
    };
  }
}
