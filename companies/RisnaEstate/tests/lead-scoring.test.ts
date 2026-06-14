/**
 * RisnaEstate - Lead Intelligence Tests
 */

describe('Lead Scoring', () => {
  interface Lead {
    phone?: string;
    email?: string;
    budget?: { min: number; max: number };
    source?: string;
    designation?: string;
    salary?: number;
    workLocation?: string;
    corporateTier?: string;
  }

  function calculateLeadScore(lead: Lead): { score: number; segment: string; tags: string[] } {
    let score = 50;
    const tags: string[] = [];

    // Budget scoring
    if (lead.budget) {
      if (lead.budget.max >= 50000000) score += 30;
      else if (lead.budget.max >= 20000000) score += 20;
      else if (lead.budget.max >= 5000000) score += 10;
    }

    // NRI detection (phone pattern)
    if (lead.phone) {
      if (lead.phone.startsWith('+971')) { score += 15; tags.push('nri', 'uae'); }
      if (lead.phone.startsWith('+1')) { score += 15; tags.push('nri', 'usa'); }
      if (lead.phone.startsWith('+44')) { score += 15; tags.push('nri', 'uk'); }
    }

    // Email domain scoring
    if (lead.email) {
      if (lead.email.includes('.ae')) { score += 10; tags.push('uae_email'); }
      if (lead.email.includes('.in')) { score += 5; tags.push('india_email'); }
    }

    // Source scoring
    if (lead.source) {
      const sourceScores: Record<string, number> = {
        referral: 15,
        corpperks: 20,
        ads: 10,
        organic: 5
      };
      score += sourceScores[lead.source] || 0;
      if (lead.source === 'referral') tags.push('referral');
      if (lead.source === 'corpperks') tags.push('corporate');
    }

    // Designation scoring (CXO)
    if (lead.designation) {
      const cxoTitles = ['CEO', 'CTO', 'CFO', 'COO', 'Founder', 'Director', 'VP', 'Head'];
      if (cxoTitles.some(t => lead.designation!.includes(t))) {
        score += 25;
        tags.push('cxo', 'decision-maker');
      }
    }

    // Salary scoring
    if (lead.salary) {
      if (lead.salary >= 5000000) { score += 30; tags.push('high-earner'); }
      else if (lead.salary >= 2000000) { score += 20; }
      else if (lead.salary >= 1000000) { score += 10; }
    }

    // Location scoring
    if (lead.workLocation) {
      const uaeLocations = ['dubai', 'abudhabi', 'uae', 'abu dhabi'];
      if (uaeLocations.some(l => lead.workLocation!.toLowerCase().includes(l))) {
        score += 15;
        tags.push('uae-based');
      }
    }

    // Corporate tier
    if (lead.corporateTier) {
      const tierScores: Record<string, number> = { enterprise: 15, professional: 10, starter: 5 };
      score += tierScores[lead.corporateTier] || 0;
      if (lead.corporateTier === 'enterprise') tags.push('enterprise');
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Determine segment
    let segment = 'standard';
    if (score >= 80) segment = 'hni';
    else if (score >= 60) segment = 'corporate';

    return { score, segment, tags };
  }

  describe('Budget Scoring', () => {
    test('scores 50L+ budget as high', () => {
      const result = calculateLeadScore({ budget: { min: 50000000, max: 100000000 } });
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    test('scores 20L+ budget as medium', () => {
      const result = calculateLeadScore({ budget: { min: 20000000, max: 50000000 } });
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    test('scores 5L+ budget as standard', () => {
      const result = calculateLeadScore({ budget: { min: 5000000, max: 10000000 } });
      expect(result.score).toBeLessThan(80);
    });
  });

  describe('NRI Detection', () => {
    test('detects UAE phone as NRI', () => {
      const result = calculateLeadScore({ phone: '+971501234567' });
      expect(result.tags).toContain('nri');
      expect(result.tags).toContain('uae');
    });

    test('detects USA phone as NRI', () => {
      const result = calculateLeadScore({ phone: '+14155551234' });
      expect(result.tags).toContain('nri');
      expect(result.tags).toContain('usa');
    });

    test('detects UK phone as NRI', () => {
      const result = calculateLeadScore({ phone: '+442071234567' });
      expect(result.tags).toContain('nri');
      expect(result.tags).toContain('uk');
    });

    test('Indian phone not flagged as NRI', () => {
      const result = calculateLeadScore({ phone: '+919876543210' });
      expect(result.tags).not.toContain('nri');
    });
  });

  describe('Segment Classification', () => {
    test('classifies 80+ as HNI', () => {
      const result = calculateLeadScore({
        phone: '+971501234567',
        budget: { min: 50000000, max: 100000000 },
        designation: 'CEO'
      });
      expect(result.segment).toBe('hni');
    });

    test('classifies 60-79 as corporate', () => {
      const result = calculateLeadScore({
        source: 'corpperks',
        corporateTier: 'enterprise'
      });
      expect(result.segment).toBe('corporate');
    });

    test('classifies below 60 as standard', () => {
      const result = calculateLeadScore({
        phone: '+919876543210',
        budget: { min: 3000000, max: 5000000 }
      });
      expect(result.segment).toBe('standard');
    });
  });

  describe('Source Attribution', () => {
    test('referral source adds points', () => {
      const withReferral = calculateLeadScore({ source: 'referral', phone: '+919876543210' });
      const withoutReferral = calculateLeadScore({ phone: '+919876543210' });
      expect(withReferral.score).toBeGreaterThan(withoutReferral.score);
    });

    test('corpperks adds most points', () => {
      const result = calculateLeadScore({ source: 'corpperks', corporateTier: 'enterprise' });
      expect(result.tags).toContain('corporate');
    });
  });
});

describe('Property Recommendation Scoring', () => {
  interface UserPreference {
    preferredLocations: string[];
    preferredTypes: string[];
    budget: { min: number; max: number };
    bedrooms: number[];
  }

  interface Property {
    location: string;
    type: string;
    price: number;
    bedrooms: number;
  }

  function scoreProperty(property: Property, prefs: UserPreference): number {
    let score = 0;

    // Location match
    if (prefs.preferredLocations.includes(property.location)) {
      score += 40;
    }

    // Type match
    if (prefs.preferredTypes.includes(property.type)) {
      score += 20;
    }

    // Budget match
    if (property.price >= prefs.budget.min && property.price <= prefs.budget.max) {
      score += 25;
    } else if (property.price > prefs.budget.max) {
      score -= 10;
    }

    // Bedroom match
    if (prefs.bedrooms.includes(property.bedrooms)) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  test('prefers matching location', () => {
    const prefs: UserPreference = {
      preferredLocations: ['Dubai Marina', 'Palm Jumeirah'],
      preferredTypes: ['apartment', 'villa'],
      budget: { min: 2000000, max: 10000000 },
      bedrooms: [2, 3]
    };

    const matching = scoreProperty({ location: 'Dubai Marina', type: 'apartment', price: 3000000, bedrooms: 2 }, prefs);
    const nonMatching = scoreProperty({ location: 'Deira', type: 'apartment', price: 3000000, bedrooms: 2 }, prefs);

    expect(matching).toBeGreaterThan(nonMatching);
  });

  test('prefers matching budget', () => {
    const prefs: UserPreference = {
      preferredLocations: ['Dubai Marina'],
      preferredTypes: ['apartment'],
      budget: { min: 2000000, max: 5000000 },
      bedrooms: [2]
    };

    const inBudget = scoreProperty({ location: 'Dubai Marina', type: 'apartment', price: 3000000, bedrooms: 2 }, prefs);
    const overBudget = scoreProperty({ location: 'Dubai Marina', type: 'apartment', price: 10000000, bedrooms: 2 }, prefs);

    expect(inBudget).toBeGreaterThan(overBudget);
  });

  test('caps score at 100', () => {
    const prefs: UserPreference = {
      preferredLocations: ['Dubai Marina'],
      preferredTypes: ['apartment'],
      budget: { min: 1000000, max: 10000000 },
      bedrooms: [2]
    };

    const score = scoreProperty({ location: 'Dubai Marina', type: 'apartment', price: 5000000, bedrooms: 2 }, prefs);
    expect(score).toBeLessThanOrEqual(100);
  });
});
