import { SnapchatAd } from '../models/snapchatAd.model.js';
import { SnapchatCampaign } from '../models/snapchatCampaign.model.js';
import { SnapchatAdAccount } from '../models/snapchatAdAccount.model.js';
import { snapchatApiService } from './snapchatApi.service.js';
import { generateId } from '../utils/helpers.js';
import { logger } from 'utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateAdParams {
  campaignId: string;
  name: string;
  type: 'SNAP_AD' | 'STORY_AD' | 'COLLECTION_AD' | 'FILTER';
  creative: {
    headline: string;
    body: string;
    callToAction: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
  };
}

class AdService {
  async createAd(
    organizationId: string,
    params: CreateAdParams
  ): Promise<SnapchatAd> {
    const campaign = await SnapchatCampaign.findOne({ id: params.campaignId });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const adAccount = await SnapchatAdAccount.findOne({
      id: campaign.adAccountId,
      organizationId,
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found');
    }

    const ad = new SnapchatAd({
      id: generateId('ad'),
      campaignId: params.campaignId,
      name: params.name,
      type: params.type,
      status: 'PAUSED',
      creative: params.creative,
      stats: {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
      },
    });

    if (adAccount.accessToken) {
      snapchatApiService.setAccessToken(adAccount.accessToken);

      try {
        const snapchatAd = await snapchatApiService.createAd(
          adAccount.snapchatAccountId,
          campaign.snapchatCampaignId || '',
          {
            name: params.name,
            type: params.type,
            creative: {
              ...params.creative,
              call_to_action: params.creative.callToAction,
            } as unknown as Record<string, unknown>,
          }
        );

        ad.snapchatAdId = snapchatAd.id;
      } catch (error) {
        logger.warn('Failed to create ad in Snapchat, saving locally', { error });
      }
    }

    await ad.save();

    logger.info('Ad created', {
      organizationId,
      adId: ad.id,
      campaignId: params.campaignId,
    });

    return ad;
  }

  async getAds(
    organizationId: string,
    campaignId?: string
  ): Promise<SnapchatAd[]> {
    const query: Record<string, unknown> = {};

    if (campaignId) {
      const campaign = await SnapchatCampaign.findOne({ id: campaignId });
      if (campaign) {
        query.campaignId = campaignId;
      }
    } else {
      const adAccounts = await SnapchatAdAccount.find({
        organizationId,
        status: 'connected',
      });

      const campaigns = await SnapchatCampaign.find({
        adAccountId: { $in: adAccounts.map((acc) => acc.id) },
      });

      query.campaignId = { $in: campaigns.map((c) => c.id) };
    }

    return SnapchatAd.find(query).sort({ createdAt: -1 });
  }

  async getAd(organizationId: string, adId: string): Promise<SnapchatAd> {
    const ad = await SnapchatAd.findOne({ id: adId });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    const campaign = await SnapchatCampaign.findOne({ id: ad.campaignId });
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const adAccount = await SnapchatAdAccount.findOne({
      id: campaign.adAccountId,
      organizationId,
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found');
    }

    return ad;
  }

  async updateAdStatus(
    organizationId: string,
    adId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<SnapchatAd> {
    const ad = await this.getAd(organizationId, adId);

    ad.status = status;
    await ad.save();

    logger.info('Ad status updated', { organizationId, adId, status });

    return ad;
  }

  async getAdAnalytics(
    organizationId: string,
    adId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    const ad = await this.getAd(organizationId, adId);

    if (!ad.snapchatAdId) {
      return ad.stats;
    }

    const campaign = await SnapchatCampaign.findOne({ id: ad.campaignId });
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const adAccount = await SnapchatAdAccount.findOne({
      id: campaign.adAccountId,
      organizationId,
    });

    if (!adAccount?.accessToken) {
      return ad.stats;
    }

    snapchatApiService.setAccessToken(adAccount.accessToken);

    try {
      const analytics = await snapchatApiService.getAdAnalytics(
        adAccount.snapchatAccountId,
        ad.snapchatAdId,
        startDate,
        endDate
      );

      return analytics;
    } catch (error) {
      logger.warn('Failed to get ad analytics from Snapchat', { error });
      return ad.stats;
    }
  }
}

export const adService = new AdService();
export default adService;