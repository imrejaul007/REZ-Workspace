/**
 * Campaign Service - Business logic for search campaign management
 */

import { v4 as uuidv4 } from 'uuid';
import { SearchCampaign } from '../models';
import { CreateCampaignRequest, ISearchCampaign } from '../types';
import { logger } from 'utils/logger.js';
import { activeCampaigns } from '../utils/metrics';

export class CampaignService {
  /**
   * Create a new search campaign
   */
  async createCampaign(data: CreateCampaignRequest): Promise<ISearchCampaign> {
    try {
      logger.info('Creating new search campaign', { name: data.name, advertiserId: data.advertiserId });

      const campaign = new SearchCampaign({
        name: data.name,
        advertiserId: data.advertiserId,
        budget: {
          daily: data.budget.daily,
          total: data.budget.total,
          spent: 0,
        },
        network: data.network || 'all',
        status: 'pending',
        targeting: {
          locations: data.targeting?.locations || [],
          languages: data.targeting?.languages || ['en'],
          devices: data.targeting?.devices || ['all'],
          ageRanges: data.targeting?.ageRanges || [],
        },
        bidding: {
          strategy: data.bidding?.strategy || 'cpc',
          defaultCpc: data.bidding?.defaultCpc || 1.0,
          targetRoas: data.bidding?.targetRoas,
        },
        startDate: data.startDate || new Date(),
        endDate: data.endDate,
      });

      await campaign.save();

      logger.info('Search campaign created successfully', { campaignId: campaign._id });
      return campaign;
    } catch (error) {
      logger.error('Failed to create campaign', { error, data });
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<ISearchCampaign | null> {
    try {
      const campaign = await SearchCampaign.findById(campaignId);
      return campaign;
    } catch (error) {
      logger.error('Failed to get campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get all campaigns with pagination
   */
  async listCampaigns(
    filters: {
      advertiserId?: string;
      status?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<{ campaigns: ISearchCampaign[]; total: number; page: number; totalPages: number }> {
    try {
      const { advertiserId, status, limit = 20, page = 1 } = filters;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (advertiserId) query.advertiserId = advertiserId;
      if (status) query.status = status;

      const [campaigns, total] = await Promise.all([
        SearchCampaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        SearchCampaign.countDocuments(query),
      ]);

      return {
        campaigns,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to list campaigns', { error, filters });
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignRequest>
  ): Promise<ISearchCampaign | null> {
    try {
      logger.info('Updating campaign', { campaignId, updates });

      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.budget) {
        updateData['budget.daily'] = updates.budget.daily;
        updateData['budget.total'] = updates.budget.total;
      }
      if (updates.network) updateData.network = updates.network;
      if (updates.targeting) {
        if (updates.targeting.locations) updateData['targeting.locations'] = updates.targeting.locations;
        if (updates.targeting.languages) updateData['targeting.languages'] = updates.targeting.languages;
        if (updates.targeting.devices) updateData['targeting.devices'] = updates.targeting.devices;
        if (updates.targeting.ageRanges) updateData['targeting.ageRanges'] = updates.targeting.ageRanges;
      }
      if (updates.bidding) {
        if (updates.bidding.strategy) updateData['bidding.strategy'] = updates.bidding.strategy;
        if (updates.bidding.defaultCpc) updateData['bidding.defaultCpc'] = updates.bidding.defaultCpc;
        if (updates.bidding.targetRoas) updateData['bidding.targetRoas'] = updates.bidding.targetRoas;
      }
      if (updates.startDate) updateData.startDate = updates.startDate;
      if (updates.endDate) updateData.endDate = updates.endDate;

      const campaign = await SearchCampaign.findByIdAndUpdate(
        campaignId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (campaign) {
        logger.info('Campaign updated successfully', { campaignId });
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to update campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Activate campaign
   */
  async activateCampaign(campaignId: string): Promise<ISearchCampaign | null> {
    try {
      const campaign = await SearchCampaign.findByIdAndUpdate(
        campaignId,
        { $set: { status: 'active' } },
        { new: true }
      );

      if (campaign) {
        await this.updateActiveCampaignsMetric();
        logger.info('Campaign activated', { campaignId });
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to activate campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<ISearchCampaign | null> {
    try {
      const campaign = await SearchCampaign.findByIdAndUpdate(
        campaignId,
        { $set: { status: 'paused' } },
        { new: true }
      );

      if (campaign) {
        await this.updateActiveCampaignsMetric();
        logger.info('Campaign paused', { campaignId });
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to pause campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * End campaign
   */
  async endCampaign(campaignId: string): Promise<ISearchCampaign | null> {
    try {
      const campaign = await SearchCampaign.findByIdAndUpdate(
        campaignId,
        { $set: { status: 'ended' } },
        { new: true }
      );

      if (campaign) {
        await this.updateActiveCampaignsMetric();
        logger.info('Campaign ended', { campaignId });
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to end campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Add spend to campaign
   */
  async addSpend(campaignId: string, amount: number): Promise<void> {
    try {
      await SearchCampaign.findByIdAndUpdate(campaignId, {
        $inc: { 'budget.spent': amount },
      });
      logger.debug('Added spend to campaign', { campaignId, amount });
    } catch (error) {
      logger.error('Failed to add spend', { error, campaignId, amount });
      throw error;
    }
  }

  /**
   * Get campaign by advertiser
   */
  async getCampaignsByAdvertiser(advertiserId: string): Promise<ISearchCampaign[]> {
    try {
      return await SearchCampaign.findByAdvertiser(advertiserId);
    } catch (error) {
      logger.error('Failed to get campaigns by advertiser', { error, advertiserId });
      throw error;
    }
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<ISearchCampaign[]> {
    try {
      return await SearchCampaign.findActive();
    } catch (error) {
      logger.error('Failed to get active campaigns', { error });
      throw error;
    }
  }

  /**
   * Update active campaigns metric
   */
  private async updateActiveCampaignsMetric(): Promise<void> {
    try {
      const count = await SearchCampaign.countDocuments({ status: 'active' });
      activeCampaigns.set(count);
    } catch (error) {
      logger.error('Failed to update active campaigns metric', { error });
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      const result = await SearchCampaign.findByIdAndDelete(campaignId);
      if (result) {
        await this.updateActiveCampaignsMetric();
        logger.info('Campaign deleted', { campaignId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete campaign', { error, campaignId });
      throw error;
    }
  }
}

export const campaignService = new CampaignService();