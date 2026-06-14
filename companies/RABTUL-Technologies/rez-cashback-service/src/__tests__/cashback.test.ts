/**
 * Cashback Service Tests
 */

import { describe, it, expect } from 'vitest';

interface Cashback {
  userId: string;
  amount: number;
  orderId: string;
  status: 'pending' | 'credited' | 'expired';
  expiresAt: Date;
}

function calculateCashback(orderAmount: number, rate: number): number {
  return Math.floor(orderAmount * rate / 100);
}

function isExpired(cashback: Cashback): boolean {
  return cashback.status === 'pending' && new Date() > cashback.expiresAt;
}

describe('Cashback Calculation', () => {
  it('should calculate cashback percentage', () => {
    expect(calculateCashback(1000, 5)).toBe(50);
    expect(calculateCashback(500, 10)).toBe(50);
  });

  it('should floor fractional cashback', () => {
    expect(calculateCashback(999, 5)).toBe(49); // 49.95 -> 49
  });
});

describe('Cashback Expiry', () => {
  it('should detect expired cashback', () => {
    const cashback: Cashback = {
      userId: 'u1',
      amount: 100,
      orderId: 'o1',
      status: 'pending',
      expiresAt: new Date(Date.now() - 86400000), // 1 day ago
    };
    expect(isExpired(cashback)).toBe(true);
  });

  it('should not mark credited as expired', () => {
    const cashback: Cashback = {
      userId: 'u1',
      amount: 100,
      orderId: 'o1',
      status: 'credited',
      expiresAt: new Date(Date.now() - 86400000),
    };
    expect(isExpired(cashback)).toBe(false);
  });
});
