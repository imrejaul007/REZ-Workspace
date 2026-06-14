/**
 * Unit tests for Payment Validation
 */

import {
  validatePaymentInput,
  validateRefundInput,
  validateWebhookPayload,
  validateRazorpaySignature,
  PaymentInput,
  RefundInput,
} from '../../utils/validation';

describe('Payment Validation', () => {
  describe('validatePaymentInput', () => {
    it('should accept valid payment input', () => {
      const input: PaymentInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100.50,
        currency: 'INR',
        paymentMethod: 'card',
      };

      const result = validatePaymentInput(input);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing userId', () => {
      const input = {
        orderId: 'order-456',
        amount: 100,
        paymentMethod: 'card',
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('userId is required');
    });

    it('should reject missing orderId', () => {
      const input = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'card',
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('orderId is required');
    });

    it('should reject negative amount', () => {
      const input = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: -50,
        paymentMethod: 'card',
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('positive'))).toBe(true);
    });

    it('should reject zero amount', () => {
      const input = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 0,
        paymentMethod: 'card',
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
    });

    it('should reject missing payment method', () => {
      const input = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100,
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('paymentMethod is required');
    });

    it('should accept valid optional fields', () => {
      const input: PaymentInput = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100,
        currency: 'INR',
        paymentMethod: 'card',
        purpose: 'order',
        userDetails: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+919876543210',
        },
        metadata: {
          merchantId: 'merchant-123',
        },
      };

      const result = validatePaymentInput(input);
      expect(result.valid).toBe(true);
    });

    it('should validate email format', () => {
      const input = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100,
        paymentMethod: 'card',
        userDetails: {
          email: 'invalid-email',
        },
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('should validate phone format', () => {
      const input = {
        userId: 'user-123',
        orderId: 'order-456',
        amount: 100,
        paymentMethod: 'card',
        userDetails: {
          phone: 'invalid-phone',
        },
      } as PaymentInput;

      const result = validatePaymentInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('phone'))).toBe(true);
    });
  });

  describe('validateRefundInput', () => {
    it('should accept valid refund input', () => {
      const input: RefundInput = {
        paymentId: 'pay_123',
        amount: 50.00,
        reason: 'Customer request',
      };

      const result = validateRefundInput(input);
      expect(result.valid).toBe(true);
    });

    it('should reject missing paymentId', () => {
      const input = {
        amount: 50,
      } as RefundInput;

      const result = validateRefundInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('paymentId is required');
    });

    it('should reject negative refund amount', () => {
      const input = {
        paymentId: 'pay_123',
        amount: -10,
      } as RefundInput;

      const result = validateRefundInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('positive'))).toBe(true);
    });

    it('should reject refund amount exceeding payment amount', () => {
      const input = {
        paymentId: 'pay_123',
        amount: 150, // Assuming payment was 100
        maxRefundable: 100,
      } as RefundInput;

      const result = validateRefundInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceed'))).toBe(true);
    });

    it('should allow partial refund up to payment amount', () => {
      const input = {
        paymentId: 'pay_123',
        amount: 50,
        maxRefundable: 100,
      } as RefundInput;

      const result = validateRefundInput(input);
      expect(result.valid).toBe(true);
    });

    it('should reject refund after expiry period', () => {
      const input = {
        paymentId: 'pay_123',
        amount: 50,
        paymentDate: new Date('2020-01-01'), // Old payment
      } as RefundInput;

      const result = validateRefundInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('90 days'))).toBe(true);
    });
  });

  describe('validateWebhookPayload', () => {
    it('should accept valid Razorpay webhook payload', () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 10000, // In paise
              currency: 'INR',
              status: 'captured',
            },
          },
          order: {
            entity: {
              id: 'order_456',
            },
          },
        },
        created_at: Date.now(),
      };

      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it('should reject payload without event', () => {
      const payload = {
        payload: {},
      } as any;

      const result = validateWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('event is required');
    });

    it('should reject payload with invalid event type', () => {
      const payload = {
        event: 'invalid.event',
        payload: {},
      } as any;

      const result = validateWebhookPayload(payload);

      expect(result.valid).toBe(false);
    });

    it('should accept valid payment.captured event', () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 10000,
            },
          },
        },
        created_at: Date.now(),
      };

      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it('should accept valid refund events', () => {
      const payload = {
        event: 'refund.created',
        payload: {
          refund: {
            entity: {
              id: 'ref_123',
              amount: 5000,
            },
          },
        },
        created_at: Date.now(),
      };

      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it('should reject old webhook timestamps', () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
            },
          },
        },
        created_at: Date.now() - 3600000, // 1 hour ago
      };

      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateRazorpaySignature', () => {
    it('should accept valid signature', () => {
      const payload = '{"test":"data"}';
      const signature = 'valid_signature';
      const secret = 'webhook_secret';

      // Mock crypto
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      const result = validateRazorpaySignature(payload, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"test":"data"}';
      const signature = 'invalid_signature';
      const secret = 'webhook_secret';

      const result = validateRazorpaySignature(payload, signature, secret);
      expect(result).toBe(false);
    });
  });
});
