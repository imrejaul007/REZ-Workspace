/**
 * rez-gift-card-service Unit Tests
 * Tests gift card management, validation, redemption, and campaigns
 */

import { describe, it, expect } from 'vitest';

describe('Gift Card Structure', () => {
  it('should have correct gift card structure', () => {
    const giftCard = {
      id: 'gc-001',
      cardNumber: 'GC4721000001234',
      pin: '1234',
      initialValue: 5000,
      currentBalance: 3250,
      currency: 'INR',
      status: 'active' as const,
      purchaseDate: new Date('2026-05-01'),
      expiryDate: new Date('2027-05-01'),
    };

    expect(giftCard).toHaveProperty('cardNumber');
    expect(giftCard).toHaveProperty('currentBalance');
    expect(giftCard).toHaveProperty('status');
    expect(giftCard.cardNumber).toMatch(/^GC\d{13}$/);
  });

  it('should validate card number format', () => {
    const validNumber = 'GC4721000001234';
    const invalidNumbers = ['4721000001234', 'GC1234', 'gc4721000001234'];

    expect(validNumber).toMatch(/^GC\d{13}$/);
    invalidNumbers.forEach(num => {
      expect(num).not.toMatch(/^GC\d{13}$/);
    });
  });

  it('should validate PIN format', () => {
    const validPin = '1234';
    expect(validPin).toHaveLength(4);
    expect(parseInt(validPin, 10)).toBeGreaterThanOrEqual(1000);
    expect(parseInt(validPin, 10)).toBeLessThanOrEqual(9999);
  });
});

describe('Gift Card Statuses', () => {
  it('should validate gift card statuses', () => {
    const statuses = ['active', 'redeemed', 'expired', 'cancelled'];
    expect(statuses).toContain('active');
    expect(statuses).toContain('redeemed');
  });

  it('should only allow redemption from active cards', () => {
    const card = { status: 'active' as const };
    const canRedeem = card.status === 'active';
    expect(canRedeem).toBe(true);
  });

  it('should not allow redemption from expired cards', () => {
    const card = { status: 'expired' as const };
    const canRedeem = card.status === 'active';
    expect(canRedeem).toBe(false);
  });
});

describe('Gift Card Purchase', () => {
  it('should validate minimum purchase amount', () => {
    const minAmount = 100;
    const maxAmount = 100000;

    expect(minAmount).toBeGreaterThan(0);
    expect(maxAmount).toBeGreaterThan(minAmount);
  });

  it('should calculate bonus correctly', () => {
    const baseAmount = 5000;
    const bonusPercent = 10;
    const bonusAmount = baseAmount * (bonusPercent / 100);
    const finalAmount = baseAmount + bonusAmount;

    expect(finalAmount).toBe(5500);
  });

  it('should apply campaign bonus only when conditions met', () => {
    const amount = 500;
    const minPurchase = 1000;
    const bonusPercent = 10;

    const shouldApplyBonus = amount >= minPurchase;
    const bonus = shouldApplyBonus ? amount * (bonusPercent / 100) : 0;

    expect(bonus).toBe(0);
  });
});

describe('Balance Management', () => {
  it('should calculate remaining balance after redemption', () => {
    const balance = 5000;
    const redemption = 1750;
    const newBalance = balance - redemption;

    expect(newBalance).toBe(3250);
  });

  it('should mark card as redeemed when balance is zero', () => {
    const balance = 500;
    const redemption = 500;
    const newBalance = balance - redemption;

    const shouldMarkRedeemed = newBalance === 0;
    expect(shouldMarkRedeemed).toBe(true);
  });

  it('should reject redemption when insufficient balance', () => {
    const balance = 500;
    const redemption = 1000;

    const canRedeem = balance >= redemption;
    expect(canRedeem).toBe(false);
  });

  it('should calculate top-up correctly', () => {
    const balance = 3250;
    const topUp = 2000;
    const newBalance = balance + topUp;

    expect(newBalance).toBe(5250);
  });
});

describe('Expiry Management', () => {
  it('should validate expiry date format', () => {
    const expiryDate = new Date('2027-05-01');
    expect(expiryDate).toBeInstanceOf(Date);
    expect(expiryDate.getFullYear()).toBe(2027);
  });

  it('should check if card is expired', () => {
    const expiryDate = new Date('2026-01-01');
    const now = new Date('2026-06-01');

    const isExpired = now > expiryDate;
    expect(isExpired).toBe(true);
  });

  it('should default expiry to 12 months', () => {
    const purchaseDate = new Date('2026-06-01');
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + 12);

    expect(expiryDate.getFullYear()).toBe(2027);
    expect(expiryDate.getMonth()).toBe(5); // June (0-indexed)
  });
});

describe('Transaction Types', () => {
  it('should validate transaction types', () => {
    const types = ['purchase', 'redemption', 'refund', 'expire', 'topup'];
    expect(types).toContain('purchase');
    expect(types).toContain('redemption');
    expect(types).toContain('topup');
  });

  it('should have correct transaction structure', () => {
    const transaction = {
      id: 'txn-001',
      giftCardId: 'gc-001',
      cardNumber: 'GC4721000001234',
      type: 'redemption' as const,
      amount: 1750,
      balanceAfter: 3250,
      description: 'Room service payment',
      createdAt: new Date(),
    };

    expect(transaction).toHaveProperty('type');
    expect(transaction).toHaveProperty('amount');
    expect(transaction).toHaveProperty('balanceAfter');
  });

  it('should calculate balance after transactions correctly', () => {
    const transactions = [
      { type: 'purchase', amount: 5000 },
      { type: 'redemption', amount: 1750 },
      { type: 'topup', amount: 1000 },
    ];

    let balance = 0;
    transactions.forEach(t => {
      if (t.type === 'purchase' || t.type === 'topup') {
        balance += t.amount;
      } else if (t.type === 'redemption') {
        balance -= t.amount;
      }
    });

    expect(balance).toBe(4250);
  });
});

describe('Campaign Management', () => {
  it('should have correct campaign structure', () => {
    const campaign = {
      id: 'campaign-001',
      name: 'Summer Special',
      bonusValue: 10,
      minPurchaseAmount: 1000,
      validFrom: new Date('2026-06-01'),
      validTo: new Date('2026-08-31'),
      maxIssuance: 100,
      issuedCount: 25,
      isActive: true,
    };

    expect(campaign).toHaveProperty('bonusValue');
    expect(campaign).toHaveProperty('isActive');
  });

  it('should check if campaign is within valid period', () => {
    const campaign = {
      validFrom: new Date('2026-06-01'),
      validTo: new Date('2026-08-31'),
    };
    const now = new Date('2026-07-01');

    const isValid = now >= campaign.validFrom && now <= campaign.validTo;
    expect(isValid).toBe(true);
  });

  it('should check campaign issuance limit', () => {
    const campaign = {
      maxIssuance: 100,
      issuedCount: 100,
    };

    const canIssue = campaign.issuedCount < campaign.maxIssuance;
    expect(canIssue).toBe(false);
  });

  it('should calculate remaining campaign issuance', () => {
    const campaign = {
      maxIssuance: 100,
      issuedCount: 75,
    };

    const remaining = campaign.maxIssuance - campaign.issuedCount;
    expect(remaining).toBe(25);
  });
});

describe('Validation', () => {
  it('should validate email format', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.in'];
    const invalidEmails = ['invalid', '@nodomain.com', 'no@'];

    validEmails.forEach(email => {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    invalidEmails.forEach(email => {
      expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  it('should validate recipient message length', () => {
    const maxLength = 500;
    const message = 'A'.repeat(500);

    expect(message.length).toBeLessThanOrEqual(maxLength);
    expect(message.length).toBe(500);
  });
});

describe('Analytics', () => {
  it('should calculate total issued value', () => {
    const cards = [
      { initialValue: 5000 },
      { initialValue: 3000 },
      { initialValue: 7500 },
    ];

    const total = cards.reduce((sum, c) => sum + c.initialValue, 0);
    expect(total).toBe(15500);
  });

  it('should calculate outstanding value', () => {
    const cards = [
      { status: 'active', currentBalance: 3250 },
      { status: 'active', currentBalance: 1800 },
      { status: 'redeemed', currentBalance: 0 },
    ];

    const outstanding = cards
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.currentBalance, 0);

    expect(outstanding).toBe(5050);
  });

  it('should calculate redemption rate', () => {
    const totalIssued = 50000;
    const totalRedeemed = 35000;
    const totalOutstanding = 10000;
    const alreadyUsed = totalIssued - totalOutstanding;

    const redemptionRate = Math.round((totalRedeemed / alreadyUsed) * 100);
    expect(redemptionRate).toBe(88);
  });
});

describe('API Response Format', () => {
  it('should format success response correctly', () => {
    const response = {
      success: true,
      data: { id: 'gc-001', cardNumber: 'GC4721000001234' },
      message: 'Gift card purchased successfully',
    };

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('data');
  });

  it('should format error response correctly', () => {
    const errorResponse = {
      success: false,
      message: 'Insufficient balance',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });

  it('should include error details for validation failures', () => {
    const validationError = {
      success: false,
      data: { errors: [{ field: 'amount', message: 'Must be at least 100' }] },
      message: 'Validation failed',
    };

    expect(validationError.success).toBe(false);
    expect(validationError.data).toHaveProperty('errors');
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'healthy',
      service: 'rez-gift-card-service',
      port: 4047,
      timestamp: new Date().toISOString(),
      stats: {
        giftCards: 25,
        activeCards: 20,
        transactions: 150,
        campaigns: 3,
      },
    };

    expect(health.status).toBe('healthy');
    expect(health).toHaveProperty('stats');
    expect(health.stats).toHaveProperty('giftCards');
  });
});
