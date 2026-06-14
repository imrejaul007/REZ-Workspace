import { v4 as uuidv4 } from 'uuid';
import { campaignService } from './campaign.service.js';
import { vastGeneratorService } from './vast-generator.service.js';
import { CTVCampaignModel } from '../models/index.js';
import { AdEventModel } from '../models/index.js';
import { DecisionRequest, DecisionResponse, CTVCreative, CTVCampaignDocument } from '../types/index.js';

class AdDecisionService {
  /**
   * Make an ad decision - select the best ad for the given context
   */
  async makeDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const requestId = uuidv4();

    // Find eligible campaigns
    const campaigns = await campaignService.findActiveCampaigns({
      format: request.placementId.split('_')[0] || 'preroll',
      geo: request.geo,
      deviceType: request.deviceType,
      appId: request.appId,
      contentCategory: request.contentCategory,
    });

    if (campaigns.length === 0) {
      return {
        requestId,
        vastXml: vastGeneratorService.generateNoVAST(),
        creatives: [],
        campaignId: '',
        impressions: 0,
        revenue: 0,
      };
    }

    // Filter campaigns by frequency cap
    const eligibleCampaigns: CTVCampaignDocument[] = [];
    for (const campaign of campaigns) {
      if (request.deviceId) {
        const withinCap = await campaignService.checkFrequencyCap(request.deviceId, campaign.campaignId);
        if (withinCap) {
          eligibleCampaigns.push(campaign);
        }
      } else {
        eligibleCampaigns.push(campaign);
      }
    }

    if (eligibleCampaigns.length === 0) {
      return {
        requestId,
        vastXml: vastGeneratorService.generateNoVAST(),
        creatives: [],
        campaignId: '',
        impressions: 0,
        revenue: 0,
      };
    }

    // Select best campaign based on bid amount and targeting match
    const selectedCampaign = this.selectBestCampaign(eligibleCampaigns, request);

    if (!selectedCampaign) {
      return {
        requestId,
        vastXml: vastGeneratorService.generateNoVAST(),
        creatives: [],
        campaignId: '',
        impressions: 0,
        revenue: 0,
      };
    }

    // Select creative
    const selectedCreative = this.selectCreative(selectedCampaign, request);

    if (!selectedCreative) {
      return {
        requestId,
        vastXml: vastGeneratorService.generateNoVAST(),
        creatives: [],
        campaignId: selectedCampaign.campaignId,
        impressions: 0,
        revenue: 0,
      };
    }

    // Calculate revenue
    const revenue = this.calculateRevenue(selectedCampaign, selectedCreative);

    // Generate VAST XML
    const vastXml = vastGeneratorService.generateVAST(selectedCampaign, selectedCreative, {
      skipOffset: request.skipOffset,
      podPosition: request.podPosition,
    });

    // Track impression (async, don't wait)
    if (request.deviceId) {
      campaignService.incrementFrequency(request.deviceId, selectedCampaign.campaignId);
    }
    campaignService.trackImpression(selectedCampaign.campaignId, revenue);

    return {
      requestId,
      vastXml,
      creatives: [selectedCreative],
      campaignId: selectedCampaign.campaignId,
      impressions: 1,
      revenue,
    };
  }

  /**
   * Make pod decision - select multiple ads for an ad break
   */
  async makePodDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const requestId = uuidv4();
    const maxAds = request.maxAds || 3;

    // Find eligible campaigns
    const campaigns = await campaignService.findActiveCampaigns({
      format: 'pod',
      geo: request.geo,
      deviceType: request.deviceType,
      appId: request.appId,
      contentCategory: request.contentCategory,
    });

    if (campaigns.length === 0) {
      return {
        requestId,
        vastXml: vastGeneratorService.generateNoVAST(),
        creatives: [],
        campaignId: '',
        impressions: 0,
        revenue: 0,
      };
    }

    // Select creatives for the pod
    const selectedCreatives: CTVCreative[] = [];
    let totalRevenue = 0;
    let campaignId = '';

    for (const campaign of campaigns) {
      if (selectedCreatives.length >= maxAds) break;

      // Check frequency cap
      if (request.deviceId) {
        const withinCap = await campaignService.checkFrequencyCap(request.deviceId, campaign.campaignId);
        if (!withinCap) continue;
      }

      const creative = this.selectCreative(campaign, request);
      if (creative) {
        selectedCreatives.push(creative);
        totalRevenue += this.calculateRevenue(campaign, creative);
        campaignId = campaign.campaignId;

        if (request.deviceId) {
          campaignService.incrementFrequency(request.deviceId, campaign.campaignId);
        }
        campaignService.trackImpression(campaign.campaignId, this.calculateRevenue(campaign, creative));
      }
    }

    if (selectedCreatives.length === 0) {
      return {
        requestId,
        vastXml: vastGeneratorService.generateNoVAST(),
        creatives: [],
        campaignId: '',
        impressions: 0,
        revenue: 0,
      };
    }

    // Generate pod VAST
    const vastXml = vastGeneratorService.generatePodVAST(campaigns[0], selectedCreatives, {
      skipOffset: request.skipOffset,
    });

    return {
      requestId,
      vastXml,
      creatives: selectedCreatives,
      campaignId,
      impressions: selectedCreatives.length,
      revenue: totalRevenue,
    };
  }

  /**
   * Select the best campaign based on bid and targeting match
   */
  private selectBestCampaign(
    campaigns: CTVCampaignDocument[],
    request: DecisionRequest
  ): CTVCampaignDocument | null {
    // Score each campaign
    const scored = campaigns.map((campaign) => {
      let score = campaign.bid.amount;

      // Boost for targeting match
      if (request.geo && campaign.targeting.geo?.includes(request.geo)) {
        score *= 1.2;
      }
      if (request.deviceType && campaign.targeting.deviceTypes?.includes(request.deviceType)) {
        score *= 1.1;
      }
      if (request.appId && campaign.targeting.apps?.includes(request.appId)) {
        score *= 1.15;
      }
      if (request.contentCategory && campaign.targeting.contentCategories?.includes(request.contentCategory)) {
        score *= 1.1;
      }

      return { campaign, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.campaign || null;
  }

  /**
   * Select the best creative from a campaign
   */
  private selectCreative(campaign: CTVCampaign, request: DecisionRequest): CTVCreative | null {
    if (!campaign.creatives || campaign.creatives.length === 0) {
      return null;
    }

    // For now, select first creative
    // In production, could use rotation algorithms (weighted random, sequential, etc.)
    const creative = campaign.creatives[0];

    // Filter by duration if videoDuration is provided
    if (request.videoDuration && creative.duration > request.videoDuration * 0.5) {
      return creative;
    }

    return creative;
  }

  /**
   * Calculate revenue for an ad impression
   */
  private calculateRevenue(campaign: CTVCampaign, creative: CTVCreative): number {
    const { type, amount } = campaign.bid;

    switch (type) {
      case 'cpm':
        return amount / 1000; // CPM to actual cost
      case 'cpv':
        // Cost per view (viewable impression)
        return amount;
      case 'cpa':
        // Cost per action - set as pending, track when action occurs
        return amount * 0.1; // Default to 10% of max bid
      default:
        return campaign.bid.maxBid / 1000;
    }
  }

  /**
   * Track ad event
   */
  async trackEvent(
    eventType: string,
    campaignId: string,
    creativeId: string,
    metadata: {
      deviceId?: string;
      deviceType: string;
      placementId?: string;
      geo?: string;
      ip?: string;
      userAgent?: string;
      podPosition?: number;
      skipOffset?: number;
    }
  ): Promise<void> {
    const eventId = uuidv4();

    // Create event record
    const event = new AdEventModel({
      eventId,
      campaignId,
      creativeId,
      placementId: metadata.placementId || 'unknown',
      eventType: eventType as 'impression' | 'view' | 'click' | 'skip' | 'complete' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'error',
      deviceId: metadata.deviceId,
      deviceType: metadata.deviceType,
      timestamp: new Date(),
      metadata: {
        geo: metadata.geo,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        podPosition: metadata.podPosition,
        skipOffset: metadata.skipOffset,
      },
    });

    await event.save();

    // Update campaign metrics based on event type
    switch (eventType) {
      case 'view':
      case 'firstQuartile':
        await campaignService.trackView(campaignId);
        break;
      case 'midpoint':
        await campaignService.trackView(campaignId);
        break;
      case 'thirdQuartile':
        await campaignService.trackView(campaignId);
        break;
      case 'complete':
        await campaignService.trackCompletion(campaignId);
        break;
      case 'click':
        await campaignService.trackClick(campaignId);
        break;
      case 'skip':
        await campaignService.trackSkip(campaignId);
        break;
    }
  }
}

export const adDecisionService = new AdDecisionService();