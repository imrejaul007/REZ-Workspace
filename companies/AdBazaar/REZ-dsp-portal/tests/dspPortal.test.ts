import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DSPPortalService } from '../src/services/DSPPortalService';

// Mock axios for DOOH methods
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('DSPPortalService', () => {
  let service: DSPPortalService;
  let axios: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = new DSPPortalService();
    vi.clearAllMocks();

    // Get the mocked axios
    axios = require('axios');
  });

  // =============================================================================
  // 1. registerAdvertiser - creates advertiser with correct data
  // =============================================================================
  describe('registerAdvertiser', () => {
    it('creates advertiser with correct data', async () => {
      const advertiserData = {
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
        website: 'https://test.com',
      };

      const advertiser = await service.registerAdvertiser(advertiserData);

      expect(advertiser).toBeDefined();
      expect(advertiser.id).toMatch(/^adv-\d+$/);
      expect(advertiser.name).toBe('Test Advertiser');
      expect(advertiser.email).toBe('test@example.com');
      expect(advertiser.company).toBe('Test Company');
      expect(advertiser.website).toBe('https://test.com');
      expect(advertiser.status).toBe('pending');
      expect(advertiser.balance).toBe(0);
      expect(advertiser.spent).toBe(0);
      expect(advertiser.createdAt).toBeInstanceOf(Date);
    });

    it('creates advertiser without optional website', async () => {
      const advertiserData = {
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      };

      const advertiser = await service.registerAdvertiser(advertiserData);

      expect(advertiser).toBeDefined();
      expect(advertiser.website).toBeUndefined();
    });
  });

  // =============================================================================
  // 2. createCampaign - creates campaign linked to advertiser
  // =============================================================================
  describe('createCampaign', () => {
    it('creates campaign linked to advertiser', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaignData = {
        name: 'Test Campaign',
        objective: 'awareness' as const,
        budget: { daily: 100, total: 1000 },
        bidding: { strategy: 'auto' as const },
        targeting: { locations: ['US'], age: { min: 18, max: 35 } },
      };

      const campaign = await service.createCampaign(advertiser.id, campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.id).toMatch(/^camp-\d+$/);
      expect(campaign.advertiserId).toBe(advertiser.id);
      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.objective).toBe('awareness');
      expect(campaign.status).toBe('draft');
      expect(campaign.budget.daily).toBe(100);
      expect(campaign.budget.total).toBe(1000);
      expect(campaign.budget.spent).toBe(0);
      expect(campaign.creatives).toEqual([]);
      expect(campaign.metrics).toEqual({
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        conversionRate: 0,
        spend: 0,
        cpm: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      });
    });

    it('throws error when advertiser not found', async () => {
      await expect(
        service.createCampaign('non-existent-id', {
          name: 'Test Campaign',
          objective: 'awareness',
          budget: { total: 1000 },
          bidding: { strategy: 'auto' },
          targeting: {},
        })
      ).rejects.toThrow('Advertiser not found');
    });
  });

  // =============================================================================
  // 3. getCampaign - retrieves existing campaign
  // =============================================================================
  describe('getCampaign (existing)', () => {
    it('retrieves existing campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const created = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'traffic',
        budget: { total: 500 },
        bidding: { strategy: 'manual', maxBid: 2.5 },
        targeting: { devices: ['mobile'] },
      });

      const retrieved = await service.getCampaign(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Campaign');
      expect(retrieved?.advertiserId).toBe(advertiser.id);
    });
  });

  // =============================================================================
  // 4. getCampaign - returns null for non-existent
  // =============================================================================
  describe('getCampaign (non-existent)', () => {
    it('returns null for non-existent campaign', async () => {
      const result = await service.getCampaign('non-existent-id');
      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // 5. addCreative - adds creative to campaign
  // =============================================================================
  describe('addCreative', () => {
    it('adds creative to campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'conversion',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      const creativeData = {
        name: 'Test Creative',
        type: 'banner' as const,
        format: '300x250' as const,
        url: 'https://example.com/banner.jpg',
        clickUrl: 'https://example.com/click',
      };

      const creative = await service.addCreative(campaign.id, creativeData);

      expect(creative).toBeDefined();
      expect(creative?.id).toMatch(/^creative-\d+$/);
      expect(creative?.name).toBe('Test Creative');
      expect(creative?.type).toBe('banner');
      expect(creative?.format).toBe('300x250');
      expect(creative?.url).toBe('https://example.com/banner.jpg');
      expect(creative?.clickUrl).toBe('https://example.com/click');
      expect(creative?.status).toBe('pending');
    });

    it('returns null when campaign not found', async () => {
      const result = await service.addCreative('non-existent-id', {
        name: 'Test Creative',
        type: 'banner',
        format: '300x250',
        url: 'https://example.com/banner.jpg',
        clickUrl: 'https://example.com/click',
      });

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // 6. launchCampaign - changes status to active
  // =============================================================================
  describe('launchCampaign', () => {
    it('changes status to active from draft', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);

      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('active');
    });

    it('changes status to active from paused', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);
      await service.pauseCampaign(campaign.id);
      await service.launchCampaign(campaign.id);

      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('active');
    });

    it('throws error when campaign not found', async () => {
      await expect(service.launchCampaign('non-existent-id')).rejects.toThrow(
        'Campaign not found'
      );
    });

    it('throws error when campaign cannot be launched from current status', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);

      await expect(service.launchCampaign(campaign.id)).rejects.toThrow(
        'Campaign cannot be launched from current status'
      );
    });
  });

  // =============================================================================
  // 7. pauseCampaign - changes status to paused
  // =============================================================================
  describe('pauseCampaign', () => {
    it('changes status to paused from active', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);
      await service.pauseCampaign(campaign.id);

      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('paused');
    });

    it('throws error when campaign not found', async () => {
      await expect(service.pauseCampaign('non-existent-id')).rejects.toThrow(
        'Campaign not found'
      );
    });

    it('throws error when campaign cannot be paused from current status', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await expect(service.pauseCampaign(campaign.id)).rejects.toThrow(
        'Campaign cannot be paused from current status'
      );
    });
  });

  // =============================================================================
  // 8. completeCampaign - changes status to completed
  // =============================================================================
  describe('completeCampaign', () => {
    it('changes status to completed', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.completeCampaign(campaign.id);

      const updated = await service.getCampaign(campaign.id);
      expect(updated?.status).toBe('completed');
    });

    it('throws error when campaign not found', async () => {
      await expect(service.completeCampaign('non-existent-id')).rejects.toThrow(
        'Campaign not found'
      );
    });
  });

  // =============================================================================
  // 9. deleteCampaign - removes campaign
  // =============================================================================
  describe('deleteCampaign', () => {
    it('removes campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      const result = await service.deleteCampaign(campaign.id);

      expect(result).toBe(true);
      const deleted = await service.getCampaign(campaign.id);
      expect(deleted).toBeNull();
    });

    it('returns false when campaign not found', async () => {
      const result = await service.deleteCampaign('non-existent-id');
      expect(result).toBe(false);
    });

    it('throws error when trying to delete active campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.launchCampaign(campaign.id);

      await expect(service.deleteCampaign(campaign.id)).rejects.toThrow(
        'Cannot delete active campaign. Pause it first.'
      );
    });
  });

  // =============================================================================
  // 10. getCampaignMetrics - returns metrics
  // =============================================================================
  describe('getCampaignMetrics', () => {
    it('returns metrics for existing campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      const metrics = await service.getCampaignMetrics(campaign.id);

      expect(metrics).toBeDefined();
      expect(metrics).toEqual({
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        conversionRate: 0,
        spend: 0,
        cpm: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      });
    });

    it('returns null for non-existent campaign', async () => {
      const result = await service.getCampaignMetrics('non-existent-id');
      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // 11. estimateReach - calculates reach based on budget
  // =============================================================================
  describe('estimateReach', () => {
    it('calculates reach based on budget', async () => {
      const targeting = {
        locations: ['US'],
        age: { min: 18, max: 35 },
      };

      const result = await service.estimateReach(targeting, 1000);

      expect(result).toBeDefined();
      expect(result.impressions).toBeGreaterThan(0);
      expect(result.reach).toBeGreaterThan(0);
      expect(result.frequency).toBeGreaterThan(0);
    });

    it('calculates correct impressions with fixed CPM of $4.00', async () => {
      const targeting = { locations: ['US'] };

      // Budget of $1000 at $4 CPM = 250,000 impressions
      const result = await service.estimateReach(targeting, 1000);

      // CPM is $4 per 1000 impressions, so $1000 / $4 * 1000 = 250,000
      expect(result.impressions).toBe(250000);
    });

    it('calculates reach as 60% of impressions', async () => {
      const targeting = { locations: ['US'] };

      const result = await service.estimateReach(targeting, 1000);

      // Reach should be 60% of impressions
      expect(result.reach).toBe(Math.round(result.impressions * 0.6));
    });

    it('calculates frequency correctly', async () => {
      const targeting = { locations: ['US'] };

      const result = await service.estimateReach(targeting, 1000);

      // Frequency is rounded to 1 decimal place in the service
      // Raw calculation: 250000 / 150000 = 1.6666...
      // Rounded to 1 decimal: 1.7
      expect(result.frequency).toBe(1.7);
    });
  });

  // =============================================================================
  // 12. addFunds - increases advertiser balance
  // =============================================================================
  describe('addFunds', () => {
    it('increases advertiser balance', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const result = await service.addFunds(advertiser.id, 500);

      expect(result).toBeDefined();
      expect(result?.newBalance).toBe(500);
      expect(result?.transactionId).toMatch(/^txn-\d+$/);

      const updated = await service.getAdvertiser(advertiser.id);
      expect(updated?.balance).toBe(500);
    });

    it('adds funds to existing balance', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      await service.addFunds(advertiser.id, 500);
      const result = await service.addFunds(advertiser.id, 300);

      expect(result?.newBalance).toBe(800);
    });

    it('returns null when advertiser not found', async () => {
      const result = await service.addFunds('non-existent-id', 500);
      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // 13. getBillingSummary - returns billing info
  // =============================================================================
  describe('getBillingSummary', () => {
    it('returns billing info', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      await service.addFunds(advertiser.id, 1000);

      const summary = await service.getBillingSummary(advertiser.id);

      expect(summary).toBeDefined();
      expect(summary?.balance).toBe(1000);
      expect(summary?.pending).toBe(100); // 10% of balance
      expect(summary?.spent).toBe(0);
      expect(summary?.invoices).toBeDefined();
      expect(Array.isArray(summary?.invoices)).toBe(true);
      expect(summary?.invoices.length).toBeGreaterThan(0);
    });

    it('returns null when advertiser not found', async () => {
      const result = await service.getBillingSummary('non-existent-id');
      expect(result).toBeNull();
    });

    it('includes invoice structure', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const summary = await service.getBillingSummary(advertiser.id);

      if (summary?.invoices && summary.invoices.length > 0) {
        const invoice = summary.invoices[0];
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('amount');
        expect(invoice).toHaveProperty('date');
        expect(invoice.date).toBeInstanceOf(Date);
      }
    });
  });

  // =============================================================================
  // 14. getDOOHPricing - handles errors gracefully
  // =============================================================================
  describe('getDOOHPricing', () => {
    it('returns pricing quote on success', async () => {
      const mockResponse = {
        data: {
          finalCPM: 5.5,
          baseCPM: 4.0,
          adjustments: {
            captivity: 0.5,
            cityTier: 0.3,
            timeSlot: 0.2,
            seasonal: 0.1,
            demand: 0.4,
            audienceMatch: 0.0,
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await service.getDOOHPricing({
        screenType: 'digital-signage',
        city: 'New York',
        tier: 'metro',
      });

      expect(result).toBeDefined();
      expect(result?.finalCPM).toBe(5.5);
      expect(result?.baseCPM).toBe(4.0);
      expect(axios.post).toHaveBeenCalled();
    });

    it('handles errors gracefully and returns null', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      const result = await service.getDOOHPricing({
        screenType: 'digital-signage',
        city: 'New York',
        tier: 'metro',
      });

      expect(result).toBeNull();
    });

    it('handles timeout errors gracefully', async () => {
      axios.post.mockRejectedValue(new Error('timeout'));

      const result = await service.getDOOHPricing({
        screenType: 'digital-signage',
        city: 'New York',
        tier: 'metro',
      });

      expect(result).toBeNull();
    });

    it('includes scheduled time in request when provided', async () => {
      const mockResponse = { data: { finalCPM: 5.5, baseCPM: 4.0, adjustments: {} } };
      axios.post.mockResolvedValue(mockResponse);

      const scheduledTime = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T17:00:00Z'),
      };

      await service.getDOOHPricing({
        screenType: 'digital-signage',
        city: 'New York',
        tier: 'metro',
        scheduledTime,
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/pricing/calculate'),
        expect.objectContaining({
          screenType: 'digital-signage',
          city: 'New York',
          tier: 'metro',
          scheduledTime,
        }),
        expect.objectContaining({ timeout: 5000 })
      );
    });
  });

  // =============================================================================
  // Additional method tests for completeness
  // =============================================================================
  describe('getAdvertiser', () => {
    it('retrieves existing advertiser', async () => {
      const created = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const retrieved = await service.getAdvertiser(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Advertiser');
    });

    it('returns null for non-existent advertiser', async () => {
      const result = await service.getAdvertiser('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAdvertiserCampaigns', () => {
    it('returns all campaigns for advertiser', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      await service.createCampaign(advertiser.id, {
        name: 'Campaign 1',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      await service.createCampaign(advertiser.id, {
        name: 'Campaign 2',
        objective: 'traffic',
        budget: { total: 2000 },
        bidding: { strategy: 'manual' },
        targeting: {},
      });

      const campaigns = await service.getAdvertiserCampaigns(advertiser.id);

      expect(campaigns).toHaveLength(2);
      expect(campaigns.map((c) => c.name)).toContain('Campaign 1');
      expect(campaigns.map((c) => c.name)).toContain('Campaign 2');
    });

    it('returns empty array when no campaigns exist', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaigns = await service.getAdvertiserCampaigns(advertiser.id);

      expect(campaigns).toEqual([]);
    });
  });

  describe('generateReport', () => {
    it('returns report for existing campaign', async () => {
      const advertiser = await service.registerAdvertiser({
        name: 'Test Advertiser',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const campaign = await service.createCampaign(advertiser.id, {
        name: 'Test Campaign',
        objective: 'awareness',
        budget: { total: 1000 },
        bidding: { strategy: 'auto' },
        targeting: {},
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const report = await service.generateReport(campaign.id, startDate, endDate);

      expect(report).toBeDefined();
      expect(report?.campaignId).toBe(campaign.id);
      expect(report?.dateRange.start).toEqual(startDate);
      expect(report?.dateRange.end).toEqual(endDate);
      expect(report?.metrics).toBeDefined();
    });

    it('returns null for non-existent campaign', async () => {
      const result = await service.generateReport(
        'non-existent-id',
        new Date(),
        new Date()
      );
      expect(result).toBeNull();
    });
  });

  describe('getScreenTypes', () => {
    it('returns screen types on success', async () => {
      const mockScreenTypes = [
        { type: 'indoor', captivityLevel: 'high', description: 'Indoor screens', baseCPM: 5.0 },
        { type: 'outdoor', captivityLevel: 'medium', description: 'Outdoor screens', baseCPM: 3.5 },
      ];
      axios.get.mockResolvedValue({ data: mockScreenTypes });

      const result = await service.getScreenTypes();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(axios.get).toHaveBeenCalled();
    });

    it('returns null on error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.getScreenTypes();

      expect(result).toBeNull();
    });
  });

  describe('getDemoPricing', () => {
    it('returns demo pricing on success', async () => {
      const mockPricing = [
        { screenType: 'indoor', base: 4.0, metroPeak: 6.0, metroNormal: 4.5, tier2Peak: 5.0 },
      ];
      axios.get.mockResolvedValue({ data: mockPricing });

      const result = await service.getDemoPricing();

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(axios.get).toHaveBeenCalled();
    });

    it('returns null on error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.getDemoPricing();

      expect(result).toBeNull();
    });
  });

  describe('calculateCampaignEstimate', () => {
    it('returns campaign estimate on success', async () => {
      const mockScreenTypes = [
        { type: 'indoor', captivityLevel: 'high', description: 'Indoor screens', baseCPM: 5.0 },
      ];
      axios.get.mockResolvedValue({ data: mockScreenTypes });

      const result = await service.calculateCampaignEstimate({
        screenTypes: ['indoor'],
        cities: ['New York'],
        budget: 1000,
        objective: 'awareness',
      });

      expect(result).toBeDefined();
      expect(result?.estimatedImpressions).toBeGreaterThan(0);
      expect(result?.estimatedCPM).toBeGreaterThan(0);
      expect(result?.priceBreakdown).toBeDefined();
    });

    it('returns null when no screen types available', async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await service.calculateCampaignEstimate({
        screenTypes: ['indoor'],
        cities: ['New York'],
        budget: 1000,
        objective: 'awareness',
      });

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.calculateCampaignEstimate({
        screenTypes: ['indoor'],
        cities: ['New York'],
        budget: 1000,
        objective: 'awareness',
      });

      expect(result).toBeNull();
    });
  });
});
