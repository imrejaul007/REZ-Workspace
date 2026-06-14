/**
 * AdBazaar Client for DO App
 *
 * Connect DO App to AdBazaar Marketing & DOOH
 * Features: Ads, Campaigns, Rewards, Analytics
 */

import axios, { AxiosInstance } from 'axios';

const ADBAZAAR_URL = process.env.ADBAZAAR_URL || 'http://localhost:4068';

export class AdBazaarClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: ADBAZAAR_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // ADS / CAMPAIGNS
  // =========================================================================

  async getAds(userId: string) {
    try {
      const { data } = await this.client.get('/api/ads', {
        params: { userId },
      });
      return data;
    } catch (error) {
      console.error('AdBazaar getAds error:', error);
      return { ads: [] };
    }
  }

  async viewAd(adId: string, userId: string) {
    try {
      const { data } = await this.client.post('/api/ads/view', {
        adId,
        userId,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('AdBazaar viewAd error:', error);
      return null;
    }
  }

  async clickAd(adId: string, userId: string) {
    try {
      const { data } = await this.client.post('/api/ads/click', {
        adId,
        userId,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('AdBazaar clickAd error:', error);
      return null;
    }
  }

  // =========================================================================
  // REWARDS / COINS
  // =========================================================================

  async getRewards(userId: string) {
    try {
      const { data } = await this.client.get(`/api/rewards/${userId}`);
      return data;
    } catch (error) {
      console.error('AdBazaar getRewards error:', error);
      return null;
    }
  }

  async earnCoins(userId: string, amount: number, source: string) {
    try {
      const { data } = await this.client.post('/api/rewards/earn', {
        userId,
        amount,
        source,
      });
      return data;
    } catch (error) {
      console.error('AdBazaar earnCoins error:', error);
      return null;
    }
  }

  async redeemCoins(userId: string, amount: number, item: string) {
    try {
      const { data } = await this.client.post('/api/rewards/redeem', {
        userId,
        amount,
        item,
      });
      return data;
    } catch (error) {
      console.error('AdBazaar redeemCoins error:', error);
      return null;
    }
  }

  async getTransactionHistory(userId: string) {
    try {
      const { data } = await this.client.get(`/api/rewards/${userId}/history`);
      return data;
    } catch (error) {
      console.error('AdBazaar getTransactionHistory error:', error);
      return { transactions: [] };
    }
  }

  // =========================================================================
  // CAMPAIGNS
  // =========================================================================

  async getCampaigns(params?: {
    status?: 'active' | 'paused' | 'completed';
    type?: string;
  }) {
    try {
      const { data } = await this.client.get('/api/campaigns', { params });
      return data;
    } catch (error) {
      console.error('AdBazaar getCampaigns error:', error);
      return { campaigns: [] };
    }
  }

  async createCampaign(campaign: {
    name: string;
    type: string;
    budget: number;
    targetAudience: Record<string, any>;
    startDate: string;
    endDate?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/campaigns', campaign);
      return data;
    } catch (error) {
      console.error('AdBazaar createCampaign error:', error);
      return null;
    }
  }

  async getCampaignAnalytics(campaignId: string) {
    try {
      const { data } = await this.client.get(`/api/campaigns/${campaignId}/analytics`);
      return data;
    } catch (error) {
      console.error('AdBazaar getCampaignAnalytics error:', error);
      return null;
    }
  }

  // =========================================================================
  // QR CODES
  // =========================================================================

  async createQR(qr: {
    type: 'safe' | 'verify' | 'creator' | 'ads';
    businessId: string;
    content: Record<string, any>;
  }) {
    try {
      const { data } = await this.client.post('/api/qr/create', qr);
      return data;
    } catch (error) {
      console.error('AdBazaar createQR error:', error);
      return null;
    }
  }

  async scanQR(qrId: string, userId: string) {
    try {
      const { data } = await this.client.post('/api/qr/scan', {
        qrId,
        userId,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('AdBazaar scanQR error:', error);
      return null;
    }
  }

  async getQRAnalytics(qrId: string) {
    try {
      const { data } = await this.client.get(`/api/qr/${qrId}/analytics`);
      return data;
    } catch (error) {
      console.error('AdBazaar getQRAnalytics error:', error);
      return null;
    }
  }

  // =========================================================================
  // DOOH (Digital Out of Home)
  // =========================================================================

  async getNearbyScreens(params: { lat: number; lng: number; radius?: number }) {
    try {
      const { data } = await this.client.get('/api/dooh/screens/nearby', { params });
      return data;
    } catch (error) {
      console.error('AdBazaar getNearbyScreens error:', error);
      return { screens: [] };
    }
  }

  async getScreenContent(screenId: string) {
    try {
      const { data } = await this.client.get(`/api/dooh/screens/${screenId}/content`);
      return data;
    } catch (error) {
      console.error('AdBazaar getScreenContent error:', error);
      return null;
    }
  }

  // =========================================================================
  // CREATORS
  // =========================================================================

  async becomeCreator(userId: string) {
    try {
      const { data } = await this.client.post('/api/creators/register', { userId });
      return data;
    } catch (error) {
      console.error('AdBazaar becomeCreator error:', error);
      return null;
    }
  }

  async getCreatorAnalytics(userId: string) {
    try {
      const { data } = this.client.get(`/api/creators/${userId}/analytics`);
      return data;
    } catch (error) {
      console.error('AdBazaar getCreatorAnalytics error:', error);
      return null;
    }
  }

  async getCreatorEarnings(userId: string) {
    try {
      const { data } = await this.client.get(`/api/creators/${userId}/earnings`);
      return data;
    } catch (error) {
      console.error('AdBazaar getCreatorEarnings error:', error);
      return null;
    }
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  async getUserAnalytics(userId: string) {
    try {
      const { data } = await this.client.get(`/api/analytics/user/${userId}`);
      return data;
    } catch (error) {
      console.error('AdBazaar getUserAnalytics error:', error);
      return null;
    }
  }

  async getEngagementMetrics(userId: string, period: 'day' | 'week' | 'month') {
    try {
      const { data } = await this.client.get(`/api/analytics/${userId}/engagement`, {
        params: { period },
      });
      return data;
    } catch (error) {
      console.error('AdBazaar getEngagementMetrics error:', error);
      return null;
    }
  }

  // =========================================================================
  // DO APP SPECIFIC METHODS
  // =========================================================================

  async getDOAppDashboard(userId: string) {
    const [rewards, ads, analytics] = await Promise.all([
      this.getRewards(userId),
      this.getAds(userId),
      this.getUserAnalytics(userId),
    ]);

    return {
      rewards,
      ads: ads.ads?.slice(0, 5) || [],
      analytics,
      quickActions: {
        watchAd: true,
        redeem: true,
        createQR: true,
        becomeCreator: true,
      },
    };
  }

  async earnByWatching(userId: string) {
    // Get available ads
    const { ads } = await this.getAds(userId);

    if (!ads || ads.length === 0) {
      return { message: 'No ads available', coins: 0 };
    }

    // Watch first ad
    const ad = ads[0];
    const viewResult = await this.viewAd(ad.id, userId);

    // Earn coins
    const coins = ad.coinsPerView || 5;
    await this.earnCoins(userId, coins, 'ad_view');

    return {
      ad,
      coinsEarned: coins,
      totalCoins: (await this.getRewards(userId))?.balance || 0,
    };
  }
}

// Export singleton
export const adbazaarClient = new AdBazaarClient();

export default AdBazaarClient;
