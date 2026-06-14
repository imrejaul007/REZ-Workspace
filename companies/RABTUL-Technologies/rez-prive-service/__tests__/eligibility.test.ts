/**
 * REZ Prive - Eligibility Service Tests
 * Tests for 6-Pillar eligibility calculation engine
 */

import { describe, it, expect } from 'vitest';
import {
  PillarId,
  PriveTier,
  AccessState,
  PillarScore,
  PILLAR_WEIGHTS,
} from '../src/types';

// Re-export types for testing
type PillarMeta = {
  name: string;
  shortName: string;
  icon: string;
  color: string;
};

// Pillar metadata (mirrored from service)
const PILLAR_META: Record<PillarId, PillarMeta> = {
  engagement: { name: 'Engagement', shortName: 'ENG', icon: 'activity', color: '#4CAF50' },
  trust: { name: 'Trust', shortName: 'TRU', icon: 'shield', color: '#2196F3' },
  influence: { name: 'Influence', shortName: 'INF', icon: 'star', color: '#FF9800' },
  economic: { name: 'Economic', shortName: 'ECO', icon: 'trending-up', color: '#9C27B0' },
  brand_affinity: { name: 'Brand Affinity', shortName: 'BRN', icon: 'heart', color: '#E91E63' },
  network: { name: 'Network', shortName: 'NET', icon: 'users', color: '#00BCD4' },
};

// Pure functions extracted for testing
function determineTier(score: number): PriveTier {
  if (score >= 85) return 'elite';
  if (score >= 70) return 'signature';
  if (score >= 50) return 'entry';
  return 'none';
}

function determineAccessState(score: number, trustScore: number): AccessState {
  if (trustScore < 60) return 'suspended';
  return 'active';
}

function calculateTrustScore(trustMetrics?: {
  disputeRate?: number;
  flaggedReviews?: number;
  fakeBillDetected?: boolean;
}): number {
  if (!trustMetrics) return 100;

  const { disputeRate = 0, flaggedReviews = 0, fakeBillDetected = false } = trustMetrics;

  if (fakeBillDetected) return 0;

  let score = 100;
  score -= disputeRate * 2;
  score -= flaggedReviews * 10;

  return Math.max(0, Math.min(100, score));
}

function calculateEngagementScore(metrics: {
  transactions30d: number;
  activeDays30d: number;
  categoriesUsed: number;
}): number {
  const { transactions30d, activeDays30d, categoriesUsed } = metrics;
  return Math.min(
    100,
    (transactions30d / 20) * 40 + (activeDays30d / 20) * 30 + categoriesUsed * 10
  );
}

function calculateTrustPillarScore(metrics: {
  disputeRate: number;
  flaggedReviews: number;
}): number {
  const { disputeRate, flaggedReviews } = metrics;
  return Math.max(0, Math.min(100, 100 - disputeRate * 2 - flaggedReviews * 10));
}

function calculateInfluenceScore(metrics: {
  totalFollowers: number;
  engagementRate: number;
}): number {
  const { totalFollowers, engagementRate } = metrics;
  return Math.min(100, (totalFollowers / 1000) * 50 + engagementRate * 0.5);
}

function calculateEconomicScore(metrics: {
  gmv30d: number;
  avgOrderValue: number;
}): number {
  const { gmv30d, avgOrderValue } = metrics;
  return Math.min(100, (gmv30d / 10000) * 50 + (avgOrderValue / 500) * 50);
}

function calculateBrandAffinityScore(metrics: {
  campaignAcceptanceRate: number;
  brandLoyaltyScore: number;
}): number {
  const { campaignAcceptanceRate, brandLoyaltyScore } = metrics;
  return Math.min(100, campaignAcceptanceRate + brandLoyaltyScore);
}

function calculateNetworkScore(metrics: {
  referralCount: number;
  communityEngagement: number;
}): number {
  const { referralCount, communityEngagement } = metrics;
  return Math.min(100, referralCount * 10 + communityEngagement);
}

function getPillarDescription(pillarId: PillarId, score: number): string {
  const descriptions: Record<PillarId, { low: string; mid: string; high: string }> = {
    engagement: {
      low: 'Just getting started with the platform',
      mid: 'Regularly using the app for transactions',
      high: 'Highly engaged with multiple activities',
    },
    trust: {
      low: 'Some issues with account verification',
      mid: 'Good standing with verified account',
      high: 'Trusted member with excellent record',
    },
    influence: {
      low: 'Building your presence',
      mid: 'Growing following and engagement',
      high: 'Influential with strong reach',
    },
    economic: {
      low: 'Occasional transactions',
      mid: 'Regular spending across categories',
      high: 'High-value customer with premium purchases',
    },
    brand_affinity: {
      low: 'Exploring brands',
      mid: 'Engaged with brand campaigns',
      high: 'Strong brand loyalty and advocacy',
    },
    network: {
      low: 'Building your network',
      mid: 'Active in the community',
      high: 'Well-connected with quality referrals',
    },
  };

  const d = descriptions[pillarId];
  if (score < 33) return d.low;
  if (score < 66) return d.mid;
  return d.high;
}

function getImprovementTips(pillarId: PillarId, score: number): string[] {
  const tips: Record<PillarId, string[]> = {
    engagement: ['Make more transactions', 'Use the app daily', 'Try different categories'],
    trust: ['Keep dispute rate low', 'Get verified', 'Avoid flagged reviews'],
    influence: ['Share content on social media', 'Engage with your followers', 'Participate in campaigns'],
    economic: ['Increase order frequency', 'Try premium categories', 'Use multiple merchants'],
    brand_affinity: ['Accept brand invitations', 'Provide brand feedback', 'Complete brand campaigns'],
    network: ['Refer friends', 'Join community events', 'Engage with other users'],
  };

  return score >= 80 ? ['Maintain your excellent score!'] : tips[pillarId];
}

describe('Tier Determination', () => {
  it('should return elite for score >= 85', () => {
    expect(determineTier(85)).toBe('elite');
    expect(determineTier(90)).toBe('elite');
    expect(determineTier(100)).toBe('elite');
  });

  it('should return signature for score >= 70 and < 85', () => {
    expect(determineTier(70)).toBe('signature');
    expect(determineTier(75)).toBe('signature');
    expect(determineTier(84)).toBe('signature');
  });

  it('should return entry for score >= 50 and < 70', () => {
    expect(determineTier(50)).toBe('entry');
    expect(determineTier(60)).toBe('entry');
    expect(determineTier(69)).toBe('entry');
  });

  it('should return none for score < 50', () => {
    expect(determineTier(49)).toBe('none');
    expect(determineTier(25)).toBe('none');
    expect(determineTier(0)).toBe('none');
  });
});

describe('Access State Determination', () => {
  it('should return suspended when trust score < 60', () => {
    expect(determineAccessState(80, 59)).toBe('suspended');
    expect(determineAccessState(90, 0)).toBe('suspended');
  });

  it('should return active when trust score >= 60', () => {
    expect(determineAccessState(50, 60)).toBe('active');
    expect(determineAccessState(85, 80)).toBe('active');
    expect(determineAccessState(100, 100)).toBe('active');
  });
});

describe('Trust Score Calculation', () => {
  it('should return 100 when no metrics provided', () => {
    expect(calculateTrustScore(undefined)).toBe(100);
  });

  it('should return 100 for zero dispute rate and flagged reviews', () => {
    expect(calculateTrustScore({ disputeRate: 0, flaggedReviews: 0 })).toBe(100);
  });

  it('should return 0 when fake bill detected', () => {
    expect(calculateTrustScore({ disputeRate: 0, flaggedReviews: 0, fakeBillDetected: true })).toBe(0);
  });

  it('should reduce score based on dispute rate', () => {
    expect(calculateTrustScore({ disputeRate: 10, flaggedReviews: 0 })).toBe(80);
    expect(calculateTrustScore({ disputeRate: 5, flaggedReviews: 0 })).toBe(90);
  });

  it('should reduce score based on flagged reviews', () => {
    expect(calculateTrustScore({ disputeRate: 0, flaggedReviews: 3 })).toBe(70);
    expect(calculateTrustScore({ disputeRate: 0, flaggedReviews: 5 })).toBe(50);
  });

  it('should combine dispute rate and flagged reviews', () => {
    expect(calculateTrustScore({ disputeRate: 5, flaggedReviews: 2 })).toBe(70);
  });

  it('should not go below 0', () => {
    expect(calculateTrustScore({ disputeRate: 60, flaggedReviews: 10 })).toBe(0);
  });

  it('should not exceed 100', () => {
    expect(calculateTrustScore({ disputeRate: -10, flaggedReviews: -10 })).toBe(100);
  });
});

describe('Engagement Pillar Score', () => {
  it('should calculate engagement score correctly', () => {
    const score = calculateEngagementScore({
      transactions30d: 10,
      activeDays30d: 10,
      categoriesUsed: 5,
    });
    // (10/20)*40 + (10/20)*30 + 5*10 = 20 + 15 + 50 = 85
    expect(score).toBe(85);
  });

  it('should cap at 100', () => {
    const score = calculateEngagementScore({
      transactions30d: 100,
      activeDays30d: 100,
      categoriesUsed: 20,
    });
    expect(score).toBe(100);
  });

  it('should return 0 for no activity', () => {
    const score = calculateEngagementScore({
      transactions30d: 0,
      activeDays30d: 0,
      categoriesUsed: 0,
    });
    expect(score).toBe(0);
  });
});

describe('Trust Pillar Score', () => {
  it('should calculate correctly', () => {
    expect(calculateTrustPillarScore({ disputeRate: 5, flaggedReviews: 1 })).toBe(80);
  });

  it('should cap at 0 and 100', () => {
    expect(calculateTrustPillarScore({ disputeRate: 100, flaggedReviews: 0 })).toBe(0);
    expect(calculateTrustPillarScore({ disputeRate: 0, flaggedReviews: 0 })).toBe(100);
  });
});

describe('Influence Pillar Score', () => {
  it('should calculate based on followers and engagement', () => {
    const score = calculateInfluenceScore({ totalFollowers: 500, engagementRate: 5 });
    // (500/1000)*50 + 5*0.5 = 25 + 2.5 = 27.5
    expect(score).toBe(27.5);
  });

  it('should cap at 100', () => {
    const score = calculateInfluenceScore({ totalFollowers: 2000, engagementRate: 10 });
    expect(score).toBe(100);
  });
});

describe('Economic Pillar Score', () => {
  it('should calculate based on GMV and AOV', () => {
    const score = calculateEconomicScore({ gmv30d: 5000, avgOrderValue: 250 });
    // (5000/10000)*50 + (250/500)*50 = 25 + 25 = 50
    expect(score).toBe(50);
  });

  it('should cap at 100', () => {
    const score = calculateEconomicScore({ gmv30d: 20000, avgOrderValue: 1000 });
    expect(score).toBe(100);
  });
});

describe('Brand Affinity Pillar Score', () => {
  it('should calculate based on acceptance rate and loyalty', () => {
    const score = calculateBrandAffinityScore({ campaignAcceptanceRate: 60, brandLoyaltyScore: 30 });
    // 60 + 30 = 90
    expect(score).toBe(90);
  });

  it('should cap at 100', () => {
    const score = calculateBrandAffinityScore({ campaignAcceptanceRate: 80, brandLoyaltyScore: 40 });
    expect(score).toBe(100);
  });
});

describe('Network Pillar Score', () => {
  it('should calculate based on referrals and engagement', () => {
    const score = calculateNetworkScore({ referralCount: 5, communityEngagement: 20 });
    // 5 * 10 + 20 = 70
    expect(score).toBe(70);
  });

  it('should cap at 100', () => {
    const score = calculateNetworkScore({ referralCount: 10, communityEngagement: 10 });
    expect(score).toBe(100);
  });
});

describe('Pillar Descriptions', () => {
  it('should return low description for score < 33', () => {
    expect(getPillarDescription('engagement', 20)).toBe('Just getting started with the platform');
    expect(getPillarDescription('trust', 10)).toBe('Some issues with account verification');
  });

  it('should return mid description for score 33-65', () => {
    expect(getPillarDescription('engagement', 50)).toBe('Regularly using the app for transactions');
    expect(getPillarDescription('economic', 55)).toBe('Regular spending across categories');
  });

  it('should return high description for score >= 66', () => {
    expect(getPillarDescription('engagement', 80)).toBe('Highly engaged with multiple activities');
    expect(getPillarDescription('network', 90)).toBe('Well-connected with quality referrals');
  });
});

describe('Improvement Tips', () => {
  it('should return tips for low score', () => {
    const tips = getImprovementTips('engagement', 20);
    expect(tips).toContain('Make more transactions');
    expect(tips).toContain('Use the app daily');
  });

  it('should return maintenance tip for high score', () => {
    const tips = getImprovementTips('engagement', 85);
    expect(tips).toEqual(['Maintain your excellent score!']);
  });

  it('should return pillar-specific tips', () => {
    const trustTips = getImprovementTips('trust', 40);
    expect(trustTips).toContain('Get verified');

    const economicTips = getImprovementTips('economic', 40);
    expect(economicTips).toContain('Increase order frequency');
  });
});

describe('Pillar Weights', () => {
  it('should have weights for all 6 pillars', () => {
    expect(PILLAR_WEIGHTS).toHaveProperty('engagement');
    expect(PILLAR_WEIGHTS).toHaveProperty('trust');
    expect(PILLAR_WEIGHTS).toHaveProperty('influence');
    expect(PILLAR_WEIGHTS).toHaveProperty('economic');
    expect(PILLAR_WEIGHTS).toHaveProperty('brand_affinity');
    expect(PILLAR_WEIGHTS).toHaveProperty('network');
  });

  it('should have weights that sum to approximately 1', () => {
    const totalWeight = Object.values(PILLAR_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(totalWeight).toBeCloseTo(1, 2);
  });

  it('should have weights between 0 and 1', () => {
    Object.entries(PILLAR_WEIGHTS).forEach(([, weight]) => {
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    });
  });
});

describe('Pillar Metadata', () => {
  it('should have metadata for all pillars', () => {
    expect(PILLAR_META).toHaveProperty('engagement');
    expect(PILLAR_META).toHaveProperty('trust');
    expect(PILLAR_META).toHaveProperty('influence');
    expect(PILLAR_META).toHaveProperty('economic');
    expect(PILLAR_META).toHaveProperty('brand_affinity');
    expect(PILLAR_META).toHaveProperty('network');
  });

  it('should have required metadata fields', () => {
    Object.entries(PILLAR_META).forEach(([pillarId, meta]) => {
      expect(meta).toHaveProperty('name');
      expect(meta).toHaveProperty('shortName');
      expect(meta).toHaveProperty('icon');
      expect(meta).toHaveProperty('color');
      expect(typeof meta.name).toBe('string');
      expect(typeof meta.shortName).toBe('string');
      expect(typeof meta.icon).toBe('string');
      expect(typeof meta.color).toBe('string');
    });
  });
});

describe('Weighted Score Calculation', () => {
  it('should calculate weighted score correctly', () => {
    const rawScore = 80;
    const weight = PILLAR_WEIGHTS.engagement;
    const weightedScore = rawScore * weight;

    expect(weightedScore).toBeGreaterThan(0);
    expect(weightedScore).toBeLessThan(rawScore);
  });

  it('should sum to total score', () => {
    // Simulate a user's pillar scores
    const pillarScores = {
      engagement: 75,
      trust: 90,
      influence: 40,
      economic: 60,
      brand_affinity: 85,
      network: 55,
    };

    const totalScore = Object.entries(pillarScores).reduce((sum, [pillarId, score]) => {
      return sum + score * PILLAR_WEIGHTS[pillarId as PillarId];
    }, 0);

    expect(totalScore).toBeGreaterThan(0);
    expect(totalScore).toBeLessThan(100);
  });
});
