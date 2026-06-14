import { apiClient } from './client';
import { devWarn } from '../../utils/devLog';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

export type BonusCampaignType =
  | 'cashback_boost'
  | 'bank_offer'
  | 'bill_upload_bonus'
  | 'category_multiplier'
  | 'first_transaction_bonus'
  | 'festival_offer';

export interface BonusCampaignReward {
  type: 'percentage' | 'flat' | 'multiplier';
  value: number;
  capPerUser: number;
  coinType: 'rez' | 'branded';
}

export interface BonusCampaignDisplay {
  icon: string;
  bannerImage?: string;
  partnerLogo?: string;
  backgroundColor?: string;
  badgeText?: string;
  featured: boolean;
  priority: number;
}

// LI WEI: merchant ROI — campaign performance metrics
export interface CampaignMetrics {
  attributedRevenue?: number;
  customerCount?: number;
  conversionRate?: number;
  roi?: number;
}

// MA-GAP-167: Typed deep link params instead of Record<string, any>
export interface CampaignDeepLinkParams {
  campaignId?: string;
  offerId?: string;
  productId?: string;
  outletId?: string;
  referrer?: string;
  [key: string]: string | undefined;
}

export interface BonusCampaign {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description?: string;
  campaignType: BonusCampaignType;
  reward: BonusCampaignReward;
  display: BonusCampaignDisplay;
  schedule: {
    startTime: string;
    endTime: string;
  };
  deepLink?: {
    screen: string;
    params?: CampaignDeepLinkParams;
  };
  maxClaimsPerUser: number;
  terms?: string[];
  fundingSource?: {
    partnerName?: string;
    partnerLogo?: string;
  };
  userState?: string;
  userClaimCount?: number;
  userTotalReward?: number;
  // LI WEI: merchant ROI — optional campaign performance metrics
  metrics?: CampaignMetrics;
}

// MA-GAP-164: Typed API response shape
interface CampaignsApiResponse {
  campaigns?: BonusCampaign[];
  total?: number;
  campaign?: BonusCampaign;
}

// ============================================
// SERVICE
// ============================================

class BonusCampaignService {
  /**
   * Get all active bonus campaigns
   * Uses the public user-facing endpoint: GET /api/bonus-zone/campaigns
   */
  async getActiveCampaigns(): Promise<{ campaigns: BonusCampaign[]; total: number }> {
    try {
      // MA-BROKEN-FIX: Added merchant/ prefix — bonus-zone/* routes go to monolith (404),
      // merchant/bonus-zone/* routes to merchant-service (working path).
      const response = await apiClient.get<CampaignsApiResponse>('merchant/bonus-zone/campaigns');

      if (response.success && response.data?.campaigns) {
        return {
          campaigns: response.data.campaigns,
          total: response.data.total || response.data.campaigns.length,
        };
      }
      if (!response.success) {
        logger.error('[BonusCampaigns] Failed to fetch active campaigns', {
          message: response.message,
        });
      }
      return { campaigns: [], total: 0 };
    } catch (error) {
      devWarn('[BonusCampaigns] Failed to fetch active campaigns:', error.message);
      return { campaigns: [], total: 0 };
    }
  }

  /**
   * Get a single campaign by slug
   * Uses: GET /api/bonus-zone/campaigns/:slug
   */
  async getCampaignBySlug(slug: string): Promise<BonusCampaign | null> {
    try {
      // MA-BROKEN-FIX: Added merchant/ prefix — bonus-zone/* routes go to monolith (404),
      // merchant/bonus-zone/* routes to merchant-service (working path).
      const response = await apiClient.get<CampaignsApiResponse>(
        `merchant/bonus-zone/campaigns/${slug}`
      );
      if (response.success && response.data?.campaign) {
        return response.data.campaign;
      }
      if (!response.success) {
        logger.error('[BonusCampaigns] Failed to fetch campaign detail', {
          slug,
          message: response.message,
        });
      }
      return null;
    } catch (error) {
      devWarn('[BonusCampaigns] Failed to fetch campaign detail:', error.message);
      return null;
    }
  }
}

export const bonusCampaignService = new BonusCampaignService();
export default bonusCampaignService;
