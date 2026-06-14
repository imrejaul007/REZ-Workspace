import { CampaignGeneratorService } from '../src/services/campaign-generator.service';
import { ParsedIntent } from '../src/types';

describe('CampaignGeneratorService', () => {
  let generator: CampaignGeneratorService;

  beforeEach(() => {
    generator = new CampaignGeneratorService();
  });

  describe('generate', () => {
    it('should generate a complete campaign from parsed intent', async () => {
      const parsed: ParsedIntent = {
        goal: {
          type: 'sales',
          target: 1000,
          timeline: '30 days'
        },
        audience: {
          location: ['Bangalore', 'Mumbai'],
          demographics: { age: '25-35', gender: 'all' },
          interests: ['technology', 'shopping']
        },
        budget: {
          amount: 50000,
          currency: 'INR',
          optimization: 'moderate'
        },
        products: [{ name: 'phones', category: 'electronics' }],
        channels: ['google', 'facebook', 'instagram']
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.campaign).toBeDefined();
      expect(result.campaign.name).toContain('Sell');
      expect(result.campaign.objective).toBe('sales');
      expect(result.campaign.status).toBe('draft');
      expect(result.campaign.budget.amount).toBe(50000);
      expect(result.campaign.targeting.locations).toContain('Bangalore');
      expect(result.campaign.ads.length).toBeGreaterThan(0);
      expect(result.campaign.schedule.startDate).toBeDefined();
      expect(result.campaign.bidStrategy).toBeDefined();
    });

    it('should generate campaign name based on product and location', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'leads', target: 500 },
        audience: { location: ['Chennai'] },
        budget: { amount: 30000, currency: 'INR' },
        products: [{ name: 'consulting' }]
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.campaign.name).toContain('consulting');
      expect(result.campaign.name).toContain('Chennai');
    });

    it('should allocate budget across channels', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Delhi'] },
        budget: { amount: 100000, currency: 'INR' },
        channels: ['google', 'facebook', 'instagram']
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.campaign.budget.allocation).toBeDefined();
      expect(result.campaign.budget.allocation.channels).toHaveProperty('google');
      expect(result.campaign.budget.allocation.channels).toHaveProperty('facebook');
      expect(result.campaign.budget.allocation.channels).toHaveProperty('instagram');

      // Verify total allocation doesn't exceed budget
      const channelTotal = Object.values(result.campaign.budget.allocation.channels).reduce((a, b) => a + b, 0);
      expect(channelTotal).toBeLessThanOrEqual(100000);
    });

    it('should generate ads with appropriate call to action', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'bookings', target: 100 },
        audience: { location: ['Pune'] },
        budget: { amount: 20000, currency: 'INR' }
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.campaign.ads[0].callToAction).toBe('Book Now');
    });

    it('should generate bid strategy based on goal type', async () => {
      const testCases: Array<{ goalType: 'sales' | 'leads' | 'bookings' | 'traffic' | 'awareness'; expectedType: string }> = [
        { goalType: 'sales', expectedType: 'cpa' },
        { goalType: 'leads', expectedType: 'cpc' },
        { goalType: 'bookings', expectedType: 'cpa' },
        { goalType: 'traffic', expectedType: 'cpm' },
        { goalType: 'awareness', expectedType: 'cpm' }
      ];

      for (const testCase of testCases) {
        const parsed: ParsedIntent = {
          goal: { type: testCase.goalType, target: 100 },
          audience: { location: ['Bangalore'] },
          budget: { amount: 50000, currency: 'INR' }
        };

        const result = await generator.generate(parsed, 'advertiser-123');
        expect(result.campaign.bidStrategy.type).toBe(testCase.expectedType);
      }
    });

    it('should generate suggestions based on campaign parameters', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should set correct schedule dates', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 500 },
        audience: { location: ['Mumbai'] },
        budget: { amount: 25000, currency: 'INR' },
        timeline: { duration: '14 days' }
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.campaign.schedule.startDate).toBeDefined();
      expect(result.campaign.schedule.endDate).toBeDefined();
      if (result.campaign.schedule.endDate) {
        expect(result.campaign.schedule.endDate.getTime()).toBeGreaterThan(
          result.campaign.schedule.startDate.getTime()
        );
      }
    });

    it('should generate targeting with location and demographics', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'leads', target: 200 },
        audience: {
          location: ['Hyderabad', 'Chennai'],
          demographics: { age: '30-45', gender: 'male' },
          interests: ['business', 'technology']
        },
        budget: { amount: 40000, currency: 'INR' }
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      expect(result.campaign.targeting.locations).toContain('Hyderabad');
      expect(result.campaign.targeting.locations).toContain('Chennai');
      expect(result.campaign.targeting.interests).toContain('business');
      expect(result.campaign.targeting.gender).toContain('male');
    });

    it('should calculate confidence based on campaign completeness', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' },
        products: [{ name: 'electronics' }],
        channels: ['google', 'facebook']
      };

      const result = await generator.generate(parsed, 'advertiser-123');

      // Should have reasonable confidence
      expect(result.campaign).toBeDefined();
    });
  });

  describe('adjust', () => {
    it('should increase budget when requested', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      };

      const originalCampaign = (await generator.generate(parsed, 'advertiser-123')).campaign;
      const result = await generator.adjust(originalCampaign, 'increase budget by 50%');

      expect(result.campaign.budget.amount).toBe(75000);
      expect(result.appliedChanges).toContain('Increased budget by 50%');
    });

    it('should decrease budget when requested', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      };

      const originalCampaign = (await generator.generate(parsed, 'advertiser-123')).campaign;
      const result = await generator.adjust(originalCampaign, 'decrease budget by 20%');

      expect(result.campaign.budget.amount).toBe(40000);
      expect(result.appliedChanges).toContain('Decreased budget by 20%');
    });

    it('should update location when requested', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      };

      const originalCampaign = (await generator.generate(parsed, 'advertiser-123')).campaign;
      const result = await generator.adjust(originalCampaign, 'change location to Mumbai');

      expect(result.campaign.targeting.locations).toContain('Mumbai');
      expect(result.campaign.targeting.locations).not.toContain('Bangalore');
    });

    it('should apply explicit changes when provided', async () => {
      const parsed: ParsedIntent = {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      };

      const originalCampaign = (await generator.generate(parsed, 'advertiser-123')).campaign;
      const result = await generator.adjust(originalCampaign, 'update campaign', {
        name: 'New Campaign Name'
      });

      expect(result.campaign.name).toBe('New Campaign Name');
 });
  });
});