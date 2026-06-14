import { v4 as uuidv4 } from 'uuid';
import { ClientCampaign, IClientCampaign, Client } from '../models';
import { logger, campaignOperationsTotal } from '../utils';
import { LinkedCampaign } from '../types';

export class CampaignLinkService {
  /**
   * Link a campaign to a client
   */
  async linkCampaign(data: {
    clientId: string;
    campaignId: string;
    name: string;
    budget?: number;
    startDate: Date;
    endDate?: Date;
  }): Promise<LinkedCampaign> {
    try {
      // Verify client exists
      const client = await Client.findOne({ clientId: data.clientId });
      if (!client) {
        throw new Error('Client not found');
      }

      const campaign = new ClientCampaign({
        campaignId: data.campaignId,
        clientId: data.clientId,
        name: data.name,
        status: 'draft',
        budget: {
          allocated: data.budget || 0,
          spent: 0,
          remaining: data.budget || 0,
          currency: client.budget.currency,
        },
        dates: {
          start: data.startDate,
          end: data.endDate,
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
        },
      });

      await campaign.save();

      // Update client's campaign list
      await Client.updateOne(
        { clientId: data.clientId },
        { $push: { campaigns: campaign._id } }
      );

      campaignOperationsTotal.inc({ operation: 'link', status: 'success' });
      logger.info('Campaign linked to client', {
        campaignId: data.campaignId,
        clientId: data.clientId,
        name: data.name,
      });

      return this.formatCampaign(campaign);
    } catch (error) {
      campaignOperationsTotal.inc({ operation: 'link', status: 'error' });
      logger.error('Failed to link campaign', { error, data });
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<LinkedCampaign | null> {
    try {
      const campaign = await ClientCampaign.findOne({ campaignId });

      if (!campaign) {
        logger.warn('Campaign not found', { campaignId });
        return null;
      }

      return this.formatCampaign(campaign);
    } catch (error) {
      logger.error('Failed to get campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get all campaigns for a client
   */
  async getClientCampaigns(
    clientId: string,
    options?: { status?: string; page?: number; limit?: number }
  ): Promise<{ campaigns: LinkedCampaign[]; total: number }> {
    try {
      const filter: any = { clientId };

      if (options?.status) {
        filter.status = options.status;
      }

      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const [campaigns, total] = await Promise.all([
        ClientCampaign.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ClientCampaign.countDocuments(filter),
      ]);

      return {
        campaigns: campaigns.map(c => this.formatCampaign(c as IClientCampaign)),
        total,
      };
    } catch (error) {
      logger.error('Failed to get client campaigns', { error, clientId });
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    data: {
      name?: string;
      status?: 'active' | 'paused' | 'completed' | 'draft' | 'archived';
      budget?: {
        allocated?: number;
        spent?: number;
      };
      dates?: {
        start?: Date;
        end?: Date;
      };
      performance?: {
        impressions?: number;
        clicks?: number;
        conversions?: number;
      };
      targeting?: {
        demographics?: Record<string, any>;
        locations?: string[];
        interests?: string[];
      };
    }
  ): Promise<LinkedCampaign | null> {
    try {
      const campaign = await ClientCampaign.findOne({ campaignId });

      if (!campaign) {
        logger.warn('Campaign not found for update', { campaignId });
        return null;
      }

      // Update fields
      if (data.name) campaign.name = data.name;
      if (data.status) campaign.status = data.status;
      if (data.budget) {
        campaign.budget = {
          ...campaign.budget.toObject(),
          ...data.budget,
          remaining: data.budget.allocated
            ? data.budget.allocated - (data.budget.spent ?? campaign.budget.spent)
            : campaign.budget.remaining,
        };
      }
      if (data.dates) {
        campaign.dates = {
          ...campaign.dates.toObject(),
          ...data.dates,
        };
      }
      if (data.performance) {
        const perf = { ...campaign.performance.toObject(), ...data.performance };
        // Calculate derived metrics
        perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
        perf.cpc = perf.clicks > 0 ? campaign.budget.spent / perf.clicks : 0;
        campaign.performance = perf;
      }
      if (data.targeting) {
        campaign.targeting = {
          ...campaign.targeting.toObject(),
          ...data.targeting,
        };
      }

      await campaign.save();

      campaignOperationsTotal.inc({ operation: 'update', status: 'success' });
      logger.info('Campaign updated', { campaignId, updates: Object.keys(data) });

      return this.formatCampaign(campaign);
    } catch (error) {
      campaignOperationsTotal.inc({ operation: 'update', status: 'error' });
      logger.error('Failed to update campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Update campaign performance metrics
   */
  async updateCampaignPerformance(
    campaignId: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      spent?: number;
    }
  ): Promise<LinkedCampaign | null> {
    try {
      const campaign = await ClientCampaign.findOne({ campaignId });

      if (!campaign) {
        return null;
      }

      // Update performance
      if (metrics.impressions !== undefined) {
        campaign.performance.impressions = metrics.impressions;
      }
      if (metrics.clicks !== undefined) {
        campaign.performance.clicks = metrics.clicks;
      }
      if (metrics.conversions !== undefined) {
        campaign.performance.conversions = metrics.conversions;
      }
      if (metrics.spent !== undefined) {
        campaign.budget.spent = metrics.spent;
        campaign.budget.remaining = campaign.budget.allocated - metrics.spent;
      }

      // Recalculate derived metrics
      const p = campaign.performance;
      p.ctr = p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0;
      p.cpc = p.clicks > 0 ? campaign.budget.spent / p.clicks : 0;
      // ROAS would need revenue data - placeholder calculation
      p.roas = campaign.budget.spent > 0 ? (p.conversions * 100) / campaign.budget.spent : 0;

      await campaign.save();

      // Update client's aggregate performance
      await this.updateClientPerformance(campaign.clientId);

      return this.formatCampaign(campaign);
    } catch (error) {
      logger.error('Failed to update campaign performance', { error, campaignId });
      throw error;
    }
  }

  /**
   * Unlink campaign from client
   */
  async unlinkCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = await ClientCampaign.findOne({ campaignId });

      if (!campaign) {
        return false;
      }

      const clientId = campaign.clientId;

      await ClientCampaign.findOneAndDelete({ campaignId });

      // Remove from client's campaign list
      await Client.updateOne(
        { clientId },
        { $pull: { campaigns: campaign._id } }
      );

      campaignOperationsTotal.inc({ operation: 'unlink', status: 'success' });
      logger.info('Campaign unlinked from client', { campaignId, clientId });

      return true;
    } catch (error) {
      campaignOperationsTotal.inc({ operation: 'unlink', status: 'error' });
      logger.error('Failed to unlink campaign', { error, campaignId });
      throw error;
    }
  }

  /**
   * Update client's aggregate performance from campaigns
   */
  private async updateClientPerformance(clientId: string): Promise<void> {
    try {
      const campaigns = await ClientCampaign.find({ clientId });

      const totals = campaigns.reduce(
        (acc, c) => ({
          impressions: acc.impressions + c.performance.impressions,
          clicks: acc.clicks + c.performance.clicks,
          conversions: acc.conversions + c.performance.conversions,
          spend: acc.spend + c.budget.spent,
        }),
        { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
      );

      await Client.updateOne(
        { clientId },
        {
          $set: {
            'performance.totalImpressions': totals.impressions,
            'performance.totalClicks': totals.clicks,
            'performance.totalConversions': totals.conversions,
            'performance.avgCTR': totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
            'performance.avgCPC': totals.clicks > 0 ? totals.spend / totals.clicks : 0,
            'performance.avgROAS': totals.spend > 0 ? (totals.conversions * 100) / totals.spend : 0,
            'spending.total': totals.spend,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to update client performance', { error, clientId });
    }
  }

  /**
   * Format campaign document
   */
  private formatCampaign(campaign: any): LinkedCampaign {
    return {
      campaignId: campaign.campaignId,
      clientId: campaign.clientId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget?.toObject ? campaign.budget.toObject() : campaign.budget,
      dates: campaign.dates?.toObject ? campaign.dates.toObject() : campaign.dates,
      performance: campaign.performance?.toObject ? campaign.performance.toObject() : campaign.performance,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}

export const campaignLinkService = new CampaignLinkService();
export default campaignLinkService;