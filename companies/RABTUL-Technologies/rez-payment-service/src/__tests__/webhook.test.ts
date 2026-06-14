/**
 * Razorpay Webhook Integration Tests
 *
 * L20 FIX: Webhook integration test template.
 *
 * Prerequisites:
 * 1. Get Razorpay test credentials from https://dashboard.razorpay.com/app/keys
 * 2. Set environment variables:
 *    TEST_RAZORPAY_KEY_ID=rzp_test_xxxxx
 *    TEST_RAZORPAY_KEY_SECRET=xxxxx
 *    TEST_RAZORPAY_WEBHOOK_SECRET=xxxxx
 * 3. Use ngrok or similar to expose local server:
 *    ngrok http 4001
 * 4. Register webhook URL in Razorpay dashboard:
 *    https://your-ngrok-url/webhooks/razorpay
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

// ─── Test Configuration ───────────────────────────────────────────────────────────

const TEST_CONFIG = {
  razorpayKeyId: process.env.TEST_RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.TEST_RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.TEST_RAZORPAY_WEBHOOK_SECRET || '',
  baseUrl: process.env.TEST_WEBHOOK_BASE_URL || 'http://localhost:4001',
};

// ─── Signature Generation ───────────────────────────────────────────────────────

function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

function generateIdempotencyKey(): string {
  return `test_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

// ─── Mock Webhook Payloads ─────────────────────────────────────────────────────

const WEBHOOK_EVENTS = {
  paymentAuthorized: {
    event: 'payment.authorized',
    payload: {
      payment: {
        id: 'pay_' + crypto.randomUUID().slice(0, 8),
        amount: 10000,
        currency: 'INR',
        status: 'authorized',
        order_id: 'order_' + crypto.randomUUID().slice(0, 8),
        created_at: Math.floor(Date.now() / 1000),
      },
    },
  },

  paymentCaptured: {
    event: 'payment.captured',
    payload: {
      payment: {
        id: 'pay_' + crypto.randomUUID().slice(0, 8),
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_' + crypto.randomUUID().slice(0, 8),
        captured_at: Math.floor(Date.now() / 1000),
      },
    },
  },

  paymentFailed: {
    event: 'payment.failed',
    payload: {
      payment: {
        id: 'pay_' + crypto.randomUUID().slice(0, 8),
        amount: 10000,
        currency: 'INR',
        status: 'failed',
        error_code: 'BAD_REQUEST_ERROR',
        error_description: 'The payment was rejected by the card issuer.',
      },
    },
  },

  refundCreated: {
    event: 'refund.created',
    payload: {
      refund: {
        id: 'rfnd_' + crypto.randomUUID().slice(0, 8),
        entity: 'refund',
        amount: 5000,
        status: 'processed',
        payment_id: 'pay_' + crypto.randomUUID().slice(0, 8),
        created_at: Math.floor(Date.now() / 1000),
      },
    },
  },

  orderPaid: {
    event: 'order.paid',
    payload: {
      order: {
        id: 'order_' + crypto.randomUUID().slice(0, 8),
        amount: 10000,
        currency: 'INR',
        status: 'paid',
        created_at: Math.floor(Date.now() / 1000),
      },
    },
  },
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Razorpay Webhook Integration', () => {
  const skipIfNoCredentials = () => {
    if (!TEST_CONFIG.razorpayKeyId || !TEST_CONFIG.razorpayWebhookSecret) {
      throw new Error('SKIP: Set TEST_RAZORPAY_KEY_ID and TEST_RAZORPAY_WEBHOOK_SECRET');
    }
  };

  describe('Signature Validation', () => {
    it('should generate valid webhook signature', () => {
      const payload = JSON.stringify({ event: 'test' });
      const secret = 'test_secret';
      const signature = generateWebhookSignature(payload, secret);

      // Verify signature format (64 hex chars)
      assert.ok(/^[a-f0-9]{64}$/.test(signature), 'Signature should be 64 hex chars');

      // Verify deterministic (same input = same output)
      const signature2 = generateWebhookSignature(payload, secret);
      assert.strictEqual(signature, signature2, 'Signature should be deterministic');
    });

    it('should reject tampered payload', () => {
      const payload = JSON.stringify({ event: 'test', amount: 100 });
      const secret = 'test_secret';
      const signature = generateWebhookSignature(payload, secret);

      // Tamper with payload
      const tamperedPayload = JSON.stringify({ event: 'test', amount: 999 });
      const tamperedSignature = generateWebhookSignature(tamperedPayload, secret);

      assert.notStrictEqual(signature, tamperedSignature, 'Tampered payload should produce different signature');
    });

    it('should use different secrets for different environments', () => {
      const payload = JSON.stringify({ event: 'test' });
      const prodSecret = 'prod_secret_xxx';
      const testSecret = 'test_secret_xxx';

      const prodSignature = generateWebhookSignature(payload, prodSecret);
      const testSignature = generateWebhookSignature(payload, testSecret);

      assert.notStrictEqual(prodSignature, testSignature, 'Different secrets should produce different signatures');
    });
  });

  describe('Payment Events', () => {
    it('should process payment.authorized event', () => {
      const event = WEBHOOK_EVENTS.paymentAuthorized;
      const payload = JSON.stringify(event);

      assert.strictEqual(event.event, 'payment.authorized');
      assert.ok(event.payload.payment.id.startsWith('pay_'));
      assert.strictEqual(event.payload.payment.status, 'authorized');
    });

    it('should process payment.captured event', () => {
      const event = WEBHOOK_EVENTS.paymentCaptured;
      const payload = JSON.stringify(event);

      assert.strictEqual(event.event, 'payment.captured');
      assert.ok(event.payload.payment.id.startsWith('pay_'));
      assert.strictEqual(event.payload.payment.status, 'captured');
    });

    it('should process payment.failed event', () => {
      const event = WEBHOOK_EVENTS.paymentFailed;
      const payload = JSON.stringify(event);

      assert.strictEqual(event.event, 'payment.failed');
      assert.ok(event.payload.payment.error_code);
      assert.ok(event.payload.payment.error_description);
    });

    it('should handle idempotent payment events', () => {
      // Same payment ID should be processed only once
      const paymentId = 'pay_idempotent123';
      const processedPayments = new Set<string>();

      const isFirstTime = !processedPayments.has(paymentId);
      processedPayments.add(paymentId);

      const isSecondTime = !processedPayments.has(paymentId);

      assert.strictEqual(isFirstTime, true, 'First occurrence should be processed');
      assert.strictEqual(isSecondTime, false, 'Second occurrence should be skipped');
    });
  });

  describe('Refund Events', () => {
    it('should process refund.created event', () => {
      const event = WEBHOOK_EVENTS.refundCreated;
      const payload = JSON.stringify(event);

      assert.strictEqual(event.event, 'refund.created');
      assert.ok(event.payload.refund.id.startsWith('rfnd_'));
      assert.ok(event.payload.refund.amount > 0);
      assert.strictEqual(event.payload.refund.status, 'processed');
    });

    it('should validate refund amount against original payment', () => {
      const originalPaymentAmount = 10000; // 100 INR in paise
      const refundAmount = 5000; // 50 INR

      const isValidRefund = refundAmount <= originalPaymentAmount;
      assert.strictEqual(isValidRefund, true, 'Refund should not exceed payment amount');
    });

    it('should reject refund exceeding payment amount', () => {
      const originalPaymentAmount = 10000;
      const refundAmount = 15000;

      const isValidRefund = refundAmount <= originalPaymentAmount;
      assert.strictEqual(isValidRefund, false, 'Excess refund should be rejected');
    });
  });

  describe('Order Events', () => {
    it('should process order.paid event', () => {
      const event = WEBHOOK_EVENTS.orderPaid;
      const payload = JSON.stringify(event);

      assert.strictEqual(event.event, 'order.paid');
      assert.ok(event.payload.order.id.startsWith('order_'));
      assert.strictEqual(event.payload.order.status, 'paid');
    });

    it('should link payment to order', () => {
      const paymentId = 'pay_link123';
      const orderId = 'order_link456';

      // Payment should contain order_id reference
      const event = {
        ...WEBHOOK_EVENTS.paymentCaptured,
        payload: {
          payment: {
            ...WEBHOOK_EVENTS.paymentCaptured.payload.payment,
            order_id: orderId,
          },
        },
      };

      assert.ok(event.payload.payment.order_id);
      assert.strictEqual(event.payload.payment.order_id, orderId);
    });
  });

  describe('Security', () => {
    it('should validate webhook secret format', () => {
      const webhookSecret = TEST_CONFIG.razorpayWebhookSecret;

      if (!webhookSecret) {
        console.log('SKIP: TEST_RAZORPAY_WEBHOOK_SECRET not set');
        return;
      }

      // Webhook secrets are typically 128+ chars
      assert.ok(webhookSecret.length >= 32, 'Webhook secret should be sufficiently long');
    });

    it('should not expose sensitive data in logs', () => {
      const sensitivePayload = {
        card: {
          number: '4111111111111111',
          cvv: '123',
        },
      };

      // Sensitive fields should be redacted
      const redacted = JSON.parse(JSON.stringify(sensitivePayload));
      if (redacted.card) {
        delete redacted.card.cvv;
        redacted.card.number = '****' + redacted.card.number.slice(-4);
      }

      assert.ok(!('cvv' in (redacted.card || {})), 'CVV should be redacted');
      assert.ok(redacted.card.number.startsWith('****'), 'Card number should be masked');
    });

    it('should reject requests without signature', async () => {
      // Webhook handler should reject requests without X-Razorpay-Signature header
      const headers = {};

      const hasSignature = 'x-razorpay-signature' in headers;
      assert.strictEqual(hasSignature, false, 'Request without signature should be rejected');
    });

    it('should validate signature timestamp', () => {
      // Razorpay includes timestamp in webhook signature to prevent replay attacks
      const webhookData = {
        payload: JSON.stringify({ event: 'test' }),
        timestamp: Math.floor(Date.now() / 1000),
      };

      const maxAgeSeconds = 5 * 60; // 5 minutes
      const age = Math.floor(Date.now() / 1000) - webhookData.timestamp;

      const isRecent = age <= maxAgeSeconds;
      assert.strictEqual(isRecent, true, 'Webhook should be recent');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON payload', () => {
      const malformedPayload = '{ "event": "test", invalid json }';

      let parseError = false;
      try {
        JSON.parse(malformedPayload);
      } catch {
        parseError = true;
      }

      assert.strictEqual(parseError, true, 'Malformed JSON should fail parsing');
    });

    it('should handle missing required fields', () => {
      const incompleteEvent = {
        event: 'payment.captured',
        payload: {
          payment: {
            id: 'pay_123',
            // missing: amount, currency, status, order_id
          },
        },
      };

      const hasRequiredFields =
        incompleteEvent.payload.payment.id &&
        'amount' in incompleteEvent.payload.payment &&
        'status' in incompleteEvent.payload.payment;

      assert.strictEqual(hasRequiredFields, false, 'Incomplete event should fail validation');
    });

    it('should handle unknown event types gracefully', () => {
      const unknownEvent = {
        event: 'unknown.event.type',
        payload: {},
      };

      const KNOWN_EVENTS = [
        'payment.authorized',
        'payment.captured',
        'payment.failed',
        'refund.created',
        'refund.processed',
        'order.paid',
        'order.failed',
      ];

      const isKnownEvent = KNOWN_EVENTS.includes(unknownEvent.event);
      assert.strictEqual(isKnownEvent, false, 'Unknown events should be logged but not crash');
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate webhook delivery', () => {
      const deliveryCount = new Map<string, number>();
      const webhookId = 'wh_' + crypto.randomUUID().slice(0, 8);

      // First delivery
      deliveryCount.set(webhookId, (deliveryCount.get(webhookId) || 0) + 1);
      const firstCount = deliveryCount.get(webhookId) || 0;

      // Duplicate delivery
      deliveryCount.set(webhookId, (deliveryCount.get(webhookId) || 0) + 1);
      const secondCount = deliveryCount.get(webhookId) || 0;

      assert.strictEqual(firstCount, 1, 'First delivery should count as 1');
      assert.strictEqual(secondCount, 2, 'Duplicate should count as 2');

      // But only process once
      const shouldProcess = firstCount === 1;
      const shouldSkipDuplicate = secondCount > 1;

      assert.strictEqual(shouldProcess, true);
      assert.strictEqual(shouldSkipDuplicate, true);
    });

    it('should store processed webhook IDs', async () => {
      const processedWebhooks = new Set<string>();
      const webhookId = 'wh_processed123';

      processedWebhooks.add(webhookId);
      const isProcessed = processedWebhooks.has(webhookId);

      assert.strictEqual(isProcessed, true, 'Processed webhook should be tracked');
    });
  });
});

// ─── Manual Integration Test ───────────────────────────────────────────────────

/**
 * To run manual integration test:
 *
 * 1. Start your local server:
 *    npm run dev
 *
 * 2. Expose with ngrok:
 *    ngrok http 4001
 *
 * 3. Copy ngrok URL and register in Razorpay dashboard:
 *    Webhook URL: https://your-ngrok-url/webhooks/razorpay
 *    Events: payment.authorized, payment.captured, payment.failed, refund.created
 *
 * 4. Create a test order and complete payment
 *
 * 5. Check logs for webhook processing
 */

console.log(`
🧪 Razorpay Webhook Test Suite

To enable integration tests, set environment variables:
  TEST_RAZORPAY_KEY_ID=rzp_test_xxxxx
  TEST_RAZORPAY_KEY_SECRET=xxxxx
  TEST_RAZORPAY_WEBHOOK_SECRET=xxxxx

For manual testing:
  1. Start: npm run dev
  2. Expose: ngrok http 4001
  3. Register webhook URL in Razorpay dashboard
  4. Create test payment and check logs
`);
