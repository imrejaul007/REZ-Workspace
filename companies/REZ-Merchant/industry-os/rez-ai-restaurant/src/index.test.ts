/**
 * Unit Tests for Restaurant AI Plugin
 */

import { RestaurantAIPlugin } from './index';

jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('RestaurantAIPlugin', () => {
  let plugin: RestaurantAIPlugin;

  beforeEach(() => {
    plugin = new RestaurantAIPlugin();
  });

  describe('Plugin Initialization', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('restaurant');
    });

    it('should have correct version', () => {
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have correct description', () => {
      expect(plugin.description).toBe(
        'AI for Restaurant vertical - Demand forecast, Menu optimization, Kitchen AI'
      );
    });

    it('should have correct events list', () => {
      expect(plugin.events).toContain('order.created');
      expect(plugin.events).toContain('order.completed');
      expect(plugin.events).toContain('order.cancelled');
      expect(plugin.events).toContain('menu.viewed');
      expect(plugin.events).toContain('checkout.started');
    });

    it('should have correct models list', () => {
      expect(plugin.models).toContain('demand-forecast');
      expect(plugin.models).toContain('prep-time-prediction');
      expect(plugin.models).toContain('menu-popularity');
      expect(plugin.models).toContain('optimal-pricing');
      expect(plugin.models).toContain('seat-forecast');
      expect(plugin.models).toContain('staff-forecast');
    });

    it('should initialize with config', async () => {
      const config = { storeId: 'store_123', merchantId: 'merchant_456' };
      await plugin.init(config);
      expect(plugin.api).toBeDefined();
    });
  });

  describe('Plugin Shutdown', () => {
    it('should shutdown without errors', async () => {
      await expect(plugin.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Prep Time Prediction', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should calculate prep time for biryani', async () => {
      const req = {
        body: {
          items: [{ category: 'biryani', quantity: 2 }],
          storeId: 'test_store',
          kitchenLoad: 0,
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await (plugin as any).predictPrepTime(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'prep-time-prediction',
          version: '1.0.0',
          prediction: expect.objectContaining({
            estimatedMinutes: 30, // 15 * 2 = 30
          }),
        })
      );
    });

    it('should calculate prep time for pizza', async () => {
      const req = {
        body: {
          items: [{ category: 'pizza', quantity: 3 }],
          storeId: 'test_store',
          kitchenLoad: 0,
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await (plugin as any).predictPrepTime(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prediction: expect.objectContaining({
            estimatedMinutes: 36, // 12 * 3 = 36
          }),
        })
      );
    });

    it('should apply kitchen load multiplier', async () => {
      const req = {
        body: {
          items: [{ category: 'burger', quantity: 1 }],
          storeId: 'test_store',
          kitchenLoad: 5, // 50% increase
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await (plugin as any).predictPrepTime(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prediction: expect.objectContaining({
            rushMultiplier: '1.50',
          }),
        })
      );
    });

    it('should handle multiple items', async () => {
      const req = {
        body: {
          items: [
            { category: 'biryani', quantity: 2 },
            { category: 'salad', quantity: 1 },
            { category: 'beverage', quantity: 3 },
          ],
          storeId: 'test_store',
          kitchenLoad: 0,
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await (plugin as any).predictPrepTime(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prediction: expect.objectContaining({
            breakdown: expect.arrayContaining([
              expect.objectContaining({ name: 'biryani', baseTime: 15, quantity: 2, time: 30 }),
              expect.objectContaining({ name: 'salad', baseTime: 5, quantity: 1, time: 5 }),
              expect.objectContaining({ name: 'beverage', baseTime: 2, quantity: 3, time: 6 }),
            ]),
          }),
        })
      );
    });

    it('should use default time for unknown category', async () => {
      const req = {
        body: {
          items: [{ category: 'unknown_dish', quantity: 1 }],
          storeId: 'test_store',
          kitchenLoad: 0,
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await (plugin as any).predictPrepTime(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prediction: expect.objectContaining({
            estimatedMinutes: 10, // default base time
          }),
        })
      );
    });

    it('should return confidence score', async () => {
      const req = {
        body: {
          items: [{ category: 'dessert', quantity: 1 }],
          storeId: 'test_store',
          kitchenLoad: 0,
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await (plugin as any).predictPrepTime(req, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prediction: expect.objectContaining({
            confidence: 0.85,
          }),
        })
      );
    });
  });

  describe('Menu Item Scoring', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should calculate score correctly for high performers', () => {
      const item = {
        profitability: 0.9,
        popularity: 0.8,
        margin: 0.5,
      };

      const score = (plugin as any).calculateItemScore(item);
      expect(score).toBeCloseTo(0.36, 2); // 0.9 * 0.8 * 0.5
    });

    it('should calculate score correctly for low performers', () => {
      const item = {
        profitability: 0.2,
        popularity: 0.3,
        margin: 0.1,
      };

      const score = (plugin as any).calculateItemScore(item);
      expect(score).toBeCloseTo(0.006, 3);
    });

    it('should handle missing values with defaults', () => {
      const item = {};

      const score = (plugin as any).calculateItemScore(item);
      expect(score).toBeCloseTo(0.075, 3); // 0.5 * 0.5 * 0.3
    });
  });

  describe('Item Recommendations', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should recommend removal for low score items', () => {
      const item = { score: 0.3, popularity: 0.2 };
      const recommendations = (plugin as any).getItemRecommendations(item);

      expect(recommendations).toContain('Consider removing or repricing');
    });

    it('should recommend highlighting for popular items', () => {
      const item = { score: 0.6, popularity: 0.9 };
      const recommendations = (plugin as any).getItemRecommendations(item);

      expect(recommendations).toContain('Highlight as featured');
    });

    it('should recommend cost review for low margin items', () => {
      const item = { score: 0.5, popularity: 0.5, margin: 0.1 };
      const recommendations = (plugin as any).getItemRecommendations(item);

      expect(recommendations).toContain('Review ingredient costs');
    });

    it('should return multiple recommendations', () => {
      const item = { score: 0.2, popularity: 0.9, margin: 0.1 };
      const recommendations = (plugin as any).getItemRecommendations(item);

      expect(recommendations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Average Calculation', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should calculate average correctly', () => {
      const numbers = [10, 20, 30, 40, 50];
      const avg = (plugin as any).avg(numbers);

      expect(avg).toBe(30);
    });

    it('should return 0 for empty array', () => {
      const avg = (plugin as any).avg([]);

      expect(avg).toBe(0);
    });

    it('should handle single element', () => {
      const avg = (plugin as any).avg([42]);

      expect(avg).toBe(42);
    });

    it('should handle decimal values', () => {
      const numbers = [1.5, 2.5, 3.0];
      const avg = (plugin as any).avg(numbers);

      expect(avg).toBeCloseTo(2.33, 2);
    });
  });

  describe('Demand Calculation', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should generate predictions for time slots', () => {
      const timeSlots = ['11:00', '12:00', '13:00'];
      const predictions = (plugin as any).calculateDemand([], {}, 'sunny', timeSlots);

      expect(predictions).toHaveLength(3);
      expect(predictions[0]).toHaveProperty('time', '11:00');
      expect(predictions[0]).toHaveProperty('confidence');
      expect(predictions[0]).toHaveProperty('predictedOrders');
      expect(predictions[0]).toHaveProperty('staffNeeded');
    });

    it('should return valid confidence scores', () => {
      const timeSlots = ['11:00'];
      const predictions = (plugin as any).calculateDemand([], {}, 'sunny', timeSlots);

      expect(predictions[0].confidence).toBe(0.88);
    });
  });

  describe('Staffing Calculation', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should calculate staff needed based on predictions', () => {
      const predictions = [
        { predictedOrders: 30 },
        { predictedOrders: 50 },
        { predictedOrders: 40 },
      ];

      const staffing = (plugin as any).calculateStaffing(predictions);

      expect(staffing).toHaveProperty('chefs');
      expect(staffing).toHaveProperty('servers');
      expect(staffing).toHaveProperty('hosts');
    });

    it('should handle empty predictions', () => {
      const staffing = (plugin as any).calculateStaffing([]);

      expect(staffing.chefs).toBe(0);
      expect(staffing.servers).toBe(0);
      expect(staffing.hosts).toBe(0);
    });
  });

  describe('Category Grouping', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should group items by category', () => {
      const items = [
        { category: 'main', name: 'Biryani' },
        { category: 'main', name: 'Paneer' },
        { category: 'bread', name: 'Naan' },
        { category: 'main', name: 'Curry' },
      ];

      const grouped = (plugin as any).groupByCategory(items);

      expect(grouped.main).toHaveLength(3);
      expect(grouped.bread).toHaveLength(1);
    });

    it('should handle empty items array', () => {
      const grouped = (plugin as any).groupByCategory([]);

      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      await plugin.init({ storeId: 'test_store' });
    });

    it('should suggest featured placement', () => {
      const placement = (plugin as any).suggestPlacement({});
      expect(placement).toBe('featured');
    });

    it('should analyze seasonality', () => {
      const seasonality = (plugin as any).analyzeSeasonality({});
      expect(seasonality).toEqual({ peak: 'winter', offPeak: 'summer' });
    });

    it('should return current staffing as default', async () => {
      const staffing = await (plugin as any).getCurrentStaffing('test_store');
      expect(staffing).toBe(5);
    });

    it('should return total seats as default', async () => {
      const seats = await (plugin as any).getTotalSeats('test_store');
      expect(seats).toBe(50);
    });

    it('should return walk-in trends', async () => {
      const trends = await (plugin as any).getWalkInTrends('test_store', '2026-06-02');
      expect(trends).toHaveProperty('avgWalkIns');
      expect(trends).toHaveProperty('peakHour');
    });
  });
});
