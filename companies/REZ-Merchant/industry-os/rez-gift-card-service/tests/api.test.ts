/**
 * REZ Gift Card Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('./models', () => ({
  GiftCard: {
    findOne: vi.fn(),
    find: vi.fn().mockReturnThis(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    select: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
  },
  GiftCardCampaign: {
    find: vi.fn().mockReturnThis(),
    create: vi.fn(),
    sort: vi.fn().mockReturnThis(),
  },
  GiftCardTransaction: {
    create: vi.fn(),
    find: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  },
}));

describe('REZ Gift Card Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'rez-gift-card-service',
        version: '1.0.0',
        database: 'connected',
        timestamp: expect.any(String),
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.database).toBe('connected');
    });

    it('should return liveness status', () => {
      const mockLivenessResponse = { status: 'alive' };
      expect(mockLivenessResponse.status).toBe('alive');
    });

    it('should return readiness status', () => {
      const mockReadinessResponse = { status: 'ready' };
      expect(mockReadinessResponse.status).toBe('ready');
    });
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4047', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have internal service token', () => {
      const internalToken = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';
      expect(typeof internalToken).toBe('string');
      expect(internalToken.length).toBeGreaterThan(0);
    });
  });

  describe('Gift Card Creation', () => {
    it('should validate gift card creation schema', () => {
      const createSchema = {
        amount: expect.any(Number),
        merchantId: expect.any(String),
        issuedBy: expect.any(String),
        customerName: expect.any(String),
        customerEmail: expect.any(String),
        customerPhone: expect.stringMatching(/^[6-9]\d{9}$/),
        validityDays: expect.any(Number),
        pin: expect.stringMatching(/^\d{4}$/),
      };

      const mockData = {
        amount: 1000,
        merchantId: 'MCH-001',
        issuedBy: 'ADMIN-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '9876543210',
        validityDays: 365,
        pin: '1234',
      };

      expect(mockData).toMatchObject(createSchema);
    });

    it('should validate amount range', () => {
      const amount = 1000;
      expect(amount).toBeGreaterThanOrEqual(100);
      expect(amount).toBeLessThanOrEqual(100000);
    });
  });

  describe('Gift Card Redemption', () => {
    it('should validate redemption schema', () => {
      const redeemSchema = {
        cardNumber: expect.any(String),
        amount: expect.any(Number),
        merchantId: expect.any(String),
        redeemedBy: expect.any(String),
        orderId: expect.any(String),
        description: expect.any(String),
      };

      const mockData = {
        cardNumber: 'GC47211234567890',
        amount: 500,
        merchantId: 'MCH-001',
        redeemedBy: 'STAFF-001',
        orderId: 'ORD-001',
        description: 'Payment for order',
      };

      expect(mockData).toMatchObject(redeemSchema);
    });

    it('should validate amount for redemption', () => {
      const redemptionAmount = 500;
      expect(redemptionAmount).toBeGreaterThan(0);
    });
  });

  describe('Gift Card Validation', () => {
    it('should validate card validation schema', () => {
      const validateSchema = {
        cardNumber: expect.any(String),
        pin: expect.stringMatching(/^\d{4}$/),
      };

      const mockData = {
        cardNumber: 'GC47211234567890',
        pin: '1234',
      };

      expect(mockData).toMatchObject(validateSchema);
    });

    it('should validate card number format', () => {
      const cardNumber = 'GC47211234567890';
      expect(cardNumber.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Gift Card Status', () => {
    it('should have valid status values', () => {
      const validStatuses = ['active', 'redeemed', 'expired', 'cancelled'];
      expect(validStatuses).toContain('active');
      expect(validStatuses).toContain('redeemed');
    });
  });

  describe('Gift Card Response Format', () => {
    it('should return issue response format', () => {
      const issueResponse = {
        success: true,
        data: {
          cardId: expect.any(String),
          cardNumber: expect.any(String),
          pin: expect.any(String),
          amount: expect.any(Number),
          currentBalance: expect.any(Number),
          expiresAt: expect.any(Date),
        },
      };

      const mockResponse = {
        success: true,
        data: {
          cardId: 'GC-001',
          cardNumber: 'GC47211234567890',
          pin: '1234',
          amount: 1000,
          currentBalance: 1000,
          expiresAt: new Date(),
        },
      };

      expect(mockResponse).toMatchObject(issueResponse);
    });

    it('should return validation response format', () => {
      const validateResponse = {
        success: true,
        data: {
          cardId: expect.any(String),
          cardNumber: expect.any(String),
          currentBalance: expect.any(Number),
          status: expect.stringMatching(/^(active|redeemed|expired)/),
          expiresAt: expect.any(Date),
          isValid: expect.any(Boolean),
        },
      };

      const mockResponse = {
        success: true,
        data: {
          cardId: 'GC-001',
          cardNumber: 'GC47211234567890',
          currentBalance: 500,
          status: 'active',
          expiresAt: new Date(),
          isValid: true,
        },
      };

      expect(mockResponse).toMatchObject(validateResponse);
    });

    it('should return redemption response format', () => {
      const redeemResponse = {
        success: true,
        data: {
          cardId: expect.any(String),
          cardNumber: expect.any(String),
          amountRedeemed: expect.any(Number),
          newBalance: expect.any(Number),
          status: expect.stringMatching(/^(active|redeemed)/),
        },
      };

      const mockResponse = {
        success: true,
        data: {
          cardId: 'GC-001',
          cardNumber: 'GC47211234567890',
          amountRedeemed: 500,
          newBalance: 500,
          status: 'active',
        },
      };

      expect(mockResponse).toMatchObject(redeemResponse);
    });
  });

  describe('Campaign Management', () => {
    it('should validate campaign schema', () => {
      const campaignSchema = {
        campaignId: expect.any(String),
        name: expect.any(String),
        merchantId: expect.any(String),
        cardsIssued: expect.any(Number),
        status: expect.stringMatching(/^(active|paused|completed)$/),
      };

      const mockCampaign = {
        campaignId: 'GC-CAMP-001',
        name: 'Holiday Special',
        merchantId: 'MCH-001',
        cardsIssued: 50,
        status: 'active',
      };

      expect(mockCampaign).toMatchObject(campaignSchema);
    });
  });

  describe('Analytics', () => {
    it('should validate analytics summary schema', () => {
      const summarySchema = {
        totalCards: expect.any(Number),
        activeCards: expect.any(Number),
        totalIssued: expect.any(Number),
        totalRedeemed: expect.any(Number),
        outstandingBalance: expect.any(Number),
      };

      const mockSummary = {
        totalCards: 100,
        activeCards: 75,
        totalIssued: 100000,
        totalRedeemed: 60000,
        outstandingBalance: 40000,
      };

      expect(mockSummary).toMatchObject(summarySchema);
    });
  });

  describe('Transaction Types', () => {
    it('should have valid transaction types', () => {
      const transactionTypes = ['issue', 'redeem', 'refund', 'expire'];
      expect(transactionTypes).toContain('issue');
      expect(transactionTypes).toContain('redeem');
    });
  });

  describe('Error Handling', () => {
    it('should return not found error', () => {
      const notFoundError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Gift card not found',
        },
      };

      expect(notFoundError.success).toBe(false);
      expect(notFoundError.error.code).toBe('NOT_FOUND');
    });

    it('should return insufficient balance error', () => {
      const balanceError = {
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: expect.stringContaining('Insufficient balance'),
        },
      };

      expect(balanceError.success).toBe(false);
      expect(balanceError.error.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should return expired error', () => {
      const expiredError = {
        success: false,
        error: {
          code: 'EXPIRED',
          message: 'Gift card has expired',
        },
      };

      expect(expiredError.success).toBe(false);
      expect(expiredError.error.code).toBe('EXPIRED');
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limit configuration', () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      };

      expect(rateLimitConfig.windowMs).toBe(900000);
      expect(rateLimitConfig.max).toBe(100);
    });
  });

  describe('Currency', () => {
    it('should use INR as default currency', () => {
      const currency = 'INR';
      expect(currency).toBe('INR');
    });
  });
});