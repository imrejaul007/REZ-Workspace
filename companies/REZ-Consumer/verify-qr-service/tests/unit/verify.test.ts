/**
 * Unit Tests for Verify QR Service
 * Tests serial verification, validation, and lookup functionality
 */

import {
  createMockSerial,
  createMockWarranty,
  createMockOwnership,
  MockSerialRepository,
  MockWarrantyRepository,
  MockOwnershipRepository,
  MockExternalAPIService,
  generateValidSerial,
  generateInvalidSerial,
} from '../setup';

// ============================================================
// Service Implementation (to be tested)
// ============================================================

interface VerifyResult {
  isValid: boolean;
  serialNumber: string;
  productId?: string;
  warrantyStatus?: {
    isActive: boolean;
    endDate: string;
    daysRemaining: number;
  };
  ownership?: {
    currentOwnerId: string;
    transferredAt: string;
  };
  error?: string;
}

class VerifyService {
  constructor(
    private serialRepo: MockSerialRepository,
    private warrantyRepo: MockWarrantyRepository,
    private ownershipRepo: MockOwnershipRepository,
    private externalAPI: MockExternalAPIService
  ) {}

  async verifySerial(serialNumber: string): Promise<VerifyResult> {
    // Input validation
    if (!serialNumber || typeof serialNumber !== 'string') {
      return {
        isValid: false,
        serialNumber: serialNumber || '',
        error: 'Serial number is required',
      };
    }

    // Normalize serial number
    const normalizedSerial = serialNumber.trim().toUpperCase();

    // Format validation
    if (!this.isValidSerialFormat(normalizedSerial)) {
      return {
        isValid: false,
        serialNumber: normalizedSerial,
        error: 'Invalid serial number format',
      };
    }

    // Check with external API for manufacturing validation
    try {
      const externalValidation = await this.externalAPI.validateSerialWithManufacturer(
        normalizedSerial
      );
      if (!externalValidation.valid) {
        return {
          isValid: false,
          serialNumber: normalizedSerial,
          error: 'Serial not registered with manufacturer',
        };
      }
    } catch (error) {
      return {
        isValid: false,
        serialNumber: normalizedSerial,
        error: 'Unable to validate serial with manufacturer',
      };
    }

    // Lookup serial in database
    const serial = await this.serialRepo.findBySerialNumber(normalizedSerial);
    if (!serial) {
      return {
        isValid: false,
        serialNumber: normalizedSerial,
        error: 'Serial number not found in system',
      };
    }

    if (!serial.isValid) {
      return {
        isValid: false,
        serialNumber: normalizedSerial,
        error: 'Serial has been deactivated',
      };
    }

    // Get warranty status
    const warranty = await this.warrantyRepo.findBySerialNumber(normalizedSerial);
    let warrantyStatus;
    if (warranty) {
      const now = new Date();
      const endDate = new Date(warranty.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      warrantyStatus = {
        isActive: warranty.isActive && daysRemaining > 0,
        endDate: warranty.endDate.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
      };
    }

    // Get current ownership
    const ownership = await this.ownershipRepo.findCurrentOwner(normalizedSerial);
    const ownershipInfo = ownership
      ? {
          currentOwnerId: ownership.ownerId,
          transferredAt: ownership.transferredAt.toISOString(),
        }
      : undefined;

    return {
      isValid: true,
      serialNumber: normalizedSerial,
      productId: serial.productId,
      warrantyStatus,
      ownership: ownershipInfo,
    };
  }

  private isValidSerialFormat(serial: string): boolean {
    // Format: REZ-XXXXX-XXXXX (alphanumeric with dashes)
    return /^REZ-[A-Z0-9]+-[A-Z0-9]+$/i.test(serial);
  }

  async verifyBulk(serialNumbers: string[]): Promise<Map<string, VerifyResult>> {
    const results = new Map<string, VerifyResult>();

    // Process in parallel with concurrency limit
    const batchSize = 10;
    for (let i = 0; i < serialNumbers.length; i += batchSize) {
      const batch = serialNumbers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(serial => this.verifySerial(serial))
      );
      batch.forEach((serial, index) => {
        results.set(serial, batchResults[index]);
      });
    }

    return results;
  }

  async getVerificationHistory(serialNumber: string): Promise<{
    serial: ReturnType<typeof this.serialRepo.findBySerialNumber> extends Promise<infer T> ? T : never;
    verifications: Array<{ timestamp: Date; ip?: string }>;
  } | null> {
    const normalizedSerial = serialNumber.trim().toUpperCase();
    const serial = await this.serialRepo.findBySerialNumber(normalizedSerial);

    if (!serial) {
      return null;
    }

    // Return mock verification history
    const verifications = [
      { timestamp: new Date(Date.now() - 86400000), ip: '192.168.1.1' },
      { timestamp: new Date(), ip: '192.168.1.2' },
    ];

    return { serial, verifications };
  }
}

// ============================================================
// Test Suite
// ============================================================

describe('VerifyService', () => {
  let verifyService: VerifyService;
  let serialRepo: MockSerialRepository;
  let warrantyRepo: MockWarrantyRepository;
  let ownershipRepo: MockOwnershipRepository;
  let externalAPI: MockExternalAPIService;

  beforeEach(() => {
    serialRepo = new MockSerialRepository();
    warrantyRepo = new MockWarrantyRepository();
    ownershipRepo = new MockOwnershipRepository();
    externalAPI = new MockExternalAPIService();
    verifyService = new VerifyService(serialRepo, warrantyRepo, ownershipRepo, externalAPI);
  });

  afterEach(() => {
    serialRepo.clear();
    warrantyRepo.clear();
    ownershipRepo.clear();
  });

  describe('verifySerial', () => {
    describe('input validation', () => {
      it('should reject empty serial number', async () => {
        const result = await verifyService.verifySerial('');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial number is required');
      });

      it('should reject null serial number', async () => {
        const result = await verifyService.verifySerial(null as unknown as string);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial number is required');
      });

      it('should reject undefined serial number', async () => {
        const result = await verifyService.verifySerial(undefined as unknown as string);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial number is required');
      });

      it('should reject non-string serial number', async () => {
        const result = await verifyService.verifySerial(12345 as unknown as string);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial number is required');
      });

      it('should reject serial with only whitespace', async () => {
        const result = await verifyService.verifySerial('   ');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid serial number format');
      });
    });

    describe('format validation', () => {
      it('should reject invalid serial format - no prefix', async () => {
        const result = await verifyService.verifySerial('ABC123');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid serial number format');
      });

      it('should reject invalid serial format - wrong prefix', async () => {
        const result = await verifyService.verifySerial('XYZ-123-456');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid serial number format');
      });

      it('should reject invalid serial format - missing dash', async () => {
        const result = await verifyService.verifySerial('REZ12345678');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid serial number format');
      });

      it('should reject invalid serial format - special characters', async () => {
        const result = await verifyService.verifySerial('REZ@#$%^&*()');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid serial number format');
      });

      it('should accept valid serial format with lowercase', async () => {
        const mockSerial = createMockSerial({ serialNumber: 'REZ-ABC123-XYZ789' });
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial('rez-abc123-xyz789');

        expect(result.isValid).toBe(true);
        expect(result.serialNumber).toBe('REZ-ABC123-XYZ789');
      });

      it('should accept valid serial format with mixed case', async () => {
        const mockSerial = createMockSerial({ serialNumber: 'REZ-AbC123-xYz789' });
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial('ReZ-aBc123-XyZ789');

        expect(result.isValid).toBe(true);
        expect(result.serialNumber).toBe('REZ-ABC123-XYZ789');
      });

      it('should trim whitespace from serial number', async () => {
        const mockSerial = createMockSerial({ serialNumber: 'REZ-ABC123-XYZ789' });
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial('  REZ-ABC123-XYZ789  ');

        expect(result.isValid).toBe(true);
      });
    });

    describe('external API validation', () => {
      it('should fail when external API returns invalid', async () => {
        const invalidSerial = generateInvalidSerial();

        const result = await verifyService.verifySerial(invalidSerial);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial not registered with manufacturer');
      });

      it('should fail when external API throws error', async () => {
        externalAPI.setFailure(true, 'Service unavailable');
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Unable to validate serial with manufacturer');
      });

      it('should succeed when external API validates successfully', async () => {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.isValid).toBe(true);
        expect(result.productId).toBe(mockSerial.productId);
      });
    });

    describe('serial lookup', () => {
      it('should return error for non-existent serial', async () => {
        const result = await verifyService.verifySerial(generateValidSerial());

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial number not found in system');
      });

      it('should return error for deactivated serial', async () => {
        const mockSerial = createMockSerial({ isValid: false });
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Serial has been deactivated');
      });

      it('should return product ID for valid serial', async () => {
        const mockSerial = createMockSerial({ productId: 'PROD-12345' });
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.isValid).toBe(true);
        expect(result.productId).toBe('PROD-12345');
      });
    });

    describe('warranty status', () => {
      it('should return warranty info when warranty exists', async () => {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const mockWarranty = createMockWarranty({
          serialNumber: mockSerial.serialNumber,
          isActive: true,
          endDate,
        });
        await warrantyRepo.create(mockWarranty);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.warrantyStatus).toBeDefined();
        expect(result.warrantyStatus?.isActive).toBe(true);
        expect(result.warrantyStatus?.daysRemaining).toBeGreaterThan(0);
        expect(result.warrantyStatus?.daysRemaining).toBeLessThanOrEqual(31);
      });

      it('should return inactive warranty when expired', async () => {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const endDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        const mockWarranty = createMockWarranty({
          serialNumber: mockSerial.serialNumber,
          isActive: false,
          endDate,
        });
        await warrantyRepo.create(mockWarranty);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.warrantyStatus?.isActive).toBe(false);
        expect(result.warrantyStatus?.daysRemaining).toBe(0);
      });

      it('should return undefined warranty status when no warranty exists', async () => {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.warrantyStatus).toBeUndefined();
      });
    });

    describe('ownership info', () => {
      it('should return current owner info when ownership exists', async () => {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const mockOwnership = createMockOwnership({
          serialNumber: mockSerial.serialNumber,
          ownerId: 'OWNER-123',
        });
        await ownershipRepo.create(mockOwnership);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.ownership).toBeDefined();
        expect(result.ownership?.currentOwnerId).toBe('OWNER-123');
      });

      it('should return undefined ownership when no ownership record exists', async () => {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);

        const result = await verifyService.verifySerial(mockSerial.serialNumber);

        expect(result.ownership).toBeUndefined();
      });
    });
  });

  describe('verifyBulk', () => {
    it('should verify multiple serials', async () => {
      const serials = [];
      for (let i = 0; i < 5; i++) {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);
        serials.push(mockSerial.serialNumber);
      }

      const results = await verifyService.verifyBulk(serials);

      expect(results.size).toBe(5);
      for (const serial of serials) {
        expect(results.get(serial)?.isValid).toBe(true);
      }
    });

    it('should handle mixed valid and invalid serials', async () => {
      const validSerial = createMockSerial();
      await serialRepo.create(validSerial);

      const serials = [validSerial.serialNumber, generateInvalidSerial()];

      const results = await verifyService.verifyBulk(serials);

      expect(results.get(validSerial.serialNumber)?.isValid).toBe(true);
      expect(results.get(generateInvalidSerial())?.isValid).toBe(false);
    });

    it('should handle empty array', async () => {
      const results = await verifyService.verifyBulk([]);

      expect(results.size).toBe(0);
    });

    it('should handle large batch (concurrency)', async () => {
      const serials = [];
      for (let i = 0; i < 25; i++) {
        const mockSerial = createMockSerial();
        await serialRepo.create(mockSerial);
        serials.push(mockSerial.serialNumber);
      }

      const results = await verifyService.verifyBulk(serials);

      expect(results.size).toBe(25);
    });
  });

  describe('getVerificationHistory', () => {
    it('should return null for non-existent serial', async () => {
      const result = await verifyService.getVerificationHistory(generateValidSerial());

      expect(result).toBeNull();
    });

    it('should return verification history for existing serial', async () => {
      const mockSerial = createMockSerial();
      await serialRepo.create(mockSerial);

      const result = await verifyService.getVerificationHistory(mockSerial.serialNumber);

      expect(result).not.toBeNull();
      expect(result?.serial.serialNumber).toBe(mockSerial.serialNumber);
      expect(result?.verifications).toBeDefined();
      expect(result?.verifications.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// Serial Format Validation Tests
// ============================================================

describe('Serial Format Validation', () => {
  const isValidSerialFormat = (serial: string): boolean => {
    return /^REZ-[A-Z0-9]+-[A-Z0-9]+$/i.test(serial);
  };

  it('should accept valid serial format', () => {
    expect(isValidSerialFormat('REZ-ABC123-XYZ789')).toBe(true);
    expect(isValidSerialFormat('REZ-12345-67890')).toBe(true);
    expect(isValidSerialFormat('REZ-A-B')).toBe(true);
    expect(isValidSerialFormat('REZ-1234-ABCD')).toBe(true);
  });

  it('should reject invalid serial formats', () => {
    expect(isValidSerialFormat('REZABC123XYZ789')).toBe(false);
    expect(isValidSerialFormat('REZ-ABC123')).toBe(false);
    expect(isValidSerialFormat('ABC123-XYZ789')).toBe(false);
    expect(isValidSerialFormat('REZ--XYZ789')).toBe(false);
    expect(isValidSerialFormat('')).toBe(false);
    expect(isValidSerialFormat('REZ-ABC@123-XYZ')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isValidSerialFormat('rez-abc123-xyz789')).toBe(true);
    expect(isValidSerialFormat('ReZ-AbC123-xYz789')).toBe(true);
    expect(isValidSerialFormat('REZ-ABC123-XYZ789')).toBe(true);
  });
});
