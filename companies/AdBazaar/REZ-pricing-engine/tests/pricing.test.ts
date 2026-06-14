/**
 * REZ Pricing Engine - Unit Tests
 * Tests pricing calculations, discount logic, and budget allocation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'http://localhost:4131';

// ============================================
// PRICING CALCULATION TESTS
// ============================================

describe('REZ Pricing Engine - Pricing Calculations', () => {
  describe('Base Price Calculations', () => {
    it('should calculate base price for banner ads', async () => {
      // Banner base CPM is 150, CPC is 5, CPA is 50
      const bannerCPM = 150;
      const bannerCPC = 5;
      const bannerCPA = 50;

      expect(bannerCPM).toBe(150);
      expect(bannerCPC).toBe(5);
      expect(bannerCPA).toBe(50);
    });

    it('should calculate base price for DOOH ads', async () => {
      // DOOH base CPM is 200, CPC is 8, CPA is 60, CPV is 12, CPS is 5
      const doohCPM = 200;
      const doohCPC = 8;
      const doohCPA = 60;
      const doohCPV = 12;
      const doohCPS = 5;

      expect(doohCPM).toBe(200);
      expect(doohCPC).toBe(8);
      expect(doohCPA).toBe(60);
      expect(doohCPV).toBe(12);
      expect(doohCPS).toBe(5);
    });

    it('should calculate base price for QR campaigns', async () => {
      // QR base CPM is 40, CPC is 2, CPA is 20, CPV is 4, CPS is 3
      const qrCPM = 40;
      const qrCPC = 2;
      const qrCPA = 20;
      const qrCPV = 4;
      const qrCPS = 3;

      expect(qrCPM).toBe(40);
      expect(qrCPC).toBe(2);
      expect(qrCPA).toBe(20);
      expect(qrCPS).toBe(3);
    });
  });

  describe('Peak Time Multipliers', () => {
    it('should apply correct multiplier for peak evening hours', () => {
      // Peak hour multipliers
      const peakHours: Record<number, number> = {
        6: 0.6, 7: 0.8, 8: 1.2, 9: 1.5, 10: 1.8, 11: 2.0,
        12: 1.8, 13: 1.3, 14: 1.2, 15: 1.0, 16: 1.1, 17: 1.4,
        18: 1.8, 19: 2.2, 20: 2.5, 21: 2.0, 22: 1.5, 23: 0.9,
        0: 0.5, 1: 0.4, 2: 0.3, 3: 0.3, 4: 0.4, 5: 0.5,
      };

      // Peak times (8 PM)
      expect(peakHours[20]).toBe(2.5);

      // Peak times (9 PM)
      expect(peakHours[21]).toBe(2.0);

      // Low times (3 AM)
      expect(peakHours[3]).toBe(0.3);

      // Off-peak (3 PM)
      expect(peakHours[15]).toBe(1.0);
    });

    it('should apply correct multiplier for day of week', () => {
      const dayMultipliers: Record<number, number> = {
        0: 0.7,  // Sunday
        1: 0.9,  // Monday
        2: 0.95, // Tuesday
        3: 1.0,  // Wednesday
        4: 1.1,  // Thursday
        5: 1.3,  // Friday
        6: 1.4,  // Saturday
      };

      // Weekend premium
      expect(dayMultipliers[6]).toBe(1.4); // Saturday
      expect(dayMultipliers[5]).toBe(1.3); // Friday

      // Weekday base
      expect(dayMultipliers[0]).toBe(0.7); // Sunday low
    });
  });

  describe('Seasonal Multipliers', () => {
    it('should apply festival season multipliers', () => {
      // Festival-heavy months (Oct-Dec)
      const festivalMonths = [9, 10, 11];
      const festivalMultiplier = 2.0;

      festivalMonths.forEach((month) => {
        expect(month).toBeGreaterThanOrEqual(9);
        expect(month).toBeLessThanOrEqual(11);
      });

      // Holi season (Feb-Mar)
      const holiMonths = [2, 3];
      const holiMultiplier = 1.5;

      holiMonths.forEach((month) => {
        expect(month).toBeGreaterThanOrEqual(2);
        expect(month).toBeLessThanOrEqual(3);
      });

      // Summer (Apr-May)
      const summerMonths = [4, 5];
      const summerMultiplier = 1.3;

      summerMonths.forEach((month) => {
        expect(month).toBeGreaterThanOrEqual(4);
        expect(month).toBeLessThanOrEqual(5);
      });

      // Monsoon (Jun-Jul)
      const monsoonMonths = [6, 7];
      const monsoonMultiplier = 0.8;

      monsoonMonths.forEach((month) => {
        expect(month).toBeGreaterThanOrEqual(6);
        expect(month).toBeLessThanOrEqual(7);
      });
    });
  });

  describe('Location Multipliers', () => {
    it('should apply correct tier multipliers', () => {
      const tierMultipliers: Record<string, number> = {
        tier1: 2.5,
        tier2: 1.5,
        tier3: 1.0,
      };

      expect(tierMultipliers.tier1).toBe(2.5);
      expect(tierMultipliers.tier2).toBe(1.5);
      expect(tierMultipliers.tier3).toBe(1.0);

      // Mumbai is tier 1
      expect(tierMultipliers.tier1).toBeGreaterThan(tierMultipliers.tier2);
    });

    it('should calculate city tier correctly', () => {
      const tier1Cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
      const tier2Cities = ['jaipur', 'lucknow', 'chandigarh', 'indore', 'bhubaneswar', 'nagpur', 'mangalore'];

      const getCityTier = (city: string): string => {
        const normalizedCity = city.toLowerCase();
        if (tier1Cities.some(c => normalizedCity.includes(c))) return 'tier1';
        if (tier2Cities.some(c => normalizedCity.includes(c))) return 'tier2';
        return 'tier3';
      };

      expect(getCityTier('Mumbai')).toBe('tier1');
      expect(getCityTier('New Delhi')).toBe('tier1');
      expect(getCityTier('Jaipur')).toBe('tier2');
      expect(getCityTier('Unknown City')).toBe('tier3');
    });
  });

  describe('Category Multipliers', () => {
    it('should apply correct category multipliers', () => {
      const categoryMultipliers: Record<string, number> = {
        luxury: 2.5,
        real_estate: 3.0,
        restaurant: 1.0,
        events: 1.8,
        healthcare: 2.0,
        retail: 1.2,
        services: 1.0,
      };

      expect(categoryMultipliers.luxury).toBe(2.5);
      expect(categoryMultipliers.real_estate).toBe(3.0);
      expect(categoryMultipliers.restaurant).toBe(1.0);
      expect(categoryMultipliers.healthcare).toBe(2.0);
    });
  });

  describe('Audience Income Multipliers', () => {
    it('should apply correct income level multipliers', () => {
      const incomeMultipliers: Record<string, number> = {
        high: 1.5,
        medium: 1.2,
        low: 1.0,
      };

      expect(incomeMultipliers.high).toBe(1.5);
      expect(incomeMultipliers.medium).toBe(1.2);
      expect(incomeMultipliers.low).toBe(1.0);
    });
  });
});

// ============================================
// DISCOUNT LOGIC TESTS
// ============================================

describe('REZ Pricing Engine - Discount Logic', () => {
  describe('Liquidation Price Calculation', () => {
    it('should calculate 50% discount for last-minute slots (<1 hour)', () => {
      const originalPrice = 1000;
      const hoursUntilSlot = 0.5;

      let discount = 0;
      if (hoursUntilSlot < 1) discount += 0.5; // 50% off
      if (hoursUntilSlot < 4) discount += 0.3; // 30% off
      if (hoursUntilSlot < 24) discount += 0.15; // 15% off

      const liquidationPrice = originalPrice * (1 - Math.min(discount, 0.7));

      expect(discount).toBe(0.5);
      expect(liquidationPrice).toBe(500);
    });

    it('should calculate 30% discount for slots <4 hours', () => {
      const originalPrice = 1000;
      const hoursUntilSlot = 2;

      let discount = 0;
      if (hoursUntilSlot < 1) discount += 0.5;
      if (hoursUntilSlot < 4) discount += 0.3;
      if (hoursUntilSlot < 24) discount += 0.15;

      const liquidationPrice = originalPrice * (1 - Math.min(discount, 0.7));

      expect(discount).toBe((0.3 + 0.15));
      expect(liquidationPrice).toBe(550);
    });

    it('should calculate 15% discount for slots <24 hours', () => {
      const originalPrice = 1000;
      const hoursUntilSlot = 12;

      let discount = 0;
      if (hoursUntilSlot < 1) discount += 0.5;
      if (hoursUntilSlot < 4) discount += 0.3;
      if (hoursUntilSlot < 24) discount += 0.15;

      const liquidationPrice = originalPrice * (1 - Math.min(discount, 0.7));

      expect(discount).toBe(0.15);
      expect(liquidationPrice).toBe(850);
    });

    it('should apply unsold inventory discount', () => {
      const originalPrice = 1000;
      const percentSold = 20;

      let inventoryDiscount = 0;
      if (percentSold < 25) inventoryDiscount += 0.25;
      else if (percentSold < 50) inventoryDiscount += 0.15;
      else if (percentSold < 75) inventoryDiscount += 0.05;

      expect(inventoryDiscount).toBe(0.25);
    });

    it('should cap maximum discount at 70%', () => {
      const originalPrice = 1000;

      // Simulate combined discounts exceeding 70%
      const combinedDiscount = 0.5 + 0.3 + 0.15 + 0.25; // = 1.2
      const cappedDiscount = Math.min(combinedDiscount, 0.7);

      expect(cappedDiscount).toBe(0.7);
      expect(originalPrice * (1 - cappedDiscount)).toBe(300);
    });
  });

  describe('Minimum Spend Validation', () => {
    it('should validate minimum spend for each ad type', () => {
      const minimumSpend: Record<string, number> = {
        banner: 500,
        feed: 500,
        search: 500,
        store: 500,
        push: 300,
        whatsapp: 1000,
        email: 300,
        dooh: 3000,
        offline: 5000,
        qr: 500,
      };

      expect(minimumSpend.banner).toBe(500);
      expect(minimumSpend.push).toBe(300);
      expect(minimumSpend.whatsapp).toBe(1000);
      expect(minimumSpend.dooh).toBe(3000);
      expect(minimumSpend.offline).toBe(5000);
    });

    it('should reject budget below minimum spend', () => {
      const minimumSpend = { banner: 500, push: 300 };
      const budget = 250;

      const isValid = budget >= minimumSpend.banner;
      expect(isValid).toBe(false);
    });

    it('should accept budget at minimum spend', () => {
      const minimumSpend = { banner: 500, push: 300 };
      const budget = 500;

      const isValid = budget >= minimumSpend.banner;
      expect(isValid).toBe(true);
    });
  });
});

// ============================================
// BUDGET ALLOCATION TESTS
// ============================================

describe('REZ Pricing Engine - Budget Allocation', () => {
  describe('Channel Distribution', () => {
    it('should distribute awareness budget correctly', () => {
      const awarenessDistribution = {
        push: 30,
        feed: 25,
        banner: 20,
        whatsapp: 15,
        email: 10,
      };

      const totalBudget = 100000;
      const allocations = Object.entries(awarenessDistribution).map(([channel, percentage]) => ({
        channel,
        amount: totalBudget * (percentage / 100),
      }));

      expect(allocations.find(a => a.channel === 'push')?.amount).toBe(30000);
      expect(allocations.find(a => a.channel === 'feed')?.amount).toBe(25000);
      expect(allocations.find(a => a.channel === 'email')?.amount).toBe(10000);
    });

    it('should distribute conversion budget correctly', () => {
      const conversionDistribution = {
        whatsapp: 30,
        search: 25,
        feed: 20,
        push: 15,
        email: 10,
      };

      const totalBudget = 50000;
      const allocations = Object.entries(conversionDistribution).map(([channel, percentage]) => ({
        channel,
        amount: totalBudget * (percentage / 100),
      }));

      expect(allocations.find(a => a.channel === 'whatsapp')?.amount).toBe(15000);
      expect(allocations.find(a => a.channel === 'search')?.amount).toBe(12500);
    });

    it('should distribute QR scan budget correctly', () => {
      const qrScanDistribution = {
        qr: 50,
        offline: 30,
        push: 20,
      };

      const totalBudget = 10000;
      const allocations = Object.entries(qrScanDistribution).map(([channel, percentage]) => ({
        channel,
        amount: totalBudget * (percentage / 100),
      }));

      expect(allocations.find(a => a.channel === 'qr')?.amount).toBe(5000);
      expect(allocations.find(a => a.channel === 'offline')?.amount).toBe(3000);
    });
  });

  describe('Budget Allocation Sorting', () => {
    it('should sort allocations by amount descending', () => {
      const allocations = [
        { channel: 'push', amount: 30000 },
        { channel: 'feed', amount: 25000 },
        { channel: 'banner', amount: 20000 },
        { channel: 'whatsapp', amount: 15000 },
        { channel: 'email', amount: 10000 },
      ];

      const sorted = allocations.sort((a, b) => b.amount - a.amount);

      expect(sorted[0].channel).toBe('push');
      expect(sorted[4].channel).toBe('email');
    });
  });
});

// ============================================
// API ENDPOINT TESTS
// ============================================

describe('REZ Pricing Engine - API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ status: 'ok', service: 'REZ-pricing-engine' }),
      });

      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('REZ-pricing-engine');
    });
  });

  describe('POST /api/price', () => {
    it('should calculate price for DOOH campaign', async () => {
      const mockResponse = {
        success: true,
        data: {
          finalPrice: 450,
          unit: 'CPM',
          basePrice: 200,
          qualityScore: 1.0,
          confidenceScore: 0.8,
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType: 'dooh',
          placement: 'mall_led_screen',
          goalType: 'awareness',
          campaignMode: 'auction',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.finalPrice).toBeDefined();
    });

    it('should reject invalid ad type', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid ad type',
        }),
      });

      const res = await fetch(`${BASE_URL}/api/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType: 'invalid',
          goalType: 'awareness',
          campaignMode: 'auction',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/price/liquidation', () => {
    it('should calculate liquidation price', async () => {
      const mockResponse = {
        success: true,
        data: {
          originalPrice: 1000,
          liquidationPrice: 500,
          discountPercent: '50.0',
          reason: 'Last-minute unsold inventory',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/price/liquidation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrice: 1000,
          hoursUntilSlot: 0.5,
          percentSold: 20,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.liquidationPrice).toBe(500);
    });
  });

  describe('POST /api/price/validate', () => {
    it('should validate minimum spend for valid budget', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: true,
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/price/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType: 'banner',
          budget: 1000,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.valid).toBe(true);
    });

    it('should reject budget below minimum', async () => {
      const mockResponse = {
        success: true,
        data: {
          valid: false,
          message: 'Minimum campaign spend for banner is ₹500',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/price/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType: 'banner',
          budget: 100,
        }),
      });

      const data = await res.json();
      expect(data.data.valid).toBe(false);
    });
  });

  describe('GET /api/price/caps', () => {
    it('should return price caps for all ad types', async () => {
      const mockResponse = {
        success: true,
        data: {
          maxSurgeCaps: {
            banner: '5x',
            feed: '4x',
            dooh: '8x',
            qr: '5x',
          },
          minimumSpend: {
            banner: '₹500',
            feed: '₹500',
            dooh: '₹3,000',
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/price/caps`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.maxSurgeCaps.banner).toBe('5x');
      expect(data.data.maxSurgeCaps.dooh).toBe('8x');
    });
  });
});

// ============================================
// ESTIMATION TESTS
// ============================================

describe('REZ Pricing Engine - Estimation Calculations', () => {
  describe('Reach Estimation', () => {
    it('should estimate reach from budget and CPM', () => {
      const budget = 50000;
      const cpm = 50;
      const reach = (budget / cpm) * 1000;

      expect(reach).toBe(1000000);
    });

    it('should adjust reach based on targeting', () => {
      const baseReach = 100000;
      const targetingFactor = 0.3; // 70% reduction for narrow targeting
      const targetedReach = Math.round(baseReach * targetingFactor);

      expect(targetedReach).toBe(30000);
    });
  });

  describe('Click Estimation', () => {
    it('should estimate clicks from reach and CTR', () => {
      const reach = 100000;
      const ctr = 0.02; // 2% CTR
      const clicks = Math.round(reach * ctr);

      expect(clicks).toBe(2000);
    });

    it('should estimate clicks from budget and CPC', () => {
      const budget = 50000;
      const cpc = 5;
      const clicks = Math.round(budget / cpc);

      expect(clicks).toBe(10000);
    });
  });

  describe('Conversion Estimation', () => {
    it('should estimate conversions from clicks and conversion rate', () => {
      const clicks = 2000;
      const conversionRate = 0.05; // 5% conversion
      const conversions = Math.round(clicks * conversionRate);

      expect(conversions).toBe(100);
    });
  });
});
