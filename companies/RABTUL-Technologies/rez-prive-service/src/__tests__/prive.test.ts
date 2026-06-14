/**
 * Prive Service Tests
 */

import { describe, it, expect } from 'vitest';

interface PrivateOffer {
  id: string;
  userId: string;
  discount: number;
  validUntil: Date;
  used: boolean;
}

function calculateDiscount(price: number, discount: number): number {
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

function isValid(offer: PrivateOffer): boolean {
  return !offer.used && new Date() < offer.validUntil;
}

describe('Discount Calculation', () => {
  it('should calculate discounted price', () => {
    expect(calculateDiscount(1000, 20)).toBe(800);
    expect(calculateDiscount(999, 15)).toBe(849.15);
  });
});

describe('Offer Validation', () => {
  it('should validate active offer', () => {
    const offer: PrivateOffer = {
      id: 'o1',
      userId: 'u1',
      discount: 25,
      validUntil: new Date(Date.now() + 86400000),
      used: false,
    };
    expect(isValid(offer)).toBe(true);
  });

  it('should invalidate used offer', () => {
    const offer: PrivateOffer = {
      id: 'o1',
      userId: 'u1',
      discount: 25,
      validUntil: new Date(Date.now() + 86400000),
      used: true,
    };
    expect(isValid(offer)).toBe(false);
  });
});
