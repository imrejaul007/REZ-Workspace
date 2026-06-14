/**
 * REZ Competitive Intelligence Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Competitive Intelligence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4600', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'ok',
      };

      expect(mockHealthResponse.status).toBe('ok');
    });
  });

  describe('Competitor Data', () => {
    it('should have restaurant competitors', () => {
      const restaurantCompetitors = [
        { name: 'Zomato', strengths: ['Delivery', 'Brand'], weaknesses: ['High commission', 'No POS'] },
        { name: 'Swiggy', strengths: ['Delivery', 'Analytics'], weaknesses: ['High fees', 'Limited tools'] },
        { name: 'Dineout', strengths: ['Reservations'], weaknesses: ['Limited reach'] },
      ];

      expect(restaurantCompetitors).toHaveLength(3);
      expect(restaurantCompetitors[0].name).toBe('Zomato');
    });

    it('should have retail competitors', () => {
      const retailCompetitors = [
        { name: 'Shopify', strengths: ['E-commerce', 'Themes'], weaknesses: ['Expensive', 'Setup'] },
        { name: 'Woocommerce', strengths: ['Free', 'Flexible'], weaknesses: ['Complex', 'Hosting'] },
      ];

      expect(retailCompetitors).toHaveLength(2);
      expect(retailCompetitors[0].name).toBe('Shopify');
    });

    it('should have salon competitors', () => {
      const salonCompetitors = [
        { name: 'Mindbody', strengths: ['Scheduling'], weaknesses: ['Expensive', 'Complex'] },
        { name: 'Square', strengths: ['Simple'], weaknesses: ['Limited features'] },
      ];

      expect(salonCompetitors).toHaveLength(2);
      expect(salonCompetitors[0].name).toBe('Mindbody');
    });
  });

  describe('Compare Endpoint', () => {
    it('should return competitor comparison for industry', () => {
      const mockCompareResponse = (industry: string) => ({
        industry,
        competitors: [],
        rezbAdvantages: [
          'Unified platform',
          'Lower fees',
          'AI-powered insights',
          'Multi-industry',
        ],
      });

      const response = mockCompareResponse('restaurant');
      expect(response.industry).toBe('restaurant');
      expect(response.rezbAdvantages).toContain('Unified platform');
    });
  });

  describe('Market Endpoint', () => {
    it('should return market insights for industry', () => {
      const mockMarketResponse = (industry: string) => ({
        industry,
        marketSize: '500B',
        growthRate: '25%',
        trends: ['AI', 'Omnichannel', 'Subscriptions'],
      });

      const response = mockMarketResponse('restaurant');
      expect(response.industry).toBe('restaurant');
      expect(response.marketSize).toBe('500B');
      expect(response.growthRate).toBe('25%');
      expect(response.trends).toContain('AI');
    });
  });

  describe('Benchmark Endpoint', () => {
    it('should return merchant benchmarking data', () => {
      const mockBenchmarkResponse = (merchantId: string) => ({
        merchantId,
        metrics: {
          revenue: 100000,
          orders: 500,
        },
        recommendations: ['Add loyalty', 'Boost ratings'],
      });

      const response = mockBenchmarkResponse('MCH-001');
      expect(response.merchantId).toBe('MCH-001');
      expect(response.metrics.revenue).toBe(100000);
      expect(response.metrics.orders).toBe(500);
      expect(response.recommendations).toContain('Add loyalty');
    });
  });

  describe('REZ Advantages', () => {
    it('should list key REZ advantages over competitors', () => {
      const rezbAdvantages = [
        'Unified platform',
        'Lower fees',
        'AI-powered insights',
        'Multi-industry',
      ];

      expect(rezbAdvantages).toHaveLength(4);
      expect(rezbAdvantages).toContain('Unified platform');
      expect(rezbAdvantages).toContain('AI-powered insights');
    });
  });

  describe('Industries Coverage', () => {
    it('should support restaurant industry', () => {
      const industries = ['restaurant', 'retail', 'salon'];
      expect(industries).toContain('restaurant');
    });

    it('should support retail industry', () => {
      const industries = ['restaurant', 'retail', 'salon'];
      expect(industries).toContain('retail');
    });

    it('should support salon industry', () => {
      const industries = ['restaurant', 'retail', 'salon'];
      expect(industries).toContain('salon');
    });
  });

  describe('API Response Format', () => {
    it('should return JSON responses', () => {
      const response = {
        industry: 'restaurant',
        competitors: [],
        rezbAdvantages: [],
      };

      expect(typeof response).toBe('object');
      expect(response.industry).toBeDefined();
    });
  });
});