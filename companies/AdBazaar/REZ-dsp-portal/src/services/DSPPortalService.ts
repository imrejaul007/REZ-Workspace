import logger from '../utils/logger.js';

/**
 * REZ DSP Portal - DSP Portal Service
 * Self-serve advertising platform with DOOH Intelligence integration
 */

import axios from 'axios';
import { DSPAdvertiser, DSPCampaign, DSPargeting, DSpotCreative, DSPMetrics } from '../types/index.js';

// DOOH Intelligence Integration
const DOOH_INTEL_URL = process.env.DOOH_INTEL_URL || 'http://localhost:4080';

// Types for DOOH Intelligence
interface DOOHPricingQuote {
  finalCPM: number;
  baseCPM: number;
  adjustments: {
    captivity: number;
    cityTier: number;
    timeSlot: number;
    seasonal: number;
    demand: number;
    audienceMatch: number;
  };
}

interface ScreenTypeInfo {
  type: string;
  captivityLevel: string;
  description: string;
  baseCPM: number;
}

// In-memory storage for demo (replace with MongoDB in production)
const advertisers = new Map<string, DSPAdvertiser>();
const campaigns = new Map<string, DSPCampaign>();

export class DSPPortalService {
  /**
   * Register new advertiser
   */
  async registerAdvertiser(data: {
    name: string;
    email: string;
    company: string;
    website?: string;
  }): Promise<DSPAdvertiser> {
    const advertiser: DSPAdvertiser = {
      id: `adv-${Date.now()}`,
      name: data.name,
      email: data.email,
      company: data.company,
      website: data.website,
      status: 'pending',
      balance: 0,
      spent: 0,
      createdAt: new Date(),
    };

    advertisers.set(advertiser.id, advertiser);
    logger.info('Advertiser registered', { advertiserId: advertiser.id });
    return advertiser;
  }

  /**
   * Get advertiser by ID
   */
  async getAdvertiser(id: string): Promise<DSPAdvertiser | null> {
    return advertisers.get(id) || null;
  }

  /**
   * Create campaign
   */
  async createCampaign(
    advertiserId: string,
    data: {
      name: string;
      objective: DSPCampaign['objective'];
      budget: { daily?: number; total: number };
      bidding: DSPCampaign['bidding'];
      targeting: DSPargeting;
    }
  ): Promise<DSPCampaign> {
    const advertiser = advertisers.get(advertiserId);
    if (!advertiser) {
      throw new Error('Advertiser not found');
    }

    const campaign: DSPCampaign = {
      id: `camp-${Date.now()}`,
      advertiserId,
      name: data.name,
      objective: data.objective,
      status: 'draft',
      budget: {
        ...data.budget,
        spent: 0,
      },
      bidding: data.bidding,
      targeting: data.targeting,
      creatives: [],
      metrics: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        conversionRate: 0,
        spend: 0,
        cpm: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      },
      createdAt: new Date(),
    };

    campaigns.set(campaign.id, campaign);
    logger.info('Campaign created', { campaignId: campaign.id, advertiserId });
    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id: string): Promise<DSPCampaign | null> {
    return campaigns.get(id) || null;
  }

  /**
   * Get all campaigns for advertiser
   */
  async getAdvertiserCampaigns(advertiserId: string): Promise<DSPCampaign[]> {
    return Array.from(campaigns.values()).filter(c => c.advertiserId === advertiserId);
  }

  /**
   * Add creative to campaign
   */
  async addCreative(
    campaignId: string,
    creative: Omit<DSpotCreative, 'id' | 'status'>
  ): Promise<DSpotCreative | null> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      return null;
    }

    const newCreative: DSpotCreative = {
      ...creative,
      id: `creative-${Date.now()}`,
      status: 'pending',
    };

    campaign.creatives.push(newCreative);
    logger.info('Creative added', { campaignId, creativeId: newCreative.id });
    return newCreative;
  }

  /**
   * Launch campaign
   */
  async launchCampaign(campaignId: string): Promise<void> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new Error('Campaign cannot be launched from current status');
    }

    campaign.status = 'active';
    logger.info('Campaign launched', { campaignId });
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error('Campaign cannot be paused from current status');
    }

    campaign.status = 'paused';
    logger.info('Campaign paused', { campaignId });
  }

  /**
   * Complete campaign
   */
  async completeCampaign(campaignId: string): Promise<void> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = 'completed';
    logger.info('Campaign completed', { campaignId });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      return false;
    }

    if (campaign.status === 'active') {
      throw new Error('Cannot delete active campaign. Pause it first.');
    }

    campaigns.delete(campaignId);
    logger.info('Campaign deleted', { campaignId });
    return true;
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<DSPMetrics | null> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      return null;
    }
    return campaign.metrics;
  }

  /**
   * Generate report
   */
  async generateReport(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    campaignId: string;
    dateRange: { start: Date; end: Date };
    metrics: DSPMetrics;
  } | null> {
    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      return null;
    }

    return {
      campaignId,
      dateRange: { start: startDate, end: endDate },
      metrics: campaign.metrics,
    };
  }

  /**
   * Estimate reach
   */
  async estimateReach(targeting: DSPargeting, budget: number): Promise<{
    impressions: number;
    reach: number;
    frequency: number;
  }> {
    const cpm = 4.0; // $4 per 1000 impressions
    const impressions = (budget / cpm) * 1000;
    const reach = impressions * 0.6; // Assume 60% unique
    const frequency = impressions / reach;

    return {
      impressions: Math.round(impressions),
      reach: Math.round(reach),
      frequency: Math.round(frequency * 10) / 10,
    };
  }

  /**
   * Add funds to account
   */
  async addFunds(advertiserId: string, amount: number): Promise<{
    newBalance: number;
    transactionId: string;
  } | null> {
    const advertiser = advertisers.get(advertiserId);
    if (!advertiser) {
      return null;
    }

    advertiser.balance += amount;
    logger.info('Funds added', { advertiserId, amount, newBalance: advertiser.balance });

    return {
      newBalance: advertiser.balance,
      transactionId: `txn-${Date.now()}`,
    };
  }

  /**
   * Get billing summary
   */
  async getBillingSummary(advertiserId: string): Promise<{
    balance: number;
    pending: number;
    spent: number;
    invoices: { id: string; amount: number; date: Date }[];
  } | null> {
    const advertiser = advertisers.get(advertiserId);
    if (!advertiser) {
      return null;
    }

    return {
      balance: advertiser.balance,
      pending: advertiser.balance * 0.1, // Mock pending amount
      spent: advertiser.spent,
      invoices: [
        { id: 'inv-1', amount: 1500, date: new Date() },
        { id: 'inv-2', amount: 2000, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      ],
    };
  }

  // ============================================================================
  // DOOH INTELLIGENCE METHODS
  // ============================================================================

  /**
   * Get dynamic pricing from DOOH Intelligence
   */
  async getDOOHPricing(params: {
    screenType: string;
    city: string;
    tier: 'metro' | 'tier1' | 'tier2' | 'tier3';
    scheduledTime?: { start: Date; end: Date };
  }): Promise<DOOHPricingQuote | null> {
    try {
      const response = await axios.post(
        `${DOOH_INTEL_URL}/api/pricing/calculate`,
        {
          screenType: params.screenType,
          location: {
            city: params.city,
            tier: params.tier,
          },
          scheduledTime: params.scheduledTime || {
            start: new Date(),
            end: new Date(),
          },
          campaignObjective: 'awareness',
        },
        { timeout: 5000 }
      );
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get DOOH pricing', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Get available screen types with pricing
   */
  async getScreenTypes(): Promise<ScreenTypeInfo[] | null> {
    try {
      const response = await axios.get(
        `${DOOH_INTEL_URL}/api/screens/types`,
        { timeout: 5000 }
      );
      return response.data.data.screens;
    } catch (error) {
      logger.error('Failed to get screen types', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Get demo pricing (all screen types)
   */
  async getDemoPricing(): Promise<Array<{
    screenType: string;
    base: number;
    metroPeak: number;
    metroNormal: number;
    tier2Peak: number;
  }> | null> {
    try {
      const response = await axios.get(
        `${DOOH_INTEL_URL}/api/demo/pricing`,
        { timeout: 5000 }
      );
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get demo pricing', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Calculate campaign estimate with intelligence
   */
  async calculateCampaignEstimate(params: {
    screenTypes: string[];
    cities: string[];
    budget: number;
    objective: string;
  }): Promise<{
    estimatedImpressions: number;
    estimatedCPM: number;
    priceBreakdown: Array<{
      screenType: string;
      baseCPM: number;
      estimatedCPM: number;
    }>;
  } | null> {
    try {
      const screenTypes = await this.getScreenTypes();
      if (!screenTypes?.length) return null;

      const priceBreakdown = params.screenTypes.map((screenType) => {
        const info = screenTypes.find((s) => s.type === screenType);
        return {
          screenType,
          baseCPM: info?.baseCPM || 100,
          estimatedCPM: (info?.baseCPM || 100) * 2.5,
        };
      });

      const avgCPM =
        priceBreakdown.reduce((sum, p) => sum + p.estimatedCPM, 0) /
        priceBreakdown.length;

      return {
        estimatedImpressions: Math.round((params.budget / avgCPM) * 1000),
        estimatedCPM: avgCPM,
        priceBreakdown,
      };
    } catch (error) {
      logger.error('Failed to calculate estimate', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
}

export const dspPortalService = new DSPPortalService();
