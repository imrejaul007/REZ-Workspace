/**
 * Creator Earnings Service Tests
 */

import { describe, it, expect } from 'vitest';

interface Earning {
  creatorId: string;
  amount: number;
  source: string;
  status: 'pending' | 'approved' | 'paid';
  createdAt: Date;
}

function calculateEarnings(earnings: Earning[]): {
  total: number;
  pending: number;
  approved: number;
  paid: number;
} {
  return earnings.reduce((acc, e) => {
    acc.total += e.amount;
    if (e.status === 'pending') acc.pending += e.amount;
    if (e.status === 'approved') acc.approved += e.amount;
    if (e.status === 'paid') acc.paid += e.amount;
    return acc;
  }, { total: 0, pending: 0, approved: 0, paid: 0 });
}

describe('Earnings Calculation', () => {
  const earnings: Earning[] = [
    { creatorId: 'c1', amount: 1000, source: 'views', status: 'pending', createdAt: new Date() },
    { creatorId: 'c1', amount: 500, source: 'referral', status: 'approved', createdAt: new Date() },
    { creatorId: 'c1', amount: 2000, source: 'sales', status: 'paid', createdAt: new Date() },
  ];

  it('should calculate total earnings', () => {
    const result = calculateEarnings(earnings);
    expect(result.total).toBe(3500);
  });

  it('should calculate by status', () => {
    const result = calculateEarnings(earnings);
    expect(result.pending).toBe(1000);
    expect(result.approved).toBe(500);
    expect(result.paid).toBe(2000);
  });
});
