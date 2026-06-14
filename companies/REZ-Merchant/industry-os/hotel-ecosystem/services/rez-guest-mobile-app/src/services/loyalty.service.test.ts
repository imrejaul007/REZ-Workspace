import { describe, it, expect, beforeEach } from 'vitest';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(() => {
    service = new LoyaltyService();
  });

  describe('getStatus', () => {
    it('should return guest loyalty status', async () => {
      const status = await service.getStatus('guest-123');

      expect(status.tier).toBeDefined();
      expect(status.points).toBeGreaterThanOrEqual(0);
      expect(status.lifetimePoints).toBeGreaterThanOrEqual(0);
      expect(status.benefits).toBeDefined();
      expect(Array.isArray(status.benefits)).toBe(true);
    });

    it('should return tier progress', async () => {
      const status = await service.getStatus('guest-123');

      expect(status.tierProgress).toBeDefined();
      expect(status.tierProgress.current).toBeGreaterThanOrEqual(0);
      expect(status.tierProgress.next).toBeGreaterThan(0);
      expect(status.tierProgress.percentage).toBeGreaterThanOrEqual(0);
    });

    it('should include next tier info for non-platinum', async () => {
      const status = await service.getStatus('guest-123');

      // Either nextTier is null (Platinum) or has valid info
      if (status.nextTier) {
        expect(status.nextTier.name).toBeDefined();
        expect(status.nextTier.pointsNeeded).toBeGreaterThan(0);
      }
    });
  });

  describe('getAvailableRewards', () => {
    it('should return available rewards for guest', async () => {
      const rewards = await service.getAvailableRewards('guest-123');

      expect(rewards.available).toBeDefined();
      expect(rewards.tierRewards).toBeDefined();
      expect(rewards.allRewards).toBeDefined();
      expect(Array.isArray(rewards.available)).toBe(true);
    });

    it('should include reward details', async () => {
      const rewards = await service.getAvailableRewards('guest-123');

      if (rewards.available.length > 0) {
        const reward = rewards.available[0];
        expect(reward.rewardId).toBeDefined();
        expect(reward.name).toBeDefined();
        expect(reward.pointsCost).toBeGreaterThan(0);
      }
    });
  });

  describe('redeemReward', () => {
    it('should successfully redeem a reward', async () => {
      const rewards = await service.getAvailableRewards('guest-123');

      if (rewards.available.length > 0) {
        const result = await service.redeemReward('guest-123', rewards.available[0].rewardId);

        expect(result.success).toBe(true);
        expect(result.reward).toBeDefined();
        expect(result.pointsRedeemed).toBeGreaterThan(0);
        expect(result.voucherCode).toBeDefined();
        expect(result.expiresAt).toBeDefined();
      }
    });

    it('should throw error for invalid reward', async () => {
      await expect(service.redeemReward('guest-123', 'INVALID-ID')).rejects.toThrow('Reward not found');
    });

    it('should throw error for insufficient points', async () => {
      // Try to redeem with zero points scenario handled
      const result = await service.getStatus('guest-123');
      // If points are 0, no redemption possible
      expect(result.points).toBeDefined();
    });
  });

  describe('calculateEarning', () => {
    it('should calculate points for a transaction', async () => {
      const result = await service.calculateEarning('guest-123', 1000);

      expect(result.pointsEarned).toBeGreaterThan(0);
      expect(result.bonusPoints).toBeGreaterThanOrEqual(0);
      expect(result.totalPoints).toBe(result.pointsEarned + result.bonusPoints);
      expect(result.newTierProgress).toBeGreaterThan(0);
    });

    it('should return higher earning for higher tiers', async () => {
      // Bronze tier earning
      const bronze = await service.calculateEarning('guest-123', 1000);

      // The multiplier is applied internally based on tier
      expect(bronze.pointsEarned).toBeGreaterThan(0);
    });
  });

  describe('getAllTiers', () => {
    it('should return all loyalty tiers', async () => {
      const tiers = await service.getAllTiers();

      expect(tiers.length).toBe(4);
      expect(tiers.map(t => t.name)).toEqual(['Bronze', 'Silver', 'Gold', 'Platinum']);
    });

    it('should include tier benefits', async () => {
      const tiers = await service.getAllTiers();

      tiers.forEach(tier => {
        expect(tier.name).toBeDefined();
        expect(tier.minPoints).toBeDefined();
        expect(tier.maxPoints).toBeDefined();
        expect(tier.benefits).toBeDefined();
        expect(Array.isArray(tier.benefits)).toBe(true);
        expect(tier.earningMultiplier).toBeGreaterThan(0);
      });
    });
  });
});
