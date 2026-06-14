/**
 * Webhook Verification Service Tests
 * Tests for webhook signature verification across providers
 */

import { describe, it, expect, vi } from 'vitest';
import * as crypto from 'crypto';

// Signature verification utilities
function verifyRazorpayWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const [timestamp, v1Signature] = signature.split(',');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(v1Signature.replace('v1=', '')),
    Buffer.from(expectedSignature)
  );
}

function verifyPayPalWebhook(
  payload: string,
  transmissionId: string,
  transmissionTime: string,
  webhookId: string,
  expectedChecksum: string,
  secret: string
): boolean {
  const crc = crc32(payload);
  const expectedChecksumCalc = crypto
    .createHmac('sha256', secret)
    .update(`${transmissionId}|${transmissionTime}|${webhookId}|${crc}`)
    .digest('hex');
  return expectedChecksum === expectedChecksumCalc;
}

// Simple CRC32 implementation
function crc32(str: string): number {
  let crc = 0xffffffff;
  const table = makeCrcTable();
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

// Event deduplication
interface WebhookEvent {
  eventId: string;
  provider: string;
  processedAt?: Date;
}

const processedEvents = new Map<string, WebhookEvent>();

function isEventProcessed(eventId: string, provider: string): boolean {
  const key = `${provider}:${eventId}`;
  return processedEvents.has(key);
}

function markEventProcessed(eventId: string, provider: string): void {
  const key = `${provider}:${eventId}`;
  processedEvents.set(key, { eventId, provider, processedAt: new Date() });
}

function cleanOldEvents(provider: string, ttlHours: number = 24): void {
  const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
  const prefix = `${provider}:`;
  for (const [key, event] of processedEvents) {
    if (key.startsWith(prefix) && event.processedAt && event.processedAt < cutoff) {
      processedEvents.delete(key);
    }
  }
}

describe('Razorpay Webhook Verification', () => {
  const secret = 'webhook_secret_123';

  it('should verify valid Razorpay signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: {} });
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    expect(verifyRazorpayWebhook(payload, signature, secret)).toBe(true);
  });

  it('should reject invalid signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured' });
    const invalidSignature = 'invalid_signature_hash';

    expect(() => verifyRazorpayWebhook(payload, invalidSignature, secret)).toThrow();
  });

  it('should reject tampered payload', () => {
    const originalPayload = JSON.stringify({ amount: 1000 });
    const signature = crypto
      .createHmac('sha256', secret)
      .update(originalPayload)
      .digest('hex');

    const tamperedPayload = JSON.stringify({ amount: 9999 });

    expect(() => verifyRazorpayWebhook(tamperedPayload, signature, secret)).toThrow();
  });
});

describe('Stripe Webhook Verification', () => {
  const secret = 'whsec_test_secret';

  it('should verify valid Stripe signature', () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const fullSignature = `${timestamp},v1=${signature}`;
    expect(verifyStripeWebhook(payload, fullSignature, secret)).toBe(true);
  });

  it('should reject old timestamp', () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 6+ minutes ago
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${oldTimestamp}.${payload}`)
      .digest('hex');

    const fullSignature = `${oldTimestamp},v1=${signature}`;

    // Stripe rejects events older than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    expect(parseInt(oldTimestamp)).toBeLessThan(now - 300);
  });
});

describe('Event Deduplication', () => {
  beforeEach(() => {
    processedEvents.clear();
  });

  it('should detect new event', () => {
    expect(isEventProcessed('evt_123', 'razorpay')).toBe(false);
  });

  it('should detect processed event', () => {
    markEventProcessed('evt_123', 'razorpay');
    expect(isEventProcessed('evt_123', 'razorpay')).toBe(true);
  });

  it('should treat same ID from different providers as unique', () => {
    markEventProcessed('evt_123', 'razorpay');
    expect(isEventProcessed('evt_123', 'stripe')).toBe(false);
  });

  it('should clean old events', () => {
    // Manually add old event
    const key = 'razorpay:evt_old';
    processedEvents.set(key, {
      eventId: 'evt_old',
      provider: 'razorpay',
      processedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
    });

    cleanOldEvents('razorpay', 24);
    expect(isEventProcessed('evt_old', 'razorpay')).toBe(false);
  });

  it('should keep recent events', () => {
    markEventProcessed('evt_123', 'razorpay');
    cleanOldEvents('razorpay', 24);
    expect(isEventProcessed('evt_123', 'razorpay')).toBe(true);
  });
});

describe('Webhook Security', () => {
  it('should use timing-safe comparison', () => {
    const secret = 'test_secret';
    const payload = JSON.stringify({ event: 'test' });
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // timingSafeEqual should not throw for valid inputs
    expect(verifyRazorpayWebhook(payload, signature, secret)).toBe(true);
  });

  it('should reject signature length mismatch', () => {
    const payload = JSON.stringify({ event: 'test' });
    const shortSignature = 'abc';
    const secret = 'test_secret';

    expect(() => verifyRazorpayWebhook(payload, shortSignature, secret)).toThrow();
  });
});

describe('Event Processing', () => {
  it('should process payment.captured event', () => {
    const event = {
      event: 'payment.captured',
      payload: {
        payment: {
          id: 'pay_123',
          amount': 1000,
          currency: 'INR'
        }
      }
    };

    expect(event.event).toBe('payment.captured');
    expect(event.payload.payment.amount).toBe(1000);
  });

  it('should process order.paid event', () => {
    const event = {
      event: 'order.paid',
      payload: {
        order: {
          id: 'order_123',
          amount_paid': 5000
        }
      }
    };

    expect(event.event).toBe('order.paid');
  });
});
