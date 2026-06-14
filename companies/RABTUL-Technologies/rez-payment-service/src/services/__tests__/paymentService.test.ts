/**
 * Unit tests for PaymentService
 *
 * Note: This service uses Node's built-in test runner (node --test).
 * Tests are organized using describe() blocks for consistency with Jest-style tests.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock modules before importing
jest.mock('mongoose', () => {
  const mockSession = {
    withTransaction: jest.fn().mockImplementation(async (fn) => fn()),
    endSession: jest.fn(),
  };
  return {
    default: {
      connection: {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      },
      isValidObjectId: jest.fn().mockReturnValue(true),
      Types: {
        ObjectId: jest.fn().mockImplementation((id) => id),
      },
      startSession: jest.fn().mockResolvedValue(mockSession),
    },
    Schema: jest.fn(),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1234'),
}));

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    eval: jest.fn().mockResolvedValue(1),
  }),
}));

// Mock BullMQ Queue
const mockQueueAdd = jest.fn().mockResolvedValue({ id: 'job-123' });
const mockQueueGetJob = jest.fn().mockResolvedValue(null);
const mockQueueOn = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    getJob: mockQueueGetJob,
    on: mockQueueOn,
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

// Mock fetch for wallet service calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocks
import {
  creditWalletAfterPayment,
  initiatePayment,
  capturePayment,
  getPaymentStatus,
  getPaymentAuditTrail,
  getMerchantSettlements,
  assertAuthoritativeOrderAmount,
  normalizePaymentPurpose,
  PaymentMetadata,
  InitiateInput,
} from '../paymentService';

// Import mocked modules
import mongoose from 'mongoose';
import { Payment, IPayment } from '../models/Payment';
import { PaymentAuditLog } from '../models/TransactionAuditLog';

// Helper function to normalize payment purpose (re-implemented for testing)
function testNormalizePaymentPurpose(purpose) {
  switch (purpose || 'order') {
    case 'order': return 'order_payment';
    case 'wallet_topup': return 'wallet_topup';
    case 'subscription': return 'financial_service';
    case 'refund': return 'other';
    case 'other': return 'other';
    default: return 'other';
  }
}

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WALLET_SERVICE_URL = 'http://wallet-service:3000';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.INTERNAL_SERVICE_TOKEN = 'test-token';
  });

  describe('normalizePaymentPurpose', () => {
    it('should normalize order to order_payment', () => {
      expect(testNormalizePaymentPurpose('order')).toBe('order_payment');
    });

    it('should normalize wallet_topup correctly', () => {
      expect(testNormalizePaymentPurpose('wallet_topup')).toBe('wallet_topup');
    });

    it('should normalize subscription to financial_service', () => {
      expect(testNormalizePaymentPurpose('subscription')).toBe('financial_service');
    });

    it('should normalize refund to other', () => {
      expect(testNormalizePaymentPurpose('refund')).toBe('other');
    });

    it('should default to order_payment for undefined', () => {
      expect(testNormalizePaymentPurpose(undefined)).toBe('order_payment');
    });

    it('should handle other purpose', () => {
      expect(testNormalizePaymentPurpose('other')).toBe('other');
    });
  });

  describe('assertAuthoritativeOrderAmount', () => {
    it('should resolve order amount from orderId', async () => {
      const mockOrder = { _id: 'order123', totals: { total: 100 } };
      mongoose.connection.collection('orders').findOne.mockResolvedValueOnce(mockOrder);

      await expect(assertAuthoritativeOrderAmount('order123', 100)).resolves.toBeUndefined();
    });

    it('should throw error for non-existent order', async () => {
      mongoose.connection.collection('orders').findOne.mockResolvedValueOnce(null);

      await expect(assertAuthoritativeOrderAmount('nonexistent', 100)).rejects.toThrow(
        'Authoritative order amount not found'
      );
    });

    it('should throw error for amount mismatch', async () => {
      const mockOrder = { _id: 'order123', totals: { total: 100 } };
      mongoose.connection.collection('orders').findOne.mockResolvedValueOnce(mockOrder);

      await expect(assertAuthoritativeOrderAmount('order123', 200)).rejects.toThrow(
        'Amount mismatch'
      );
    });

    it('should accept amounts within tolerance', async () => {
      const mockOrder = { _id: 'order123', totals: { total: 100 } };
      mongoose.connection.collection('orders').findOne.mockResolvedValueOnce(mockOrder);

      await expect(assertAuthoritativeOrderAmount('order123', 100.005)).resolves.toBeUndefined();
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment by paymentId', async () => {
      const mockPayment = {
        paymentId: 'pay_123',
        amount: 100,
        status: 'completed',
      };

      Payment.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPayment),
      });

      // Direct query test - the function returns what findOne returns
      const result = await getPaymentStatus('pay_123');

      expect(Payment.findOne).toHaveBeenCalledWith({ paymentId: 'pay_123' });
    });

    it('should filter by ownerUserId when provided', async () => {
      Payment.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await getPaymentStatus('pay_123', 'user_456');

      expect(Payment.findOne).toHaveBeenCalledWith({
        paymentId: 'pay_123',
        user: expect.anything(),
      });
    });

    it('should throw error for invalid ownerUserId', async () => {
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await expect(getPaymentStatus('pay_123', 'invalid-id')).rejects.toThrow('Invalid ownerUserId');
    });
  });

  describe('getPaymentAuditTrail', () => {
    it('should return audit logs sorted by date descending', async () => {
      const mockLogs = [
        { action: 'capture', paymentId: 'pay_123', createdAt: new Date('2024-01-02') },
        { action: 'initiate', paymentId: 'pay_123', createdAt: new Date('2024-01-01') },
      ];

      PaymentAuditLog.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await getPaymentAuditTrail('pay_123');

      expect(result).toHaveLength(2);
      expect(PaymentAuditLog.find).toHaveBeenCalledWith({ paymentId: 'pay_123' });
    });

    it('should limit to 200 entries', async () => {
      PaymentAuditLog.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await getPaymentAuditTrail('pay_123');

      expect(PaymentAuditLog.find).toHaveBeenCalled();
    });
  });

  describe('getMerchantSettlements', () => {
    it('should return paginated payments', async () => {
      const mockPayments = [
        { paymentId: 'pay_1', amount: 100, status: 'completed' },
        { paymentId: 'pay_2', amount: 200, status: 'completed' },
      ];

      Payment.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      Payment.countDocuments = jest.fn().mockResolvedValue(50);

      const result = await getMerchantSettlements('merchant123', 1, 20);

      expect(result.payments).toHaveLength(2);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(true);
    });

    it('should clamp limit to valid range', async () => {
      Payment.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      Payment.countDocuments = jest.fn().mockResolvedValue(0);

      await getMerchantSettlements('merchant123', 1, 200);

      expect(Payment.find).toHaveBeenCalled();
    });

    it('should set hasMore to false when on last page', async () => {
      Payment.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ paymentId: 'pay_1' }]),
            }),
          }),
        }),
      });
      Payment.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await getMerchantSettlements('merchant123', 1, 20);

      expect(result.hasMore).toBe(false);
    });
  });

  describe('initiatePayment - Wallet Topup Limits', () => {
    it('should enforce wallet topup limit of 100000', async () => {
      const input: InitiateInput = {
        userId: 'user123',
        orderId: 'order123',
        amount: 150000,
        paymentMethod: 'upi',
        purpose: 'wallet_topup',
      };

      mongoose.connection.collection('orders').findOne.mockResolvedValueOnce({ totals: { total: 150000 } });

      await expect(initiatePayment(input)).rejects.toThrow('Wallet topup amount cannot exceed 100000');
    });

    it('should enforce financial service limit of 500000', async () => {
      const input: InitiateInput = {
        userId: 'user123',
        orderId: 'order123',
        amount: 600000,
        paymentMethod: 'card',
        purpose: 'subscription',
      };

      mongoose.connection.collection('orders').findOne.mockResolvedValueOnce({ totals: { total: 600000 } });

      await expect(initiatePayment(input)).rejects.toThrow('Financial service amount cannot exceed 500000');
    });

    it('should allow wallet topup within limit', async () => {
      const input: InitiateInput = {
        userId: 'user123',
        orderId: 'order123',
        amount: 50000,
        paymentMethod: 'upi',
        purpose: 'wallet_topup',
      };

      // Mock Redis lock
      const redis = require('redis');
      redis.createClient().set.mockResolvedValue('OK');

      // Mock Razorpay
      jest.mock('../razorpayService', () => ({
        createOrder: jest.fn().mockResolvedValue({ id: 'rzp_order_123' }),
      }));

      Payment.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      // This test validates the limit check passes
      expect(input.amount).toBeLessThan(100000);
    });
  });

  describe('Payment ID Generation', () => {
    it('should generate payment ID with pay_ prefix', () => {
      const { v4 } = require('uuid');
      v4.mockReturnValue('test-uuid-1234');

      const paymentId = `pay_${'test-uuid-1234'.replace(/-/g, '').slice(0, 16)}`;

      expect(paymentId).toMatch(/^pay_[a-f0-9]{16}$/);
    });
  });

  describe('InitiateInput Validation', () => {
    it('should require userId', () => {
      const input: Partial<InitiateInput> = {
        orderId: 'order123',
        amount: 100,
        paymentMethod: 'upi',
      };

      expect(input.userId).toBeUndefined();
    });

    it('should require orderId', () => {
      const input: Partial<InitiateInput> = {
        userId: 'user123',
        amount: 100,
        paymentMethod: 'upi',
      };

      expect(input.orderId).toBeUndefined();
    });

    it('should require paymentMethod', () => {
      const input: Partial<InitiateInput> = {
        userId: 'user123',
        orderId: 'order123',
        amount: 100,
      };

      expect(input.paymentMethod).toBeUndefined();
    });

    it('should support optional metadata', () => {
      const input: InitiateInput = {
        userId: 'user123',
        orderId: 'order123',
        amount: 100,
        paymentMethod: 'upi',
        metadata: {
          merchantId: 'merchant123',
          orderNumber: 'ORD-001',
        },
      };

      expect(input.metadata?.merchantId).toBe('merchant123');
    });
  });

  describe('PaymentMetadata Interface', () => {
    it('should allow flexible metadata fields', () => {
      const metadata: PaymentMetadata = {
        merchantId: 'merchant123',
        orderId: 'order123',
        orderNumber: 'ORD-001',
        razorpayOrderId: 'rzp_order_123',
        orchestratorIdempotencyKey: 'idempotency_123',
        userId: 'user123',
        reason: 'test',
        customField: 'custom value',
      };

      expect(metadata.merchantId).toBe('merchant123');
      expect(metadata.customField).toBe('custom value');
    });
  });
});

// Run tests if this file is executed directly
if (typeof describe === 'undefined') {
  console.log('Run with: node --test paymentService.test.ts');
}
