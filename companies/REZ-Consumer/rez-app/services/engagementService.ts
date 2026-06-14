/**
 * Engagement Service
 * Integration with REZ Media engagement platform
 *
 * Features:
 * - Loyalty points
 * - Offers and deals
 * - Badges and achievements
 * - Streaks
 * - Referrals
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

// Points & Rewards
export interface LoyaltyProfile {
  userId: string;
  points: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
  nextTier: { name: string; pointsNeeded: number };
  benefits: string[];
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  amount: number;
  balance: number;
  description: string;
  orderId?: string;
  expiresAt?: string;
  createdAt: string;
}

// Badges & Achievements
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'order' | 'spending' | 'exploration' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  progress?: { current: number; target: number };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: Badge;
  unlockedAt?: string;
  reward?: { type: 'points' | 'voucher' | 'badge'; value: number };
}

// Streaks
export interface Streak {
  userId: string;
  type: 'order' | 'review' | 'checkin' | 'referral';
  currentCount: number;
  longestCount: number;
  lastActivity: string;
  isActive: boolean;
  rewards: StreakReward[];
}

export interface StreakReward {
  day: number;
  reward: { type: 'points' | 'discount' | 'freebie'; value: number };
  unlockedAt?: string;
}

// Offers
export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'cashback' | 'freebie' | 'bogo' | 'points_multiplier';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  applicableStores?: string[];
  applicableCategories?: string[];
  validUntil: string;
  terms: string[];
}

export interface UserOffer {
  offerId: string;
  status: 'available' | 'used' | 'expired';
  claimedAt?: string;
  usedAt?: string;
}

// Referrals
export interface ReferralProgram {
  userId: string;
  referralCode: string;
  shareUrl: string;
  stats: {
    totalReferrals: number;
    successfulReferrals: number;
    pointsEarned: number;
  };
  rewards: {
    referrer: { type: 'points' | 'voucher'; value: number };
    referee: { type: 'points' | 'voucher'; value: number };
  };
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const ENGAGEMENT_SERVICE_URL = process.env.EXPO_PUBLIC_ENGAGEMENT_SERVICE_URL || 'https://REZ-engagement-platform.onrender.com';
const ENGAGEMENT_API_VERSION = 'v1';
const ENGAGEMENT_BASE_URL = `${ENGAGEMENT_SERVICE_URL}/api/${ENGAGEMENT_API_VERSION}`;

// ============================================================================
// POINTS & LOYALTY
// ============================================================================

/**
 * Get user loyalty profile
 */
export async function getLoyaltyProfile(
  userId: string
): Promise<ApiResponse<LoyaltyProfile>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get loyalty profile:', error);
    return { success: false, error: 'Failed to load loyalty profile' };
  }
}

/**
 * Get points transaction history
 */
export async function getPointsHistory(
  userId: string,
  limit = 20
): Promise<ApiResponse<PointsTransaction[]>> {
  try {
    const response = await apiClient.get(
      `${ENGAGEMENT_BASE_URL}/loyalty/${userId}/transactions?limit=${limit}`
    );
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get points history:', error);
    return { success: false, error: 'Failed to load points history' };
  }
}

/**
 * Earn points for an action
 */
export async function earnPoints(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<ApiResponse<{ pointsEarned: number; newBalance: number }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}/earn`, {
      action,
      metadata,
    });
    // @ts-ignore
    return response;
  } catch (error) {
    logger.debug('[Engagement] Points earning failed:', error);
    return { success: false, error: 'Failed to earn points' };
  }
}

/**
 * Redeem points
 */
export async function redeemPoints(
  userId: string,
  rewardId: string,
  points: number
): Promise<ApiResponse<{ success: boolean; voucherCode?: string }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/loyalty/${userId}/redeem`, {
      rewardId,
      points,
    });
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Points redemption failed:', error);
    return { success: false, error: 'Failed to redeem points' };
  }
}

// ============================================================================
// BADGES & ACHIEVEMENTS
// ============================================================================

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<ApiResponse<Badge[]>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/badges`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get badges:', error);
    return { success: false, error: 'Failed to load badges' };
  }
}

/**
 * Get user badges
 */
export async function getUserBadges(
  userId: string
): Promise<ApiResponse<Badge[]>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/users/${userId}/badges`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get user badges:', error);
    return { success: false, error: 'Failed to load user badges' };
  }
}

/**
 * Check and award badges for an action
 */
export async function checkBadgeProgress(
  userId: string,
  action: string
): Promise<ApiResponse<{ newBadges: Badge[]; achievements: Achievement[] }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/users/${userId}/badges/check`, {
      action,
    });
    // @ts-ignore
    return response;
  } catch (error) {
    logger.debug('[Engagement] Badge check failed:', error);
    return { success: false, error: 'Failed to check badges' };
  }
}

// ============================================================================
// STREAKS
// ============================================================================

/**
 * Get user streaks
 */
export async function getUserStreaks(
  userId: string
): Promise<ApiResponse<Streak[]>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/users/${userId}/streaks`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get streaks:', error);
    return { success: false, error: 'Failed to load streaks' };
  }
}

/**
 * Record streak activity
 */
export async function recordStreakActivity(
  userId: string,
  type: Streak['type']
): Promise<ApiResponse<{ streak: Streak; reward?: StreakReward }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/users/${userId}/streaks/record`, {
      type,
    });
    // @ts-ignore
    return response;
  } catch (error) {
    logger.debug('[Engagement] Streak recording failed:', error);
    return { success: false, error: 'Failed to record streak' };
  }
}

// ============================================================================
// OFFERS
// ============================================================================

/**
 * Get available offers for user
 */
export async function getAvailableOffers(
  userId?: string,
  filters?: { storeId?: string; category?: string }
): Promise<ApiResponse<Offer[]>> {
  try {
    let url = `${ENGAGEMENT_BASE_URL}/offers`;
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.category) params.append('category', filters.category);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await apiClient.get(url);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get offers:', error);
    return { success: false, error: 'Failed to load offers' };
  }
}

/**
 * Claim an offer
 */
export async function claimOffer(
  userId: string,
  offerId: string
): Promise<ApiResponse<{ claimed: boolean; voucherCode?: string }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/offers/${offerId}/claim`, {
      userId,
    });
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to claim offer:', error);
    return { success: false, error: 'Failed to claim offer' };
  }
}

// ============================================================================
// REFERRALS
// ============================================================================

/**
 * Get referral program info
 */
export async function getReferralProgram(
  userId: string
): Promise<ApiResponse<ReferralProgram>> {
  try {
    const response = await apiClient.get(`${ENGAGEMENT_BASE_URL}/users/${userId}/referral`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to get referral program:', error);
    return { success: false, error: 'Failed to load referral program' };
  }
}

/**
 * Apply referral code
 */
export async function applyReferralCode(
  userId: string,
  referralCode: string
): Promise<ApiResponse<{ success: boolean; bonusPoints?: number }>> {
  try {
    const response = await apiClient.post(`${ENGAGEMENT_BASE_URL}/referrals/apply`, {
      userId,
      code: referralCode,
    });
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Engagement] Failed to apply referral code:', error);
    return { success: false, error: 'Failed to apply referral code' };
  }
}
