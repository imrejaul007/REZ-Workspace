/**
 * Unit Tests for Warranty Service
 * Tests warranty activation, validation, expiration, and management
 */

import {
  createMockSerial,
  createMockWarranty,
  createMockOwnership,
  MockSerialRepository,
  MockWarrantyRepository,
  MockOwnershipRepository,
  generateValidSerial,
} from '../setup';

// ============================================================
// Types
// ============================================================

interface ActivationResult {
  success: boolean;
  warrantyId?: string;
  startDate?: string;
  endDate?: string;
  error?: string;
}

interface WarrantyStatus {
  isActive: boolean;
  daysRemaining: number;
  endDate: string;
  claimCount: number;
  canFileClaim: boolean;
}

// ============================================================
// Service Implementation
// ============================================================

class WarrantyService {
  private readonly DEFAULT_WARRANTY_DAYS = 365;

  constructor(
    private warrantyRepo: MockWarrantyRepository,
    private serialRepo: MockSerialRepository,
    private ownershipRepo: MockOwnershipRepository
  ) {}

  async activateWarranty(
    serialNumber: string,
    ownerId: string,
    durationDays?: number
  ): Promise<ActivationResult> {
    // Validate serial number exists
    const serial = await this.serialRepo.findBySerialNumber(serialNumber);
    if (!serial) {
      return { success: false, error: 'Serial number not found' };
    }

    if (!serial.isValid) {
      return { success: false, error: 'Serial is not valid' };
    }

    // Check if warranty already exists
    const existingWarranty = await this.warrantyRepo.findBySerialNumber(serialNumber);
    if (existingWarranty) {
      return { success: false, error: 'Warranty already activated' };
    }

    // Verify ownership
    const ownership = await this.ownershipRepo.findCurrentOwner(serialNumber);
    if (!ownership || ownership.ownerId !== ownerId) {
      return { success: false, error: 'You do not own this product' };
    }

    // Calculate warranty dates
    const duration = durationDays || this.DEFAULT_WARRANTY_DAYS;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // Create warranty
    const warranty = createMockWarranty({
      serialNumber,
      ownerId,
      startDate,
      endDate,
      isActive: true,
      claimCount: 0,
    });

    await this.warrantyRepo.create(warranty);

    return {
      success: true,
      warrantyId: warranty.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  async getWarrantyStatus(serialNumber: string): Promise<WarrantyStatus | null> {
    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);

    if (!warranty) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(warranty.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isActive = warranty.isActive && daysRemaining > 0;

    // Can file claim if warranty is active and under claim limit
    const MAX_CLAIMS_PER_WARRANTY = 2;
    const canFileClaim = isActive && warranty.claimCount < MAX_CLAIMS_PER_WARRANTY;

    return {
      isActive,
      daysRemaining: Math.max(0, daysRemaining),
      endDate: warranty.endDate.toISOString(),
      claimCount: warranty.claimCount,
      canFileClaim,
    };
  }

  async extendWarranty(
    serialNumber: string,
    ownerId: string,
    additionalDays: number
  ): Promise<ActivationResult> {
    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);

    if (!warranty) {
      return { success: false, error: 'Warranty not found' };
    }

    if (warranty.ownerId !== ownerId) {
      return { success: false, error: 'You do not own this warranty' };
    }

    if (!warranty.isActive) {
      return { success: false, error: 'Warranty is not active' };
    }

    const currentEndDate = new Date(warranty.endDate);
    const newEndDate = new Date(
      currentEndDate.getTime() + additionalDays * 24 * 60 * 60 * 1000
    );

    await this.warrantyRepo.update(warranty.id, { endDate: newEndDate });

    return {
      success: true,
      warrantyId: warranty.id,
      endDate: newEndDate.toISOString(),
    };
  }

  async transferWarranty(
    serialNumber: string,
    fromOwnerId: string,
    toOwnerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);

    if (!warranty) {
      return { success: false, error: 'Warranty not found' };
    }

    if (warranty.ownerId !== fromOwnerId) {
      return { success: false, error: 'You do not own this warranty' };
    }

    // Transfer ownership
    await this.warrantyRepo.update(warranty.id, { ownerId: toOwnerId });

    return { success: true };
  }

  async getWarrantiesByOwner(ownerId: string): Promise<WarrantyStatus[]> {
    const warranties = await this.warrantyRepo.findByOwnerId(ownerId);

    const statuses: WarrantyStatus[] = [];
    for (const warranty of warranties) {
      const status = await this.getWarrantyStatus(warranty.serialNumber);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  async getActiveWarranties(): Promise<Array<{ serialNumber: string; ownerId: string; daysRemaining: number }>> {
    const warranties = await this.warrantyRepo.findActive();

    return warranties.map(warranty => {
      const now = new Date();
      const endDate = new Date(warranty.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        serialNumber: warranty.serialNumber,
        ownerId: warranty.ownerId,
        daysRemaining: Math.max(0, daysRemaining),
      };
    });
  }

  async deactivateWarranty(serialNumber: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);

    if (!warranty) {
      return { success: false, error: 'Warranty not found' };
    }

    await this.warrantyRepo.update(warranty.id, { isActive: false });

    return { success: true };
  }
}

// ============================================================
// Test Suite
// ============================================================

describe('WarrantyService', () => {
  let warrantyService: WarrantyService;
  let warrantyRepo: MockWarrantyRepository;
  let serialRepo: MockSerialRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    warrantyRepo = new MockWarrantyRepository();
    serialRepo = new MockSerialRepository();
    ownershipRepo = new MockOwnershipRepository();
    warrantyService = new WarrantyService(warrantyRepo, serialRepo, ownershipRepo);
  });

  afterEach(() => {
    warrantyRepo.clear();
    serialRepo.clear();
    ownershipRepo.clear();
  });

  describe('activateWarranty', () => {
    it('should successfully activate warranty for valid serial', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const result = await warrantyService.activateWarranty(serial.serialNumber, 'USER-001');

      expect(result.success).toBe(true);
      expect(result.warrantyId).toBeDefined();
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });

    it('should activate warranty with custom duration', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const result = await warrantyService.activateWarranty(
        serial.serialNumber,
        'USER-001',
        180
      );

      expect(result.success).toBe(true);

      const startTime = new Date(result.startDate!).getTime();
      const endTime = new Date(result.endDate!).getTime();
      const durationDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));

      expect(durationDays).toBe(180);
    });

    it('should fail for non-existent serial', async () => {
      const result = await warrantyService.activateWarranty(
        generateValidSerial(),
        'USER-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serial number not found');
    });

    it('should fail for invalid serial', async () => {
      const serial = createMockSerial({ isValid: false });
      await serialRepo.create(serial);

      const result = await warrantyService.activateWarranty(
        serial.serialNumber,
        'USER-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serial is not valid');
    });

    it('should fail if warranty already exists', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      // First activation
      await warrantyService.activateWarranty(serial.serialNumber, 'USER-001');

      // Second activation should fail
      const result = await warrantyService.activateWarranty(serial.serialNumber, 'USER-001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty already activated');
    });

    it('should fail if user is not the owner', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const result = await warrantyService.activateWarranty(
        serial.serialNumber,
        'USER-002'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not own this product');
    });

    it('should fail if no ownership record exists', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const result = await warrantyService.activateWarranty(
        serial.serialNumber,
        'USER-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not own this product');
    });

    it('should default to 365 days warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const result = await warrantyService.activateWarranty(serial.serialNumber, 'USER-001');

      const startTime = new Date(result.startDate!).getTime();
      const endTime = new Date(result.endDate!).getTime();
      const durationDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));

      expect(durationDays).toBe(365);
    });
  });

  describe('getWarrantyStatus', () => {
    it('should return active status for valid warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
        endDate,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty);

      const status = await warrantyService.getWarrantyStatus(serial.serialNumber);

      expect(status).not.toBeNull();
      expect(status?.isActive).toBe(true);
      expect(status?.daysRemaining).toBeGreaterThan(0);
      expect(status?.canFileClaim).toBe(true);
    });

    it('should return inactive status for expired warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const endDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
        endDate,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty);

      const status = await warrantyService.getWarrantyStatus(serial.serialNumber);

      expect(status?.isActive).toBe(false);
      expect(status?.daysRemaining).toBe(0);
      expect(status?.canFileClaim).toBe(false);
    });

    it('should return inactive status for deactivated warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: false,
        endDate,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty);

      const status = await warrantyService.getWarrantyStatus(serial.serialNumber);

      expect(status?.isActive).toBe(false);
      expect(status?.canFileClaim).toBe(false);
    });

    it('should not allow claim when claim limit reached', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
        endDate,
        claimCount: 2, // At limit
      });
      await warrantyRepo.create(warranty);

      const status = await warrantyService.getWarrantyStatus(serial.serialNumber);

      expect(status?.canFileClaim).toBe(false);
    });

    it('should return null for non-existent warranty', async () => {
      const status = await warrantyService.getWarrantyStatus(generateValidSerial());

      expect(status).toBeNull();
    });
  });

  describe('extendWarranty', () => {
    it('should extend warranty duration', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const originalEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
        endDate: originalEndDate,
      });
      await warrantyRepo.create(warranty);

      const result = await warrantyService.extendWarranty(
        serial.serialNumber,
        'USER-001',
        90
      );

      expect(result.success).toBe(true);

      const newEndTime = new Date(result.endDate!).getTime();
      const originalEndTime = originalEndDate.getTime();
      const extendedDays = Math.ceil((newEndTime - originalEndTime) / (1000 * 60 * 60 * 24));

      expect(extendedDays).toBe(90);
    });

    it('should fail for non-existent warranty', async () => {
      const result = await warrantyService.extendWarranty(
        generateValidSerial(),
        'USER-001',
        90
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty not found');
    });

    it('should fail if user is not the owner', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const result = await warrantyService.extendWarranty(
        serial.serialNumber,
        'USER-002',
        90
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not own this warranty');
    });

    it('should fail if warranty is not active', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: false,
      });
      await warrantyRepo.create(warranty);

      const result = await warrantyService.extendWarranty(
        serial.serialNumber,
        'USER-001',
        90
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty is not active');
    });
  });

  describe('transferWarranty', () => {
    it('should transfer warranty to new owner', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const result = await warrantyService.transferWarranty(
        serial.serialNumber,
        'USER-001',
        'USER-002'
      );

      expect(result.success).toBe(true);

      // Verify ownership was transferred
      const updatedWarranty = await warrantyRepo.findBySerialNumber(serial.serialNumber);
      expect(updatedWarranty?.ownerId).toBe('USER-002');
    });

    it('should fail if user is not the owner', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const result = await warrantyService.transferWarranty(
        serial.serialNumber,
        'USER-002',
        'USER-003'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not own this warranty');
    });

    it('should fail for non-existent warranty', async () => {
      const result = await warrantyService.transferWarranty(
        generateValidSerial(),
        'USER-001',
        'USER-002'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty not found');
    });
  });

  describe('getWarrantiesByOwner', () => {
    it('should return all warranties for owner', async () => {
      const serials = [];
      for (let i = 0; i < 3; i++) {
        const serial = createMockSerial();
        await serialRepo.create(serial);

        const warranty = createMockWarranty({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
          isActive: true,
        });
        await warrantyRepo.create(warranty);
        serials.push(serial);
      }

      const statuses = await warrantyService.getWarrantiesByOwner('USER-001');

      expect(statuses.length).toBe(3);
    });

    it('should return empty array for owner with no warranties', async () => {
      const statuses = await warrantyService.getWarrantiesByOwner('USER-WITH-NO-WARRANTIES');

      expect(statuses).toEqual([]);
    });
  });

  describe('getActiveWarranties', () => {
    it('should return only active warranties', async () => {
      // Create active warranty
      const activeSerial = createMockSerial();
      await serialRepo.create(activeSerial);
      const activeWarranty = createMockWarranty({
        serialNumber: activeSerial.serialNumber,
        isActive: true,
      });
      await warrantyRepo.create(activeWarranty);

      // Create inactive warranty
      const inactiveSerial = createMockSerial();
      await serialRepo.create(inactiveSerial);
      const inactiveWarranty = createMockWarranty({
        serialNumber: inactiveSerial.serialNumber,
        isActive: false,
      });
      await warrantyRepo.create(inactiveWarranty);

      const activeWarranties = await warrantyService.getActiveWarranties();

      expect(activeWarranties.length).toBe(1);
      expect(activeWarranties[0].serialNumber).toBe(activeSerial.serialNumber);
    });
  });

  describe('deactivateWarranty', () => {
    it('should deactivate warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const result = await warrantyService.deactivateWarranty(
        serial.serialNumber,
        'Product recalled'
      );

      expect(result.success).toBe(true);

      const updatedWarranty = await warrantyRepo.findBySerialNumber(serial.serialNumber);
      expect(updatedWarranty?.isActive).toBe(false);
    });

    it('should fail for non-existent warranty', async () => {
      const result = await warrantyService.deactivateWarranty(
        generateValidSerial(),
        'Product recalled'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty not found');
    });
  });
});

// ============================================================
// Edge Cases Tests
// ============================================================

describe('Warranty Edge Cases', () => {
  let warrantyRepo: MockWarrantyRepository;
  let serialRepo: MockSerialRepository;
  let ownershipRepo: MockOwnershipRepository;
  let warrantyService: WarrantyService;

  beforeEach(() => {
    warrantyRepo = new MockWarrantyRepository();
    serialRepo = new MockSerialRepository();
    ownershipRepo = new MockOwnershipRepository();
    warrantyService = new WarrantyService(warrantyRepo, serialRepo, ownershipRepo);
  });

  it('should handle warranty expiring today', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const warranty = createMockWarranty({
      serialNumber: serial.serialNumber,
      isActive: true,
      endDate,
    });
    await warrantyRepo.create(warranty);

    const status = await warrantyService.getWarrantyStatus(serial.serialNumber);

    expect(status?.isActive).toBe(true);
    expect(status?.daysRemaining).toBe(0);
  });

  it('should handle warranty starting today', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    const result = await warrantyService.activateWarranty(serial.serialNumber, 'USER-001');

    expect(result.success).toBe(true);

    const status = await warrantyService.getWarrantyStatus(serial.serialNumber);
    expect(status?.isActive).toBe(true);
    expect(status?.daysRemaining).toBe(365);
  });

  it('should handle maximum warranty duration', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    // Maximum 5 years
    const result = await warrantyService.activateWarranty(
      serial.serialNumber,
      'USER-001',
      1825
    );

    expect(result.success).toBe(true);

    const status = await warrantyService.getWarrantyStatus(serial.serialNumber);
    expect(status?.daysRemaining).toBe(1825);
  });
});
