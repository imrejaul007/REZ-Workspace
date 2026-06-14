/**
 * Ad Service - Business logic for search ad management
 */

import { SearchAd, SearchCampaign } from '../models';
import { CreateAdRequest, ISearchAd } from '../types';
import { logger } from 'utils/logger.js';
import { impressionsTotal, clicksTotal } from '../utils/metrics';

export class AdService {
  /**
   * Create a new search ad
   */
  async createAd(campaignId: string, data: CreateAdRequest): Promise<ISearchAd> {
    try {
      logger.info('Creating new search ad', { campaignId, headline: data.headline });

      // Verify campaign exists
      const campaign = await SearchCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const ad = new SearchAd({
        campaignId,
        headline: data.headline,
        description: data.description,
        description2: data.description2,
        url: data.url,
        displayUrl: data.displayUrl,
        finalUrl: data.finalUrl || data.url,
        status: campaign.status === 'active' ? 'active' : 'pending',
      });

      await ad.save();

      logger.info('Search ad created successfully', { adId: ad._id, campaignId });
      return ad;
    } catch (error) {
      logger.error('Failed to create ad', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get ad by ID
   */
  async getAd(adId: string): Promise<ISearchAd | null> {
    try {
      return await SearchAd.findById(adId);
    } catch (error) {
      logger.error('Failed to get ad', { error, adId });
      throw error;
    }
  }

  /**
   * Get ads by campaign
   */
  async getAdsByCampaign(campaignId: string): Promise<ISearchAd[]> {
    try {
      return await SearchAd.findByCampaign(campaignId);
    } catch (error) {
      logger.error('Failed to get ads by campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get active ads by campaign
   */
  async getActiveAdsByCampaign(campaignId: string): Promise<ISearchAd[]> {
    try {
      return await SearchAd.findActiveByCampaign(campaignId);
    } catch (error) {
      logger.error('Failed to get active ads by campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Update ad
   */
  async updateAd(adId: string, updates: Partial<CreateAdRequest>): Promise<ISearchAd | null> {
    try {
      logger.info('Updating ad', { adId, updates });

      const updateData: any = {};
      if (updates.headline) updateData.headline = updates.headline;
      if (updates.description) updateData.description = updates.description;
      if (updates.description2) updateData.description2 = updates.description2;
      if (updates.url) updateData.url = updates.url;
      if (updates.displayUrl) updateData.displayUrl = updates.displayUrl;
      if (updates.finalUrl) updateData.finalUrl = updates.finalUrl;

      const ad = await SearchAd.findByIdAndUpdate(
        adId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (ad) {
        logger.info('Ad updated successfully', { adId });
      }

      return ad;
    } catch (error) {
      logger.error('Failed to update ad', { error, adId });
      throw error;
    }
  }

  /**
   * Pause ad
   */
  async pauseAd(adId: string): Promise<ISearchAd | null> {
    try {
      const ad = await SearchAd.findById(adId);
      if (ad) {
        await ad.pause();
        logger.info('Ad paused', { adId });
        return ad;
      }
      return null;
    } catch (error) {
      logger.error('Failed to pause ad', { error, adId });
      throw error;
    }
  }

  /**
   * Resume ad
   */
  async resumeAd(adId: string): Promise<ISearchAd | null> {
    try {
      const ad = await SearchAd.findById(adId);
      if (ad) {
        await ad.resume();
        logger.info('Ad resumed', { adId });
        return ad;
      }
      return null;
    } catch (error) {
      logger.error('Failed to resume ad', { error, adId });
      throw error;
    }
  }

  /**
   * Delete ad
   */
  async deleteAd(adId: string): Promise<boolean> {
    try {
      const result = await SearchAd.findByIdAndDelete(adId);
      if (result) {
        logger.info('Ad deleted', { adId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete ad', { error, adId });
      throw error;
    }
  }

  /**
   * Update ad rank
   */
  async updateAdRank(adId: string, rank: number): Promise<void> {
    try {
      const ad = await SearchAd.findById(adId);
      if (ad) {
        await ad.updateRank(rank);
      }
    } catch (error) {
      logger.error('Failed to update ad rank', { error, adId, rank });
      throw error;
    }
  }

  /**
   * Get ad count by campaign
   */
  async getAdCountByCampaign(campaignId: string): Promise<number> {
    try {
      return await SearchAd.countByCampaign(campaignId);
    } catch (error) {
      logger.error('Failed to get ad count', { error, campaignId });
      throw error;
    }
  }

  /**
   * Record impression
   */
  async recordImpression(campaignId: string, network: string): Promise<void> {
    try {
      impressionsTotal.inc({ campaign_id: campaignId, network });
    } catch (error) {
      logger.error('Failed to record impression', { error, campaignId });
    }
  }

  /**
   * Record click
   */
  async recordClick(campaignId: string, network: string): Promise<void> {
    try {
      clicksTotal.inc({ campaign_id: campaignId, network });
    } catch (error) {
      logger.error('Failed to record click', { error, campaignId });
    }
  }

  /**
   * Bulk create ads
   */
  async bulkCreateAds(campaignId: string, ads: CreateAdRequest[]): Promise<ISearchAd[]> {
    try {
      logger.info('Bulk creating ads', { campaignId, count: ads.length });

      const campaign = await SearchCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const adDocs = ads.map((ad) => ({
        campaignId,
        headline: ad.headline,
        description: ad.description,
        description2: ad.description2,
        url: ad.url,
        displayUrl: ad.displayUrl,
        finalUrl: ad.finalUrl || ad.url,
        status: campaign.status === 'active' ? 'active' : 'pending',
      }));

      const createdAds = await SearchAd.insertMany(adDocs);
      logger.info('Bulk ads created successfully', { campaignId, count: createdAds.length });

      return createdAds;
    } catch (error) {
      logger.error('Failed to bulk create ads', { error, campaignId });
      throw error;
    }
  }
}

export const adService = new AdService();