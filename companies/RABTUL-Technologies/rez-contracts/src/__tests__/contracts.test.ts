/**
 * Contracts Service Tests
 */

import { describe, it, expect } from 'vitest';

interface Contract {
  id: string;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  startDate: Date;
  endDate: Date;
}

function isActive(contract: Contract): boolean {
  const now = new Date();
  return contract.status === 'active' && now >= contract.startDate && now <= contract.endDate;
}

function getRemainingDays(contract: Contract): number {
  const now = new Date();
  const diff = contract.endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

describe('Contract Status', () => {
  it('should check if active', () => {
    const contract: Contract = {
      id: 'c1',
      status: 'active',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 30),
    };
    expect(isActive(contract)).toBe(true);
  });
});

describe('Remaining Days', () => {
  it('should calculate remaining days', () => {
    const contract: Contract = {
      id: 'c1',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 10),
    };
    expect(getRemainingDays(contract)).toBe(10);
  });

  it('should return 0 for expired', () => {
    const contract: Contract = {
      id: 'c1',
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 30),
      endDate: new Date(Date.now() - 86400000),
    };
    expect(getRemainingDays(contract)).toBe(0);
  });
});
