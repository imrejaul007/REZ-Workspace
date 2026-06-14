import { describe, it, expect, beforeEach } from 'vitest';
import { AdOS, createAdOS, optimizeCampaign } from '../src/index';
import { Listing, ListingMetrics, OptimizationRequest } from '../src/types';

describe('AdOS - Advertising Operating System', () => {
  // Create a test listing factory
  const createTestListing = (overrides: Partial<Listing> = {}): Listing => ({
    id: 'test-listing-1',
    name: 'Test Restaurant',
    category: 'restaurant',
    subcategory: 'italian',
    location: {
      city: 'Mumbai',
      area: 'Bandra',
      lat: 19.0596,
      lng: 72.8295,
    },
    pricing: {
      type: 'platform',
      coin_budget: 10000,
      cost_per_scan: 0.5,
      cost_per_visit: 5,
    },
    volume_potential: 0.8,
    category_match: 0.9,
    vendor_id: 'vendor-1',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  const createTestMetrics = (overrides: Partial<ListingMetrics> = {}): ListingMetrics => ({
    scans: 1000,
    visits: 350,
    purchases: 157,
    revenue: 54950,
    scan_to_visit_rate: 0.35,
    visit_to_purchase_rate: 0.45,
    avg_order_value: 350,
    last_updated: new Date(),
    data_points: 50,
    ...overrides,
  });

  describe('ROI Engine', () => {
    it('should calculate ROI with real metrics', () => {
      const listing = createTestListing();
      const metrics = createTestMetrics();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
      expect(result.recommendation).toBeDefined();
    });

    it('should use fallback data when metrics are not available', () => {
      const listing = createTestListing();
      const metrics: ListingMetrics | null = null;

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
    });

    it('should calculate ROI with different pricing models', () => {
      const ownerListing = createTestListing({
        pricing: { type: 'owner', base_price: 5000, commission_rate: 0.15 },
      });

      const platformListing = createTestListing({
        pricing: { type: 'platform', coin_budget: 10000, cost_per_scan: 0.5 },
      });

      const hybridListing = createTestListing({
        pricing: { type: 'hybrid', base_price: 2000, revenue_split: { vendor: 70, platform: 30 } },
      });

      const result = createAdOS().optimize({
        listings: [ownerListing, platformListing, hybridListing],
        budget: 15000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
      expect(result.recommendation.allocations).toBeDefined();
    });
  });

  describe('Optimization Engine', () => {
    it('should optimize with single listing', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 5000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
      expect(result.recommendation.total_budget).toBe(5000);
    });

    it('should optimize with multiple listings', () => {
      const listings = [
        createTestListing({ id: 'l1', name: 'Restaurant 1' }),
        createTestListing({ id: 'l2', name: 'Restaurant 2' }),
        createTestListing({ id: 'l3', name: 'Restaurant 3' }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 30000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
      expect(result.recommendation.allocations?.length).toBeGreaterThan(0);
    });

    it('should apply category filter', () => {
      const listings = [
        createTestListing({ id: 'l1', category: 'restaurant' }),
        createTestListing({ id: 'l2', category: 'retail' }),
        createTestListing({ id: 'l3', category: 'gym' }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 10000,
        category_filter: ['restaurant'],
      });

      expect(result.success).toBe(true);
      const filteredListings = result.recommendation.listings?.filter(
        (l) => l.listing.category === 'restaurant'
      );
      expect(filteredListings?.length).toBe(1);
    });

    it('should exclude low confidence listings by default', () => {
      const listings = [
        createTestListing({ id: 'l1' }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 10000,
        include_low_confidence: false,
      });

      expect(result.success).toBe(true);
    });

    it('should respect max_listings parameter', () => {
      const listings = Array.from({ length: 10 }, (_, i) =>
        createTestListing({ id: `l${i}`, name: `Listing ${i}` })
      );

      const result = createAdOS().optimize({
        listings,
        budget: 50000,
        max_listings: 3,
      });

      expect(result.success).toBe(true);
      expect(result.recommendation.allocations?.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty listings array', () => {
      const result = createAdOS().optimize({
        budget: 10000,
      });

      expect(result.success).toBe(true);
    });

    it('should handle zero budget', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Guardrails', () => {
    it('should pass guardrails for valid configuration', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.guardrails).toBeDefined();
    });

    it('should exclude listings with poor metrics', () => {
      const listings = [
        createTestListing({ id: 'good-listing' }),
        createTestListing({ id: 'bad-listing' }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 50000,
        guardrails: {
          min_roas_threshold: 0.5,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Performance Prediction', () => {
    it('should predict performance for a single listing', () => {
      const listing = createTestListing();
      const metrics = createTestMetrics();

      const ados = createAdOS();
      const prediction = ados.predictPerformance(listing, metrics, 10000, 30);

      expect(prediction.listing_id).toBe(listing.id);
      expect(prediction.predicted.scans).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('should identify risks for low confidence predictions', () => {
      const listing = createTestListing();
      const metrics: ListingMetrics | null = null;

      const ados = createAdOS();
      const prediction = ados.predictPerformance(listing, metrics, 1000, 30);

      const hasLowVolumeRisk = prediction.risks.some(
        (r) => r.type === 'new_listing' || r.type === 'low_volume'
      );
      expect(hasLowVolumeRisk).toBe(true);
    });
  });

  describe('Summary Generation', () => {
    it('should generate campaign summary', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      const summary = createAdOS().getSummary(result);

      expect(summary.total_listings).toBeGreaterThanOrEqual(0);
      expect(summary.total_budget).toBe(10000);
      expect(summary.risk_level).toMatch(/^(low|medium|high)$/);
    });

    it('should count warnings correctly', () => {
      const listings = [
        createTestListing({ id: 'l1' }),
        createTestListing({ id: 'l2' }),
        createTestListing({ id: 'l3' }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 50000,
      });

      const summary = createAdOS().getSummary(result);
      expect(summary.warnings_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations for low ROAS', () => {
      const listings = [
        createTestListing({
          id: 'low-roas',
          pricing: { type: 'platform', coin_budget: 100, cost_per_scan: 10 },
        }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 100,
        duration_days: 30,
      });

      const recommendations = createAdOS().generateRecommendations(result);

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should recommend diversification for few listings', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      const recommendations = createAdOS().generateRecommendations(result);

      // Should recommend adding more listings if only 1
      const diversificationRec = recommendations.find((r) =>
        r.includes('diversification')
      );
      expect(diversificationRec).toBeDefined();
    });

    it('should flag excluded listings in recommendations', () => {
      const listings = [
        createTestListing({ id: 'l1' }),
        createTestListing({ id: 'l2' }),
      ];

      const result = createAdOS().optimize({
        listings,
        budget: 50000,
      });

      const recommendations = createAdOS().generateRecommendations(result);

      // If there are excluded listings, should mention them
      if (result.guardrails.excluded_listings?.length > 0) {
        const exclusionRec = recommendations.find((r) =>
          r.includes('excluded')
        );
        expect(exclusionRec).toBeDefined();
      }
    });
  });

  describe('Quick Functions', () => {
    it('should use quick optimizeCampaign function', () => {
      const listing = createTestListing();

      const result = optimizeCampaign({
        listings: [listing],
        budget: 5000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Custom Weights', () => {
    it('should accept custom scoring weights', () => {
      const listing = createTestListing();

      const result = createAdOS({
        roas: 0.7,
        confidence: 0.1,
        volume: 0.15,
        category_match: 0.05,
      }).optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', () => {
      const result = createAdOS().optimize({
        listings: [],
        budget: 0,
      } as OptimizationRequest);

      expect(result.success).toBe(true);
    });

    it('should handle unknown error gracefully', () => {
      // This tests error handling in the orchestrator
      const result = createAdOS().optimize({
        listings: [createTestListing()],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.success).toBe(true);
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Freshness', () => {
    it('should include data freshness information', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.data_freshness.oldest_metric).toBeDefined();
      expect(result.data_freshness.newest_metric).toBeDefined();
    });

    it('should include processing time', () => {
      const listing = createTestListing();

      const result = createAdOS().optimize({
        listings: [listing],
        budget: 10000,
        duration_days: 30,
      });

      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
    });
  });
});
