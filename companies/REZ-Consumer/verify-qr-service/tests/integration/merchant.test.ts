/**
 * Integration Tests for Merchant Service
 * Tests merchant operations, serial generation, batch processing, and merchant-specific workflows
 */

import {
  createMockSerial,
  createMockWarranty,
  createMockOwnership,
  MockSerialRepository,
  MockWarrantyRepository,
  MockOwnershipRepository,
  generateValidSerial,
  generateInvalidSerial,
} from '../setup';

// ============================================================
// Types
// ============================================================

interface Merchant {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  tier: 'basic' | 'standard' | 'premium';
  serialQuota: number;
  createdAt: Date;
}

interface SerialBatch {
  batchId: string;
  merchantId: string;
  serials: string[];
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface MerchantStats {
  totalSerialsGenerated: number;
  activeSerials: number;
  deactivatedSerials: number;
  warrantyActivations: number;
  claimsFiled: number;
}

// ============================================================
// Service Implementation
// ============================================================

class MerchantService {
  private readonly SERIALS_PER_BATCH_LIMIT = 1000;
  private readonly BATCH_COOLDOWN_MS = 60 * 1000; // 1 minute between batches

  constructor(
    private serialRepo: MockSerialRepository,
    private warrantyRepo: MockWarrantyRepository,
    private ownershipRepo: MockOwnershipRepository
  ) {}

  async registerMerchant(
    name: string,
    tier: 'basic' | 'standard' | 'premium' = 'basic'
  ): Promise<{ success: boolean; merchant?: Merchant; error?: string }> {
    if (!name || name.length < 3) {
      return { success: false, error: 'Merchant name must be at least 3 characters' };
    }

    const quotas: Record<string, number> = {
      basic: 1000,
      standard: 10000,
      premium: 100000,
    };

    const merchant: Merchant = {
      id: `MERCH-${Date.now()}`,
      name,
      apiKey: this.generateApiKey(),
      isActive: true,
      tier,
      serialQuota: quotas[tier],
      createdAt: new Date(),
    };

    return { success: true, merchant };
  }

  async generateSerials(
    merchantId: string,
    quantity: number,
    productId: string
  ): Promise<{ success: boolean; batch?: SerialBatch; error?: string }> {
    // Validate quantity
    if (quantity <= 0 || quantity > this.SERIALS_PER_BATCH_LIMIT) {
      return {
        success: false,
        error: `Quantity must be between 1 and ${this.SERIALS_PER_BATCH_LIMIT}`,
      };
    }

    // Check merchant exists and is active
    const merchant = await this.getMerchant(merchantId);
    if (!merchant) {
      return { success: false, error: 'Merchant not found' };
    }

    if (!merchant.isActive) {
      return { success: false, error: 'Merchant account is inactive' };
    }

    // Check quota
    const currentUsage = await this.getMerchantSerialCount(merchantId);
    if (currentUsage + quantity > merchant.serialQuota) {
      return {
        success: false,
        error: `Serial quota exceeded. Available: ${merchant.serialQuota - currentUsage}`,
      };
    }

    // Generate serials
    const serials: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const serialNumber = this.generateSerialNumber(merchantId);
      const serial = createMockSerial({
        serialNumber,
        productId,
        merchantId,
        isValid: true,
      });
      await this.serialRepo.create(serial);
      serials.push(serialNumber);
    }

    const batch: SerialBatch = {
      batchId: `BATCH-${Date.now()}`,
      merchantId,
      serials,
      createdAt: new Date(),
      status: 'completed',
    };

    return { success: true, batch };
  }

  async deactivateSerial(
    serialNumber: string,
    merchantId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const serial = await this.serialRepo.findBySerialNumber(serialNumber);

    if (!serial) {
      return { success: false, error: 'Serial not found' };
    }

    if (serial.merchantId !== merchantId) {
      return { success: false, error: 'Serial does not belong to this merchant' };
    }

    if (!serial.isValid) {
      return { success: false, error: 'Serial is already deactivated' };
    }

    await this.serialRepo.update(serialNumber, { isValid: false });

    return { success: true };
  }

  async transferSerialsToCustomer(
    serialNumbers: string[],
    merchantId: string,
    customerId: string
  ): Promise<{ success: boolean; transferred: number; error?: string }> {
    // Validate all serials belong to merchant
    const validSerials: string[] = [];
    for (const serialNumber of serialNumbers) {
      const serial = await this.serialRepo.findBySerialNumber(serialNumber);
      if (serial && serial.merchantId === merchantId && serial.isValid) {
        validSerials.push(serialNumber);
      }
    }

    if (validSerials.length === 0) {
      return { success: false, transferred: 0, error: 'No valid serials found' };
    }

    // Create ownership records
    for (const serialNumber of validSerials) {
      const ownership = createMockOwnership({
        serialNumber,
        ownerId: customerId,
        previousOwnerId: merchantId,
        transferReason: 'Sale',
      });
      await this.ownershipRepo.create(ownership);
    }

    return { success: true, transferred: validSerials.length };
  }

  async getMerchantSerials(
    merchantId: string,
    options?: { productId?: string; isValid?: boolean; limit?: number; offset?: number }
  ): Promise<{ serials: string[]; total: number }> {
    let serials = await this.serialRepo.findByMerchantId(merchantId);

    if (options?.productId) {
      serials = serials.filter(s => s.productId === options.productId);
    }

    if (options?.isValid !== undefined) {
      serials = serials.filter(s => s.isValid === options.isValid);
    }

    const total = serials.length;

    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    serials = serials.slice(offset, offset + limit);

    return {
      serials: serials.map(s => s.serialNumber),
      total,
    };
  }

  async getMerchantStats(merchantId: string): Promise<MerchantStats> {
    const serials = await this.serialRepo.findByMerchantId(merchantId);
    const allWarranties = Array.from(
      new Set(
        serials.map(s =>
          this.warrantyRepo.findBySerialNumber(s.serialNumber)
        )
      )
    );

    let warrantyActivations = 0;
    for (const warrantyPromise of allWarranties) {
      const warranty = await warrantyPromise;
      if (warranty) warrantyActivations++;
    }

    return {
      totalSerialsGenerated: serials.length,
      activeSerials: serials.filter(s => s.isValid).length,
      deactivatedSerials: serials.filter(s => !s.isValid).length,
      warrantyActivations,
      claimsFiled: 0, // Would require claim repo access
    };
  }

  async updateMerchantTier(
    merchantId: string,
    newTier: 'basic' | 'standard' | 'premium'
  ): Promise<{ success: boolean; error?: string }> {
    // Mock implementation
    return { success: true };
  }

  async suspendMerchant(merchantId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async reactivateMerchant(merchantId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  // Private helper methods
  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  private generateSerialNumber(merchantId: string): string {
    const prefix = 'REZ';
    const merchantSuffix = merchantId.slice(-4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}-${merchantSuffix}`;
  }

  private async getMerchant(merchantId: string): Promise<Merchant | null> {
    // Mock merchant lookup
    if (merchantId.startsWith('MERCH-')) {
      return {
        id: merchantId,
        name: 'Test Merchant',
        apiKey: 'test-api-key',
        isActive: true,
        tier: 'standard',
        serialQuota: 10000,
        createdAt: new Date(),
      };
    }
    return null;
  }

  private async getMerchantSerialCount(merchantId: string): Promise<number> {
    const serials = await this.serialRepo.findByMerchantId(merchantId);
    return serials.length;
  }
}

// ============================================================
// Test Suite
// ============================================================

describe('MerchantService', () => {
  let merchantService: MerchantService;
  let serialRepo: MockSerialRepository;
  let warrantyRepo: MockWarrantyRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    serialRepo = new MockSerialRepository();
    warrantyRepo = new MockWarrantyRepository();
    ownershipRepo = new MockOwnershipRepository();
    merchantService = new MerchantService(serialRepo, warrantyRepo, ownershipRepo);
  });

  afterEach(() => {
    serialRepo.clear();
    warrantyRepo.clear();
    ownershipRepo.clear();
  });

  describe('registerMerchant', () => {
    it('should register a new merchant with basic tier', async () => {
      const result = await merchantService.registerMerchant('Test Store');

      expect(result.success).toBe(true);
      expect(result.merchant).toBeDefined();
      expect(result.merchant?.name).toBe('Test Store');
      expect(result.merchant?.tier).toBe('basic');
      expect(result.merchant?.apiKey).toBeDefined();
      expect(result.merchant?.apiKey.length).toBe(32);
    });

    it('should register a merchant with custom tier', async () => {
      const result = await merchantService.registerMerchant('Premium Store', 'premium');

      expect(result.success).toBe(true);
      expect(result.merchant?.tier).toBe('premium');
      expect(result.merchant?.serialQuota).toBe(100000);
    });

    it('should fail for short merchant name', async () => {
      const result = await merchantService.registerMerchant('AB');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant name must be at least 3 characters');
    });

    it('should fail for empty merchant name', async () => {
      const result = await merchantService.registerMerchant('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant name must be at least 3 characters');
    });

    it('should generate unique API keys', async () => {
      const result1 = await merchantService.registerMerchant('Store 1');
      const result2 = await merchantService.registerMerchant('Store 2');

      expect(result1.merchant?.apiKey).not.toBe(result2.merchant?.apiKey);
    });
  });

  describe('generateSerials', () => {
    it('should generate serials successfully', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      const result = await merchantService.generateSerials(merchantId, 10, 'PROD-001');

      expect(result.success).toBe(true);
      expect(result.batch).toBeDefined();
      expect(result.batch?.serials.length).toBe(10);
      expect(result.batch?.status).toBe('completed');
    });

    it('should create serials in database', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 5, 'PROD-001');

      const serials = await serialRepo.findByMerchantId(merchantId);
      expect(serials.length).toBe(5);
    });

    it('should include merchant ID in generated serials', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      const result = await merchantService.generateSerials(merchantId, 5, 'PROD-001');

      const serials = await serialRepo.findByMerchantId(merchantId);
      expect(serials.every(s => s.merchantId === merchantId)).toBe(true);
    });

    it('should fail for non-existent merchant', async () => {
      const result = await merchantService.generateSerials('INVALID-MERCHANT', 10, 'PROD-001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
    });

    it('should fail for inactive merchant', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      await merchantService.suspendMerchant(merchant.merchant!.id);

      const result = await merchantService.generateSerials(
        merchant.merchant!.id,
        10,
        'PROD-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant account is inactive');
    });

    it('should fail when exceeding batch limit', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');

      const result = await merchantService.generateSerials(
        merchant.merchant!.id,
        1001,
        'PROD-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be between 1 and');
    });

    it('should fail for zero quantity', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');

      const result = await merchantService.generateSerials(
        merchant.merchant!.id,
        0,
        'PROD-001'
      );

      expect(result.success).toBe(false);
    });

    it('should fail for negative quantity', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');

      const result = await merchantService.generateSerials(
        merchant.merchant!.id,
        -5,
        'PROD-001'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('deactivateSerial', () => {
    it('should deactivate a valid serial', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 1, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);
      const serialNumber = serials[0];

      const result = await merchantService.deactivateSerial(
        serialNumber,
        merchantId,
        'Product recalled'
      );

      expect(result.success).toBe(true);

      const serial = await serialRepo.findBySerialNumber(serialNumber);
      expect(serial?.isValid).toBe(false);
    });

    it('should fail for non-existent serial', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');

      const result = await merchantService.deactivateSerial(
        'REZ-NOTFOUND-123',
        merchant.merchant!.id,
        'Test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serial not found');
    });

    it('should fail for serial from different merchant', async () => {
      const merchant1 = await merchantService.registerMerchant('Merchant 1');
      const merchant2 = await merchantService.registerMerchant('Merchant 2');
      const merchantId1 = merchant1.merchant!.id;
      const merchantId2 = merchant2.merchant!.id;

      await merchantService.generateSerials(merchantId1, 1, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId1);
      const serialNumber = serials[0];

      const result = await merchantService.deactivateSerial(
        serialNumber,
        merchantId2,
        'Unauthorized'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serial does not belong to this merchant');
    });

    it('should fail for already deactivated serial', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 1, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);
      const serialNumber = serials[0];

      // First deactivation
      await merchantService.deactivateSerial(serialNumber, merchantId, 'First');

      // Second deactivation should fail
      const result = await merchantService.deactivateSerial(
        serialNumber,
        merchantId,
        'Second'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serial is already deactivated');
    });
  });

  describe('transferSerialsToCustomer', () => {
    it('should transfer serials to customer', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 5, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);

      const result = await merchantService.transferSerialsToCustomer(
        serials,
        merchantId,
        'CUSTOMER-001'
      );

      expect(result.success).toBe(true);
      expect(result.transferred).toBe(5);

      // Verify ownership
      for (const serialNumber of serials) {
        const ownership = await ownershipRepo.findCurrentOwner(serialNumber);
        expect(ownership?.ownerId).toBe('CUSTOMER-001');
        expect(ownership?.previousOwnerId).toBe(merchantId);
        expect(ownership?.transferReason).toBe('Sale');
      }
    });

    it('should handle partial transfer when some serials invalid', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 3, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);

      // Deactivate one serial
      await merchantService.deactivateSerial(serials[0], merchantId, 'Recalled');

      // Add an invalid serial
      const invalidSerials = [...serials, 'REZ-INVALID-123'];

      const result = await merchantService.transferSerialsToCustomer(
        invalidSerials,
        merchantId,
        'CUSTOMER-001'
      );

      expect(result.success).toBe(true);
      expect(result.transferred).toBe(2); // Only valid serials
    });

    it('should fail when all serials are invalid', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 2, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);

      // Deactivate all
      for (const serial of serials) {
        await merchantService.deactivateSerial(serial, merchantId, 'Recalled');
      }

      const result = await merchantService.transferSerialsToCustomer(
        serials,
        merchantId,
        'CUSTOMER-001'
      );

      expect(result.success).toBe(false);
      expect(result.transferred).toBe(0);
      expect(result.error).toBe('No valid serials found');
    });
  });

  describe('getMerchantSerials', () => {
    it('should return all merchant serials', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 10, 'PROD-001');

      const result = await merchantService.getMerchantSerials(merchantId);

      expect(result.serials.length).toBe(10);
      expect(result.total).toBe(10);
    });

    it('should filter by product ID', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 5, 'PROD-001');
      await merchantService.generateSerials(merchantId, 3, 'PROD-002');

      const result = await merchantService.getMerchantSerials(merchantId, {
        productId: 'PROD-001',
      });

      expect(result.serials.length).toBe(5);
      expect(result.total).toBe(5);
    });

    it('should filter by validity', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 5, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);

      // Deactivate some
      await merchantService.deactivateSerial(serials[0], merchantId, 'Recalled');
      await merchantService.deactivateSerial(serials[1], merchantId, 'Recalled');

      const activeSerials = await merchantService.getMerchantSerials(merchantId, {
        isValid: true,
      });
      const inactiveSerials = await merchantService.getMerchantSerials(merchantId, {
        isValid: false,
      });

      expect(activeSerials.serials.length).toBe(3);
      expect(inactiveSerials.serials.length).toBe(2);
    });

    it('should paginate results', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 25, 'PROD-001');

      const page1 = await merchantService.getMerchantSerials(merchantId, {
        limit: 10,
        offset: 0,
      });
      const page2 = await merchantService.getMerchantSerials(merchantId, {
        limit: 10,
        offset: 10,
      });
      const page3 = await merchantService.getMerchantSerials(merchantId, {
        limit: 10,
        offset: 20,
      });

      expect(page1.serials.length).toBe(10);
      expect(page2.serials.length).toBe(10);
      expect(page3.serials.length).toBe(5);
      expect(page1.total).toBe(25);
      expect(page2.total).toBe(25);
      expect(page3.total).toBe(25);

      // Ensure no overlap
      const allSerials = [...page1.serials, ...page2.serials, ...page3.serials];
      const uniqueSerials = new Set(allSerials);
      expect(uniqueSerials.size).toBe(25);
    });
  });

  describe('getMerchantStats', () => {
    it('should return accurate statistics', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.generateSerials(merchantId, 10, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);

      // Deactivate some
      await merchantService.deactivateSerial(serials[0], merchantId, 'Recalled');
      await merchantService.deactivateSerial(serials[1], merchantId, 'Recalled');

      // Activate warranties for some
      for (let i = 2; i < 5; i++) {
        const warranty = createMockWarranty({
          serialNumber: serials[i],
          isActive: true,
        });
        await warrantyRepo.create(warranty);
      }

      const stats = await merchantService.getMerchantStats(merchantId);

      expect(stats.totalSerialsGenerated).toBe(10);
      expect(stats.activeSerials).toBe(8);
      expect(stats.deactivatedSerials).toBe(2);
      expect(stats.warrantyActivations).toBe(3);
    });

    it('should return zeros for new merchant', async () => {
      const merchant = await merchantService.registerMerchant('New Merchant');
      const merchantId = merchant.merchant!.id;

      const stats = await merchantService.getMerchantStats(merchantId);

      expect(stats.totalSerialsGenerated).toBe(0);
      expect(stats.activeSerials).toBe(0);
      expect(stats.deactivatedSerials).toBe(0);
    });
  });

  describe('Merchant Account Management', () => {
    it('should update merchant tier', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');

      const result = await merchantService.updateMerchantTier(
        merchant.merchant!.id,
        'premium'
      );

      expect(result.success).toBe(true);
    });

    it('should suspend merchant', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      const suspendResult = await merchantService.suspendMerchant(merchantId);
      expect(suspendResult.success).toBe(true);

      // Verify merchant cannot generate serials
      const generateResult = await merchantService.generateSerials(merchantId, 5, 'PROD-001');
      expect(generateResult.success).toBe(false);
      expect(generateResult.error).toBe('Merchant account is inactive');
    });

    it('should reactivate suspended merchant', async () => {
      const merchant = await merchantService.registerMerchant('Test Merchant');
      const merchantId = merchant.merchant!.id;

      await merchantService.suspendMerchant(merchantId);
      const reactivateResult = await merchantService.reactivateMerchant(merchantId);
      expect(reactivateResult.success).toBe(true);

      // Verify merchant can generate serials again
      const generateResult = await merchantService.generateSerials(merchantId, 5, 'PROD-001');
      expect(generateResult.success).toBe(true);
    });
  });
});

// ============================================================
// Merchant Workflow Tests
// ============================================================

describe('Merchant Workflows', () => {
  let merchantService: MerchantService;
  let serialRepo: MockSerialRepository;
  let warrantyRepo: MockWarrantyRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    serialRepo = new MockSerialRepository();
    warrantyRepo = new MockWarrantyRepository();
    ownershipRepo = new MockOwnershipRepository();
    merchantService = new MerchantService(serialRepo, warrantyRepo, ownershipRepo);
  });

  afterEach(() => {
    serialRepo.clear();
    warrantyRepo.clear();
    ownershipRepo.clear();
  });

  describe('Full Sales Lifecycle', () => {
    it('should complete full product sales workflow', async () => {
      // 1. Register merchant
      const merchantResult = await merchantService.registerMerchant(
        'Electronics Store',
        'standard'
      );
      expect(merchantResult.success).toBe(true);
      const merchantId = merchantResult.merchant!.id;

      // 2. Generate serials for new product batch
      const batchResult = await merchantService.generateSerials(
        merchantId,
        100,
        'LAPTOP-PRO-2024'
      );
      expect(batchResult.success).toBe(true);
      expect(batchResult.batch?.serials.length).toBe(100);

      // 3. Check merchant stats
      let stats = await merchantService.getMerchantStats(merchantId);
      expect(stats.totalSerialsGenerated).toBe(100);
      expect(stats.activeSerials).toBe(100);

      // 4. Transfer serials to customer
      const { serials } = await merchantService.getMerchantSerials(merchantId);
      const customerSerials = serials.slice(0, 5);
      const transferResult = await merchantService.transferSerialsToCustomer(
        customerSerials,
        merchantId,
        'CUSTOMER-JOHN-001'
      );
      expect(transferResult.success).toBe(true);
      expect(transferResult.transferred).toBe(5);

      // 5. Verify ownership transfer
      for (const serial of customerSerials) {
        const ownership = await ownershipRepo.findCurrentOwner(serial);
        expect(ownership?.ownerId).toBe('CUSTOMER-JOHN-001');
      }

      // 6. Deactivate a recalled serial
      const recalledSerial = serials[10];
      const deactivateResult = await merchantService.deactivateSerial(
        recalledSerial,
        merchantId,
        'Manufacturing defect - recall'
      );
      expect(deactivateResult.success).toBe(true);

      // 7. Final stats check
      stats = await merchantService.getMerchantStats(merchantId);
      expect(stats.totalSerialsGenerated).toBe(100);
      expect(stats.activeSerials).toBe(99); // 5 transferred + 1 deactivated
      expect(stats.deactivatedSerials).toBe(1);
    });

    it('should handle bulk customer distribution', async () => {
      // Register merchant
      const merchantResult = await merchantService.registerMerchant('Wholesale Distributor');
      const merchantId = merchantResult.merchant!.id;

      // Generate large batch
      const batchResult = await merchantService.generateSerials(
        merchantId,
        500,
        'BULK-PRODUCT-001'
      );
      expect(batchResult.success).toBe(true);

      // Distribute to multiple retailers
      const retailers = ['RETAILER-A', 'RETAILER-B', 'RETAILER-C'];
      const serialsPerRetailer = Math.floor(500 / retailers.length);

      const { serials } = await merchantService.getMerchantSerials(merchantId);

      for (let i = 0; i < retailers.length; i++) {
        const startIdx = i * serialsPerRetailer;
        const endIdx = startIdx + serialsPerRetailer;
        const retailerSerials = serials.slice(startIdx, endIdx);

        const transferResult = await merchantService.transferSerialsToCustomer(
          retailerSerials,
          merchantId,
          retailers[i]
        );
        expect(transferResult.transferred).toBe(serialsPerRetailer);
      }

      // Check final stats
      const stats = await merchantService.getMerchantStats(merchantId);
      expect(stats.activeSerials).toBe(500);
    });

    it('should handle serial deactivation workflow', async () => {
      // Register merchant
      const merchantResult = await merchantService.registerMerchant('Test Store');
      const merchantId = merchantResult.merchant!.id;

      // Generate serials
      await merchantService.generateSerials(merchantId, 10, 'PROD-001');
      const { serials } = await merchantService.getMerchantSerials(merchantId);

      // Deactivate multiple serials with different reasons
      const deactivationReasons = [
        { serial: serials[0], reason: 'Customer returned defective product' },
        { serial: serials[1], reason: 'Manufacturing defect detected' },
        { serial: serials[2], reason: 'Product recalled by manufacturer' },
      ];

      for (const { serial, reason } of deactivationReasons) {
        const result = await merchantService.deactivateSerial(serial, merchantId, reason);
        expect(result.success).toBe(true);
      }

      // Verify final state
      const activeSerials = await merchantService.getMerchantSerials(merchantId, {
        isValid: true,
      });
      const inactiveSerials = await merchantService.getMerchantSerials(merchantId, {
        isValid: false,
      });

      expect(activeSerials.serials.length).toBe(7);
      expect(inactiveSerials.serials.length).toBe(3);
    });
  });

  describe('Tier-Based Quotas', () => {
    it('should enforce basic tier quota', async () => {
      const merchant = await merchantService.registerMerchant('Basic Tier Store', 'basic');
      const merchantId = merchant.merchant!.id;

      // Basic tier has 1000 quota
      // Generate 1000 serials - should succeed
      const result1 = await merchantService.generateSerials(merchantId, 1000, 'PROD-001');
      expect(result1.success).toBe(true);

      // Try to generate 1 more - should fail
      const result2 = await merchantService.generateSerials(merchantId, 1, 'PROD-001');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('quota exceeded');
    });

    it('should enforce standard tier quota', async () => {
      const merchant = await merchantService.registerMerchant('Standard Tier Store', 'standard');
      const merchantId = merchant.merchant!.id;

      // Standard tier has 10000 quota
      const result = await merchantService.generateSerials(merchantId, 10000, 'PROD-001');
      expect(result.success).toBe(true);

      // Try to exceed
      const result2 = await merchantService.generateSerials(merchantId, 1, 'PROD-001');
      expect(result2.success).toBe(false);
    });

    it('should enforce premium tier quota', async () => {
      const merchant = await merchantService.registerMerchant('Premium Tier Store', 'premium');
      const merchantId = merchant.merchant!.id;

      // Premium tier has 100000 quota
      // Generate in batches
      for (let i = 0; i < 10; i++) {
        const result = await merchantService.generateSerials(merchantId, 10000, 'PROD-001');
        expect(result.success).toBe(true);
      }

      // Should be at quota now
      const stats = await merchantService.getMerchantStats(merchantId);
      expect(stats.totalSerialsGenerated).toBe(100000);
    });
  });

  describe('Error Recovery', () => {
    it('should handle concurrent serial generation', async () => {
      const merchant = await merchantService.registerMerchant('Concurrent Store');
      const merchantId = merchant.merchant!.id;

      // Simulate concurrent requests
      const results = await Promise.all([
        merchantService.generateSerials(merchantId, 100, 'PROD-A'),
        merchantService.generateSerials(merchantId, 100, 'PROD-B'),
        merchantService.generateSerials(merchantId, 100, 'PROD-C'),
      ]);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);

      // Total should be 300
      const stats = await merchantService.getMerchantStats(merchantId);
      expect(stats.totalSerialsGenerated).toBe(300);
    });

    it('should handle partial batch failures', async () => {
      const merchant = await merchantService.registerMerchant('Partial Store', 'basic');
      const merchantId = merchant.merchant!.id;

      // Generate up to quota
      await merchantService.generateSerials(merchantId, 999, 'PROD-001');

      // This should partially succeed based on remaining quota
      const result = await merchantService.generateSerials(merchantId, 5, 'PROD-001');
      expect(result.success).toBe(true);
      expect(result.batch?.serials.length).toBe(1); // Only 1 remaining in quota
    });
  });
});

// ============================================================
// Serial Format Tests
// ============================================================

describe('Serial Number Format', () => {
  let merchantService: MerchantService;
  let serialRepo: MockSerialRepository;

  beforeEach(() => {
    serialRepo = new MockSerialRepository();
    merchantService = new MerchantService(
      serialRepo,
      new MockWarrantyRepository(),
      new MockOwnershipRepository()
    );
  });

  afterEach(() => {
    serialRepo.clear();
  });

  it('should generate serials with correct format', async () => {
    const merchant = await merchantService.registerMerchant('Format Test');
    const merchantId = merchant.merchant!.id;

    const result = await merchantService.generateSerials(merchantId, 10, 'PROD-001');

    for (const serial of result.batch!.serials) {
      // Format: REZ-XXXXX-XXXX-MERCH suffix
      expect(serial).toMatch(/^REZ-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/);
    }
  });

  it('should include merchant identifier in serial', async () => {
    const merchant = await merchantService.registerMerchant('Merchant ID Test');
    const merchantId = merchant.merchant!.id;

    const result = await merchantService.generateSerials(merchantId, 5, 'PROD-001');

    for (const serial of result.batch!.serials) {
      expect(serial).toContain(merchantId.slice(-4).toUpperCase());
    }
  });

  it('should generate unique serials', async () => {
    const merchant = await merchantService.registerMerchant('Unique Test');
    const merchantId = merchant.merchant!.id;

    const result = await merchantService.generateSerials(merchantId, 1000, 'PROD-001');

    const uniqueSerials = new Set(result.batch!.serials);
    expect(uniqueSerials.size).toBe(1000);
  });
});
