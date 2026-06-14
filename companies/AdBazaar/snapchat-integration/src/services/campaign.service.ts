import { SnapchatCampaign } from '../models/snapchatCampaign.model.js';
import { SnapchatAdAccount } from '../models/snapchatAdAccount.model.js';
import { snapchatApiService } from './snapchatApi.service.js';
import { generateId } from '../utils/helpers.js';
import { logger } from 'utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateCampaignParams {
  adAccountId: string;
  name: string;
  objective: 'VIDEO_VIEW' | 'WEB_VIEW' | 'APP_INSTALL' | 'AUDIENCE' | 'BRAND_AWARENESS';
  dailyBudget: number;
  totalBudget: number;
  startDate: Date;
  endDate?: Date;
  targeting?: {
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    countries?: string[];
    interests?: string[];
  };
}

export interface UpdateCampaignParams {
  name?: string;
  objective?: 'VIDEO_VIEW' | 'WEB_VIEW' | 'APP_INSTALL' | 'AUDIENCE' | 'BRAND_AWARENESS';
  dailyBudget?: number;
  totalBudget?: number;
  startDate?: Date;
  endDate?: Date;
  targeting?: {
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    countries?: string[];
    interests?: string[];
  };
}

class CampaignService {
  async createCampaign(
    organizationId: string,
    params: CreateCampaignParams
  ): Promise<SnapchatCampaign> {
    const adAccount = await SnapchatAdAccount.findOne({
      id: params.adAccountId,
      organizationId,
      status: 'connected',
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found or not connected');
    }

    const campaign = new SnapchatCampaign({
      id: generateId('camp'),
      adAccountId: params.adAccountId,
      name: params.name,
      objective: params.objective,
      status: 'PAUSED',
      dailyBudget: params.dailyBudget,
      totalBudget: params.totalBudget,
      startDate: params.startDate,
      endDate: params.endDate,
      targeting: {
        ageMin: params.targeting?.ageMin || 13,
        ageMax: params.targeting?.ageMax || 65,
        genders: params.targeting?.genders || ['ALL'],
        countries: params.targeting?.countries || ['US'],
        interests: params.targeting?.interests,
      },
    });

    if (adAccount.accessToken) {
      snapchatApiService.setAccessToken(adAccount.accessToken);

      try {
        const snapchatCampaign = await snapchatApiService.createCampaign(
          adAccount.snapchatAccountId,
          {
            name: params.name,
            objective: params.objective,
            daily_budget_micro: params.dailyBudget * 1000000,
            total_budget_micro: params.totalBudget * 1000000,
            start_time: params.startDate.toISOString(),
            end_time: params.endDate?.toISOString(),
          }
        );

        campaign.snapchatCampaignId = snapchatCampaign.id;
      } catch (error) {
        logger.warn('Failed to create campaign in Snapchat, saving locally', { error });
      }
    }

    await campaign.save();

    logger.info('Campaign created', {
      organizationId,
      campaignId: campaign.id,
      name: params.name,
    });

    return campaign;
  }

  async getCampaigns(
    organizationId: string,
    adAccountId?: string
  ): Promise<SnapchatCampaign[]> {
    const query: Record<string, unknown> = {};

    if (adAccountId) {
      query.adAccountId = adAccountId;
    }

    const adAccounts = await SnapchatAdAccount.find({
      organizationId,
      status: 'connected',
    });

    query.adAccountId = { $in: adAccounts.map((acc) => acc.id) };

    return SnapchatCampaign.find(query).sort({ createdAt: -1 });
  }

  async getCampaign(organizationId: string, campaignId: string): Promise<SnapchatCampaign> {
    const campaign = await SnapchatCampaign.findOne({
      id: campaignId,
    });

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

    return campaign;
  }

  async updateCampaign(
    organizationId: string,
    campaignId: string,
    updates: UpdateCampaignParams
  ): Promise<SnapchatCampaign> {
    const campaign = await this.getCampaign(organizationId, campaignId);

    if (updates.name) campaign.name = updates.name;
    if (updates.objective) campaign.objective = updates.objective;
    if (updates.dailyBudget !== undefined) campaign.dailyBudget = updates.dailyBudget;
    if (updates.totalBudget !== undefined) campaign.totalBudget = updates.totalBudget;
    if (updates.startDate) campaign.startDate = updates.startDate;
    if (updates.endDate) campaign.endDate = updates.endDate;
    if (updates.targeting) {
      campaign.targeting = {
        ageMin: updates.targeting.ageMin || campaign.targeting.ageMin,
        ageMax: updates.targeting.ageMax || campaign.targeting.ageMax,
        genders: updates.targeting.genders || campaign.targeting.genders,
        countries: updates.targeting.countries || campaign.targeting.countries,
        interests: updates.targeting.interests || campaign.targeting.interests,
      };
    }

    if (campaign.snapchatCampaignId) {
      const adAccount = await SnapchatAdAccount.findOne({ id: campaign.adAccountId });
      if (adAccount?.accessToken) {
        snapchatApiService.setAccessToken(adAccount.accessToken);

        try {
          await snapchatApiService.updateCampaign(
            adAccount.snapchatAccountId,
            campaign.snapchatCampaignId,
            {
              name: campaign.name,
              objective: campaign.objective,
              daily_budget_micro: campaign.dailyBudget * 1000000,
              total_budget_micro: campaign.totalBudget * 1000000,
              start_time: campaign.startDate.toISOString(),
              end_time: campaign.endDate?.toISOString(),
            }
          );
        } catch (error) {
          logger.warn('Failed to update campaign in Snapchat', { error });
        }
      }
    }

    await campaign.save();

    logger.info('Campaign updated', { organizationId, campaignId });

    return campaign;
  }

  async startCampaign(organizationId: string, campaignId: string): Promise<SnapchatCampaign> {
    const campaign = await this.getCampaign(organizationId, campaignId);

    campaign.status = 'ACTIVE';

    if (campaign.snapchatCampaignId) {
      const adAccount = await SnapchatAdAccount.findOne({ id: campaign.adAccountId });
      if (adAccount?.accessToken) {
        snapchatApiService.setAccessToken(adAccount.accessToken);

        try {
          await snapchatApiService.startCampaign(
            adAccount.snapchatAccountId,
            campaign.snapchatCampaignId
          );
        } catch (error) {
          logger.warn('Failed to start campaign in Snapchat', { error });
        }
      }
    }

    await campaign.save();

    logger.info('Campaign started', { organizationId, campaignId });

    return campaign;
  }

  async pauseCampaign(organizationId: string, campaignId: string): Promise<SnapchatCampaign> {
    const campaign = await this.getCampaign(organizationId, campaignId);

    campaign.status = 'PAUSED';

    if (campaign.snapchatCampaignId) {
      const adAccount = await SnapchatAdAccount.findOne({ id: campaign.adAccountId });
      if (adAccount?.accessToken) {
        snapchatApiService.setAccessToken(adAccount.accessToken);

        try {
          await snapchatApiService.pauseCampaign(
            adAccount.snapchatAccountId,
            campaign.snapchatCampaignId
          );
        } catch (error) {
          logger.warn('Failed to pause campaign in Snapchat', { error });
        }
      }
    }

    await campaign.save();

    logger.info('Campaign paused', { organizationId, campaignId });

    return campaign;
  }

  async getCampaignAnalytics(
    organizationId: string,
    campaignId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    const campaign = await this.getCampaign(organizationId, campaignId);

    if (!campaign.snapchatCampaignId) {
      return {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
      };
    }

    const adAccount = await SnapchatAdAccount.findOne({ id: campaign.adAccountId });
    if (!adAccount?.accessToken) {
      return {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
      };
    }

    snapchatApiService.setAccessToken(adAccount.accessToken);

    try {
      return await snapchatApiService.getCampaignAnalytics(
        adAccount.snapchatAccountId,
        campaign.snapchatCampaignId,
        startDate,
        endDate
      );
    } catch (error) {
      logger.warn('Failed to get campaign analytics from Snapchat', { error });
      return {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
      };
    }
  }
}

export const campaignService = new CampaignService();
export default campaignService;