import { BackupCodeManager } from '../../services/backupCodes';

// Mock dependencies
jest.mock('../../models', () => ({
  MFAUser: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_code'),
  compare: jest.fn(),
}));

describe('BackupCodeManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCode', () => {
    it('should generate a code in correct format', () => {
      const code = BackupCodeManager.generateCode();

      // Format: XXXX-XXXX
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(BackupCodeManager.generateCode());
      }

      // All codes should be unique
      expect(codes.size).toBe(100);
    });
  });

  describe('generateCodes', () => {
    it('should generate default 10 codes', () => {
      const codes = BackupCodeManager.generateCodes();

      expect(codes).toHaveLength(10);
    });

    it('should generate requested number of codes', () => {
      const codes = BackupCodeManager.generateCodes(5);

      expect(codes).toHaveLength(5);
    });

    it('should generate codes with correct format', () => {
      const codes = BackupCodeManager.generateCodes(3);

      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });
  });

  describe('getRemainingCodesCount', () => {
    it('should return 0 for non-existent user', async () => {
      const { MFAUser } = require('../../models');
      MFAUser.findOne.mockResolvedValue(null);

      const count = await BackupCodeManager.getRemainingCodesCount('nonexistent');

      expect(count).toBe(0);
    });

    it('should return count of unused codes', async () => {
      const { MFAUser } = require('../../models');
      MFAUser.findOne.mockResolvedValue({
        backupCodes: [
          { codeHash: 'hash1', usedAt: undefined },
          { codeHash: 'hash2', usedAt: new Date() }, // Used
          { codeHash: 'hash3', usedAt: undefined },
          { codeHash: 'hash4', usedAt: undefined },
        ],
      });

      const count = await BackupCodeManager.getRemainingCodesCount('user123');

      expect(count).toBe(3);
    });

    it('should return 0 if no backup codes exist', async () => {
      const { MFAUser } = require('../../models');
      MFAUser.findOne.mockResolvedValue({
        backupCodes: undefined,
      });

      const count = await BackupCodeManager.getRemainingCodesCount('user123');

      expect(count).toBe(0);
    });
  });
});
