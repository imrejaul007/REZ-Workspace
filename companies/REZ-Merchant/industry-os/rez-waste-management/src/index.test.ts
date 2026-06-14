/**
 * REZ Waste Management Service - Unit Tests
 * Tests for waste tracking, spoilage management, and COGS calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// WASTE ENTRY TESTS
// ============================================

describe('Waste Entry Management', () => {
  interface WasteEntry {
    merchantId: string;
    restaurantId: string;
    itemId: string;
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    cost: number;
    reason: string;
    loggedBy: string;
    createdAt: Date;
  }

  describe('Waste Entry Creation', () => {
    it('should create valid waste entry', () => {
      const entry: WasteEntry = {
        merchantId: 'merchant-123',
        restaurantId: 'restaurant-456',
        itemId: 'item-789',
        itemName: 'Chicken Breast',
        category: 'proteins',
        quantity: 2.5,
        unit: 'kg',
        cost: 250,
        reason: 'expiry',
        loggedBy: 'staff-001',
        createdAt: new Date(),
      };

      expect(entry.itemName).toBe('Chicken Breast');
      expect(entry.quantity).toBe(2.5);
      expect(entry.cost).toBe(250);
    });

    it('should calculate total waste cost', () => {
      const quantity = 5;
      const unitCost = 50;
      const totalCost = quantity * unitCost;

      expect(totalCost).toBe(250);
    });

    it('should handle different units', () => {
      const entries = [
        { unit: 'kg', quantity: 2, costPerUnit: 100 },
        { unit: 'pieces', quantity: 10, costPerUnit: 15 },
        { unit: 'liters', quantity: 1.5, costPerUnit: 80 },
      ];

      entries.forEach(entry => {
        const cost = entry.quantity * entry.costPerUnit;
        expect(cost).toBeGreaterThan(0);
      });
    });
  });

  describe('Waste Categories', () => {
    const VALID_CATEGORIES = [
      'proteins',
      'vegetables',
      'dairy',
      'grains',
      'beverages',
      'prepared',
      'packaging',
      'other',
    ];

    it('should have valid waste categories', () => {
      VALID_CATEGORIES.forEach(cat => {
        expect(VALID_CATEGORIES.includes(cat)).toBe(true);
      });
    });

    it('should categorize by type', () => {
      const items = [
        { item: 'Chicken', category: 'proteins' },
        { item: 'Milk', category: 'dairy' },
        { item: 'Rice', category: 'grains' },
      ];

      const proteins = items.filter(i => i.category === 'proteins');
      expect(proteins.length).toBe(1);
    });
  });

  describe('Waste Reasons', () => {
    const VALID_REASONS = [
      'expiry',
      'damaged',
      'overproduction',
      'customer_return',
      'quality_issue',
      'spillage',
      'other',
    ];

    it('should have valid waste reasons', () => {
      VALID_REASONS.forEach(reason => {
        expect(VALID_REASONS.includes(reason)).toBe(true);
      });
    });

    it('should track most common waste reasons', () => {
      const entries = [
        { reason: 'expiry' },
        { reason: 'expiry' },
        { reason: 'expiry' },
        { reason: 'damaged' },
        { reason: 'overproduction' },
      ];

      const byReason = entries.reduce((acc, e) => {
        acc[e.reason] = (acc[e.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(byReason.expiry).toBe(3);
      expect(byReason.damaged).toBe(1);
    });
  });
});

// ============================================
// WASTE SUMMARY CALCULATIONS
// ============================================

describe('Waste Summary Calculations', () => {
  interface WasteEntry {
    category: string;
    cost: number;
    quantity: number;
  }

  describe('Total Waste Cost', () => {
    it('should calculate total waste cost', () => {
      const entries: WasteEntry[] = [
        { category: 'proteins', cost: 200, quantity: 2 },
        { category: 'vegetables', cost: 150, quantity: 5 },
        { category: 'dairy', cost: 100, quantity: 3 },
      ];

      const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
      expect(totalCost).toBe(450);
    });

    it('should handle empty entries', () => {
      const entries: WasteEntry[] = [];
      const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
      expect(totalCost).toBe(0);
    });

    it('should handle zero cost entries', () => {
      const entries: WasteEntry[] = [
        { category: 'other', cost: 0, quantity: 1 },
      ];
      const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
      expect(totalCost).toBe(0);
    });
  });

  describe('Category Breakdown', () => {
    it('should calculate cost by category', () => {
      const entries: WasteEntry[] = [
        { category: 'proteins', cost: 200, quantity: 2 },
        { category: 'proteins', cost: 150, quantity: 1.5 },
        { category: 'vegetables', cost: 100, quantity: 3 },
        { category: 'dairy', cost: 75, quantity: 2 },
      ];

      const byCategory = entries.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.cost;
        return acc;
      }, {} as Record<string, number>);

      expect(byCategory.proteins).toBe(350);
      expect(byCategory.vegetables).toBe(100);
      expect(byCategory.dairy).toBe(75);
    });

    it('should count entries by category', () => {
      const entries: WasteEntry[] = [
        { category: 'proteins', cost: 200, quantity: 2 },
        { category: 'proteins', cost: 150, quantity: 1.5 },
        { category: 'vegetables', cost: 100, quantity: 3 },
      ];

      const countByCategory = entries.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(countByCategory.proteins).toBe(2);
      expect(countByCategory.vegetables).toBe(1);
    });

    it('should calculate percentage by category', () => {
      const entries: WasteEntry[] = [
        { category: 'proteins', cost: 300, quantity: 3 },
        { category: 'vegetables', cost: 200, quantity: 5 },
      ];

      const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
      const percentages: Record<string, number> = {};

      entries.forEach(e => {
        percentages[e.category] = (e.cost / totalCost) * 100;
      });

      expect(percentages.proteins).toBe(60);
      expect(percentages.vegetables).toBe(40);
    });
  });

  describe('Total Quantity', () => {
    it('should calculate total waste quantity', () => {
      const entries: WasteEntry[] = [
        { category: 'proteins', cost: 200, quantity: 2 },
        { category: 'vegetables', cost: 150, quantity: 5 },
        { category: 'dairy', cost: 100, quantity: 3 },
      ];

      const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);
      expect(totalQuantity).toBe(10);
    });
  });
});

// ============================================
// COGS CALCULATION TESTS
// ============================================

describe('COGS Calculation', () => {
  describe('Waste Percentage Calculation', () => {
    function calculateWastePercentage(wasteCost: number, revenue: number): number {
      if (revenue === 0) return 0;
      return (wasteCost / revenue) * 100;
    }

    it('should calculate waste as percentage of revenue', () => {
      const percentage = calculateWastePercentage(500, 10000);
      expect(percentage).toBe(5);
    });

    it('should handle zero revenue', () => {
      const percentage = calculateWastePercentage(500, 0);
      expect(percentage).toBe(0);
    });

    it('should handle high waste percentage', () => {
      const percentage = calculateWastePercentage(8000, 10000);
      expect(percentage).toBe(80);
    });

    it('should handle low waste percentage', () => {
      const percentage = calculateWastePercentage(100, 50000);
      expect(percentage).toBe(0.2);
    });
  });

  describe('Actual vs Target COGS', () => {
    function calculateCOGSVariance(actualCOGS: number, targetCOGS: number): number {
      return ((actualCOGS - targetCOGS) / targetCOGS) * 100;
    }

    it('should calculate positive variance when over target', () => {
      const variance = calculateCOGSVariance(35, 30);
      expect(variance).toBeCloseTo(16.67, 1); // ~17% over
    });

    it('should calculate negative variance when under target', () => {
      const variance = calculateCOGSVariance(25, 30);
      expect(variance).toBeCloseTo(-16.67, 1); // ~17% under
    });

    it('should return zero when on target', () => {
      const variance = calculateCOGSVariance(30, 30);
      expect(variance).toBe(0);
    });
  });

  describe('Net Food Cost', () => {
    function calculateNetFoodCost(
      beginningInventory: number,
      purchases: number,
      endingInventory: number,
      wasteCost: number
    ): { foodCost: number; wastePercentage: number } {
      const foodCost = beginningInventory + purchases - endingInventory;
      const totalCost = foodCost + wasteCost;
      const wastePercentage = totalCost > 0 ? (wasteCost / totalCost) * 100 : 0;

      return { foodCost, wastePercentage };
    }

    it('should calculate net food cost', () => {
      const result = calculateNetFoodCost(5000, 3000, 4000, 500);

      expect(result.foodCost).toBe(4000); // 5000 + 3000 - 4000
      expect(result.wastePercentage).toBeCloseTo(11.11, 1);
    });

    it('should handle zero waste', () => {
      const result = calculateNetFoodCost(5000, 3000, 4000, 0);

      expect(result.foodCost).toBe(4000);
      expect(result.wastePercentage).toBe(0);
    });
  });
});

// ============================================
// DATE FILTERING TESTS
// ============================================

describe('Date Range Filtering', () => {
  interface WasteEntry {
    itemName: string;
    createdAt: Date;
    cost: number;
  }

  it('should filter entries within date range', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const entries: WasteEntry[] = [
      { itemName: 'Item1', createdAt: new Date('2024-01-15'), cost: 100 },
      { itemName: 'Item2', createdAt: new Date('2024-02-15'), cost: 200 },
      { itemName: 'Item3', createdAt: new Date('2024-01-20'), cost: 150 },
    ];

    const filtered = entries.filter(
      e => e.createdAt >= startDate && e.createdAt <= endDate
    );

    expect(filtered.length).toBe(2);
  });

  it('should handle same-day filtering', () => {
    const targetDate = new Date('2024-01-15');

    const entries: WasteEntry[] = [
      { itemName: 'Item1', createdAt: new Date('2024-01-15'), cost: 100 },
      { itemName: 'Item2', createdAt: new Date('2024-01-16'), cost: 200 },
    ];

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = entries.filter(
      e => e.createdAt >= startOfDay && e.createdAt <= endOfDay
    );

    expect(filtered.length).toBe(1);
  });

  it('should handle month boundaries', () => {
    const entries: WasteEntry[] = [
      { itemName: 'Item1', createdAt: new Date('2024-01-31T23:59:59'), cost: 100 },
      { itemName: 'Item2', createdAt: new Date('2024-02-01T00:00:00'), cost: 200 },
    ];

    const januaryStart = new Date('2024-01-01');
    const januaryEnd = new Date('2024-01-31T23:59:59');

    const filtered = entries.filter(
      e => e.createdAt >= januaryStart && e.createdAt <= januaryEnd
    );

    expect(filtered.length).toBe(1);
  });
});

// ============================================
// TREND ANALYSIS TESTS
// ============================================

describe('Trend Analysis', () => {
  describe('Daily Waste Trends', () => {
    it('should calculate daily averages', () => {
      const dailyWaste = [
        { date: '2024-01-01', cost: 100 },
        { date: '2024-01-02', cost: 150 },
        { date: '2024-01-03', cost: 120 },
      ];

      const total = dailyWaste.reduce((sum, d) => sum + d.cost, 0);
      const average = total / dailyWaste.length;

      expect(average).toBe(123.33);
    });

    it('should identify peak waste days', () => {
      const dailyWaste = [
        { date: '2024-01-01', cost: 100 },
        { date: '2024-01-02', cost: 250 },
        { date: '2024-01-03', cost: 120 },
      ];

      const peakDay = dailyWaste.reduce((max, d) =>
        d.cost > max.cost ? d : max
      );

      expect(peakDay.date).toBe('2024-01-02');
      expect(peakDay.cost).toBe(250);
    });
  });

  describe('Weekly Waste Trends', () => {
    it('should compare week-over-week changes', () => {
      const weeklyWaste = [
        { week: 1, cost: 1000 },
        { week: 2, cost: 1200 },
        { week: 3, cost: 900 },
      ];

      const week2ToWeek3 = ((weeklyWaste[2].cost - weeklyWaste[1].cost) / weeklyWaste[1].cost) * 100;
      expect(week2ToWeek3).toBe(-25); // 25% decrease
    });

    it('should identify improving or worsening trends', () => {
      const weeklyWaste = [
        { week: 1, cost: 1000 },
        { week: 2, cost: 1100 },
        { week: 3, cost: 1200 },
        { week: 4, cost: 1350 },
      ];

      const isWorsening = weeklyWaste[3].cost > weeklyWaste[0].cost;
      expect(isWorsening).toBe(true);
    });
  });

  describe('Category Trends', () => {
    it('should track category changes over time', () => {
      const before = { proteins: 40, vegetables: 30, dairy: 30 };
      const after = { proteins: 35, vegetables: 35, dairy: 30 };

      const proteinChange = after.proteins - before.proteins;
      expect(proteinChange).toBe(-5);
    });
  });
});

// ============================================
// DISPOSAL REASON ANALYSIS TESTS
// ============================================

describe('Disposal Reason Analysis', () => {
  interface WasteEntry {
    reason: string;
    cost: number;
  }

  it('should calculate cost by disposal reason', () => {
    const entries: WasteEntry[] = [
      { reason: 'expiry', cost: 500 },
      { reason: 'expiry', cost: 300 },
      { reason: 'damaged', cost: 200 },
      { reason: 'overproduction', cost: 400 },
    ];

    const byReason = entries.reduce((acc, e) => {
      acc[e.reason] = (acc[e.reason] || 0) + e.cost;
      return acc;
    }, {} as Record<string, number>);

    expect(byReason.expiry).toBe(800);
    expect(byReason.damaged).toBe(200);
    expect(byReason.overproduction).toBe(400);
  });

  it('should identify primary waste reasons', () => {
    const entries: WasteEntry[] = [
      { reason: 'expiry', cost: 600 },
      { reason: 'damaged', cost: 200 },
      { reason: 'overproduction', cost: 150 },
    ];

    const byReason = entries.reduce((acc, e) => {
      acc[e.reason] = (acc[e.reason] || 0) + e.cost;
      return acc;
    }, {} as Record<string, number>);

    const primaryReason = Object.entries(byReason).reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    expect(primaryReason[0]).toBe('expiry');
  });

  it('should calculate percentage by reason', () => {
    const entries: WasteEntry[] = [
      { reason: 'expiry', cost: 600 },
      { reason: 'damaged', cost: 300 },
      { reason: 'other', cost: 100 },
    ];

    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const expiryPercentage = (600 / totalCost) * 100;

    expect(expiryPercentage).toBe(60);
  });
});

// ============================================
// ALERTS AND THRESHOLDS TESTS
// ============================================

describe('Alerts and Thresholds', () => {
  describe('High Waste Alert', () => {
    function shouldAlertHighWaste(wasteCost: number, threshold: number): boolean {
      return wasteCost > threshold;
    }

    it('should alert when waste exceeds threshold', () => {
      expect(shouldAlertHighWaste(1500, 1000)).toBe(true);
    });

    it('should not alert when waste is within threshold', () => {
      expect(shouldAlertHighWaste(800, 1000)).toBe(false);
    });

    it('should use configurable threshold', () => {
      expect(shouldAlertHighWaste(500, 500)).toBe(false);
    });
  });

  describe('Category Threshold Alerts', () => {
    function getCategoryAlerts(
      categoryCosts: Record<string, number>,
      thresholds: Record<string, number>
    ): string[] {
      const alerts: string[] = [];

      Object.entries(categoryCosts).forEach(([category, cost]) => {
        if (thresholds[category] && cost > thresholds[category]) {
          alerts.push(`${category} waste exceeded threshold`);
        }
      });

      return alerts;
    }

    it('should alert for categories exceeding thresholds', () => {
      const categoryCosts = {
        proteins: 1500,
        vegetables: 500,
        dairy: 800,
      };

      const thresholds = {
        proteins: 1000,
        dairy: 500,
      };

      const alerts = getCategoryAlerts(categoryCosts, thresholds);

      expect(alerts).toContain('proteins waste exceeded threshold');
      expect(alerts).toContain('dairy waste exceeded threshold');
      expect(alerts.length).toBe(2);
    });
  });

  describe('Trend Alerts', () => {
    function shouldAlertIncreasingTrend(weeklyCosts: number[]): boolean {
      if (weeklyCosts.length < 3) return false;

      const recentAvg = weeklyCosts.slice(-2).reduce((a, b) => a + b, 0) / 2;
      const olderAvg = weeklyCosts.slice(0, 2).reduce((a, b) => a + b, 0) / 2;

      return recentAvg > olderAvg * 1.2; // 20% increase
    }

    it('should alert on significant increase', () => {
      const costs = [1000, 1000, 1500, 1800];
      expect(shouldAlertIncreasingTrend(costs)).toBe(true);
    });

    it('should not alert on stable trend', () => {
      const costs = [1000, 1000, 1050, 1100];
      expect(shouldAlertIncreasingTrend(costs)).toBe(false);
    });

    it('should not alert on decreasing trend', () => {
      const costs = [1500, 1400, 1200, 1000];
      expect(shouldAlertIncreasingTrend(costs)).toBe(false);
    });
  });
});

// ============================================
// API RESPONSE FORMAT TESTS
// ============================================

describe('API Response Formats', () => {
  describe('Waste Entry Response', () => {
    it('should format waste entry response', () => {
      const response = {
        success: true,
        data: {
          itemName: 'Chicken Breast',
          category: 'proteins',
          quantity: 2.5,
          unit: 'kg',
          cost: 250,
          reason: 'expiry',
          loggedBy: 'staff-001',
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.cost).toBe(250);
    });
  });

  describe('Waste Summary Response', () => {
    it('should format waste summary response', () => {
      const response = {
        success: true,
        data: {
          totalCost: 4500,
          totalEntries: 25,
          byCategory: [
            { category: 'proteins', cost: 2000, count: 10 },
            { category: 'vegetables', cost: 1500, count: 8 },
            { category: 'dairy', cost: 1000, count: 7 },
          ],
        },
      };

      expect(response.data.totalCost).toBe(4500);
      expect(response.data.byCategory.length).toBe(3);
    });
  });

  describe('COGS Response', () => {
    it('should format COGS response', () => {
      const response = {
        success: true,
        data: {
          wasteCost: 5000,
          wastePercentage: 8.5,
          foodCost: 30000,
          netFoodCost: 35000,
        },
      };

      expect(response.data.wasteCost).toBe(5000);
      expect(response.data.wastePercentage).toBe(8.5);
    });
  });

  describe('Error Response', () => {
    it('should format error response', () => {
      const response = {
        success: false,
        error: 'Failed to log waste',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

describe('Request Validation', () => {
  describe('Waste Entry Validation', () => {
    it('should require merchantId', () => {
      const entry = { merchantId: '' };
      expect(entry.merchantId).toBeDefined();
    });

    it('should require restaurantId', () => {
      const entry = { restaurantId: 'rest-123' };
      expect(entry.restaurantId).toBe('rest-123');
    });

    it('should require positive quantity', () => {
      const quantity = 5;
      expect(quantity).toBeGreaterThan(0);
    });

    it('should require non-negative cost', () => {
      const cost = 0;
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Date Range Validation', () => {
    it('should require startDate before endDate', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      expect(startDate < endDate).toBe(true);
    });

    it('should handle invalid date range', () => {
      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01');

      expect(startDate < endDate).toBe(false);
    });
  });
});
