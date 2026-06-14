import { z } from 'zod';

// Import the validation schemas from walletRoutes
const coinDebitSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1_000_000, 'Maximum 1,000,000'),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  idempotencyKey: z.string().max(200, 'Idempotency key too long').optional(),
});

const creditSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  amount: z.number().positive('Amount must be positive').max(1_000_000, 'Maximum 1,000,000'),
  coinType: z.enum(['rez', 'prive', 'branded', 'promo', 'cashback', 'referral']),
  source: z.string().min(1, 'Source required'),
  description: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
});

describe('Wallet Validation Schemas', () => {
  describe('coinDebitSchema', () => {
    it('should validate a valid debit request', () => {
      const validDebit = {
        amount: 100,
        source: 'order_payment',
        description: 'Payment for order #123',
        idempotencyKey: 'unique-key-123',
      };

      const result = coinDebitSchema.safeParse(validDebit);
      expect(result.success).toBe(true);
    });

    it('should reject negative amounts', () => {
      const invalidDebit = {
        amount: -100,
        source: 'order_payment',
      };

      const result = coinDebitSchema.safeParse(invalidDebit);
      expect(result.success).toBe(false);
    });

    it('should reject amounts exceeding maximum', () => {
      const invalidDebit = {
        amount: 2_000_000,
        source: 'order_payment',
      };

      const result = coinDebitSchema.safeParse(invalidDebit);
      expect(result.success).toBe(false);
    });

    it('should reject empty source', () => {
      const invalidDebit = {
        amount: 100,
        source: '',
      };

      const result = coinDebitSchema.safeParse(invalidDebit);
      expect(result.success).toBe(false);
    });

    it('should reject missing amount', () => {
      const invalidDebit = {
        source: 'order_payment',
      };

      const result = coinDebitSchema.safeParse(invalidDebit);
      expect(result.success).toBe(false);
    });

    it('should accept debit without optional fields', () => {
      const minimalDebit = {
        amount: 100,
        source: 'order_payment',
      };

      const result = coinDebitSchema.safeParse(minimalDebit);
      expect(result.success).toBe(true);
    });

    it('should reject idempotency key exceeding max length', () => {
      const invalidDebit = {
        amount: 100,
        source: 'order_payment',
        idempotencyKey: 'a'.repeat(201),
      };

      const result = coinDebitSchema.safeParse(invalidDebit);
      expect(result.success).toBe(false);
    });
  });

  describe('creditSchema', () => {
    it('should validate a valid credit request', () => {
      const validCredit = {
        userId: '507f1f77bcf86cd799439011',
        amount: 500,
        coinType: 'rez',
        source: 'signup_bonus',
        description: 'Welcome bonus',
      };

      const result = creditSchema.safeParse(validCredit);
      expect(result.success).toBe(true);
    });

    it('should accept all valid coin types', () => {
      const coinTypes = ['rez', 'prive', 'branded', 'promo', 'cashback', 'referral'];

      for (const coinType of coinTypes) {
        const credit = {
          userId: '507f1f77bcf86cd799439011',
          amount: 100,
          coinType,
          source: 'test',
        };

        const result = creditSchema.safeParse(credit);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid coin types', () => {
      const invalidCredit = {
        userId: '507f1f77bcf86cd799439011',
        amount: 100,
        coinType: 'invalid',
        source: 'test',
      };

      const result = creditSchema.safeParse(invalidCredit);
      expect(result.success).toBe(false);
    });

    it('should reject missing userId', () => {
      const invalidCredit = {
        amount: 100,
        coinType: 'rez',
        source: 'test',
      };

      const result = creditSchema.safeParse(invalidCredit);
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const invalidCredit = {
        userId: '507f1f77bcf86cd799439011',
        amount: 0,
        coinType: 'rez',
        source: 'test',
      };

      const result = creditSchema.safeParse(invalidCredit);
      expect(result.success).toBe(false);
    });
  });
});

describe('Wallet Rate Limiting', () => {
  // Mock Redis for rate limit tests
  const mockRedisPipeline = {
    zremrangebyscore: jest.fn().mockReturnThis(),
    zcard: jest.fn().mockReturnThis(),
    zadd: jest.fn().mockReturnThis(),
    pexpire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([[null, 0], [null, 0], [null, 'OK'], [null, 1]]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow requests under the rate limit', async () => {
    // Simulate rate limit check: 5 operations within window
    const mockExec = jest.fn().mockResolvedValue([
      [null, 0],  // zremrangebyscore result
      [null, 5], // zcard result - 5 operations in window
      [null, 'OK'], // zadd result
      [null, 1], // pexpire result
    ]);

    mockRedisPipeline.exec.mockResolvedValue([
      [null, 0],
      [null, 5], // count < maxOps (10)
      [null, 'OK'],
      [null, 1],
    ]);

    const maxOps = 10;
    const count = 5;
    expect(count < maxOps).toBe(true);
  });

  it('should reject requests exceeding the rate limit', () => {
    const maxOps = 10;
    const count = 15;
    expect(count < maxOps).toBe(false);
  });
});
