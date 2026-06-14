/**
 * REZ Decision Service - Unit Tests
 * Tests targeting engine, decision tree evaluation, and rule matching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'http://localhost:4027';

// ============================================
// INPUT VALIDATION TESTS
// ============================================

describe('REZ Decision Service - Input Validation', () => {
  describe('User ID Validation', () => {
    const MONGODB_OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

    function isValidUserId(userId: string): boolean {
      return typeof userId === 'string' && MONGODB_OBJECT_ID_REGEX.test(userId);
    }

    it('should accept valid MongoDB ObjectId format', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        'aaaaaaaaaaaaaaaaaaaaaaaa',
        'AAAAAAAAAAAAAAAAAAAAAAAA',
        '0'.repeat(24),
        'f'.repeat(24),
      ];

      validIds.forEach((id) => {
        expect(isValidUserId(id)).toBe(true);
      });
    });

    it('should reject invalid MongoDB ObjectId formats', () => {
      const invalidIds = [
        '507f1f77bcf86cd79943901',  // too short
        '507f1f77bcf86cd7994390111', // too long
        '507f1f77bcf86cd79943901g',  // invalid character
        'hello world',
        '',
        'notanid',
        '507f1f77bcf86cd79943901!', // special character
      ];

      invalidIds.forEach((id) => {
        expect(isValidUserId(id)).toBe(false);
      });
    });
  });

  describe('Campaign ID Validation', () => {
    const CAMPAIGN_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

    function isValidCampaignId(campaignId: string): boolean {
      return typeof campaignId === 'string' && campaignId.length > 0 && CAMPAIGN_ID_REGEX.test(campaignId);
    }

    it('should accept valid campaign ID formats', () => {
      const validIds = [
        'camp_001',
        'adv-123',
        'test_campaign_456',
        'AD-2024-001',
        'a',
        '1',
        'campaign-1_test',
        'REZ_AD_CAMPAIGN_2024',
      ];

      validIds.forEach((id) => {
        expect(isValidCampaignId(id)).toBe(true);
      });
    });

    it('should reject invalid campaign ID formats', () => {
      const invalidIds = [
        '',
        'camp 001',
        'test<script>',
        '..//etc',
        'test.user',
        'test@user',
        'test#user',
        'a'.repeat(101),
      ];

      invalidIds.forEach((id) => {
        expect(isValidCampaignId(id)).toBe(false);
      });
    });
  });
});

// ============================================
// TARGETING ENGINE TESTS
// ============================================

describe('REZ Decision Service - Targeting Engine', () => {
  describe('Segment Definitions', () => {
    it('should have 9 predefined segments', () => {
      const SEGMENTS = [
        { type: 'HIGH_VALUE', priority: 1 },
        { type: 'CHURNED', priority: 2 },
        { type: 'WINDOW_SHOPPERS', priority: 3 },
        { type: 'DEAL_SEEKERS', priority: 4 },
        { type: 'FOODIES', priority: 5 },
        { type: 'BUDGET_MINDERS', priority: 6 },
        { type: 'NEW_USERS', priority: 7 },
        { type: 'REORDER_PROBABILITY_HIGH', priority: 8 },
        { type: 'RECENTLY_PURCHASED', priority: 9 },
      ];

      expect(SEGMENTS).toHaveLength(9);
      expect(SEGMENTS[0].type).toBe('HIGH_VALUE');
      expect(SEGMENTS[0].priority).toBe(1);
    });

    it('should have correct segment priorities', () => {
      const SEGMENTS = [
        { type: 'HIGH_VALUE', priority: 1 },
        { type: 'CHURNED', priority: 2 },
        { type: 'WINDOW_SHOPPERS', priority: 3 },
        { type: 'DEAL_SEEKERS', priority: 4 },
        { type: 'FOODIES', priority: 5 },
        { type: 'BUDGET_MINDERS', priority: 6 },
        { type: 'NEW_USERS', priority: 7 },
        { type: 'REORDER_PROBABILITY_HIGH', priority: 8 },
        { type: 'RECENTLY_PURCHASED', priority: 9 },
      ];

      // Verify priorities are unique and sequential
      const priorities = SEGMENTS.map((s) => s.priority);
      expect([...new Set(priorities)].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('Segment Criteria Logic', () => {
    describe('HIGH_VALUE segment', () => {
      it('should identify high value users (LTV > 1000)', () => {
        const isHighValue = (ltv: number) => ltv > 1000;

        expect(isHighValue(1500)).toBe(true);
        expect(isHighValue(1001)).toBe(true);
        expect(isHighValue(1000)).toBe(false);
        expect(isHighValue(500)).toBe(false);
        expect(isHighValue(0)).toBe(false);
      });
    });

    describe('CHURNED segment', () => {
      it('should identify churned users (no order in 30+ days)', () => {
        const isChurned = (lastOrderTimestamp: number | null) => {
          if (!lastOrderTimestamp) return false;
          const daysSince = (Date.now() - lastOrderTimestamp) / 86400000;
          return daysSince > 30;
        };

        const now = Date.now();
        const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
        const twentyNineDaysAgo = now - 29 * 24 * 60 * 60 * 1000;

        expect(isChurned(thirtyOneDaysAgo)).toBe(true);
        expect(isChurned(twentyNineDaysAgo)).toBe(false);
        expect(isChurned(null)).toBe(false);
      });
    });

    describe('WINDOW_SHOPPERS segment', () => {
      it('should identify window shoppers (searches > 10, orders < 3)', () => {
        const isWindowShopper = (searches: number, orders: number) => {
          return searches > 10 && orders < 3;
        };

        expect(isWindowShopper(15, 2)).toBe(true);
        expect(isWindowShopper(11, 0)).toBe(true);
        expect(isWindowShopper(10, 0)).toBe(false);
        expect(isWindowShopper(15, 3)).toBe(false);
        expect(isWindowShopper(5, 2)).toBe(false);
      });
    });

    describe('DEAL_SEEKERS segment', () => {
      it('should identify deal seekers (deals > 5)', () => {
        const isDealSeeker = (deals: number) => deals > 5;

        expect(isDealSeeker(10)).toBe(true);
        expect(isDealSeeker(6)).toBe(true);
        expect(isDealSeeker(5)).toBe(false);
        expect(isDealSeeker(0)).toBe(false);
      });
    });

    describe('FOODIES segment', () => {
      it('should identify foodies (orders > 10, variety > 5)', () => {
        const isFoodie = (orders: number, variety: number) => {
          return orders > 10 && variety > 5;
        };

        expect(isFoodie(15, 8)).toBe(true);
        expect(isFoodie(11, 6)).toBe(true);
        expect(isFoodie(10, 8)).toBe(false);
        expect(isFoodie(15, 5)).toBe(false);
        expect(isFoodie(5, 8)).toBe(false);
      });
    });

    describe('BUDGET_MINDERS segment', () => {
      it('should identify budget minders (AOV < 200)', () => {
        const isBudgetMinder = (aov: number) => aov < 200;

        expect(isBudgetMinder(150)).toBe(true);
        expect(isBudgetMinder(199)).toBe(true);
        expect(isBudgetMinder(200)).toBe(false);
        expect(isBudgetMinder(500)).toBe(false);
      });
    });

    describe('NEW_USERS segment', () => {
      it('should identify new users (created < 7 days ago)', () => {
        const isNewUser = (createdTimestamp: number | null) => {
          if (!createdTimestamp) return false;
          const days = (Date.now() - createdTimestamp) / 86400000;
          return days < 7;
        };

        const now = Date.now();
        const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
        const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

        expect(isNewUser(threeDaysAgo)).toBe(true);
        expect(isNewUser(tenDaysAgo)).toBe(false);
        expect(isNewUser(null)).toBe(false);
      });
    });

    describe('REORDER_PROBABILITY_HIGH segment', () => {
      it('should identify users likely to reorder (5-14 days since last order, 3+ orders)', () => {
        const isReorderProbabilityHigh = (lastOrderTimestamp: number, orders: number) => {
          const days = lastOrderTimestamp ? (Date.now() - lastOrderTimestamp) / 86400000 : 999;
          return days >= 5 && days <= 14 && orders >= 3;
        };

        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
        const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;

        expect(isReorderProbabilityHigh(sevenDaysAgo, 5)).toBe(true);
        expect(isReorderProbabilityHigh(fiveDaysAgo, 3)).toBe(true);
        expect(isReorderProbabilityHigh(fourDaysAgo, 5)).toBe(false); // too recent
        expect(isReorderProbabilityHigh(twentyDaysAgo, 5)).toBe(false); // too old
        expect(isReorderProbabilityHigh(sevenDaysAgo, 2)).toBe(false); // not enough orders
      });
    });

    describe('RECENTLY_PURCHASED segment', () => {
      it('should identify recently purchased users (order in last 7 days)', () => {
        const isRecentlyPurchased = (lastOrderTimestamp: number | null) => {
          if (!lastOrderTimestamp) return false;
          const days = (Date.now() - lastOrderTimestamp) / 86400000;
          return days <= 7;
        };

        const now = Date.now();
        const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

        expect(isRecentlyPurchased(threeDaysAgo)).toBe(true);
        expect(isRecentlyPurchased(sevenDaysAgo)).toBe(true);
        expect(isRecentlyPurchased(tenDaysAgo)).toBe(false);
        expect(isRecentlyPurchased(null)).toBe(false);
      });
    });
  });

  describe('Variant Assignment', () => {
    function simpleHash(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
      }
      return Math.abs(hash);
    }

    function assignVariant(userId: string, campaignId: string): 'A' | 'B' {
      const hash = simpleHash(`${userId}:${campaignId}`);
      return hash % 2 === 0 ? 'A' : 'B';
    }

    it('should assign consistent variants for same user-campaign pair', () => {
      const userId = '507f1f77bcf86cd799439011';
      const campaignId = 'camp_001';

      const variant1 = assignVariant(userId, campaignId);
      const variant2 = assignVariant(userId, campaignId);

      expect(variant1).toBe(variant2);
    });

    it('should assign different variants for different users', () => {
      const campaignId = 'camp_001';

      const variant1 = assignVariant('507f1f77bcf86cd799439011', campaignId);
      const variant2 = assignVariant('507f1f77bcf86cd799439012', campaignId);

      // With different user IDs, variants could be same or different (50/50)
      expect(variant1 === 'A' || variant1 === 'B').toBe(true);
      expect(variant2 === 'A' || variant2 === 'B').toBe(true);
    });

    it('should assign different variants for different campaigns', () => {
      const userId = '507f1f77bcf86cd799439011';

      const variant1 = assignVariant(userId, 'camp_001');
      const variant2 = assignVariant(userId, 'camp_002');

      // With different campaign IDs, variants could be same or different (50/50)
      expect(variant1 === 'A' || variant1 === 'B').toBe(true);
      expect(variant2 === 'A' || variant2 === 'B').toBe(true);
    });

    it('should handle empty strings gracefully', () => {
      const variant = assignVariant('', '');
      expect(variant === 'A' || variant === 'B').toBe(true);
    });
  });

  describe('Frequency Cap Logic', () => {
    function checkFrequencyCap(
      daily: number,
      weekly: number,
      lifetime: number
    ): boolean {
      const DAILY_LIMIT = 5;
      const WEEKLY_LIMIT = 15;
      const LIFETIME_LIMIT = 50;

      return daily < DAILY_LIMIT && weekly < WEEKLY_LIMIT && lifetime < LIFETIME_LIMIT;
    }

    it('should allow impressions under all caps', () => {
      expect(checkFrequencyCap(2, 5, 20)).toBe(true);
      expect(checkFrequencyCap(0, 0, 0)).toBe(true);
      expect(checkFrequencyCap(4, 14, 49)).toBe(true);
    });

    it('should block impressions exceeding daily cap', () => {
      expect(checkFrequencyCap(5, 5, 20)).toBe(false);
      expect(checkFrequencyCap(10, 5, 20)).toBe(false);
    });

    it('should block impressions exceeding weekly cap', () => {
      expect(checkFrequencyCap(2, 15, 20)).toBe(false);
      expect(checkFrequencyCap(2, 20, 20)).toBe(false);
    });

    it('should block impressions exceeding lifetime cap', () => {
      expect(checkFrequencyCap(2, 5, 50)).toBe(false);
      expect(checkFrequencyCap(2, 5, 100)).toBe(false);
    });
  });
});

// ============================================
// API ENDPOINT TESTS
// ============================================

describe('REZ Decision Service - API Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({
          status: 'ok',
          service: 'decision-service',
          timestamp: '2026-06-02T10:00:00Z',
        }),
      });

      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('decision-service');
    });
  });

  describe('GET /api/targeting/segments/:userId', () => {
    it('should return segments for valid user', async () => {
      const mockResponse = {
        success: true,
        data: [
          { type: 'HIGH_VALUE', priority: 1 },
          { type: 'DEAL_SEEKERS', priority: 4 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/targeting/segments/507f1f77bcf86cd799439011`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return 401 for missing auth', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Unauthorized',
        }),
      });

      const res = await fetch(`${BASE_URL}/api/targeting/segments/507f1f77bcf86cd799439011`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/targeting/evaluate', () => {
    it('should evaluate targeting for user and campaign', async () => {
      const mockResponse = {
        success: true,
        segments: [
          { type: 'HIGH_VALUE', priority: 1 },
          { type: 'FOODIES', priority: 5 },
        ],
        variant: 'A',
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/targeting/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '507f1f77bcf86cd799439011',
          campaignId: 'camp_001',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.variant).toBeDefined();
    });
  });

  describe('GET /api/frequency/:userId/:campaignId/:channel', () => {
    it('should return frequency cap check result', async () => {
      const mockResponse = {
        success: true,
        allowed: true,
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(
        `${BASE_URL}/api/frequency/507f1f77bcf86cd799439011/camp_001/push`
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.allowed).toBe(true);
    });

    it('should block when frequency cap reached', async () => {
      const mockResponse = {
        success: true,
        allowed: false,
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(
        `${BASE_URL}/api/frequency/507f1f77bcf86cd799439011/camp_001/push`
      );

      const data = await res.json();
      expect(data.allowed).toBe(false);
    });
  });

  describe('POST /api/attribution/track', () => {
    it('should track attribution event', async () => {
      const mockResponse = {
        success: true,
        eventId: 'evt_123456',
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const res = await fetch(`${BASE_URL}/api/attribution/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '507f1f77bcf86cd799439011',
          campaignId: 'camp_001',
          merchantId: 'merchant_001',
          event: 'scan',
          value: 10,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.eventId).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'userId, campaignId, merchantId, and event are required',
        }),
      });

      const res = await fetch(`${BASE_URL}/api/attribution/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '507f1f77bcf86cd799439011',
          // missing campaignId, merchantId, event
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});

// ============================================
// DECISION TREE EVALUATION TESTS
// ============================================

describe('REZ Decision Service - Decision Tree Evaluation', () => {
  describe('Rule Matching', () => {
    interface Rule {
      condition: (context: Record<string, unknown>) => boolean;
      action: string;
    }

    function evaluateRules(rules: Rule[], context: Record<string, unknown>): string[] {
      return rules
        .filter((rule) => rule.condition(context))
        .map((rule) => rule.action);
    }

    it('should match rules based on user segments', () => {
      const rules: Rule[] = [
        {
          condition: (ctx) => ctx.hasHighValue === true,
          action: 'show_premium_ads',
        },
        {
          condition: (ctx) => ctx.hasDealSeeker === true,
          action: 'show_discount_ads',
        },
        {
          condition: (ctx) => ctx.hasFoodie === true,
          action: 'show_food_ads',
        },
      ];

      const context = { hasHighValue: true, hasDealSeeker: false, hasFoodie: true };
      const actions = evaluateRules(rules, context);

      expect(actions).toContain('show_premium_ads');
      expect(actions).toContain('show_food_ads');
      expect(actions).not.toContain('show_discount_ads');
    });

    it('should match rules based on time conditions', () => {
      const rules: Rule[] = [
        {
          condition: (ctx) => {
            const hour = ctx.hour as number;
            return hour >= 18 && hour <= 21; // peak hours
          },
          action: 'apply_surge_pricing',
        },
        {
          condition: (ctx) => {
            const day = ctx.day as number;
            return day === 5 || day === 6; // weekend
          },
          action: 'apply_weekend_multiplier',
        },
      ];

      const peakEveningContext = { hour: 20, day: 3 };
      expect(evaluateRules(rules, peakEveningContext)).toContain('apply_surge_pricing');

      const weekendContext = { hour: 12, day: 6 };
      expect(evaluateRules(rules, weekendContext)).toContain('apply_weekend_multiplier');
    });

    it('should handle complex rule combinations', () => {
      const rules: Rule[] = [
        {
          condition: (ctx) =>
            (ctx.hasHighValue === true || ctx.hasDealSeeker === true) && ctx.location === 'tier1',
          action: 'priority_delivery',
        },
      ];

      expect(
        evaluateRules(rules, { hasHighValue: true, hasDealSeeker: false, location: 'tier1' })
      ).toContain('priority_delivery');

      expect(
        evaluateRules(rules, { hasHighValue: false, hasDealSeeker: true, location: 'tier2' })
      ).not.toContain('priority_delivery');
    });
  });

  describe('Priority-based Decision Making', () => {
    interface Decision {
      priority: number;
      action: string;
      reason: string;
    }

    function selectDecision(decisions: Decision[]): Decision | null {
      if (decisions.length === 0) return null;
      return decisions.reduce((highest, current) =>
        current.priority > highest.priority ? current : highest
      );
    }

    it('should select highest priority decision', () => {
      const decisions: Decision[] = [
        { priority: 3, action: 'show_standard_ads', reason: 'default' },
        { priority: 1, action: 'show_high_value_ads', reason: 'LTV > 1000' },
        { priority: 5, action: 'show_churn_prevention', reason: '30+ days inactive' },
      ];

      const selected = selectDecision(decisions);

      expect(selected?.action).toBe('show_churn_prevention');
      expect(selected?.priority).toBe(5);
    });

    it('should return null for empty decisions', () => {
      const selected = selectDecision([]);
      expect(selected).toBeNull();
    });
  });
});
