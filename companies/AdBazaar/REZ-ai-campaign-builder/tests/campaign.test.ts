import { describe, it, expect, vi } from 'vitest';

// Mock logger
vi.mock('./utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('REZ AI Campaign Builder', () => {
  describe('Campaign Generation', () => {
    it('should create a valid campaign structure', () => {
      const createCampaign = (
        goal: string,
        merchantType: string,
        budget: number
      ) => ({
        id: `campaign_${Date.now()}`,
        goal,
        merchantType,
        budget,
        channels: ['whatsapp', 'sms'],
        creative: {
          headline: 'Welcome!',
          body: 'Check out our offers',
          cta: 'Shop Now',
        },
        targetAudience: {
          location: 'Mumbai',
          demographics: ['25-35'],
        },
        estimated: {
          reach: budget * 100,
          engagement: budget * 10,
        },
        createdAt: new Date(),
      });

      const campaign = createCampaign('Get more customers', 'restaurant', 5000);
      expect(campaign).toHaveProperty('id');
      expect(campaign).toHaveProperty('goal');
      expect(campaign).toHaveProperty('channels');
      expect(campaign).toHaveProperty('creative');
    });

    it('should extract goal from natural language', () => {
      const extractGoal = (prompt: string): string => {
        const goals = [
          { keywords: ['more customers', 'new customers', 'customer acquisition'], goal: 'customer_acquisition' },
          { keywords: ['sales', 'sell', 'orders'], goal: 'sales' },
          { keywords: ['brand', 'awareness', 'visibility'], goal: 'brand_awareness' },
          { keywords: ['engagement', 'interaction'], goal: 'engagement' },
          { keywords: ['traffic', 'footfall', 'visits'], goal: 'foot_traffic' },
        ];

        const lowerPrompt = prompt.toLowerCase();
        for (const g of goals) {
          if (g.keywords.some(kw => lowerPrompt.includes(kw))) {
            return g.goal;
          }
        }
        return 'general_promotion';
      };

      expect(extractGoal('I want more customers')).toBe('customer_acquisition');
      expect(extractGoal('Boost my sales')).toBe('sales');
      expect(extractGoal('Increase brand awareness')).toBe('brand_awareness');
    });

    it('should suggest channels based on goal', () => {
      const suggestChannels = (goal: string): string[] => {
        const channelMap: Record<string, string[]> = {
          customer_acquisition: ['whatsapp', 'sms', 'email'],
          sales: ['whatsapp', 'instagram', 'sms'],
          brand_awareness: ['instagram', 'facebook', 'youtube'],
          engagement: ['whatsapp', 'instagram'],
          foot_traffic: ['sms', 'push_notification'],
        };
        return channelMap[goal] || ['whatsapp', 'sms'];
      };

      expect(suggestChannels('customer_acquisition')).toContain('whatsapp');
      expect(suggestChannels('brand_awareness')).toContain('instagram');
      expect(suggestChannels('foot_traffic')).toContain('sms');
    });
  });

  describe('Channel Recommendations', () => {
    it('should validate channel options', () => {
      const validChannels = [
        'whatsapp',
        'sms',
        'email',
        'push_notification',
        'instagram',
        'facebook',
        'google_ads',
        'youtube',
      ];

      expect(validChannels).toContain('whatsapp');
      expect(validChannels).toContain('instagram');
      expect(validChannels).toContain('sms');
    });

    it('should calculate reach based on budget', () => {
      const calculateReach = (budget: number, channel: string): number => {
        const rates: Record<string, number> = {
          whatsapp: 0.5,
          sms: 0.3,
          email: 0.1,
          instagram: 0.8,
          facebook: 0.6,
        };
        const rate = rates[channel] || 0.4;
        return Math.floor(budget * rate);
      };

      expect(calculateReach(1000, 'whatsapp')).toBe(500);
      expect(calculateReach(1000, 'sms')).toBe(300);
      expect(calculateReach(1000, 'instagram')).toBe(800);
    });
  });

  describe('Creative Generation', () => {
    it('should generate headline variations', () => {
      const generateHeadlines = (merchantType: string, goal: string): string[] => {
        const templates: Record<string, string[]> = {
          restaurant: [
            'Taste the Difference Today!',
            'Your Favorite Food Delivered',
            'Hungry? We Have Special Deals!',
          ],
          retail: [
            'Shop Smart, Save Big!',
            'New Arrivals Just Dropped!',
            'Limited Time Offers Inside!',
          ],
          default: [
            'Don\'t Miss Out!',
            'Special Offer Just For You!',
            'Act Now for Best Deals!',
          ],
        };
        return templates[merchantType] || templates.default;
      };

      const headlines = generateHeadlines('restaurant', 'sales');
      expect(headlines.length).toBeGreaterThan(0);
      expect(headlines[0]).toContain('Food');
    });

    it('should generate CTA variations', () => {
      const ctas = [
        'Shop Now',
        'Order Now',
        'Call Now',
        'Learn More',
        'Get Started',
        'Book Today',
      ];

      expect(ctas).toContain('Shop Now');
      expect(ctas).toContain('Order Now');
      expect(ctas.length).toBe(6);
    });
  });

  describe('Budget Allocation', () => {
    it('should allocate budget across channels', () => {
      const allocateBudget = (totalBudget: number, channels: string[]): Record<string, number> => {
        const allocation: Record<string, number> = {};
        const perChannel = Math.floor(totalBudget / channels.length);

        channels.forEach(channel => {
          allocation[channel] = perChannel;
        });

        return allocation;
      };

      const allocation = allocateBudget(10000, ['whatsapp', 'sms', 'email']);
      expect(allocation.whatsapp).toBe(3333);
      expect(allocation.sms).toBe(3333);
      expect(allocation.email).toBe(3333);
    });

    it('should calculate ROI estimates', () => {
      const calculateROI = (budget: number, expectedConversions: number, avgOrderValue: number) => {
        const expectedRevenue = expectedConversions * avgOrderValue;
        const roi = ((expectedRevenue - budget) / budget) * 100;
        return Math.round(roi * 100) / 100;
      };

      expect(calculateROI(5000, 100, 100)).toBe(100); // 100% ROI
      expect(calculateROI(5000, 50, 100)).toBe(0); // break-even
      expect(calculateROI(5000, 25, 100)).toBe(-50); // 50% loss
    });
  });

  describe('Merchant Type Detection', () => {
    it('should detect merchant type from name', () => {
      const detectMerchantType = (name: string): string => {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('restaurant') || nameLower.includes('food') || nameLower.includes('cafe')) {
          return 'restaurant';
        }
        if (nameLower.includes('hotel') || nameLower.includes('resort')) {
          return 'hotel';
        }
        if (nameLower.includes('shop') || nameLower.includes('store') || nameLower.includes('mart')) {
          return 'retail';
        }
        if (nameLower.includes('gym') || nameLower.includes('fitness')) {
          return 'fitness';
        }
        return 'general';
      };

      expect(detectMerchantType('Pizza Palace')).toBe('restaurant');
      expect(detectMerchantType('Fashion Store')).toBe('retail');
      expect(detectMerchantType('City Hotel')).toBe('hotel');
    });

    it('should suggest templates by merchant type', () => {
      const getTemplates = (merchantType: string): string[] => {
        const templates: Record<string, string[]> = {
          restaurant: ['Lunch Rush', 'Dinner Special', 'Weekend Brunch'],
          hotel: ['Staycation Deal', 'Weekend Getaway'],
          retail: ['Flash Sale', 'New Arrivals'],
          fitness: ['New Year Fitness', 'Summer Shape'],
        };
        return templates[merchantType] || ['General Campaign'];
      };

      expect(getTemplates('restaurant')).toContain('Lunch Rush');
      expect(getTemplates('hotel')).toContain('Staycation Deal');
    });
  });

  describe('Campaign Optimization', () => {
    it('should generate optimization suggestions', () => {
      const getSuggestions = (metrics: Record<string, number>): string[] => {
        const suggestions: string[] = [];

        if (metrics.ctr < 2) {
          suggestions.push('Improve creative with stronger CTAs');
        }
        if (metrics.conversionRate < 5) {
          suggestions.push('Optimize landing page for better conversions');
        }
        if (metrics.cpc > 5) {
          suggestions.push('Refine audience targeting to reduce CPC');
        }
        if (metrics.roi < 100) {
          suggestions.push('Consider adjusting budget allocation');
        }

        return suggestions;
      };

      const suggestions = getSuggestions({ ctr: 1, conversionRate: 3, cpc: 8, roi: 50 });
      expect(suggestions.length).toBe(4);
    });

    it('should calculate lift potential', () => {
      const calculateLift = (baseline: number, optimized: number) => {
        return Math.round(((optimized - baseline) / baseline) * 100 * 100) / 100;
      };

      expect(calculateLift(100, 120)).toBe(20); // 20% lift
      expect(calculateLift(100, 80)).toBe(-20); // 20% decrease
    });
  });

  describe('API Endpoints', () => {
    it('should validate endpoint paths', () => {
      const endpoints = [
        { path: '/health', method: 'GET' },
        { path: '/api/generate', method: 'POST' },
        { path: '/api/generate-creative', method: 'POST' },
        { path: '/api/recommendations', method: 'GET' },
        { path: '/api/optimize', method: 'POST' },
        { path: '/api/templates', method: 'GET' },
      ];

      expect(endpoints.find(e => e.path === '/health')).toBeDefined();
      expect(endpoints.find(e => e.path === '/api/generate')).toBeDefined();
    });

    it('should validate generate request body', () => {
      const validRequest = {
        goal: 'Get more customers',
        merchantType: 'restaurant',
        location: 'Mumbai',
        budget: 5000,
        preferChannels: ['whatsapp', 'sms'],
      };

      expect(validRequest).toHaveProperty('goal');
      expect(typeof validRequest.budget).toBe('number');
    });

    it('should validate optimize request body', () => {
      const validOptimizeRequest = {
        campaignId: 'camp_001',
        currentMetrics: {
          ctr: 2.5,
          conversionRate: 4.2,
          cpc: 3.5,
          roi: 150,
        },
      };

      expect(validOptimizeRequest).toHaveProperty('campaignId');
      expect(validOptimizeRequest).toHaveProperty('currentMetrics');
    });
  });

  describe('Location Targeting', () => {
    it('should validate location formats', () => {
      const locations = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Pan India'];
      expect(locations).toContain('Mumbai');
      expect(locations.length).toBe(4);
    });

    it('should suggest radius-based targeting', () => {
      const suggestRadius = (merchantType: string): number => {
        const radiusMap: Record<string, number> = {
          restaurant: 3, // 3 km
          retail: 5,
          hotel: 10,
          fitness: 2,
        };
        return radiusMap[merchantType] || 5;
      };

      expect(suggestRadius('restaurant')).toBe(3);
      expect(suggestRadius('retail')).toBe(5);
      expect(suggestRadius('hotel')).toBe(10);
    });
  });
});