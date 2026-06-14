import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from './logger.js';
import { cacheGet, cacheSet } from './cache.service.js';
import type { CampaignSummary, CampaignMetrics, CampaignContextResponse } from '../types/index.js';

let adsClient: AxiosInstance | null = null;

function getAdsClient(): AxiosInstance {
  if (!adsClient) {
    adsClient = axios.create({
      baseURL: config.rezAdsService.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    adsClient.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('REZ Ads Service error', {
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  return adsClient;
}

// Get all campaigns for an advertiser
export async function getCampaigns(advertiserId: string): Promise<CampaignSummary[]> {
  const cacheKey = `campaigns:${advertiserId}`;
  const cached = await cacheGet<CampaignSummary[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const client = getAdsClient();
    const response = await client.get(`/api/campaigns`, {
      params: { advertiserId },
    });

    const campaigns: CampaignSummary[] = response.data.campaigns?.map((c: Record<string, unknown>) => ({
      campaignId: c.id as string,
      name: c.name as string,
      status: c.status as 'active' | 'paused' | 'completed' | 'draft',
      budget: (c.budget as number) || 0,
      spent: (c.spent as number) || 0,
      impressions: (c.impressions as number) || 0,
      clicks: (c.clicks as number) || 0,
      ctr: (c.ctr as number) || 0,
      cpc: (c.cpc as number) || 0,
      conversions: (c.conversions as number) || 0,
    })) || [];

    await cacheSet(cacheKey, campaigns, 60); // Cache for 1 minute
    return campaigns;
  } catch (error) {
    logger.error('Failed to fetch campaigns', { advertiserId, error });
    // Return mock data for development
    return generateMockCampaigns(advertiserId);
  }
}

// Get campaign metrics
export async function getCampaignMetrics(
  advertiserId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CampaignMetrics> {
  const cacheKey = `metrics:${advertiserId}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'now'}`;
  const cached = await cacheGet<CampaignMetrics>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const client = getAdsClient();
    const response = await client.get(`/api/campaigns/metrics`, {
      params: {
        advertiserId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });

    const metrics: CampaignMetrics = {
      ...response.data,
      period: {
        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: endDate || new Date(),
      },
    };

    await cacheSet(cacheKey, metrics, 60);
    return metrics;
  } catch (error) {
    logger.error('Failed to fetch campaign metrics', { advertiserId, error });
    // Return mock metrics
    return generateMockMetrics(startDate, endDate);
  }
}

// Get single campaign context
export async function getCampaignContext(
  campaignId: string,
  advertiserId: string
): Promise<CampaignContextResponse | null> {
  const cacheKey = `campaign-context:${campaignId}`;
  const cached = await cacheGet<CampaignContextResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const client = getAdsClient();
    const response = await client.get(`/api/campaigns/${campaignId}`, {
      params: { advertiserId },
    });

    const campaign = response.data;
    const context: CampaignContextResponse = {
      campaign: {
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        spent: campaign.spent,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        conversions: campaign.conversions,
      },
      historicalMetrics: campaign.historicalMetrics || [],
      insights: campaign.insights || [],
      recommendations: campaign.recommendations || [],
    };

    await cacheSet(cacheKey, context, 60);
    return context;
  } catch (error) {
    logger.error('Failed to fetch campaign context', { campaignId, error });
    return null;
  }
}

// Pause campaign
export async function pauseCampaign(campaignId: string, advertiserId: string): Promise<boolean> {
  try {
    const client = getAdsClient();
    await client.post(`/api/campaigns/${campaignId}/pause`, {
      advertiserId,
    });
    logger.info('Campaign paused', { campaignId, advertiserId });
    return true;
  } catch (error) {
    logger.error('Failed to pause campaign', { campaignId, error });
    return false;
  }
}

// Resume campaign
export async function resumeCampaign(campaignId: string, advertiserId: string): Promise<boolean> {
  try {
    const client = getAdsClient();
    await client.post(`/api/campaigns/${campaignId}/resume`, {
      advertiserId,
    });
    logger.info('Campaign resumed', { campaignId, advertiserId });
    return true;
  } catch (error) {
    logger.error('Failed to resume campaign', { campaignId, error });
    return false;
  }
}

// Adjust campaign budget
export async function adjustBudget(
  campaignId: string,
  advertiserId: string,
  newBudget: number
): Promise<boolean> {
  try {
    const client = getAdsClient();
    await client.patch(`/api/campaigns/${campaignId}/budget`, {
      advertiserId,
      budget: newBudget,
    });
    logger.info('Campaign budget adjusted', { campaignId, advertiserId, newBudget });
    return true;
  } catch (error) {
    logger.error('Failed to adjust campaign budget', { campaignId, error });
    return false;
  }
}

// Generate mock campaigns for development
function generateMockCampaigns(advertiserId: string): CampaignSummary[] {
  return [
    {
      campaignId: 'camp-001',
      name: 'Summer Sale 2024',
      status: 'active',
      budget: 50000,
      spent: 32450,
      impressions: 1250000,
      clicks: 37500,
      ctr: 3.0,
      cpc: 0.86,
      conversions: 1875,
    },
    {
      campaignId: 'camp-002',
      name: 'New Product Launch',
      status: 'active',
      budget: 75000,
      spent: 45100,
      impressions: 2100000,
      clicks: 63000,
      ctr: 3.0,
      cpc: 0.72,
      conversions: 3150,
    },
    {
      campaignId: 'camp-003',
      name: 'Brand Awareness',
      status: 'paused',
      budget: 100000,
      spent: 23000,
      impressions: 890000,
      clicks: 17800,
      ctr: 2.0,
      cpc: 1.29,
      conversions: 890,
    },
  ];
}

// Generate mock metrics
function generateMockMetrics(startDate?: Date, endDate?: Date): CampaignMetrics {
  return {
    totalCampaigns: 3,
    activeCampaigns: 2,
    totalSpend: 100550,
    totalImpressions: 4240000,
    totalClicks: 118300,
    totalConversions: 5915,
    averageCtr: 2.79,
    averageCpc: 0.85,
    roas: 3.2,
    period: {
      start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: endDate || new Date(),
    },
  };
}

// Get recommendations based on campaign performance
export async function getRecommendations(advertiserId: string): Promise<string[]> {
  const campaigns = await getCampaigns(advertiserId);
  const recommendations: string[] = [];

  // Analyze campaigns and generate recommendations
  const lowCtrCampaigns = campaigns.filter(c => c.ctr < 2);
  if (lowCtrCampaigns.length > 0) {
    recommendations.push(`Consider improving ad creative for ${lowCtrCampaigns.length} campaign(s) with CTR below 2%`);
  }

  const highCpcCampaigns = campaigns.filter(c => c.cpc > 5);
  if (highCpcCampaigns.length > 0) {
    recommendations.push(`Review keyword bidding for ${highCpcCampaigns.length} campaign(s) with CPC above ₹5`);
  }

  const pausedCampaigns = campaigns.filter(c => c.status === 'paused');
  if (pausedCampaigns.length > 0) {
    recommendations.push(`${pausedCampaigns.length} paused campaign(s) could be reviewed for potential reactivation`);
  }

  const highBudgetCampaigns = campaigns.filter(c => c.spent / c.budget > 0.8);
  if (highBudgetCampaigns.length > 0) {
    recommendations.push(`${highBudgetCampaigns.length} campaign(s) are using over 80% of their budget`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Your campaigns are performing well. Continue monitoring for optimal results.');
  }

  return recommendations;
}