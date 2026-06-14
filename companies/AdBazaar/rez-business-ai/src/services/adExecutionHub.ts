/**
 * REZ Business AI - Ad Execution Hub
 *
 * Connects Business AI to REZ Media for ads and campaigns
 */

import { AIAction } from '../types';
import { randomInt } from 'crypto';

interface AdCreative {
  headline: string;
  description: string;
  cta: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface TargetingParams {
  age?: { min: number; max: number };
  gender?: string[];
  location?: {
    type: 'city' | 'state' | 'pincode' | 'radius';
    value: string | { lat: number; lng: number; radius: number };
  };
  interests?: string[];
  behavior?: string[];
  customAudience?: string[];
}

interface AdCampaign {
  name: string;
  objective: 'reach' | 'traffic' | 'engagement' | 'conversions' | 'awareness';
  budget: number;
  schedule: { start: Date; end: Date };
  targeting: TargetingParams;
  creatives: AdCreative[];
  placements: ('facebook' | 'instagram' | 'google' | 'tiktok' | 'native')[];
}

interface CampaignResult {
  campaignId: string;
  status: 'created' | 'running' | 'paused' | 'completed';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  errors?: string[];
}

export class AdExecutionHub {
  private adAIUrl: string;
  private engagementUrl: string;

  constructor() {
    this.adAIUrl = process.env.AD_AI_URL || 'http://localhost:4021';
    this.engagementUrl = process.env.ENGAGEMENT_URL || 'http://localhost:4017';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };
  }

  /**
   * Create ad campaign via REZ-AdAI
   */
  async createAdCampaign(params: {
    merchantId: string;
    objective: string;
    targeting: TargetingParams;
    budget: number;
    creative: AdCreative;
    campaignName: string;
  }): Promise<CampaignResult> {
    try {
      // Generate AI-optimized creative
      const optimizedCreative = await this.optimizeCreative(params.creative, params.objective);

      // Create campaign via REZ-AdAI
      const campaign: AdCampaign = {
        name: params.campaignName,
        objective: params.objective as unknown,
        budget: params.budget,
        schedule: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        targeting: params.targeting,
        creatives: [optimizedCreative],
        placements: ['facebook', 'instagram', 'google'],
      };

      const response = await fetch(`${this.adAIUrl}/api/v1/campaigns`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          merchantId: params.merchantId,
          campaign,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create campaign: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        campaignId: result.campaignId,
        status: 'created',
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
        },
      };
    } catch (error) {
      logger.error('Ad campaign creation failed:', error);
      return {
        campaignId: '',
        status: 'failed',
        metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, roas: 0 },
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Create engagement campaign via REZ-Engagement
   */
  async createEngagementCampaign(params: {
    merchantId: string;
    type: 'push' | 'whatsapp' | 'sms' | 'email';
    audience: string[];
    content: {
      title: string;
      message: string;
      offer?: { type: string; value: number };
    };
  }): Promise<{ success: boolean; messageId?: string; delivered?: number; errors?: string[] }> {
    try {
      const response = await fetch(`${this.engagementUrl}/api/v1/campaigns/engage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          merchantId: params.merchantId,
          channel: params.type,
          audience: params.audience,
          content: params.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create engagement: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messageId,
        delivered: result.delivered || 0,
      };
    } catch (error) {
      logger.error('Engagement campaign failed:', error);
      return {
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Create full marketing funnel
   */
  async createFullFunnel(params: {
    merchantId: string;
    objective: string;
    audience: {
      primary: string[];
      secondary?: string[];
    };
    offer: {
      type: 'discount' | 'cashback' | 'freebie';
      value: number;
      minOrder?: number;
    };
    budget: number;
    channels: ('ad' | 'whatsapp' | 'push' | 'sms')[];
  }): Promise<{
    adCampaign?: CampaignResult;
    engagementResults: { channel: string; success: boolean; delivered?: number }[];
    totalReach: number;
    estimatedConversions: number;
  }> {
    const engagementResults: { channel: string; success: boolean; delivered?: number }[] = [];

    // 1. Create Ad Campaign
    let adCampaign: CampaignResult | undefined;

    if (params.channels.includes('ad')) {
      adCampaign = await this.createAdCampaign({
        merchantId: params.merchantId,
        objective: params.objective,
        targeting: {
          customAudience: params.audience.primary,
        },
        budget: params.budget * 0.6, // 60% budget to ads
        campaignName: `Business AI - ${params.objective} Campaign`,
        creative: this.generateCreative(params),
      });
    }

    // 2. Create Engagement Campaigns
    for (const channel of params.channels.filter(c => c !== 'ad')) {
      const result = await this.createEngagementCampaign({
        merchantId: params.merchantId,
        type: channel as unknown,
        audience: params.audience.primary,
        content: this.generateContent(params),
      });
      engagementResults.push({ channel, ...result });
    }

    // 3. Calculate totals
    const totalReach = adCampaign
      ? adCampaign.metrics.impressions
      : 0;
    const totalDelivered = engagementResults.reduce((sum, r) => sum + (r.delivered || 0), 0);

    return {
      adCampaign,
      engagementResults,
      totalReach: totalReach + totalDelivered,
      estimatedConversions: Math.round((totalReach + totalDelivered) * 0.03), // 3% conversion estimate
    };
  }

  /**
   * Optimize creative using AI
   */
  private async optimizeCreative(creative: AdCreative, objective: string): Promise<AdCreative> {
    try {
      const response = await fetch(`${this.adAIUrl}/api/v1/creative/optimize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ creative, objective }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.creative;
      }
    } catch (error) {
      logger.error('Creative optimization failed:', error);
    }

    return creative;
  }

  /**
   * Generate ad creative
   */
  private generateCreative(params: {
    objective: string;
    offer: { type: string; value: number };
  }): AdCreative {
    const offerText = params.offer.value > 0
      ? `Get ${params.offer.value}% OFF`
      : 'Special Offer';

    const headlineVariants = [
      `${offerText} - Limited Time!`,
      `🔥 ${params.offer.value}% Cashback`,
      `Don't Miss Out: ${params.offer.value}% Off`,
      `Exclusive Deal Just For You!`,
    ];

    const descriptions = [
      `${params.offer.value}% off on your order. Use code at checkout.`,
      `Amazing offer! Save ${params.offer.value}% on your purchase.`,
      `${params.offer.value}% off + free delivery. Order now!`,
    ];

    return {
      headline: headlineVariants[randomInt(0, headlineVariants.length)],
      description: descriptions[randomInt(0, descriptions.length)],
      cta: 'Shop Now',
    };
  }

  /**
   * Generate engagement content
   */
  private generateContent(params: {
    offer: { type: string; value: number };
  }): { title: string; message: string; offer?: { type: string; value: number } } {
    return {
      title: `🎉 ${params.offer.value}% Off!`,
      message: `Hey! We have an exclusive ${params.offer.value}% ${params.offer.type} for you. Don't miss out!`,
      offer: params.offer,
    };
  }

  /**
   * Execute AI action via ecosystem
   */
  async executeAction(action: AIAction): Promise<{
    success: boolean;
    results: unknown[];
    errors?: string[];
  }> {
    const results: unknown[] = [];
    const errors: string[] = [];

    try {
      switch (action.type) {
        case 'ad_create':
          const adResult = await this.createAdCampaign({
            merchantId: action.merchantId,
            objective: action.data.objective || 'reach',
            targeting: action.data.targeting || {},
            budget: action.data.budget || 1000,
            campaignName: action.data.campaignName || 'AI Campaign',
            creative: action.data.creative || this.generateCreative({ objective: action.data.objective, offer: { type: 'discount', value: 10 } }),
          });
          results.push(adResult);
          break;

        case 'whatsapp_campaign':
        case 'notification_send':
        case 'push_notification':
          const channel = action.type === 'whatsapp_campaign' ? 'whatsapp'
            : action.type === 'push_notification' ? 'push'
            : 'sms';
          const engageResult = await this.createEngagementCampaign({
            merchantId: action.merchantId,
            type: channel as unknown,
            audience: action.data.audience || [],
            content: {
              title: action.data.title || 'Special Offer',
              message: action.data.message || '',
              offer: action.data.offer,
            },
          });
          results.push(engageResult);
          break;

        case 'campaign_create':
          // Create multi-channel campaign
          const funnelResult = await this.createFullFunnel({
            merchantId: action.merchantId,
            objective: action.data.objective || 'conversions',
            audience: { primary: action.data.audience || [] },
            offer: action.data.offer || { type: 'discount', value: 10 },
            budget: action.data.budget || 2000,
            channels: action.data.channels || ['whatsapp', 'push'],
          });
          results.push(funnelResult);
          break;

        default:
          errors.push(`Unknown action type: ${action.type}`);
      }

      return {
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<CampaignResult['metrics'] | null> {
    try {
      const response = await fetch(`${this.adAIUrl}/api/v1/campaigns/${campaignId}/metrics`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        return result.metrics;
      }
    } catch (error) {
      logger.error('Failed to get campaign performance:', error);
    }

    return null;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.adAIUrl}/api/v1/campaigns/${campaignId}/pause`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to pause campaign:', error);
      return false;
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.adAIUrl}/api/v1/campaigns/${campaignId}/resume`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to resume campaign:', error);
      return false;
    }
  }

  /**
   * Optimize campaign budget
   */
  async optimizeBudget(campaignId: string, targetROAS: number): Promise<{
    success: boolean;
    suggestedBudget?: number;
    changes?: string[];
  }> {
    try {
      const response = await fetch(`${this.adAIUrl}/api/v1/campaigns/${campaignId}/optimize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ targetROAS }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          suggestedBudget: result.suggestedBudget,
          changes: result.changes,
        };
      }
    } catch (error) {
      logger.error('Budget optimization failed:', error);
    }

    return { success: false };
  }
}

export const adExecutionHub = new AdExecutionHub();
