/**
 * Bill Payment Service Tests
 */

import { describe, it, expect } from 'vitest';

interface Bill {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
}

function calculateBill(amount: number, feePercent: number): number {
  return Math.round(amount * (1 + feePercent / 100) * 100) / 100;
}

describe('Bill Calculation', () => {
  it('should calculate with fee', () => {
    expect(calculateBill(1000, 1)).toBe(1010);
  });

  it('should handle zero fee', () => {
    expect(calculateBill(1000, 0)).toBe(1000);
  });
});
