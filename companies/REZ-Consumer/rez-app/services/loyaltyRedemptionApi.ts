// @ts-nocheck
/**
 * Loyalty Redemption API Service
 * Handles all loyalty redemption-related operations
 */

import apiClient, { ApiResponse } from './apiClient';
import {
  RewardItem,
  RedemptionRequest,
  RedemptionResponse,
  RedemptionHistory,
  PointBalance,
  PointTransaction,
  TierConfig,
  RewardCatalog,
  CatalogFilters,
  PointOptimization,
  PointForecast,
  PointGoal,
  PointChallenge,
  SpinWheelReward,
  ScratchCardReward,
  DailyCheckIn,
  Streak,
  PointTransfer,
  FamilyPool,
  PointExpiryNotification,
  MilestoneReward,
  AutoApplyRecommendation,
  RewardReservation,
} from '@/types/loyaltyRedemption.types';

class LoyaltyRedemptionApiService {
  private baseUrl = '/loyalty';

  // ==================== Reward Catalog ====================

  /**
   * Get rewards catalog with filters
   */
  async getRewardsCatalog(filters?: CatalogFilters): Promise<ApiResponse<RewardCatalog>> {

    return apiClient.get<unknown>(`${this.baseUrl}/catalog`, filters as unknown);
  }

  /**
   * Get featured rewards
   */
  async getFeaturedRewards(): Promise<ApiResponse<{ rewards: RewardItem[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/rewards/featured`);
  }

  /**
   * Get reward by ID
   */
  async getRewardById(rewardId: string): Promise<ApiResponse<{ reward: RewardItem }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/rewards/${rewardId}`);
  }

  /**
   * Search rewards
   */
  async searchRewards(query: string): Promise<ApiResponse<{ rewards: RewardItem[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/rewards/search`, { q: query });
  }

  // ==================== Point Balance ====================

  /**
   * Get current point balance and tier info
   */
  async getPointBalance(): Promise<ApiResponse<PointBalance>> {

    return apiClient.get<unknown>(`${this.baseUrl}/points/balance`);
  }

  /**
   * Get point transaction history
   */
  async getPointHistory(filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ transactions: PointTransaction[]; total: number; hasMore: boolean }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/points/history`, filters);
  }

  /**
   * Get point forecast
   */
  async getPointForecast(): Promise<ApiResponse<PointForecast>> {

    return apiClient.get<unknown>(`${this.baseUrl}/points/forecast`);
  }

  /**
   * Get points expiring soon
   */
  async getExpiringPoints(): Promise<ApiResponse<PointExpiryNotification>> {

    return apiClient.get<unknown>(`${this.baseUrl}/points/expiring`);
  }

  // ==================== Redemption ====================

  /**
   * Redeem a reward
   */
  async redeemReward(data: RedemptionRequest): Promise<ApiResponse<RedemptionResponse>> {

    return apiClient.post<unknown>(`${this.baseUrl}/redeem`, data as unknown);
  }

  /**
   * Reserve a reward (hold points temporarily)
   */
  async reserveReward(data: RedemptionRequest): Promise<ApiResponse<RewardReservation>> {

    return apiClient.post<unknown>(`${this.baseUrl}/reserve`, data as unknown);
  }

  /**
   * Cancel reward reservation
   */
  async cancelReservation(reservationId: string): Promise<ApiResponse<{ success: boolean }>> {

    return apiClient.delete<unknown>(`${this.baseUrl}/reserve/${reservationId}`);
  }

  /**
   * Get redemption history
   */
  async getRedemptionHistory(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<RedemptionHistory>> {

    return apiClient.get<unknown>(`${this.baseUrl}/redemptions`, filters);
  }

  /**
   * Get active vouchers/rewards
   */
  async getActiveRewards(): Promise<ApiResponse<{ rewards: unknown[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/my-rewards`, { status: 'active' });
  }

  /**
   * Use a redeemed voucher
   */
  async useVoucher(voucherId: string, orderId?: string): Promise<ApiResponse<{ success: boolean }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/vouchers/${voucherId}/use`, { orderId });
  }

  // ==================== Tier Benefits ====================

  /**
   * Get current tier information
   */
  async getTierInfo(): Promise<ApiResponse<TierConfig>> {

    return apiClient.get<unknown>(`${this.baseUrl}/tier`);
  }

  /**
   * Get all tier configurations
   */
  async getAllTiers(): Promise<ApiResponse<{ tiers: TierConfig[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/tiers`);
  }

  /**
   * Calculate tier discount for order
   */
  async calculateTierDiscount(orderAmount: number): Promise<ApiResponse<{
    discount: number;
    percentage: number;
    tier: string;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/tier/discount`, { orderAmount });
  }

  /**
   * Get tier benefits for user
   */
  async getTierBenefits(): Promise<ApiResponse<{
    currentBenefits: unknown[];
    nextTierBenefits: unknown[];
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/tier/benefits`);
  }

  // ==================== Smart Features ====================

  /**
   * Get point optimizer recommendations
   */
  async getPointOptimization(targetAmount?: number): Promise<ApiResponse<PointOptimization>> {

    return apiClient.post<unknown>(`${this.baseUrl}/optimize`, { targetAmount });
  }

  /**
   * Get auto-apply recommendations for checkout
   */
  async getAutoApplyRecommendations(
    orderAmount: number,
    storeId?: string
  ): Promise<ApiResponse<AutoApplyRecommendation>> {

    return apiClient.post<unknown>(`${this.baseUrl}/auto-apply`, { orderAmount, storeId });
  }

  /**
   * Auto-apply best rewards
   */
  async autoApplyRewards(orderId: string): Promise<ApiResponse<{
    appliedRewards: string[];
    totalDiscount: number;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/orders/${orderId}/auto-apply`);
  }

  // ==================== Goals & Challenges ====================

  /**
   * Get user point goals
   */
  async getPointGoals(): Promise<ApiResponse<{ goals: PointGoal[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/goals`);
  }

  /**
   * Create point goal
   */
  async createPointGoal(data: {
    targetPoints: number;
    targetRewardId?: string;
    deadline?: string;
  }): Promise<ApiResponse<PointGoal>> {

    return apiClient.post<unknown>(`${this.baseUrl}/goals`, data as unknown);
  }

  /**
   * Get active challenges
   */
  async getChallenges(): Promise<ApiResponse<{ challenges: PointChallenge[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/challenges`);
  }

  /**
   * Claim challenge reward
   */
  async claimChallenge(challengeId: string): Promise<ApiResponse<{
    points: number;
    reward?: RewardItem;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/challenges/${challengeId}/claim`);
  }

  // ==================== Gamification ====================

  /**
   * Spin the reward wheel
   */
  async spinWheel(): Promise<ApiResponse<{
    reward: SpinWheelReward;
    newBalance: number;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/games/spin-wheel`);
  }

  /**
   * Reveal scratch card
   */
  async revealScratchCard(cardId: string): Promise<ApiResponse<{
    reward: ScratchCardReward;
    newBalance: number;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/games/scratch-card/${cardId}/reveal`);
  }

  /**
   * Daily check-in
   */
  async dailyCheckIn(): Promise<ApiResponse<{
    day: number;
    points: number;
    streak: Streak;
    bonus?;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/games/check-in`);
  }

  /**
   * Get check-in status
   */
  async getCheckInStatus(): Promise<ApiResponse<{
    checkIns: DailyCheckIn[];
    streak: Streak;
    canCheckIn: boolean;
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/games/check-in/status`);
  }

  /**
   * Get available scratch cards
   */
  async getScratchCards(): Promise<ApiResponse<{ cards: unknown[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/games/scratch-cards`);
  }

  // ==================== Point Transfer & Pooling ====================

  /**
   * Transfer points to another user
   */
  async transferPoints(data: {
    toUserId: string;
    points: number;
    message?: string;
  }): Promise<ApiResponse<PointTransfer>> {

    return apiClient.post<unknown>(`${this.baseUrl}/transfer`, data as unknown);
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(): Promise<ApiResponse<{ transfers: PointTransfer[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/transfers`);
  }

  /**
   * Create family pool
   */
  async createFamilyPool(data: {
    name: string;
    memberIds: string[];
  }): Promise<ApiResponse<FamilyPool>> {

    return apiClient.post<unknown>(`${this.baseUrl}/family-pool`, data as unknown);
  }

  /**
   * Get family pool info
   */
  async getFamilyPool(): Promise<ApiResponse<FamilyPool>> {

    return apiClient.get<unknown>(`${this.baseUrl}/family-pool`);
  }

  /**
   * Contribute to family pool
   */
  async contributeToPool(points: number): Promise<ApiResponse<{ success: boolean }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/family-pool/contribute`, { points });
  }

  // ==================== Milestones ====================

  /**
   * Get milestone rewards
   */
  async getMilestones(): Promise<ApiResponse<{ milestones: MilestoneReward[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/milestones`);
  }

  /**
   * Claim milestone reward
   */
  async claimMilestone(milestoneId: string): Promise<ApiResponse<{
    points: number;
    bonus;
  }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/milestones/${milestoneId}/claim`);
  }

  // ==================== Special Events ====================

  /**
   * Get point multiplier events
   */
  async getMultiplierEvents(): Promise<ApiResponse<{ events: unknown[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/events/multipliers`);
  }

  /**
   * Get birthday bonus status
   */
  async getBirthdayBonus(): Promise<ApiResponse<{
    eligible: boolean;
    points?: number;
    claimed?: boolean;
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/birthday-bonus`);
  }

  /**
   * Claim birthday bonus
   */
  async claimBirthdayBonus(): Promise<ApiResponse<{ points: number }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/birthday-bonus/claim`);
  }

  // ==================== Referral Points ====================

  /**
   * Get referral point tracking
   */
  async getReferralPoints(): Promise<ApiResponse<{
    totalEarned: number;
    referrals: unknown[];
    pendingPoints: number;
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/referral-points`);
  }

  // ==================== Charity ====================

  /**
   * Donate points to charity
   */
  async donatePoints(data: {
    charityId: string;
    points: number;
  }): Promise<ApiResponse<{ success: boolean; receiptId: string }>> {

    return apiClient.post<unknown>(`${this.baseUrl}/donate`, data as unknown);
  }

  /**
   * Get available charities
   */
  async getCharities(): Promise<ApiResponse<{ charities: unknown[] }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/charities`);
  }

  // ==================== Analytics ====================

  /**
   * Get redemption analytics
   */
  async getRedemptionAnalytics(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    totalRedeemed: number;
    totalValue: number;
    topRewards: RewardItem[];
    savingsOverTime: unknown[];
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/analytics/redemptions`, { period });
  }

  /**
   * Get earning analytics
   */
  async getEarningAnalytics(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    totalEarned: number;
    bySou: unknown[];
    trend: unknown[];
  }>> {

    return apiClient.get<unknown>(`${this.baseUrl}/analytics/earnings`, { period });
  }
}

// Export singleton instance
const loyaltyRedemptionApi = new LoyaltyRedemptionApiService();
export default loyaltyRedemptionApi;
