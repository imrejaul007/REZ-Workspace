/**
 * Analytics Service Tests
 */

import { analyticsService } from '../services/analyticsService';
import { ShopAnalytics } from '../models';

describe('AnalyticsService', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('getShopAnalytics', () => {
    it('should return shop analytics data', async () => {
      const analytics = await analyticsService.getShopAnalytics(
        {},
        'days_28'
      );

      expect(analytics).toBeDefined();
      expect(analytics).toHaveProperty('totalRevenue');
      expect(analytics).toHaveProperty('totalOrders');
      expect(analytics).toHaveProperty('averageOrderValue');
      expect(analytics).toHaveProperty('conversionRate');
      expect(analytics).toHaveProperty('instagramInsights');
    });

    it('should handle date range filters', async () => {
      const analytics = await analyticsService.getShopAnalytics(
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
        'days_28'
      );

      expect(analytics).toBeDefined();
    });
  });

  describe('recordDailyAnalytics', () => {
    it('should record analytics for a specific date', async () => {
      const date = new Date();
      const analytics = await analyticsService.recordDailyAnalytics(date);

      expect(analytics).toBeDefined();
      expect(analytics.date).toBeDefined();
      expect(typeof analytics.revenue).toBe('number');
      expect(typeof analytics.conversionRate).toBe('number');
    });

    it('should create or update daily analytics', async () => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      // First record
      const first = await analyticsService.recordDailyAnalytics(date);

      // Second record should update
      const second = await analyticsService.recordDailyAnalytics(date);

      expect(second._id.toString()).toBe(first._id.toString());

      // Cleanup
      await ShopAnalytics.deleteOne({ date });
    });
  });

  describe('getAnalyticsByDateRange', () => {
    it('should return analytics for a date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics = await analyticsService.getAnalyticsByDateRange(
        startDate,
        endDate
      );

      expect(Array.isArray(analytics)).toBe(true);
    });
  });

  describe('getProductAnalytics', () => {
    it('should return analytics for a specific product', async () => {
      const analytics = await analyticsService.getProductAnalytics(
        'nonexistent-product-id'
      );

      expect(analytics).toBeDefined();
      expect(analytics).toHaveProperty('totalOrders');
      expect(analytics).toHaveProperty('totalRevenue');
      expect(analytics).toHaveProperty('conversionRate');
    });
  });
});
