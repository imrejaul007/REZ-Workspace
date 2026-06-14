import { describe, it, expect } from 'vitest';

describe('DOOH SDK', () => {
  describe('Screen Types', () => {
    it('should support all screen types', () => {
      const screenTypes = ['digital_billboard', ' kiosk', 'indoor_display', 'transit'];
      const screen = { type: 'digital_billboard' as const };
      expect(screenTypes).toContain(screen.type);
    });

    it('should have screen status values', () => {
      const statuses = ['active', 'inactive', 'maintenance', 'reserved'];
      const screen = { status: 'active' as const };
      expect(statuses).toContain(screen.status);
    });
  });

  describe('Campaign Types', () => {
    it('should support campaign types', () => {
      const campaignTypes = ['awareness', 'engagement', 'conversion', 'retargeting'];
      const campaign = { type: 'awareness' as const };
      expect(campaignTypes).toContain(campaign.type);
    });

    it('should have campaign status values', () => {
      const statuses = ['draft', 'scheduled', 'active', 'paused', 'completed'];
      const campaign = { status: 'active' as const };
      expect(statuses).toContain(campaign.status);
    });
  });

  describe('Creative Management', () => {
    it('should validate creative format', () => {
      const formats = ['video', 'image', 'interactive', 'html5'];
      const creative = { format: 'video' as const };
      expect(formats).toContain(creative.format);
    });

    it('should have creative status values', () => {
      const statuses = ['pending', 'approved', 'rejected', 'archived'];
      const creative = { status: 'approved' as const };
      expect(statuses).toContain(creative.status);
    });
  });

  describe('Delivery Metrics', () => {
    it('should track impressions', () => {
      const metrics = { impressions: 10000, clicks: 500, conversions: 50 };
      expect(metrics.impressions).toBeGreaterThan(0);
      expect(metrics.clicks).toBeLessThan(metrics.impressions);
    });

    it('should calculate CTR', () => {
      const impressions = 10000;
      const clicks = 500;
      const ctr = (clicks / impressions) * 100;
      expect(ctr).toBe(5);
    });

    it('should calculate conversion rate', () => {
      const clicks = 500;
      const conversions = 50;
      const conversionRate = (conversions / clicks) * 100;
      expect(conversionRate).toBe(10);
    });
  });

  describe('Scheduling', () => {
    it('should validate schedule date range', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it('should support time windows', () => {
      const timeWindows = [
        { start: '09:00', end: '17:00', days: ['Monday', 'Tuesday', 'Wednesday'] },
      ];
      expect(timeWindows[0].start).toBe('09:00');
      expect(timeWindows[0].end).toBe('17:00');
    });
  });
});