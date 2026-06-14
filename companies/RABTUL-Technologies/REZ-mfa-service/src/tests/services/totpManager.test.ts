import speakeasy from 'speakeasy';
import { TOTPManager } from '../../services/totpManager';
import { MFAUser } from '../../models';

// Mock the MFAUser model
jest.mock('../../models', () => ({
  MFAUser: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TOTPManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a valid TOTP secret and QR code', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      (MFAUser.findOneAndUpdate as jest.Mock).mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        totpSecret: 'encrypted-secret',
        totpEnabled: false,
        save: mockSave,
      });

      const result = await TOTPManager.generateSecret('user123', 'test@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('manualEntryKey');
      expect(result.secret).toHaveLength(32); // Base32 encoded secret
      expect(result.qrCodeUrl).toContain('data:image/png;base64,');
    });

    it('should store encrypted secret in database', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      (MFAUser.findOneAndUpdate as jest.Mock).mockResolvedValue({
        userId: 'user123',
        save: mockSave,
      });

      await TOTPManager.generateSecret('user123', 'test@example.com');

      expect(MFAUser.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123' },
        expect.objectContaining({
          totpEnabled: false,
        }),
        { upsert: true, new: true }
      );
    });
  });

  describe('verifyToken', () => {
    it('should return invalid for non-existent user', async () => {
      (MFAUser.findOne as jest.Mock).mockResolvedValue(null);

      const result = await TOTPManager.verifyToken('nonexistent', '123456');

      expect(result.valid).toBe(false);
    });

    it('should return invalid for user without TOTP secret', async () => {
      (MFAUser.findOne as jest.Mock).mockResolvedValue({
        userId: 'user123',
        totpSecret: null,
      });

      const result = await TOTPManager.verifyToken('user123', '123456');

      expect(result.valid).toBe(false);
    });

    it('should return valid for correct TOTP token', async () => {
      // Generate a real secret and token
      const secret = speakeasy.generateSecret({ length: 20 });
      const token = speakeasy.totp({
        secret: secret.base32 || '',
        encoding: 'base32',
      });

      (MFAUser.findOne as jest.Mock).mockResolvedValue({
        userId: 'user123',
        totpSecret: secret.base32, // Store plain for testing
        isLocked: () => false,
        save: jest.fn().mockResolvedValue(undefined),
        incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
      });

      const result = await TOTPManager.verifyToken('user123', token);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for incorrect TOTP token', async () => {
      (MFAUser.findOne as jest.Mock).mockResolvedValue({
        userId: 'user123',
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isLocked: () => false,
        save: jest.fn().mockResolvedValue(undefined),
        incrementFailedAttempts: jest.fn().mockResolvedValue(undefined),
      });

      const result = await TOTPManager.verifyToken('user123', '000000');

      expect(result.valid).toBe(false);
    });

    it('should return invalid for locked account', async () => {
      (MFAUser.findOne as jest.Mock).mockResolvedValue({
        userId: 'user123',
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isLocked: () => true,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
      });

      const result = await TOTPManager.verifyToken('user123', '123456');

      expect(result.valid).toBe(false);
    });
  });

  describe('getMFAStatus', () => {
    it('should return disabled status for non-existent user', async () => {
      (MFAUser.findOne as jest.Mock).mockResolvedValue(null);

      const status = await TOTPManager.getMFAStatus('nonexistent');

      expect(status.enabled).toBe(false);
      expect(status.totpEnabled).toBe(false);
      expect(status.smsEnabled).toBe(false);
      expect(status.backupCodesRemaining).toBe(0);
      expect(status.trustedDevicesCount).toBe(0);
    });

    it('should return correct status for enabled MFA user', async () => {
      (MFAUser.findOne as jest.Mock).mockResolvedValue({
        userId: 'user123',
        mfaEnabled: true,
        totpEnabled: true,
        smsEnabled: false,
        backupCodes: [
          { codeHash: 'hash1', usedAt: undefined },
          { codeHash: 'hash2', usedAt: new Date() }, // Used
          { codeHash: 'hash3', usedAt: undefined },
        ],
        trustedDevices: [
          { deviceId: 'device1' },
          { deviceId: 'device2' },
        ],
      });

      const status = await TOTPManager.getMFAStatus('user123');

      expect(status.enabled).toBe(true);
      expect(status.totpEnabled).toBe(true);
      expect(status.smsEnabled).toBe(false);
      expect(status.backupCodesRemaining).toBe(2);
      expect(status.trustedDevicesCount).toBe(2);
    });
  });

  describe('generateTrustedDeviceToken', () => {
    it('should generate a consistent token for same user and device', () => {
      const token1 = TOTPManager.generateTrustedDeviceToken('user123', 'device1');
      const token2 = TOTPManager.generateTrustedDeviceToken('user123', 'device1');

      expect(token1).toBe(token2);
      expect(token1).toHaveLength(64); // SHA-256 hex
    });

    it('should generate different tokens for different devices', () => {
      const token1 = TOTPManager.generateTrustedDeviceToken('user123', 'device1');
      const token2 = TOTPManager.generateTrustedDeviceToken('user123', 'device2');

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for different users', () => {
      const token1 = TOTPManager.generateTrustedDeviceToken('user123', 'device1');
      const token2 = TOTPManager.generateTrustedDeviceToken('user456', 'device1');

      expect(token1).not.toBe(token2);
    });
  });
});
