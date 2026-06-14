import {
  TrustScoreSchema,
  CreditLimitSchema,
  TrustAlertSchema,
  SyncRequestSchema,
  BatchSyncRequestSchema,
} from '../types';

describe('Type Validation Schemas', () => {
  describe('TrustScoreSchema', () => {
    it('should validate correct trust score data', () => {
      const validData = {
        merchantId: 'merchant-123',
        score: 85,
        riskLevel: 'LOW',
        factors: {
          paymentHistory: 90,
          disputeRate: 5,
          complianceScore: 95,
          businessAge: 80,
          volumeScore: 75,
        },
        lastUpdated: new Date().toISOString(),
        source: 'fraud-service',
      };

      const result = TrustScoreSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid merchant ID', () => {
      const invalidData = {
        merchantId: '',
        score: 85,
        riskLevel: 'LOW',
        factors: {
          paymentHistory: 90,
          disputeRate: 5,
          complianceScore: 95,
          businessAge: 80,
          volumeScore: 75,
        },
        lastUpdated: new Date().toISOString(),
        source: 'test',
      };

      const result = TrustScoreSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject score out of range', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        score: 150,
        riskLevel: 'LOW',
        factors: {
          paymentHistory: 90,
          disputeRate: 5,
          complianceScore: 95,
          businessAge: 80,
          volumeScore: 75,
        },
        lastUpdated: new Date().toISOString(),
        source: 'test',
      };

      const result = TrustScoreSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid risk level', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        score: 85,
        riskLevel: 'VERY_HIGH',
        factors: {
          paymentHistory: 90,
          disputeRate: 5,
          complianceScore: 95,
          businessAge: 80,
          volumeScore: 75,
        },
        lastUpdated: new Date().toISOString(),
        source: 'test',
      };

      const result = TrustScoreSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid factor scores', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        score: 85,
        riskLevel: 'LOW',
        factors: {
          paymentHistory: 150,
          disputeRate: 5,
          complianceScore: 95,
          businessAge: 80,
          volumeScore: 75,
        },
        lastUpdated: new Date().toISOString(),
        source: 'test',
      };

      const result = TrustScoreSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreditLimitSchema', () => {
    it('should validate correct credit limit data', () => {
      const validData = {
        merchantId: 'merchant-123',
        currentLimit: 500000,
        availableLimit: 450000,
        usedLimit: 50000,
        creditUtilization: 10,
        lastCalculated: new Date().toISOString(),
      };

      const result = CreditLimitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative limits', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        currentLimit: -1000,
        availableLimit: 500000,
        usedLimit: 50000,
        creditUtilization: 10,
        lastCalculated: new Date().toISOString(),
      };

      const result = CreditLimitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject utilization over 100%', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        currentLimit: 500000,
        availableLimit: -50000,
        usedLimit: 550000,
        creditUtilization: 110,
        lastCalculated: new Date().toISOString(),
      };

      const result = CreditLimitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TrustAlertSchema', () => {
    it('should validate correct alert data', () => {
      const validData = {
        merchantId: 'merchant-123',
        alertType: 'TRUST_DROP',
        severity: 'WARNING',
        message: 'Trust score dropped by 15%',
        previousScore: 85,
        currentScore: 70,
        createdAt: new Date().toISOString(),
      };

      const result = TrustAlertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default acknowledged to false', () => {
      const validData = {
        merchantId: 'merchant-123',
        alertType: 'TRUST_DROP',
        severity: 'WARNING',
        message: 'Trust score dropped',
        createdAt: new Date().toISOString(),
      };

      const result = TrustAlertSchema.parse(validData);
      expect(result.acknowledged).toBe(false);
    });

    it('should reject invalid alert type', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        alertType: 'INVALID_TYPE',
        severity: 'WARNING',
        message: 'Test',
        createdAt: new Date().toISOString(),
      };

      const result = TrustAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        merchantId: 'merchant-123',
        alertType: 'TRUST_DROP',
        severity: 'HIGH',
        message: 'Test',
        createdAt: new Date().toISOString(),
      };

      const result = TrustAlertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('SyncRequestSchema', () => {
    it('should validate correct sync request', () => {
      const validData = {
        merchantId: 'merchant-123',
        forceSync: true,
      };

      const result = SyncRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default forceSync to false', () => {
      const validData = {
        merchantId: 'merchant-123',
      };

      const result = SyncRequestSchema.parse(validData);
      expect(result.forceSync).toBe(false);
    });
  });

  describe('BatchSyncRequestSchema', () => {
    it('should validate correct batch sync request', () => {
      const validData = {
        merchantIds: ['merchant-1', 'merchant-2', 'merchant-3'],
        forceSync: false,
      };

      const result = BatchSyncRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty merchant IDs', () => {
      const invalidData = {
        merchantIds: [],
        forceSync: false,
      };

      const result = BatchSyncRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many merchant IDs', () => {
      const invalidData = {
        merchantIds: Array(101).fill('merchant-id'),
        forceSync: false,
      };

      const result = BatchSyncRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject merchant IDs with empty strings', () => {
      const invalidData = {
        merchantIds: ['merchant-1', '', 'merchant-3'],
        forceSync: false,
      };

      const result = BatchSyncRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
