// @ts-nocheck
/**
 * Engagement API Tests
 */

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import * as engagementApi from '@/services/engagementApi';
import apiClient from '@/services/apiClient';

describe('Engagement API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getLoyaltyProgram', () => {
    it('should fetch loyalty program', async () => {
      const mockProgram = {
        id: 'prog-1',
        name: 'REZ Rewards',
        description: 'Earn points',
        points: 500,
        tier: 'Gold',
        benefits: ['Free delivery'],
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ success: true, data: mockProgram });

      const result = await engagementApi.getLoyaltyProgram();
      expect(result.success).toBe(true);
      expect(result.data?.tier).toBe('Gold');
    });
  });

  describe('getPointsBalance', () => {
    it('should fetch points balance', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ success: true, data: { points: 5000, value: 250 } });
      const result = await engagementApi.getPointsBalance();
      expect(result.data?.points).toBe(5000);
    });
  });

  describe('applyReferralCode', () => {
    it('should apply referral code', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ success: true, data: { success: true, reward: 100 } });
      const result = await engagementApi.applyReferralCode('REZFRIEND');
      expect(result.data?.reward).toBe(100);
    });
  });
});
