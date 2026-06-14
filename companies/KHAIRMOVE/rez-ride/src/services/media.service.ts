/**
 * ReZ Media Integration Service
 *
 * Connects ReZ Ride to ReZ Media ecosystem:
 * - Ads & Campaigns
 * - Gamification (Karma)
 * - DOOH advertising
 * - QR Campaigns
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';

export interface KarmaPoints {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimePoints: number;
  nextTierPoints: number;
}

export interface KarmaTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  timestamp: Date;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  type: 'banner' | 'interstitial' | 'rewarded';
  cpm: number;
  campaign: string;
}

export interface AdImpression {
  adId: string;
  userId: string;
  type: 'view' | 'click' | 'conversion';
  timestamp: Date;
}

export interface KarmaReward {
  type: 'discount' | 'free_ride' | 'cashback';
  value: number;
  description: string;
  expires: Date;
}

export class MediaService {
  private readonly logger = new Logger('MediaService');

  // ReZ Media Service URLs
  private readonly ADS_URL = process.env.REZ_ADS_URL || 'http://localhost:4068';
  private readonly KARMA_URL = process.env.REZ_KARMA_URL || 'http://localhost:4041';
  private readonly DOOH_URL = process.env.REZ_DOOH_URL || 'http://localhost:4018';
  private readonly CAMPAIGNS_URL = process.env.REZ_CAMPAIGNS_URL || 'http://localhost:4068';

  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 5000,
      headers: {
        'X-Internal-Token': this.INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  // ===========================================
  // KARMA GAMIFICATION (:4041)
  // ===========================================

  /**
   * Get user's karma points and tier
   */
  async getKarmaPoints(userId: string): Promise<KarmaPoints> {
    try {
      const response = await this.http.get(`${this.KARMA_URL}/api/karma/user/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Karma lookup failed: ${error.message}`);
      return this.getDefaultKarmaPoints();
    }
  }

  /**
   * Award karma points for ride
   */
  async awardKarmaPoints(userId: string, rideData: {
    rideId: string;
    fare: number;
    distance: number;
    rating?: number;
  }): Promise<{ points: number; totalPoints: number; badges: string[] }> {
    try {
      // Calculate points based on fare and distance
      const basePoints = Math.floor(rideData.fare / 10);
      const distanceBonus = Math.floor(rideData.distance / 5);
      const ratingBonus = rideData.rating && rideData.rating >= 4.5 ? 10 : 0;

      const totalPoints = basePoints + distanceBonus + ratingBonus;

      const response = await this.http.post(`${this.KARMA_URL}/api/karma/award`, {
        userId,
        rideId: rideData.rideId,
        points: totalPoints,
        breakdown: {
          base: basePoints,
          distance: distanceBonus,
          rating: ratingBonus,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.warn(`Karma award failed: ${error.message}`);
      return { points: 0, totalPoints: 0, badges: [] };
    }
  }

  /**
   * Get karma transaction history
   */
  async getKarmaHistory(userId: string, limit: number = 20): Promise<KarmaTransaction[]> {
    try {
      const response = await this.http.get(`${this.KARMA_URL}/api/karma/user/${userId}/history`, {
        params: { limit },
      });
      return response.data.transactions;
    } catch (error) {
      this.logger.warn(`Karma history failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Redeem karma points
   */
  async redeemKarma(userId: string, points: number, rewardType: 'discount' | 'free_ride'): Promise<KarmaReward | null> {
    try {
      const response = await this.http.post(`${this.KARMA_URL}/api/karma/redeem`, {
        userId,
        points,
        rewardType,
      });
      return response.data.reward;
    } catch (error) {
      this.logger.warn(`Karma redemption failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get available rewards
   */
  async getRewards(userId: string): Promise<KarmaReward[]> {
    try {
      const response = await this.http.get(`${this.KARMA_URL}/api/karma/rewards`, {
        params: { userId },
      });
      return response.data.rewards;
    } catch (error) {
      this.logger.warn(`Rewards lookup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get badges
   */
  async getBadges(userId: string): Promise<{ id: string; name: string; icon: string; earned: boolean }[]> {
    try {
      const response = await this.http.get(`${this.KARMA_URL}/api/karma/badges/${userId}`);
      return response.data.badges;
    } catch (error) {
      this.logger.warn(`Badges lookup failed: ${error.message}`);
      return this.getDefaultBadges();
    }
  }

  // ===========================================
  // ADVERTISING (:4068)
  // ===========================================

  /**
   * Get ad for user context
   */
  async getAd(userId: string, context: {
    screen: 'splash' | 'home' | 'ride' | 'completion';
    vehicleType?: string;
    location?: { lat: number; lng: number };
  }): Promise<Ad | null> {
    try {
      const response = await this.http.post(`${this.ADS_URL}/api/ads/target`, {
        userId,
        context,
        platform: 'mobile',
      });
      return response.data.ad;
    } catch (error) {
      this.logger.warn(`Ad fetch failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Track ad impression
   */
  async trackAdImpression(impression: AdImpression): Promise<void> {
    try {
      await this.http.post(`${this.ADS_URL}/api/ads/impression`, impression);
    } catch (error) {
      this.logger.warn(`Impression tracking failed: ${error.message}`);
    }
  }

  /**
   * Track ad click
   */
  async trackAdClick(adId: string, userId: string): Promise<void> {
    try {
      await this.http.post(`${this.ADS_URL}/api/ads/click`, {
        adId,
        userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn(`Click tracking failed: ${error.message}`);
    }
  }

  /**
   * Get interstitial ad (between screens)
   */
  async getInterstitialAd(userId: string): Promise<Ad | null> {
    return this.getAd(userId, { screen: 'home' });
  }

  /**
   * Get rewarded ad (before ride)
   */
  async getRewardedAd(userId: string): Promise<Ad | null> {
    return this.getAd(userId, { screen: 'ride' });
  }

  // ===========================================
  // DOOH ADVERTISING (:4018)
  // ===========================================

  /**
   * Register vehicle screen for DOOH
   */
  async registerDOOHScreen(driverId: string, vehicleId: string, screenId: string): Promise<void> {
    try {
      await this.http.post(`${this.DOOH_URL}/api/screens/register`, {
        driverId,
        vehicleId,
        screenId,
        type: 'vehicle',
        location: 'bangalore', // Could get from GPS
      });
    } catch (error) {
      this.logger.warn(`DOOH registration failed: ${error.message}`);
    }
  }

  /**
   * Track DOOH impression
   */
  async trackDOOHImpression(screenId: string, campaignId: string, duration: number): Promise<void> {
    try {
      await this.http.post(`${this.DOOH_URL}/api/screens/impression`, {
        screenId,
        campaignId,
        duration,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn(`DOOH tracking failed: ${error.message}`);
    }
  }

  /**
   * Get DOOH campaigns for screen
   */
  async getDOOHAds(screenId: string): Promise<{
    id: string;
    content: string;
    targetUrl: string;
    duration: number;
  }[]> {
    try {
      const response = await this.http.get(`${this.DOOH_URL}/api/screens/${screenId}/ads`);
      return response.data.ads;
    } catch (error) {
      this.logger.warn(`DOOH ads lookup failed: ${error.message}`);
      return [];
    }
  }

  // ===========================================
  // QR CAMPAIGNS
  // ===========================================

  /**
   * Check for active campaign at location
   */
  async checkCampaign(lat: number, lng: number): Promise<{
    campaignId: string;
    title: string;
    reward: { type: string; value: number };
  } | null> {
    try {
      const response = await this.http.post(`${this.CAMPAIGNS_URL}/api/campaigns/check`, {
        lat,
        lng,
        type: 'ride',
      });
      return response.data.campaign;
    } catch (error) {
      this.logger.warn(`Campaign check failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Award campaign reward
   */
  async awardCampaignReward(userId: string, campaignId: string): Promise<{
    type: 'cashback' | 'discount' | 'points';
    value: number;
  } | null> {
    try {
      const response = await this.http.post(`${this.CAMPAIGNS_URL}/api/campaigns/redeem`, {
        userId,
        campaignId,
      });
      return response.data.reward;
    } catch (error) {
      this.logger.warn(`Campaign reward failed: ${error.message}`);
      return null;
    }
  }

  // ===========================================
  // REFERRAL SYSTEM
  // ===========================================

  /**
   * Get referral stats
   */
  async getReferralStats(userId: string): Promise<{
    code: string;
    referrals: number;
    earnings: number;
    totalEarned: number;
  }> {
    try {
      const response = await this.http.get(`${this.KARMA_URL}/api/referrals/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Referral stats failed: ${error.message}`);
      return { code: '', referrals: 0, earnings: 0, totalEarned: 0 };
    }
  }

  /**
   * Apply referral code
   */
  async applyReferralCode(referrerCode: string, newUserId: string): Promise<{
    success: boolean;
    bonus: number;
  }> {
    try {
      const response = await this.http.post(`${this.KARMA_URL}/api/referrals/apply`, {
        code: referrerCode,
        newUserId,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Referral apply failed: ${error.message}`);
      return { success: false, bonus: 0 };
    }
  }

  // ===========================================
  // HELPERS
  // ===========================================

  private getDefaultKarmaPoints(): KarmaPoints {
    return {
      points: 0,
      tier: 'bronze',
      lifetimePoints: 0,
      nextTierPoints: 100,
    };
  }

  private getDefaultBadges(): { id: string; name: string; icon: string; earned: boolean }[] {
    return [
      { id: 'first_ride', name: 'First Ride', icon: '🎯', earned: false },
      { id: 'distance_100', name: '100km Club', icon: '🏅', earned: false },
      { id: 'rides_50', name: 'Frequent Rider', icon: '⭐', earned: false },
      { id: 'rating_5', name: '5-Star Rating', icon: '💎', earned: false },
      { id: 'early_bird', name: 'Early Bird', icon: '🌅', earned: false },
      { id: 'night_owl', name: 'Night Owl', icon: '🦉', earned: false },
      { id: 'pool_master', name: 'Pool Master', icon: '👥', earned: false },
      { id: 'referral_champ', name: 'Referral Champion', icon: '🎁', earned: false },
    ];
  }
}

export const mediaService = new MediaService();
