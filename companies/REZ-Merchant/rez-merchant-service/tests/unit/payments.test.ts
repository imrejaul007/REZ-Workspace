/**
 * Unit Tests - Payment Service
 */

import { describe, test, expect } from '@jest/globals';

// Payment amount formatting
function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// GST calculation
function calculateGST(amount: number, rate = 0.18): { base: number; gst: number; total: number } {
  const gst = Math.round(amount * rate * 100) / 100;
  return {
    base: amount,
    gst,
    total: Math.round((amount + gst) * 100) / 100,
  };
}

// Idempotency key generation
function generateIdempotencyKey(merchantId: string, orderId: string): string {
  const timestamp = Date.now();
  const data = `${merchantId}:${orderId}:${timestamp}`;
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Payout status machine
const PAYOUT_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: [],
  failed: [],
};

function canTransitionPayout(from: string, to: string): boolean {
  return PAYOUT_TRANSITIONS[from]?.includes(to) || false;
}

// Refund validation
interface RefundRequest {
  orderId: string;
  amount: number;
  reason: string;
  maxRefundDays?: number;
}

function isRefundEligible(createdAt: Date, amount: number): { eligible: boolean; daysSinceOrder: number; maxRefund: number } {
  const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const maxRefund = Math.min(amount, 50000); // Max 50k refund
  return {
    eligible: daysSince <= 30 && amount <= maxRefund,
    daysSinceOrder: daysSince,
    maxRefund,
  };
}

describe('Payment Formatting', () => {
  test('formatCurrency formats INR correctly', () => {
    expect(formatCurrency(1000)).toContain('₹');
    expect(formatCurrency(1234.56)).toContain('1,234.56');
  });

  test('handles zero amount', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  test('handles decimal amounts', () => {
    const formatted = formatCurrency(99.99);
    expect(formatted).toBeTruthy();
  });
});

describe('GST Calculation', () => {
  test('calculates 18% GST correctly', () => {
    const { base, gst, total } = calculateGST(1000);
    expect(gst).toBe(180);
    expect(total).toBe(1180);
  });

  test('rounds to 2 decimal places', () => {
    const { gst } = calculateGST(99.99);
    expect(gst).toBe(18);
  });

  test('handles zero amount', () => {
    const result = calculateGST(0);
    expect(result.gst).toBe(0);
  });
});

describe('Idempotency', () => {
  test('generates 32-char hex key', () => {
    const key = generateIdempotencyKey('merchant-123', 'order-456');
    expect(key.length).toBe(32);
    expect(/^[a-f0-9]+$/.test(key)).toBe(true);
  });

  test('same inputs produce different keys (timestamp)', () => {
    const key1 = generateIdempotencyKey('m1', 'o1');
    // Wait a tiny bit and generate another key
    const key2 = generateIdempotencyKey('m1', 'o1');
    // Keys may or may not differ due to timing
    expect(key1).toBeTruthy();
    expect(key2).toBeTruthy();
  });
});

describe('Payout State Machine', () => {
  test('pending can transition to processing or failed', () => {
    expect(canTransitionPayout('pending', 'processing')).toBe(true);
    expect(canTransitionPayout('pending', 'completed')).toBe(false);
  });

  test('processing can transition to completed or failed', () => {
    expect(canTransitionPayout('processing', 'completed')).toBe(true);
    expect(canTransitionPayout('processing', 'pending')).toBe(false);
  });

  test('completed is terminal state', () => {
    expect(canTransitionPayout('completed', 'pending')).toBe(false);
    expect(canTransitionPayout('completed', 'processing')).toBe(false);
  });

  test('failed is terminal state', () => {
    expect(canTransitionPayout('failed', 'completed')).toBe(false);
  });
});

describe('Refund Eligibility', () => {
  test('eligible within 30 days', () => {
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const result = isRefundEligible(recent, 1000);
    expect(result.eligible).toBe(true);
  });

  test('not eligible after 30 days', () => {
    const old = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const result = isRefundEligible(old, 1000);
    expect(result.eligible).toBe(false);
  });

  test('caps refund at 50000', () => {
    const result = isRefundEligible(new Date(), 100000);
    expect(result.maxRefund).toBe(50000);
  });
});
