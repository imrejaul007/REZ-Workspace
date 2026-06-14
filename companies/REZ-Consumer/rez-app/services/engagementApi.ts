/**
 * ENGAGEMENT PLATFORM API SERVICE
 * Integration with REZ Engagement Platform
 *
 * Service: REZ-engagement-platform
 * URL: https://REZ-engagement-platform.onrender.com
 *
 * Features:
 * - Loyalty programs
 * - Offers & deals
 * - Referral system
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  points: number;
  tier: string;
  benefits: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'cashback' | 'reward';
  value: number;
  minOrder?: number;
  expiresAt: string;
}

export interface Referral {
  id: string;
  code: string;
  status: 'pending' | 'completed' | 'rewarded';
  refereeId?: string;
  rewardEarned?: number;
}

/**
 * Get loyalty program
 */
export async function getLoyaltyProgram(): Promise<ApiResponse<LoyaltyProgram>> {
  try {
    return await apiClient.get('/engagement/loyalty');
  } catch (error) {
    logger.error('engagementApi.getLoyalty', { error });
    throw error;
  }
}

/**
 * Get points balance
 */
export async function getPointsBalance(): Promise<ApiResponse<{ points: number; value: number }>> {
  try {
    return await apiClient.get('/engagement/points/balance');
  } catch (error) {
    logger.error('engagementApi.getPoints', { error });
    throw error;
  }
}

/**
 * Get available offers
 */
export async function getOffers(params?: { type?: string; page?: number }): Promise<ApiResponse<{ offers: Offer[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/engagement/offers${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('engagementApi.getOffers', { error });
    throw error;
  }
}

/**
 * Claim offer
 */
export async function claimOffer(offerId: string): Promise<ApiResponse<{ success: boolean; code?: string }>> {
  try {
    return await apiClient.post(`/engagement/offers/${offerId}/claim`, {});
  } catch (error) {
    logger.error('engagementApi.claimOffer', { offerId, error });
    throw error;
  }
}

/**
 * Get referral code
 */
export async function getReferralCode(): Promise<ApiResponse<Referral>> {
  try {
    return await apiClient.get('/engagement/referral/code');
  } catch (error) {
    logger.error('engagementApi.getReferralCode', { error });
    throw error;
  }
}

/**
 * Get referrals
 */
export async function getReferrals(): Promise<ApiResponse<Referral[]>> {
  try {
    return await apiClient.get('/engagement/referrals');
  } catch (error) {
    logger.error('engagementApi.getReferrals', { error });
    throw error;
  }
}

/**
 * Apply referral code
 */
export async function applyReferralCode(code: string): Promise<ApiResponse<{ success: boolean; reward?: number }>> {
  try {
    return await apiClient.post('/engagement/referral/apply', { code });
  } catch (error) {
    logger.error('engagementApi.applyReferral', { code, error });
    throw error;
  }
}

export default {
  getLoyaltyProgram,
  getPointsBalance,
  getOffers,
  claimOffer,
  getReferralCode,
  getReferrals,
  applyReferralCode,
};
