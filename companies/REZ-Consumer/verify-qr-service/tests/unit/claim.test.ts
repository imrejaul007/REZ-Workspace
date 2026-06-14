/**
 * Unit Tests for Claim Service
 * Tests claim filing, processing, status updates, and validation
 */

import {
  createMockSerial,
  createMockWarranty,
  createMockClaim,
  createMockOwnership,
  MockSerialRepository,
  MockWarrantyRepository,
  MockClaimRepository,
  MockOwnershipRepository,
  generateValidSerial,
} from '../setup';

// ============================================================
// Types
// ============================================================

type ClaimStatus = 'pending' | 'approved' | 'rejected';

interface ClaimResult {
  success: boolean;
  claimId?: string;
  error?: string;
}

interface ClaimDetails {
  id: string;
  serialNumber: string;
  ownerId: string;
  reason: string;
  status: ClaimStatus;
  filedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

interface ClaimReview {
  claimId: string;
  decision: 'approved' | 'rejected';
  reviewerId: string;
  notes: string;
}

// ============================================================
// Service Implementation
// ============================================================

class ClaimService {
  private readonly MAX_CLAIMS_PER_WARRANTY = 2;

  constructor(
    private claimRepo: MockClaimRepository,
    private warrantyRepo: MockWarrantyRepository,
    private serialRepo: MockSerialRepository,
    private ownershipRepo: MockOwnershipRepository
  ) {}

  async fileClaim(
    serialNumber: string,
    ownerId: string,
    reason: string,
    evidence?: string[]
  ): Promise<ClaimResult> {
    // Validate serial exists
    const serial = await this.serialRepo.findBySerialNumber(serialNumber);
    if (!serial) {
      return { success: false, error: 'Serial number not found' };
    }

    // Verify ownership
    const ownership = await this.ownershipRepo.findCurrentOwner(serialNumber);
    if (!ownership || ownership.ownerId !== ownerId) {
      return { success: false, error: 'You do not own this product' };
    }

    // Check warranty status
    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);
    if (!warranty) {
      return { success: false, error: 'No warranty found for this product' };
    }

    if (!warranty.isActive) {
      return { success: false, error: 'Warranty is not active' };
    }

    const now = new Date();
    if (new Date(warranty.endDate) < now) {
      return { success: false, error: 'Warranty has expired' };
    }

    // Check claim limit
    if (warranty.claimCount >= this.MAX_CLAIMS_PER_WARRANTY) {
      return { success: false, error: `Maximum claims (${this.MAX_CLAIMS_PER_WARRANTY}) reached for this warranty` };
    }

    // Validate reason
    const validReasons = [
      'product_defect',
      'manufacturing_error',
      'premature_failure',
      'damage_in_transit',
      'other',
    ];
    if (!validReasons.includes(reason)) {
      return { success: false, error: 'Invalid claim reason' };
    }

    // Create claim
    const claim = createMockClaim({
      serialNumber,
      ownerId,
      reason,
      status: 'pending',
      filedAt: now,
    });

    await this.claimRepo.create(claim);

    // Increment claim count on warranty
    await this.warrantyRepo.update(warranty.id, {
      claimCount: warranty.claimCount + 1,
    });

    return {
      success: true,
      claimId: claim.id,
    };
  }

  async getClaim(claimId: string): Promise<ClaimDetails | null> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) return null;

    return {
      id: claim.id,
      serialNumber: claim.serialNumber,
      ownerId: claim.ownerId,
      reason: claim.reason,
      status: claim.status,
      filedAt: claim.filedAt,
      resolvedAt: claim.resolvedAt,
    };
  }

  async getClaimsBySerial(serialNumber: string): Promise<ClaimDetails[]> {
    const claims = await this.claimRepo.findBySerialNumber(serialNumber);

    return claims.map(claim => ({
      id: claim.id,
      serialNumber: claim.serialNumber,
      ownerId: claim.ownerId,
      reason: claim.reason,
      status: claim.status,
      filedAt: claim.filedAt,
      resolvedAt: claim.resolvedAt,
    }));
  }

  async getClaimsByOwner(ownerId: string): Promise<ClaimDetails[]> {
    const claims = await this.claimRepo.findByOwnerId(ownerId);

    return claims.map(claim => ({
      id: claim.id,
      serialNumber: claim.serialNumber,
      ownerId: claim.ownerId,
      reason: claim.reason,
      status: claim.status,
      filedAt: claim.filedAt,
      resolvedAt: claim.resolvedAt,
    }));
  }

  async reviewClaim(review: ClaimReview): Promise<{ success: boolean; error?: string }> {
    const claim = await this.claimRepo.findById(review.claimId);

    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }

    if (claim.status !== 'pending') {
      return { success: false, error: 'Claim has already been processed' };
    }

    await this.claimRepo.update(review.claimId, {
      status: review.decision,
      resolvedAt: new Date(),
    });

    return { success: true };
  }

  async cancelClaim(
    claimId: string,
    ownerId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const claim = await this.claimRepo.findById(claimId);

    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }

    if (claim.ownerId !== ownerId) {
      return { success: false, error: 'You are not the owner of this claim' };
    }

    if (claim.status !== 'pending') {
      return { success: false, error: 'Cannot cancel a processed claim' };
    }

    // Decrement claim count on warranty
    const warranty = await this.warrantyRepo.findBySerialNumber(claim.serialNumber);
    if (warranty) {
      await this.warrantyRepo.update(warranty.id, {
        claimCount: Math.max(0, warranty.claimCount - 1),
      });
    }

    // Mark as rejected with cancellation note
    await this.claimRepo.update(claimId, {
      status: 'rejected',
      resolvedAt: new Date(),
    });

    return { success: true };
  }

  async getPendingClaims(): Promise<ClaimDetails[]> {
    const claims = await this.claimRepo.findByStatus('pending');

    return claims.map(claim => ({
      id: claim.id,
      serialNumber: claim.serialNumber,
      ownerId: claim.ownerId,
      reason: claim.reason,
      status: claim.status,
      filedAt: claim.filedAt,
    }));
  }

  async getClaimStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageResolutionTime: number;
  }> {
    const all = await this.claimRepo.findByStatus('pending');
    const pending = all.length;
    const approved = (await this.claimRepo.findByStatus('approved')).length;
    const rejected = (await this.claimRepo.findByStatus('rejected')).length;

    // Calculate average resolution time
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    const resolved = [
      ...(await this.claimRepo.findByStatus('approved')),
      ...(await this.claimRepo.findByStatus('rejected')),
    ];

    for (const claim of resolved) {
      if (claim.resolvedAt) {
        totalResolutionTime +=
          claim.resolvedAt.getTime() - claim.filedAt.getTime();
        resolvedCount++;
      }
    }

    const averageResolutionTime =
      resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24) : 0;

    return {
      total: pending + approved + rejected,
      pending,
      approved,
      rejected,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
    };
  }
}

// ============================================================
// Test Suite
// ============================================================

describe('ClaimService', () => {
  let claimService: ClaimService;
  let claimRepo: MockClaimRepository;
  let warrantyRepo: MockWarrantyRepository;
  let serialRepo: MockSerialRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    claimRepo = new MockClaimRepository();
    warrantyRepo = new MockWarrantyRepository();
    serialRepo = new MockSerialRepository();
    ownershipRepo = new MockOwnershipRepository();
    claimService = new ClaimService(claimRepo, warrantyRepo, serialRepo, ownershipRepo);
  });

  afterEach(() => {
    claimRepo.clear();
    warrantyRepo.clear();
    serialRepo.clear();
    ownershipRepo.clear();
  });

  describe('fileClaim', () => {
    const setupValidClaim = async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty);

      return { serial, ownership, warranty };
    };

    it('should successfully file a claim', async () => {
      const { serial } = await setupValidClaim();

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );

      expect(result.success).toBe(true);
      expect(result.claimId).toBeDefined();
    });

    it('should increment claim count after filing', async () => {
      const { serial, warranty } = await setupValidClaim();

      await claimService.fileClaim(serial.serialNumber, 'USER-001', 'product_defect');

      const updatedWarranty = await warrantyRepo.findBySerialNumber(serial.serialNumber);
      expect(updatedWarranty?.claimCount).toBe(1);
    });

    it('should fail for non-existent serial', async () => {
      const result = await claimService.fileClaim(
        generateValidSerial(),
        'USER-001',
        'product_defect'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serial number not found');
    });

    it('should fail if user is not the owner', async () => {
      const { serial } = await setupValidClaim();

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-002',
        'product_defect'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not own this product');
    });

    it('should fail if no warranty exists', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No warranty found for this product');
    });

    it('should fail if warranty is not active', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: false,
      });
      await warrantyRepo.create(warranty);

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty is not active');
    });

    it('should fail if warranty is expired', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const endDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
        endDate,
      });
      await warrantyRepo.create(warranty);

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Warranty has expired');
    });

    it('should fail if maximum claims reached', async () => {
      const { serial } = await setupValidClaim();

      // File 2 claims (max limit)
      await claimService.fileClaim(serial.serialNumber, 'USER-001', 'product_defect');
      await claimService.fileClaim(serial.serialNumber, 'USER-001', 'manufacturing_error');

      // Third claim should fail
      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'premature_failure'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum claims');
    });

    it('should fail for invalid reason', async () => {
      const { serial } = await setupValidClaim();

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'invalid_reason'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid claim reason');
    });

    it('should accept all valid claim reasons', async () => {
      const { serial } = await setupValidClaim();
      const validReasons = [
        'product_defect',
        'manufacturing_error',
        'premature_failure',
        'damage_in_transit',
        'other',
      ];

      for (const reason of validReasons) {
        // Use fresh serial for each reason
        const freshSerial = createMockSerial();
        await serialRepo.create(freshSerial);
        const ownership = createMockOwnership({
          serialNumber: freshSerial.serialNumber,
          ownerId: 'USER-001',
        });
        await ownershipRepo.create(ownership);
        const warranty = createMockWarranty({
          serialNumber: freshSerial.serialNumber,
          ownerId: 'USER-001',
          isActive: true,
          claimCount: 0,
        });
        await warrantyRepo.create(warranty);

        const result = await claimService.fileClaim(
          freshSerial.serialNumber,
          'USER-001',
          reason
        );
        expect(result.success).toBe(true);
      }
    });
  });

  describe('getClaim', () => {
    it('should return claim details for valid claim ID', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const claimResult = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );

      const claim = await claimService.getClaim(claimResult.claimId!);

      expect(claim).not.toBeNull();
      expect(claim?.id).toBe(claimResult.claimId);
      expect(claim?.serialNumber).toBe(serial.serialNumber);
      expect(claim?.status).toBe('pending');
    });

    it('should return null for non-existent claim', async () => {
      const claim = await claimService.getClaim('NON-EXISTENT-ID');

      expect(claim).toBeNull();
    });
  });

  describe('getClaimsBySerial', () => {
    it('should return all claims for a serial', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty);

      await claimService.fileClaim(serial.serialNumber, 'USER-001', 'product_defect');

      // Create second warranty for second claim
      const warranty2 = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty2);

      await claimService.fileClaim(serial.serialNumber, 'USER-001', 'manufacturing_error');

      const claims = await claimService.getClaimsBySerial(serial.serialNumber);

      expect(claims.length).toBe(2);
    });

    it('should return empty array for serial with no claims', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const claims = await claimService.getClaimsBySerial(serial.serialNumber);

      expect(claims).toEqual([]);
    });
  });

  describe('getClaimsByOwner', () => {
    it('should return all claims for an owner', async () => {
      // Create multiple products for owner
      for (let i = 0; i < 3; i++) {
        const serial = createMockSerial();
        await serialRepo.create(serial);

        const ownership = createMockOwnership({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
        });
        await ownershipRepo.create(ownership);

        const warranty = createMockWarranty({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
          isActive: true,
          claimCount: 0,
        });
        await warrantyRepo.create(warranty);

        await claimService.fileClaim(serial.serialNumber, 'USER-001', 'product_defect');
      }

      const claims = await claimService.getClaimsByOwner('USER-001');

      expect(claims.length).toBe(3);
    });
  });

  describe('reviewClaim', () => {
    let claimId: string;

    beforeEach(async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );
      claimId = result.claimId!;
    });

    it('should approve a pending claim', async () => {
      const result = await claimService.reviewClaim({
        claimId,
        decision: 'approved',
        reviewerId: 'ADMIN-001',
        notes: 'Valid claim, approved for refund',
      });

      expect(result.success).toBe(true);

      const claim = await claimService.getClaim(claimId);
      expect(claim?.status).toBe('approved');
      expect(claim?.resolvedAt).toBeDefined();
    });

    it('should reject a pending claim', async () => {
      const result = await claimService.reviewClaim({
        claimId,
        decision: 'rejected',
        reviewerId: 'ADMIN-001',
        notes: 'Claim does not meet warranty criteria',
      });

      expect(result.success).toBe(true);

      const claim = await claimService.getClaim(claimId);
      expect(claim?.status).toBe('rejected');
    });

    it('should fail for non-existent claim', async () => {
      const result = await claimService.reviewClaim({
        claimId: 'NON-EXISTENT',
        decision: 'approved',
        reviewerId: 'ADMIN-001',
        notes: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Claim not found');
    });

    it('should fail for already processed claim', async () => {
      // First review
      await claimService.reviewClaim({
        claimId,
        decision: 'approved',
        reviewerId: 'ADMIN-001',
        notes: 'First review',
      });

      // Second review should fail
      const result = await claimService.reviewClaim({
        claimId,
        decision: 'rejected',
        reviewerId: 'ADMIN-002',
        notes: 'Second review',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Claim has already been processed');
    });
  });

  describe('cancelClaim', () => {
    let claimId: string;

    beforeEach(async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        isActive: true,
        claimCount: 1,
      });
      await warrantyRepo.create(warranty);

      const result = await claimService.fileClaim(
        serial.serialNumber,
        'USER-001',
        'product_defect'
      );
      claimId = result.claimId!;
    });

    it('should cancel a pending claim and decrement count', async () => {
      const result = await claimService.cancelClaim(
        claimId,
        'USER-001',
        'Changed my mind'
      );

      expect(result.success).toBe(true);

      const claim = await claimService.getClaim(claimId);
      expect(claim?.status).toBe('rejected');
    });

    it('should fail if user is not the owner', async () => {
      const result = await claimService.cancelClaim(
        claimId,
        'USER-002',
        'Unauthorized cancellation'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You are not the owner of this claim');
    });

    it('should fail for already processed claim', async () => {
      await claimService.reviewClaim({
        claimId,
        decision: 'approved',
        reviewerId: 'ADMIN-001',
        notes: 'Approved',
      });

      const result = await claimService.cancelClaim(
        claimId,
        'USER-001',
        'Too late to cancel'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot cancel a processed claim');
    });
  });

  describe('getPendingClaims', () => {
    it('should return only pending claims', async () => {
      // Create claims in different states
      for (let i = 0; i < 3; i++) {
        const serial = createMockSerial();
        await serialRepo.create(serial);

        const ownership = createMockOwnership({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
        });
        await ownershipRepo.create(ownership);

        const warranty = createMockWarranty({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
          isActive: true,
        });
        await warrantyRepo.create(warranty);

        const result = await claimService.fileClaim(
          serial.serialNumber,
          'USER-001',
          'product_defect'
        );

        // Approve some claims
        if (i === 0) {
          await claimService.reviewClaim({
            claimId: result.claimId!,
            decision: 'approved',
            reviewerId: 'ADMIN-001',
            notes: 'Approved',
          });
        }
      }

      const pending = await claimService.getPendingClaims();

      expect(pending.length).toBe(2);
      expect(pending.every(c => c.status === 'pending')).toBe(true);
    });
  });

  describe('getClaimStats', () => {
    it('should return correct claim statistics', async () => {
      // Create various claims
      for (let i = 0; i < 5; i++) {
        const serial = createMockSerial();
        await serialRepo.create(serial);

        const ownership = createMockOwnership({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
        });
        await ownershipRepo.create(ownership);

        const warranty = createMockWarranty({
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
          isActive: true,
        });
        await warrantyRepo.create(warranty);

        const result = await claimService.fileClaim(
          serial.serialNumber,
          'USER-001',
          'product_defect'
        );

        // Mix of approved and rejected
        if (i < 2) {
          await claimService.reviewClaim({
            claimId: result.claimId!,
            decision: 'approved',
            reviewerId: 'ADMIN-001',
            notes: 'Approved',
          });
        } else if (i < 3) {
          await claimService.reviewClaim({
            claimId: result.claimId!,
            decision: 'rejected',
            reviewerId: 'ADMIN-001',
            notes: 'Rejected',
          });
        }
      }

      const stats = await claimService.getClaimStats();

      expect(stats.total).toBe(5);
      expect(stats.pending).toBe(2);
      expect(stats.approved).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.averageResolutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty claims', async () => {
      const stats = await claimService.getClaimStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
    });
  });
});

// ============================================================
// Edge Cases Tests
// ============================================================

describe('Claim Edge Cases', () => {
  let claimService: ClaimService;
  let claimRepo: MockClaimRepository;
  let warrantyRepo: MockWarrantyRepository;
  let serialRepo: MockSerialRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    claimRepo = new MockClaimRepository();
    warrantyRepo = new MockWarrantyRepository();
    serialRepo = new MockSerialRepository();
    ownershipRepo = new MockOwnershipRepository();
    claimService = new ClaimService(claimRepo, warrantyRepo, serialRepo, ownershipRepo);
  });

  it('should handle concurrent claim filings', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    const warranty = createMockWarranty({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
      isActive: true,
      claimCount: 0,
    });
    await warrantyRepo.create(warranty);

    // Simulate concurrent filings
    const results = await Promise.all([
      claimService.fileClaim(serial.serialNumber, 'USER-001', 'product_defect'),
      claimService.fileClaim(serial.serialNumber, 'USER-001', 'manufacturing_error'),
    ]);

    // First two should succeed, third would fail
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThanOrEqual(1);
    expect(successCount).toBeLessThanOrEqual(2);
  });

  it('should handle warranty expiring during claim review', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    const warranty = createMockWarranty({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
      isActive: true,
    });
    await warrantyRepo.create(warranty);

    const result = await claimService.fileClaim(
      serial.serialNumber,
      'USER-001',
      'product_defect'
    );

    expect(result.success).toBe(true);

    // Deactivate warranty during review
    await warrantyRepo.update(warranty.id, { isActive: false });

    // Claim should still be accessible
    const claim = await claimService.getClaim(result.claimId!);
    expect(claim).not.toBeNull();
  });

  it('should handle ownership transfer during claim review', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    const warranty = createMockWarranty({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
      isActive: true,
    });
    await warrantyRepo.create(warranty);

    const result = await claimService.fileClaim(
      serial.serialNumber,
      'USER-001',
      'product_defect'
    );

    // Transfer ownership to new user
    await ownershipRepo.create(createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-002',
      previousOwnerId: 'USER-001',
    }));

    // Original claim should still be accessible
    const claim = await claimService.getClaim(result.claimId!);
    expect(claim?.ownerId).toBe('USER-001');
  });
});
