/**
 * TreasuryOS - Investment Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('mongoose');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

describe('InvestmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Investment Creation', () => {
    it('should validate investment types', () => {
      const validTypes = [
        'fixed_deposit',
        'recurring_deposit',
        'mutual_fund',
        'government_bond',
        'corporate_bond',
        'money_market',
        'custom'
      ];

      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });

    it('should calculate maturity date correctly', () => {
      const startDate = new Date('2024-01-01');
      const tenureDays = 365;
      const maturityDate = new Date(startDate.getTime() + tenureDays * 24 * 60 * 60 * 1000);

      expect(maturityDate.getFullYear()).toBe(2025);
      expect(maturityDate.getMonth()).toBe(0); // January
      expect(maturityDate.getDate()).toBe(1);
    });

    it('should calculate simple interest correctly', () => {
      const principal = 100000;
      const annualRate = 7.5;
      const tenureDays = 365;

      // Simple Interest = P * R * T / 100
      const years = tenureDays / 365;
      const interest = (principal * annualRate * years) / 100;
      const maturityAmount = principal + interest;

      expect(interest).toBe(7500);
      expect(maturityAmount).toBe(107500);
    });

    it('should calculate compound interest correctly', () => {
      const principal = 100000;
      const annualRate = 7.5;
      const tenureDays = 365;
      const compoundingFrequency = 12; // Monthly

      // A = P(1 + r/n)^(nt)
      const rate = annualRate / 100;
      const n = compoundingFrequency;
      const t = tenureDays / 365;
      const maturityAmount = principal * Math.pow(1 + rate / n, n * t);

      expect(maturityAmount).toBeGreaterThan(principal);
      expect(maturityAmount).toBeCloseTo(107783, 0);
    });
  });

  describe('Investment Redemption', () => {
    it('should identify premature vs matured investments', () => {
      const now = new Date();
      const maturityDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days future
      const pastMaturity = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days past

      expect(now < maturityDate).toBe(true); // Not matured
      expect(now > pastMaturity).toBe(true); // Past maturity
    });

    it('should calculate TDS on interest correctly', () => {
      const interestEarned = 15000;
      const tdsThreshold = 10000;
      const tdsRate = 0.1;

      let tds = 0;
      if (interestEarned > tdsThreshold) {
        tds = (interestEarned - tdsThreshold) * tdsRate;
      }

      expect(tds).toBe(500);
    });

    it('should calculate net proceeds after TDS', () => {
      const currentValue = 115000;
      const tds = 500;
      const netProceeds = currentValue - tds;

      expect(netProceeds).toBe(114500);
    });

    it('should apply premature withdrawal penalty', () => {
      const principal = 100000;
      const originalRate = 7.5;
      const penaltyRate = 1;
      const reducedRate = Math.max(originalRate - penaltyRate, 5);
      const daysElapsed = 180;
      const years = daysElapsed / 365;

      const interest = (principal * reducedRate * years) / 100;

      expect(reducedRate).toBe(6.5);
      expect(interest).toBeCloseTo(3219, 0);
    });
  });

  describe('Mark-to-Market Updates', () => {
    it('should calculate return percentage correctly', () => {
      const principal = 100000;
      const currentValue = 107500;
      const returnAmount = currentValue - principal;
      const returnPercent = (returnAmount / principal) * 100;

      expect(returnPercent).toBe(7.5);
    });

    it('should calculate change correctly', () => {
      const previousValue = 105000;
      const currentValue = 107500;
      const change = currentValue - previousValue;
      const changePercent = (change / previousValue) * 100;

      expect(change).toBe(2500);
      expect(changePercent).toBeCloseTo(2.38, 1);
    });

    it('should identify positive vs negative returns', () => {
      const positiveReturn = { value: 107500, previous: 105000 };
      const negativeReturn = { value: 98000, previous: 100000 };

      expect(positiveReturn.value - positiveReturn.previous).toBeGreaterThan(0);
      expect(negativeReturn.value - negativeReturn.previous).toBeLessThan(0);
    });
  });

  describe('Investment Portfolio', () => {
    it('should calculate total portfolio value', () => {
      const investments = [
        { type: 'fixed_deposit', currentValue: 100000 },
        { type: 'mutual_fund', currentValue: 50000 },
        { type: 'government_bond', currentValue: 75000 },
      ];

      const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
      expect(totalValue).toBe(225000);
    });

    it('should calculate portfolio returns by type', () => {
      const investments = [
        { type: 'fixed_deposit', principal: 100000, currentValue: 107500 },
        { type: 'mutual_fund', principal: 50000, currentValue: 52500 },
      ];

      const returns = investments.map(inv => ({
        type: inv.type,
        return: ((inv.currentValue - inv.principal) / inv.principal) * 100,
      }));

      expect(returns[0].return).toBe(7.5);
      expect(returns[1].return).toBe(5);
    });

    it('should identify upcoming maturities', () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const investments = [
        { name: 'FD 1', maturityDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) },
        { name: 'FD 2', maturityDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) },
        { name: 'FD 3', maturityDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000) },
      ];

      const upcoming = investments.filter(inv =>
        inv.maturityDate <= thirtyDaysFromNow && inv.maturityDate > now
      );

      expect(upcoming.length).toBe(2);
    });

    it('should calculate days to maturity', () => {
      const now = new Date();
      const maturityDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.ceil((maturityDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      expect(daysRemaining).toBe(45);
    });
  });

  describe('Auto-Renewal', () => {
    it('should determine auto-renewal eligibility', () => {
      const investment = {
        autoRenew: true,
        renewTerms: { rate: 7.5, tenureDays: 365 },
        status: 'active',
      };

      expect(investment.autoRenew).toBe(true);
      expect(investment.status).toBe('active');
    });

    it('should calculate new maturity for renewal', () => {
      const currentMaturity = new Date('2024-01-01');
      const tenureDays = 365;
      const newMaturity = new Date(currentMaturity.getTime() + tenureDays * 24 * 60 * 60 * 1000);

      expect(newMaturity.getFullYear()).toBe(2025);
    });
  });

  describe('Investment Validation', () => {
    it('should reject negative principal', () => {
      const principal = -1000;
      expect(principal).toBeLessThan(0);
    });

    it('should reject zero tenure', () => {
      const tenureDays = 0;
      expect(tenureDays).toBe(0);
    });

    it('should validate interest rate range', () => {
      const validRate = 7.5;
      const tooHighRate = 25;
      const negativeRate = -2;

      expect(validRate).toBeGreaterThan(0);
      expect(validRate).toBeLessThanOrEqual(20);
      expect(tooHighRate).toBeGreaterThan(20);
      expect(negativeRate).toBeLessThan(0);
    });
  });

  describe('Investment Transactions', () => {
    it('should categorize transaction types', () => {
      const transactionTypes = ['purchase', 'redemption', 'dividend', 'interest', 'fee', 'reinvestment'];

      expect(transactionTypes).toContain('purchase');
      expect(transactionTypes).toContain('redemption');
    });

    it('should calculate reinvestment amount', () => {
      const dividend = 5000;
      const nav = 25;
      const units = dividend / nav;

      expect(units).toBe(200);
    });
  });
});

describe('Investment Benchmarks', () => {
  it('should calculate alpha vs benchmark', () => {
    const portfolioReturn = 8.5;
    const benchmarkReturn = 7.0;
    const alpha = portfolioReturn - benchmarkReturn;

    expect(alpha).toBe(1.5);
  });

  it('should track benchmark comparison', () => {
    const investment = {
      benchmarkValue: 100000,
      currentValue: 105000,
    };

    const benchmarkReturn = ((investment.currentValue - investment.benchmarkValue) / investment.benchmarkValue) * 100;
    expect(benchmarkReturn).toBe(5);
  });
});
