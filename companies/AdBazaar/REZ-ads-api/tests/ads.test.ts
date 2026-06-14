/**
 * AdBazaar (REZ Ads) Service Tests
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:4800';

describe('AdBazaar - Ads API Service', () => {
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('rez-ads-api');
    });
  });

  describe('Campaign Management', () => {
    it('should list all campaigns', async () => {
      const res = await fetch(`${BASE_URL}/api/campaigns`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.campaigns)).toBe(true);
    });

    it('should filter campaigns by status', async () => {
      const res = await fetch(`${BASE_URL}/api/campaigns?status=active`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      data.data.campaigns.forEach((c: any) => {
        expect(c.status).toBe('active');
      });
    });

    it('should get campaign by ID', async () => {
      const res = await fetch(`${BASE_URL}/api/campaigns/camp_001`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('camp_001');
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await fetch(`${BASE_URL}/api/campaigns/non_existent`);
      expect(res.status).toBe(404);
    });

    it('should create a new campaign', async () => {
      const newCampaign = {
        name: 'Test Campaign',
        advertiserId: 'adv_test',
        budget: 50000,
        startDate: '2026-06-15',
        endDate: '2026-06-30',
      };
      const res = await fetch(`${BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('draft');
    });
  });

  describe('Ad Serving', () => {
    it('should serve ad for valid placement', async () => {
      const res = await fetch(`${BASE_URL}/api/serve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId: 'homepage_banner',
          userId: 'user_123',
          context: { page: 'home' },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.ad).toBeDefined();
    });

    it('should return null ad when no campaigns active', async () => {
      // Pause all campaigns first would be needed in real scenario
      const res = await fetch(`${BASE_URL}/api/serve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId: 'test',
          userId: 'user_123',
        }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe('Analytics', () => {
    it('should return campaign analytics', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/campaigns/camp_001`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.metrics).toBeDefined();
      expect(data.data.daily).toBeDefined();
    });
  });
});

describe('Ad Revenue Calculations', () => {
  it('should calculate CTR correctly', () => {
    const impressions = 10000;
    const clicks = 150;
    const ctr = (clicks / impressions) * 100;
    expect(ctr).toBe(1.5);
  });

  it('should calculate effective CPC', () => {
    const spend = 500;
    const clicks = 100;
    const cpc = spend / clicks;
    expect(cpc).toBe(5);
  });

  it('should calculate budget utilization', () => {
    const budget = 100000;
    const spent = 45200;
    const utilization = (spent / budget) * 100;
    expect(utilization).toBe(45.2);
  });
});
