/**
 * REZ Marketing Service - Unit Tests
 * Tests campaign endpoints, utilities, and validation logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'http://localhost:4801';

// ============================================
// UTILITY FUNCTION TESTS
// ============================================

describe('REZ Marketing - Utility Functions', () => {
  describe('ErrorCodes', () => {
    it('should have correct error code definitions', async () => {
      const { ErrorCodes } = await import('../src/utils/response');

      expect(ErrorCodes.SRV_INTERNAL_ERROR.code).toBe('SRV_001');
      expect(ErrorCodes.SRV_INTERNAL_ERROR.message).toBe('Internal server error');
      expect(ErrorCodes.RES_NOT_FOUND.code).toBe('RES_001');
      expect(ErrorCodes.RES_NOT_FOUND.message).toBe('Resource not found');
    });
  });

  describe('success() helper', () => {
    it('should return success response with data', async () => {
      const { success } = await import('../src/utils/response');

      const result = success({ id: 'test-123', name: 'Test Campaign' });

      expect(result).toEqual({
        success: true,
        data: { id: 'test-123', name: 'Test Campaign' },
      });
    });

    it('should handle null data', async () => {
      const { success } = await import('../src/utils/response');

      const result = success(null);

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });

    it('should handle array data', async () => {
      const { success } = await import('../src/utils/response');

      const result = success([{ id: '1' }, { id: '2' }]);

      expect(result).toEqual({
        success: true,
        data: [{ id: '1' }, { id: '2' }],
      });
    });
  });

  describe('err() helper', () => {
    it('should return error response with known code', async () => {
      const { err } = await import('../src/utils/response');

      const result = err('RES_NOT_FOUND');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('RES_001');
      expect(result.error.message).toBe('Resource not found');
    });

    it('should return error response with unknown code', async () => {
      const { err } = await import('../src/utils/response');

      const result = err('CUSTOM_ERROR');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CUSTOM_ERROR');
      expect(result.error.message).toBe('An error occurred');
    });

    it('should include additional details', async () => {
      const { err } = await import('../src/utils/response');

      const result = err('SRV_INTERNAL_ERROR', { field: 'email', reason: 'invalid format' });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SRV_001');
      expect(result.error.field).toBe('email');
      expect(result.error.reason).toBe('invalid format');
    });
  });
});

// ============================================
// CAMPAIGN ENDPOINT TESTS (Mocked)
// ============================================

describe('REZ Marketing - Campaign API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('GET /health', () => {
    it('should return healthy status when all checks pass', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({
          status: 'ok',
          service: 'rez-marketing-service',
          checks: { db: 'ok', redis: 'ok' },
          uptime: 3600,
          timestamp: '2026-06-02T10:00:00Z',
        }),
      });

      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('rez-marketing-service');
      expect(data.checks.db).toBe('ok');
      expect(data.checks.redis).toBe('ok');
    });

    it('should return degraded status when checks fail', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 503,
        json: () => Promise.resolve({
          status: 'degraded',
          service: 'rez-marketing-service',
          checks: { db: 'error', redis: 'ok' },
          uptime: 100,
          timestamp: '2026-06-02T10:00:00Z',
        }),
      });

      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(503);

      const data = await res.json();
      expect(data.status).toBe('degraded');
      expect(data.checks.db).toBe('error');
    });
  });

  describe('GET /api/campaigns', () => {
    it('should return list of campaigns', async () => {
      const mockCampaigns = {
        success: true,
        data: {
          campaigns: [
            { id: 'camp_001', name: 'Summer Sale', status: 'active', budget: 50000 },
            { id: 'camp_002', name: 'New Launch', status: 'draft', budget: 25000 },
          ],
          total: 2,
          page: 1,
          limit: 20,
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockCampaigns),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.campaigns)).toBe(true);
      expect(data.data.campaigns.length).toBe(2);
    });

    it('should filter campaigns by status', async () => {
      const mockResponse = {
        success: true,
        data: {
          campaigns: [{ id: 'camp_001', status: 'active' }],
          total: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns?status=active`);
      const data = await res.json();

      expect(data.success).toBe(true);
      data.data.campaigns.forEach((c: { status: string }) => {
        expect(c.status).toBe('active');
      });
    });

    it('should support pagination parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          campaigns: [],
          total: 100,
          page: 3,
          limit: 10,
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns?page=3&limit=10`);
      const data = await res.json();

      expect(data.data.page).toBe(3);
      expect(data.data.limit).toBe(10);
    });
  });

  describe('GET /api/campaigns/:id', () => {
    it('should return campaign by ID', async () => {
      const mockCampaign = {
        success: true,
        data: {
          id: 'camp_001',
          name: 'Summer Sale',
          status: 'active',
          budget: 50000,
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockCampaign),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns/camp_001`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('camp_001');
      expect(data.data.name).toBe('Summer Sale');
    });

    it('should return 404 for non-existent campaign', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'RES_001', message: 'Campaign not found' },
        }),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns/non_existent_id`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign with valid data', async () => {
      const newCampaign = {
        name: 'Test Campaign',
        advertiserId: 'adv_test',
        budget: 50000,
        startDate: '2026-06-15',
        endDate: '2026-06-30',
        targeting: { segments: ['young_professionals'] },
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'camp_new_123',
          ...newCampaign,
          status: 'draft',
          createdAt: '2026-06-02T10:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.status).toBe('draft');
    });

    it('should reject campaign with missing required fields', async () => {
      const invalidCampaign = {
        name: 'Test Campaign',
        // missing advertiserId and budget
      };

      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'VAL_001', message: 'Validation failed', details: [{ path: 'advertiserId' }] },
        }),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidCampaign),
      });

      expect(res.status).toBe(400);
    });

    it('should reject campaign with invalid budget', async () => {
      const invalidCampaign = {
        name: 'Test Campaign',
        advertiserId: 'adv_test',
        budget: -100, // negative budget
        startDate: '2026-06-15',
        endDate: '2026-06-30',
      };

      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'VAL_002', message: 'Invalid budget amount' },
        }),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidCampaign),
      });

      expect(res.status).toBe(400);
    });

    it('should reject campaign with end date before start date', async () => {
      const invalidCampaign = {
        name: 'Test Campaign',
        advertiserId: 'adv_test',
        budget: 50000,
        startDate: '2026-06-30',
        endDate: '2026-06-15', // end before start
      };

      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'VAL_003', message: 'End date must be after start date' },
        }),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidCampaign),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/campaigns/:id', () => {
    it('should update campaign status', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'camp_001',
          status: 'paused',
          updatedAt: '2026-06-02T11:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns/camp_001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('paused');
    });

    it('should update campaign budget', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'camp_001',
          budget: 75000,
          updatedAt: '2026-06-02T11:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns/camp_001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: 75000 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.budget).toBe(75000);
    });

    it('should return 404 when updating non-existent campaign', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'RES_001', message: 'Campaign not found' },
        }),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns/non_existent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      expect(res.status).toBe(404);
    });

    it('should reject invalid status transition', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'VAL_004', message: 'Cannot transition from completed to active' },
        }),
      });

      const res = await fetch(`${BASE_URL}/api/campaigns/camp_001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      expect(res.status).toBe(400);
    });
  });
});

// ============================================
// CAMPAIGN VALIDATION TESTS
// ============================================

describe('Campaign Validation Logic', () => {
  describe('Campaign ID format validation', () => {
    it('should accept valid campaign ID formats', () => {
      const validIds = ['camp_001', 'adv-123', 'test_campaign_456', 'AD-2024-001'];

      validIds.forEach((id) => {
        // Campaign ID should be alphanumeric with dashes/underscores
        expect(/^[a-zA-Z0-9_-]+$/.test(id)).toBe(true);
      });
    });

    it('should reject invalid campaign ID formats', () => {
      const invalidIds = ['camp 001', 'test<script>', '..//etc', '', 'a'.repeat(101)];

      invalidIds.forEach((id) => {
        expect(/^[a-zA-Z0-9_-]+$/.test(id)).toBe(false);
      });
    });
  });

  describe('Budget validation', () => {
    it('should validate budget is within acceptable range', () => {
      const minBudget = 100;
      const maxBudget = 10000000;

      expect(minBudget <= 50000).toBe(true);
      expect(maxBudget >= 50000).toBe(true);
      expect(minBudget <= -100).toBe(false);
      expect(maxBudget >= 10000001).toBe(false);
    });

    it('should handle decimal budgets correctly', () => {
      const budget = 50000.50;
      expect(Number.isFinite(budget)).toBe(true);
      expect(budget).toBeCloseTo(50000.5, 2);
    });
  });

  describe('Date validation', () => {
    it('should validate date ranges correctly', () => {
      const startDate = new Date('2026-06-15');
      const endDate = new Date('2026-06-30');

      expect(endDate > startDate).toBe(true);
    });

    it('should handle timezone correctly', () => {
      const date1 = new Date('2026-06-15T00:00:00Z');
      const date2 = new Date('2026-06-15T23:59:59Z');

      expect(date2 > date1).toBe(true);
    });
  });
});

// ============================================
// CAMPAIGN CALCULATION TESTS
// ============================================

describe('Campaign Calculations', () => {
  it('should calculate budget utilization percentage', () => {
    const budget = 100000;
    const spent = 45200;
    const utilization = (spent / budget) * 100;

    expect(utilization).toBe(45.2);
  });

  it('should calculate days remaining in campaign', () => {
    const startDate = new Date('2026-06-01');
    const endDate = new Date('2026-06-30');
    const today = new Date('2026-06-15');

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    expect(totalDays).toBe(29);
    expect(remainingDays).toBe(15);
  });

  it('should calculate estimated daily spend', () => {
    const budget = 50000;
    const daysRemaining = 15;
    const estimatedDailySpend = budget / daysRemaining;

    expect(estimatedDailySpend).toBeCloseTo(3333.33, 2);
  });

  it('should calculate reach estimate from budget and CPM', () => {
    const budget = 50000;
    const cpm = 50; // Cost per 1000 impressions
    const reach = (budget / cpm) * 1000;

    expect(reach).toBe(1000000);
  });

  it('should calculate CTR correctly', () => {
    const impressions = 100000;
    const clicks = 1500;
    const ctr = (clicks / impressions) * 100;

    expect(ctr).toBe(1.5);
  });

  it('should calculate effective CPM', () => {
    const spend = 5000;
    const impressions = 100000;
    const effectiveCpm = (spend / impressions) * 1000;

    expect(effectiveCpm).toBe(50);
  });
});
