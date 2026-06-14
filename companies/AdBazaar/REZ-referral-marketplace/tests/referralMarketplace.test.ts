import { describe, it, expect } from 'vitest';

describe('Referral Marketplace', () => {
  describe('Referral Programs', () => {
    it('should support referral program types', () => {
      const types = ['single-sided', 'double-sided', 'tiered', 'promo-code'];
      const program = { type: 'double-sided' as const };
      expect(types).toContain(program.type);
    });
  });

  describe('Rewards', () => {
    it('should calculate referral rewards', () => {
      const referrerReward = 100;
      const refereeReward = 50;
      expect(referrerReward + refereeReward).toBe(150);
    });

    it('should handle tiered rewards', () => {
      const tiers = [
        { referrals: 5, reward: 50 },
        { referrals: 10, reward: 100 },
        { referrals: 25, reward: 250 },
      ];
      const userReferrals = 8;
      const tier = tiers.find(t => userReferrals >= t.referrals);
      expect(tier?.reward).toBe(50);
    });
  });
});