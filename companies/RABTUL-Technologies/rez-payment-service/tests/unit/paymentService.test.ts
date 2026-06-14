/**
 * Unit tests for Payment Service
 */

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RAZORPAY_KEY_ID = 'test-key-id';
process.env.RAZORPAY_KEY_SECRET = 'test-key-secret';
process.env.WALLET_SERVICE_URL = 'http://localhost:3005';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  exists: jest.fn(),
  eval: jest.fn(),
  del: jest.fn(),
  status: 'ready',
};

const mockPaymentModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

const mockAuditLogModel = {
  create: jest.fn(),
  find: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
  on: jest.fn(),
};

jest.mock('../src/config/redis', () => ({
  redis: mockRedis,
  redisHost: 'localhost',
  redisPort: 6379,
}));

jest.mock('../src/models/Payment', () => mockPaymentModel);
jest.mock('../src/models/TransactionAuditLog', () => mockAuditLogModel);
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => mockQueue),
}));

import mongoose from 'mongoose';
import * as paymentService from '../src/services/paymentService';
import { PaymentMetadata, InitiateInput } from '../src/services/paymentService';

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('PaymentMetadata interface', () => {
    it('should accept valid metadata with all optional fields', () => {
      const metadata: PaymentMetadata = {
        merchantId: 'merchant-123',
        orderId: 'order-456',
        razorpayOrderId: 'order_razorpay_789',
        orchestratorIdempotencyKey: 'idempotent-123',
        userId: 'user-123',
        reason: 'test payment',
      };

      expect(metadata.merchantId).toBe('merchant-123');
      expect(metadata.orderId).toBe('order-456');
    });

    it('should allow additional custom fields', () => {
      const metadata: PaymentMetadata = {
        customField: 'custom-value',
        nested: { key: 'value' },
      };

      expect(metadata.customField).toBe('custom-value');
      expect(metadata.nested).toEqual({ key: 'value' });
    });
  });

  describe('InitiateInput interface', () => {
    it('should accept valid payment initiation input', () => {
      const input: InitiateInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100.50,
        currency: 'INR',
        paymentMethod: 'card',
        purpose: 'order',
        userDetails: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+919876543210',
        },
        orchestratorIdempotencyKey: 'idem-key',
        metadata: {
          merchantId: 'merchant-123',
        },
      };

      expect(input.amount).toBe(100.50);
      expect(input.paymentMethod).toBe('card');
    });
  });

  describe('creditWalletAfterPayment', () => {
    it('should skip credit when wallet service URL is not configured', async () => {
      delete process.env.WALLET_SERVICE_URL;

      const mockPayment = {
        paymentId: 'pay_123',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
      } as any;

      await paymentService.creditWalletAfterPayment(mockPayment);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should skip credit for zero or negative amounts', async () => {
      process.env.WALLET_SERVICE_URL = 'http://localhost:3005';

      const mockPaymentZero = {
        paymentId: 'pay_123',
        user: new mongoose.Types.ObjectId(),
        amount: 0,
      } as any;

      await paymentService.creditWalletAfterPayment(mockPaymentZero);
      expect(mockQueue.add).not.toHaveBeenCalled();

      const mockPaymentNegative = {
        paymentId: 'pay_456',
        user: new mongoose.Types.ObjectId(),
        amount: -50,
      } as any;

      await paymentService.creditWalletAfterPayment(mockPaymentNegative);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should skip credit if already enqueued (idempotency)', async () => {
      process.env.WALLET_SERVICE_URL = 'http://localhost:3005';
      mockRedis.get.mockResolvedValue('enqueued');

      const mockPayment = {
        paymentId: 'pay_123',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
      } as any;

      await paymentService.creditWalletAfterPayment(mockPayment);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should enqueue wallet credit job with correct parameters', async () => {
      process.env.WALLET_SERVICE_URL = 'http://localhost:3005';
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockQueue.add.mockResolvedValue(undefined);

      const userId = new mongoose.Types.ObjectId();
      const mockPayment = {
        paymentId: 'pay_123',
        user: userId,
        amount: 100,
      } as any;

      await paymentService.creditWalletAfterPayment(mockPayment);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'wallet-credit',
        expect.objectContaining({
          userId: userId.toString(),
          amount: 100,
          coinType: 'rez',
          source: 'recharge',
          idempotencyKey: 'pay-credit-pay_123',
        }),
        expect.objectContaining({
          jobId: 'pay-credit-pay_123',
        })
      );
    });

    it('should handle Redis errors gracefully and continue', async () => {
      process.env.WALLET_SERVICE_URL = 'http://localhost:3005';
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      mockRedis.set.mockResolvedValue('OK');
      mockQueue.add.mockResolvedValue(undefined);

      const mockPayment = {
        paymentId: 'pay_123',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
      } as any;

      await expect(paymentService.creditWalletAfterPayment(mockPayment)).resolves.not.toThrow();
      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('initiatePayment', () => {
    it('should reject wallet topup exceeding limit', async () => {
      const input: InitiateInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 150000,
        paymentMethod: 'wallet_topup',
        purpose: 'wallet_topup',
      };

      await expect(paymentService.initiatePayment(input)).rejects.toThrow('cannot exceed');
    });

    it('should reject financial service payment exceeding limit', async () => {
      const input: InitiateInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 600000,
        paymentMethod: 'card',
        purpose: 'subscription',
      };

      await expect(paymentService.initiatePayment(input)).rejects.toThrow('cannot exceed');
    });

    it('should return existing payment for idempotency key', async () => {
      const existingPayment = {
        paymentId: 'pay_existing',
        metadata: { razorpayOrderId: 'order_existing' },
        amount: 100,
        currency: 'INR',
      };

      mockPaymentModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(existingPayment),
      });

      const input: InitiateInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100,
        paymentMethod: 'card',
        orchestratorIdempotencyKey: 'idem-key-123',
      };

      const result = await paymentService.initiatePayment(input);

      expect(result.paymentId).toBe('pay_existing');
    });

    it('should handle concurrent initiation with lock', async () => {
      mockRedis.set.mockResolvedValueOnce(null);

      const input: InitiateInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100,
        paymentMethod: 'card',
      };

      await expect(paymentService.initiatePayment(input)).rejects.toThrow('already in progress');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment by ID', async () => {
      const mockPayment = {
        paymentId: 'pay_123',
        amount: 100,
        status: 'pending',
      };

      mockPaymentModel.findOne.mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentStatus('pay_123');

      expect(result).toEqual(mockPayment);
    });

    it('should scope payment by owner user ID', async () => {
      const mockPayment = {
        paymentId: 'pay_123',
        user: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        amount: 100,
      };

      mockPaymentModel.findOne.mockResolvedValue(mockPayment);

      await paymentService.getPaymentStatus('pay_123', '507f1f77bcf86cd799439011');

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({
        paymentId: 'pay_123',
        user: expect.any(mongoose.Types.ObjectId),
      });
    });

    it('should throw for invalid owner user ID', async () => {
      await expect(
        paymentService.getPaymentStatus('pay_123', 'invalid-id')
      ).rejects.toThrow('Invalid ownerUserId');
    });

    it('should return null when payment not found', async () => {
      mockPaymentModel.findOne.mockResolvedValue(null);

      const result = await paymentService.getPaymentStatus('pay_nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPaymentAuditTrail', () => {
    it('should return audit trail sorted by createdAt desc', async () => {
      const mockAuditTrail = [
        { action: 'capture', createdAt: new Date('2024-01-02') },
        { action: 'initiate', createdAt: new Date('2024-01-01') },
      ];

      mockAuditLogModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue(mockAuditTrail),
          }),
        }),
      });

      const result = await paymentService.getPaymentAuditTrail('pay_123');

      expect(result).toEqual(mockAuditTrail);
      expect(mockAuditLogModel.find).toHaveBeenCalledWith({ paymentId: 'pay_123' });
    });

    it('should limit audit trail to 200 entries', async () => {
      mockAuditLogModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          limit: jest.fn().mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await paymentService.getPaymentAuditTrail('pay_123');

      expect(mockAuditLogModel.find).toHaveBeenCalledWith({ paymentId: 'pay_123' });
    });
  });

  describe('getMerchantSettlements', () => {
    it('should return paginated settlements', async () => {
      const mockPayments = [
        { paymentId: 'pay_1', amount: 100 },
        { paymentId: 'pay_2', amount: 200 },
      ];

      mockPaymentModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              lean: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });
      mockPaymentModel.countDocuments.mockResolvedValue(50);

      const result = await paymentService.getMerchantSettlements('merchant_123', 1, 20);

      expect(result.payments).toEqual(mockPayments);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(true);
    });

    it('should clamp limit to 1-100 range', async () => {
      mockPaymentModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockPaymentModel.countDocuments.mockResolvedValue(0);

      await paymentService.getMerchantSettlements('merchant_123', 1, 200);

      expect(mockPaymentModel.find).toHaveBeenCalled();
    });
  });
});
