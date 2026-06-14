/**
 * Campaign Service - Business logic for campaign operations
 */

import { v4 as uuidv4 } from 'uuid';
import { PartnershipCampaign, IPartnershipCampaign, PartnershipProposal, PartnershipContract } from '../models';
import logger from 'utils/logger.js';
import { brandService } from './brand.service';

export interface CreateCampaignInput {
  brandId: string;
  name: string;
  description?: string;
  goals?: string[];
  budget?: number;
  timeline?: { startDate: string; endDate: string };
  deliverables?: Array<{
    type: 'post' | 'story' | 'reel' | 'video' | 'blog' | 'other';
    count?: number;
    description?: string;
  }>;
  requirements?: Array<{ type: string; value: string }>;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  goals?: string[];
  budget?: number;
  timeline?: { startDate: string; endDate: string };
  deliverables?: Array<{
    type: 'post' | 'story' | 'reel' | 'video' | 'blog' | 'other';
    count?: number;
    description?: string;
  }>;
  requirements?: Array<{ type: string; value: string }>;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface CampaignStats {
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  activeContracts: number;
  totalBudget: number;
  totalSpend: number;
  avgEngagement: number;
}

export interface MatchResult {
  influencerId: string;
  score: number;
  reason: string;
}

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<IPartnershipCampaign> {
    const campaignId = `camp-${uuidv4().slice(0, 8)}`;

    const campaign = new PartnershipCampaign({
      campaignId,
      ...input,
      createdAt: new Date()
    });

    await campaign.save();

    // Update brand stats
    await brandService.incrementCampaignStats(input.brandId, input.budget || 0);

    logger.info(`Campaign created: ${campaignId}`, {
      name: input.name,
      brandId: input.brandId
    });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<IPartnershipCampaign | null> {
    return PartnershipCampaign.findOne({ campaignId });
  }

  /**
   * Get campaigns by brand ID
   */
  async getCampaignsByBrandId(brandId: string): Promise<IPartnershipCampaign[]> {
    return PartnershipCampaign.find({ brandId }).sort({ createdAt: -1 });
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<IPartnershipCampaign | null> {
    const campaign = await PartnershipCampaign.findOneAndUpdate(
      { campaignId },
      { $set: input },
      { new: true }
    );

    if (campaign) {
      logger.info(`Campaign updated: ${campaignId}`, input);
    }

    return campaign;
  }

  /**
   * List campaigns with filters
   */
  async listCampaigns(options: {
    page?: number;
    limit?: number;
    brandId?: string;
    status?: string;
    minBudget?: number;
    maxBudget?: number;
  }): Promise<{ campaigns: IPartnershipCampaign[]; total: number; page: number; limit: number; pages: number }> {
    const { page = 1, limit = 20, brandId, status, minBudget, maxBudget } = options;
    const query: Record<string, any> = {};

    if (brandId) query.brandId = brandId;
    if (status) query.status = status;
    if (minBudget !== undefined || maxBudget !== undefined) {
      query.budget = {};
      if (minBudget !== undefined) query.budget.$gte = minBudget;
      if (maxBudget !== undefined) query.budget.$lte = maxBudget;
    }

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      PartnershipCampaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PartnershipCampaign.countDocuments(query)
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    const campaign = await PartnershipCampaign.findOne({ campaignId });
    if (!campaign) return null;

    const [proposals, contracts] = await Promise.all([
      PartnershipProposal.find({ campaignId }),
      PartnershipContract.find({ campaignId, status: 'active' })
    ]);

    const pendingProposals = proposals.filter(p => p.status === 'pending').length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;

    const avgEngagement = campaign.totalViews > 0
      ? (campaign.totalEngagement / campaign.totalViews) * 100
      : 0;

    return {
      totalProposals: campaign.totalProposals,
      pendingProposals,
      acceptedProposals,
      rejectedProposals,
      activeContracts: contracts.length,
      totalBudget: campaign.budget || 0,
      totalSpend: campaign.totalSpend,
      avgEngagement: Math.round(avgEngagement * 100) / 100
    };
  }

  /**
   * Match influencers to campaign (simplified matching algorithm)
   */
  async matchInfluencers(
    campaignId: string,
    filters: {
      minFollowers?: number;
      maxFollowers?: number;
      categories?: string[];
      minEngagementRate?: number;
      location?: string;
    } = {}
  ): Promise<MatchResult[]> {
    const campaign = await PartnershipCampaign.findOne({ campaignId });
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // This is a simplified implementation
    // In production, this would call REZ-Intelligence or a matching service
    const mockInfluencers: MatchResult[] = [
      {
        influencerId: 'inf-001',
        score: 95,
        reason: 'High engagement rate (8.5%) in target category'
      },
      {
        influencerId: 'inf-002',
        score: 87,
        reason: 'Strong follower count (500K) matching campaign requirements'
      },
      {
        influencerId: 'inf-003',
        score: 82,
        reason: 'Good content alignment with brand values'
      }
    ];

    // Apply filters
    let filtered = mockInfluencers;
    if (filters.minEngagementRate) {
      filtered = filtered.filter(i => i.score >= filters.minEngagementRate! * 10);
    }

    logger.info(`Matched ${filtered.length} influencers for campaign ${campaignId}`);
    return filtered;
  }

  /**
   * Update campaign stats
   */
  async updateCampaignStats(
    campaignId: string,
    stats: { totalViews?: number; totalEngagement?: number; totalSpend?: number }
  ): Promise<void> {
    const update: Record<string, any> = {};
    if (stats.totalViews !== undefined) update.totalViews = stats.totalViews;
    if (stats.totalEngagement !== undefined) update.totalEngagement = stats.totalEngagement;
    if (stats.totalSpend !== undefined) update.totalSpend = stats.totalSpend;

    await PartnershipCampaign.findOneAndUpdate({ campaignId }, { $inc: update });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const result = await PartnershipCampaign.deleteOne({ campaignId });
    if (result.deletedCount > 0) {
      logger.info(`Campaign deleted: ${campaignId}`);
      return true;
    }
    return false;
  }
}

export const campaignService = new CampaignService();