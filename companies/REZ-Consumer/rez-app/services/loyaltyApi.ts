// Loyalty Points & Rewards API Service
// Handles loyalty program operations
//
// CV-31 FIX: LoyaltyTransaction is now canonical from types/transactions.ts.
// PointsTransaction is kept as a type alias for backward compatibility.

import apiClient, { ApiResponse } from './apiClient';
import type { LoyaltyTransaction } from '@/types/transactions';
export type { LoyaltyTransaction } from '@/types/transactions';
export type { LoyaltyTransaction as PointsTransaction } from '@/types/transactions';

export interface LoyaltyPoints {
  currentPoints: number;
  // CV-14 FIX: lowercase tier values aligned with canonical LoyaltyTier enum.
  // 'diamond' added to match backend — canonical also updated with DIAMOND.
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  nextTier: string;
  pointsToNextTier: number;
  lifetimePoints: number;
  expiringPoints: number;
  expiryDate: string;
}

export interface Reward {
  _id: string;
  title: string;
  description: string;
  points: number;
  value: number;
  icon: string;
  category: 'voucher' | 'discount' | 'cashback' | 'freebie';
  available: boolean;
  expiryDate?: string;
  termsAndConditions?: string[];
}

export interface LoyaltyStats {
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  rewardsRedeemed: number;
  tier: string;
  tierBenefits: string[];
}

// Homepage Loyalty Section Types
export interface LoyaltyHubStats {
  activeBrands: number;
  streaks: number;
  unlocked: number;
  tiers: number;
}

export interface FeaturedProduct {
  productId: string;
  name: string;
  image: string;
  originalPrice: number;
  sellingPrice: number;
  savings: number;
  cashbackCoins: number;
  storeName: string;
  storeId: string;
}

export interface HomepageLoyaltySummary {
  loyaltyHub: LoyaltyHubStats | null;
  featuredLockProduct: FeaturedProduct | null;
  trendingService: FeaturedProduct | null;
}

export interface RedeemRewardRequest {
  rewardId: string;
  points: number;
}

export interface RedeemRewardResponse {
  success: boolean;
  message: string;
  newBalance: number;
  voucher?: {
    code: string;
    expiryDate: string;
    value: number;
  };
}

class LoyaltyApiService {
  private baseUrl = '/loyalty';

  /**
   * Get current loyalty points balance and tier info
   */
  async getPoints(): Promise<ApiResponse<LoyaltyPoints>> {

    return apiClient.get<unknown>(`${this.baseUrl}/points/balance`);
  }

  /**
   * Get loyalty statistics
   */
  async getStats(): Promise<ApiResponse<LoyaltyStats>> {

    return apiClient.get<unknown>(`${this.baseUrl}/tier`);
  }

  /**
   * Get available rewards
   */
  async getRewards(category?: string): Promise<ApiResponse<{ rewards: Reward[]; total: number }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/catalog`, category ? { category } : undefined);
  }

  /**
   * Get reward by ID
   */
  async getRewardById(rewardId: string): Promise<ApiResponse<{ reward: Reward }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/rewards/${rewardId}`);
  }

  /**
   * Redeem a reward
   */
  async redeemReward(data: RedeemRewardRequest): Promise<ApiResponse<RedeemRewardResponse>> {

    return apiClient.post<unknown>(`${this.baseUrl}/redeem`, data as unknown);
  }

  /**
   * Get points transaction history
   */
  async getTransactions(filters?: {
    type?: 'earned' | 'redeemed' | 'expired' | 'adjusted';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ transactions: LoyaltyTransaction[]; total: number; hasMore: boolean }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/points/history`, filters);
  }

  /**
   * Get tier information and benefits
   */
  async getTierInfo(): Promise<ApiResponse<{
    currentTier: string;
    nextTier: string;
    pointsToNextTier: number;
    benefits: string[];
    nextTierBenefits: string[];
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/tier`);
  }

  /**
   * Get points earning opportunities
   */
  async getEarningOpportunities(): Promise<ApiResponse<{
    opportunities: Array<{
      id: string;
      title: string;
      description: string;
      points: number;
      icon: string;
      action: string;
    }>;
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/earn-points`);
  }

  /**
   * Check if user can redeem reward
   */
  async canRedeemReward(rewardId: string): Promise<ApiResponse<{
    canRedeem: boolean;
    reason?: string;
    pointsNeeded?: number;
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/rewards/${rewardId}/can-redeem`);
  }

  /**
   * Get user's redeemed rewards/vouchers
   */
  async getRedeemedRewards(status?: 'active' | 'used' | 'expired'): Promise<ApiResponse<{
    vouchers: Array<{
      _id: string;
      reward: Reward;
      code: string;
      value: number;
      status: string;
      redeemedAt: string;
      expiryDate: string;
      usedAt?: string;
    }>;
    total: number;
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/redemptions`, status ? { status } : undefined);
  }

  /**
   * Get homepage loyalty section summary
   * Includes loyalty hub stats + featured products/services based on user location
   */
  async getHomepageSummary(latitude?: number, longitude?: number): Promise<ApiResponse<HomepageLoyaltySummary>> {
    const params: Record<string, unknown> = {};
    if (latitude !== undefined) params.latitude = latitude;
    if (longitude !== undefined) params.longitude = longitude;

    return apiClient.get<unknown>(`${this.baseUrl}/homepage-summary`, Object.keys(params).length > 0 ? params : undefined);
  }
}

// Export singleton instance
const loyaltyApi = new LoyaltyApiService();
export default loyaltyApi;
