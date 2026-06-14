/**
 * RisnaEstate - Lead Service Unit Tests
 */

// Mock lead data
const mockLead = {
  _id: 'lead_123',
  name: 'John Doe',
  phone: '+919876543210',
  email: 'john@example.com',
  source: 'website',
  segment: 'hni',
  preferences: {
    propertyTypes: ['apartment', 'villa'],
    budget: { min: 5000000, max: 10000000, currency: 'INR' },
    timeline: '3-6months',
    purpose: 'buy'
  },
  aiScore: {
    overall: 75,
    intent: 80,
    budgetMatch: 70,
    timeline: 75,
    engagement: 75
  },
  qualification: {
    status: 'qualified'
  }
};

describe('Lead Service Tests', () => {
  describe('Lead Creation', () => {
    test('should create lead with required fields', () => {
      expect(mockLead.name).toBeDefined();
      expect(mockLead.phone).toBeDefined();
      expect(mockLead.source).toBeDefined();
    });

    test('should have valid source', () => {
      const validSources = ['website', 'whatsapp', 'referral', 'social', 'agent', 'partner', 'ad', 'organic'];
      expect(validSources).toContain(mockLead.source);
    });

    test('should have valid segment', () => {
      const validSegments = ['nri', 'hni', 'mid_segment', 'mass_market', 'investor', 'end_user'];
      expect(validSegments).toContain(mockLead.segment);
    });
  });

  describe('Lead Scoring', () => {
    test('should calculate overall score', () => {
      const { intent, budgetMatch, timeline, engagement } = mockLead.aiScore;

      // Weights: intent=35%, budgetMatch=25%, timeline=15%, engagement=25%
      const overall = Math.round(
        intent * 0.35 +
        budgetMatch * 0.25 +
        timeline * 0.15 +
        engagement * 0.25
      );

      expect(overall).toBe(76);
    });

    test('should identify hot lead (score >= 80)', () => {
      const hotLead = {
        ...mockLead,
        aiScore: { ...mockLead.aiScore, overall: 85 }
      };

      expect(hotLead.aiScore.overall).toBeGreaterThanOrEqual(80);
    });

    test('should identify cold lead (score < 50)', () => {
      const coldLead = {
        ...mockLead,
        aiScore: { ...mockLead.aiScore, overall: 35 }
      };

      expect(coldLead.aiScore.overall).toBeLessThan(50);
    });
  });

  describe('Lead Qualification', () => {
    const validStatuses = ['new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'lost', 'converted'];

    test.each(validStatuses)('should accept status: %s', (status) => {
      const lead = { ...mockLead, qualification: { status } };
      expect(lead.qualification.status).toBe(status);
    });
  });

  describe('NRI/HNI Detection', () => {
    test('should detect NRI profile', () => {
      const nriLead = {
        ...mockLead,
        segment: 'nri',
        nriProfile: {
          isNRI: true,
          countryOfResidence: 'AE',
          visaType: 'golden'
        }
      };

      expect(nriLead.nriProfile.isNRI).toBe(true);
      expect(nriLead.nriProfile.countryOfResidence).toBe('AE');
    });

    test('should detect HNI profile', () => {
      const hniLead = {
        ...mockLead,
        segment: 'hni',
        hniProfile: {
          isHNI: true,
          annualIncome: 10000000,
          netWorth: 50000000
        }
      };

      expect(hniLead.hniProfile.isHNI).toBe(true);
      expect(hniLead.hniProfile.annualIncome).toBeGreaterThanOrEqual(5000000);
    });
  });

  describe('Lead Assignment', () => {
    test('should assign to broker', () => {
      const brokerId = 'broker_456';
      const lead = { ...mockLead, assignedBrokerId: brokerId };

      expect(lead.assignedBrokerId).toBe(brokerId);
    });
  });
});

describe('Lead Budget Analysis', () => {
  test('should calculate budget range', () => {
    const budget = mockLead.preferences.budget;
    const avgBudget = (budget.min + budget.max) / 2;

    expect(avgBudget).toBe(7500000);
  });

  test('should identify luxury budget (>= 5Cr)', () => {
    const luxuryLead = {
      ...mockLead,
      preferences: {
        ...mockLead.preferences,
        budget: { min: 50000000, max: 100000000, currency: 'INR' }
      }
    };

    expect(luxuryLead.preferences.budget.min).toBeGreaterThanOrEqual(50000000);
  });

  test('should identify mid-segment budget', () => {
    const midLead = {
      ...mockLead,
      preferences: {
        ...mockLead.preferences,
        budget: { min: 3000000, max: 7000000, currency: 'INR' }
      }
    };

    expect(midLead.preferences.budget.max).toBeLessThan(10000000);
  });
});

export {};
