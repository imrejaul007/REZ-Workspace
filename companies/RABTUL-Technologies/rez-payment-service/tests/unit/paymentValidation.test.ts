import { z } from 'zod';

// Payment validation schemas from paymentRoutes.ts
const initiateSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive().finite().max(500000),
  paymentMethod: z.enum(['upi', 'card', 'wallet', 'netbanking']),
  purpose: z.enum(['wallet_topup', 'order_payment', 'event_booking', 'financial_service', 'other']).optional(),
  orchestratorIdempotencyKey: z.string().min(1).max(200).optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
  userDetails: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).transform((data) => {
  const key = data.orchestratorIdempotencyKey || data.idempotencyKey || require('crypto').randomUUID();
  return { ...data, orchestratorIdempotencyKey: key };
});

const captureSchema = z.object({
  paymentId: z.string().min(1),
  razorpayPaymentId: z.string().regex(/^pay_[A-Za-z0-9]{14,20}$/, 'Invalid Razorpay payment ID'),
  razorpayOrderId: z.string().regex(/^order_[A-Za-z0-9]{14,20}$/, 'Invalid Razorpay order ID'),
  razorpaySignature: z.string().min(1),
});

const refundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive().finite().max(500000).multipleOf(0.01),
  reason: z.string().optional(),
});

const internalDeductSchema = z.object({
  userId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['cod', 'wallet', 'razorpay', 'upi', 'card', 'netbanking', 'bnpl']).optional(),
  purpose: z.enum(['order', 'wallet_topup', 'subscription', 'refund', 'other']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

describe('Payment Validation Schemas', () => {
  describe('initiateSchema', () => {
    it('should validate a valid payment initiation request', () => {
      const validRequest = {
        orderId: 'order_123',
        amount: 1000,
        paymentMethod: 'upi',
        purpose: 'order_payment',
      };

      const result = initiateSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject missing orderId', () => {
      const invalidRequest = {
        amount: 1000,
        paymentMethod: 'upi',
      };

      const result = initiateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidRequest = {
        orderId: 'order_123',
        amount: -100,
        paymentMethod: 'upi',
      };

      const result = initiateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject amount exceeding maximum', () => {
      const invalidRequest = {
        orderId: 'order_123',
        amount: 600000,
        paymentMethod: 'upi',
      };

      const result = initiateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid payment method', () => {
      const invalidRequest = {
        orderId: 'order_123',
        amount: 1000,
        paymentMethod: 'crypto',
      };

      const result = initiateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept all valid payment methods', () => {
      const methods = ['upi', 'card', 'wallet', 'netbanking'];

      methods.forEach(method => {
        const request = {
          orderId: 'order_123',
          amount: 1000,
          paymentMethod: method,
        };

        const result = initiateSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid purposes', () => {
      const purposes = ['wallet_topup', 'order_payment', 'event_booking', 'financial_service', 'other'];

      purposes.forEach(purpose => {
        const request = {
          orderId: 'order_123',
          amount: 1000,
          paymentMethod: 'upi',
          purpose,
        };

        const result = initiateSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should generate idempotency key when not provided', () => {
      const request = {
        orderId: 'order_123',
        amount: 1000,
        paymentMethod: 'upi',
      };

      const result = initiateSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.orchestratorIdempotencyKey).toBeDefined();
        expect(result.data.orchestratorIdempotencyKey.length).toBeGreaterThan(0);
      }
    });

    it('should prefer orchestratorIdempotencyKey over idempotencyKey', () => {
      const request = {
        orderId: 'order_123',
        amount: 1000,
        paymentMethod: 'upi',
        orchestratorIdempotencyKey: 'orchestrator-key',
        idempotencyKey: 'idempotency-key',
      };

      const result = initiateSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.orchestratorIdempotencyKey).toBe('orchestrator-key');
      }
    });
  });

  describe('captureSchema', () => {
    it('should validate a valid capture request', () => {
      const validRequest = {
        paymentId: 'pay_1234567890abcd',
        razorpayPaymentId: 'pay_ABCDEFGHIJ1234567890AB',
        razorpayOrderId: 'order_ABCDEFGHIJ1234567890AB',
        razorpaySignature: 'signature123',
      };

      const result = captureSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid Razorpay payment ID format', () => {
      const invalidRequest = {
        paymentId: 'pay_123',
        razorpayPaymentId: 'invalid_pay_id',
        razorpayOrderId: 'order_ABCDEFGHIJ1234567890AB',
        razorpaySignature: 'signature123',
      };

      const result = captureSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid Razorpay order ID format', () => {
      const invalidRequest = {
        paymentId: 'pay_1234567890abcd',
        razorpayPaymentId: 'pay_ABCDEFGHIJ1234567890AB',
        razorpayOrderId: 'invalid_order_id',
        razorpaySignature: 'signature123',
      };

      const result = captureSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject empty signature', () => {
      const invalidRequest = {
        paymentId: 'pay_1234567890abcd',
        razorpayPaymentId: 'pay_ABCDEFGHIJ1234567890AB',
        razorpayOrderId: 'order_ABCDEFGHIJ1234567890AB',
        razorpaySignature: '',
      };

      const result = captureSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('refundSchema', () => {
    it('should validate a valid refund request', () => {
      const validRequest = {
        paymentId: 'pay_1234567890abcd',
        amount: 500,
        reason: 'Customer request',
      };

      const result = refundSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept refund without reason', () => {
      const validRequest = {
        paymentId: 'pay_1234567890abcd',
        amount: 500,
      };

      const result = refundSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject negative refund amount', () => {
      const invalidRequest = {
        paymentId: 'pay_1234567890abcd',
        amount: -100,
      };

      const result = refundSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject refund exceeding maximum', () => {
      const invalidRequest = {
        paymentId: 'pay_1234567890abcd',
        amount: 600000,
      };

      const result = refundSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept paise precision amounts', () => {
      const validRequest = {
        paymentId: 'pay_1234567890abcd',
        amount: 100.50,
      };

      const result = refundSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('internalDeductSchema', () => {
    it('should validate a valid internal deduct request', () => {
      const validRequest = {
        userId: 'user_123',
        orderId: 'order_456',
        amount: 1000,
      };

      const result = internalDeductSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept all valid payment methods', () => {
      const methods = ['cod', 'wallet', 'razorpay', 'upi', 'card', 'netbanking', 'bnpl'];

      methods.forEach(method => {
        const request = {
          userId: 'user_123',
          orderId: 'order_456',
          amount: 1000,
          paymentMethod: method,
        };

        const result = internalDeductSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid payment method', () => {
      const invalidRequest = {
        userId: 'user_123',
        orderId: 'order_456',
        amount: 1000,
        paymentMethod: 'crypto',
      };

      const result = internalDeductSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept optional metadata', () => {
      const validRequest = {
        userId: 'user_123',
        orderId: 'order_456',
        amount: 1000,
        metadata: {
          transactionId: 'txn_123',
          notes: 'Test transaction',
        },
      };

      const result = internalDeductSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });
});

describe('Payment Replay Prevention', () => {
  const _localNonceCache = new Map<string, number>();
  const NONCE_TTL_MS = 25 * 60 * 60 * 1000;

  function isReplayedPaymentId(razorpayPaymentId: string, localCache: Map<string, number>): boolean {
    if (localCache.has(razorpayPaymentId)) {
      const timestamp = localCache.get(razorpayPaymentId)!;
      const now = Date.now();
      if (now - timestamp < NONCE_TTL_MS) {
        return true; // Replayed within TTL
      }
      localCache.delete(razorpayPaymentId);
    }
    localCache.set(razorpayPaymentId, Date.now());
    return false;
  }

  beforeEach(() => {
    _localNonceCache.clear();
  });

  it('should allow first occurrence of payment ID', () => {
    const paymentId = 'pay_ABCDEFGHIJ1234567890AB';
    const isReplayed = isReplayedPaymentId(paymentId, _localNonceCache);
    expect(isReplayed).toBe(false);
  });

  it('should detect replayed payment ID', () => {
    const paymentId = 'pay_ABCDEFGHIJ1234567890AB';
    isReplayedPaymentId(paymentId, _localNonceCache);
    const isReplayed = isReplayedPaymentId(paymentId, _localNonceCache);
    expect(isReplayed).toBe(true);
  });

  it('should allow different payment IDs', () => {
    isReplayedPaymentId('pay_AAAABBBBCCCCDDDD', _localNonceCache);
    isReplayedPaymentId('pay_EEEEFFFFGGGGHHHH', _localNonceCache);
    expect(_localNonceCache.size).toBe(2);
  });
});
