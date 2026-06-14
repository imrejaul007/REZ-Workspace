import {
  RetailCampaign,
  IRetailCampaign,
  CampaignStatus,
  CampaignObjective,
  BidStrategy
} from '../models';
import { logger } from '../utils/logger';
import { campaignsTotal, activeCampaigns, adImpressionsTotal, adClicksTotal } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCampaignInput {
  retailerId: string;
  advertiserId: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  bidStrategy?: BidStrategy;
  budget: {
    total: number;
    daily?: number;
  };
  targeting?: IRetailCampaign['targeting'];
  products: IRetailCampaign['products'];
  creativeAssets?: IRetailCampaign['creativeAssets'];
  schedule: {
    startDate: Date;
    endDate: Date;
    flighting?: Array<{
      startDate: Date;
      endDate: Date;
      budgetPercent: number;
    }>;
  };
  attribution?: Partial<IRetailCampaign['attribution']>;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  objective?: CampaignObjective;
  status?: CampaignStatus;
  bidStrategy?: BidStrategy;
  budget?: {
    total?: number;
    daily?: number;
  };
  targeting?: IRetailCampaign['targeting'];
  products?: IRetailCampaign['products'];
  creativeAssets?: IRetailCampaign['creativeAssets'];
  schedule?: IRetailCampaign['schedule'];
  attribution?: Partial<IRetailCampaign['attribution']>;
}

export interface AddAdInput {
  productId: string;
  name: string;
  category: string;
  bidAmount: number;
  adSchedule: {
    startDate: Date;
    endDate: Date;
    days?: string[];
    hours?: { start: number; end: number };
  };
}

export interface UpdatePerformanceInput {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}

class CampaignService {
  async create(input: CreateCampaignInput): Promise<IRetailCampaign> {
    try {
      const campaign = new RetailCampaign({
        retailerId: input.retailerId,
        advertiserId: input.advertiserId,
        name: input.name,
        description: input.description,
        objective: input.objective,
        bidStrategy: input.bidStrategy || 'cpm',
        budget: {
          total: input.budget.total,
          daily: input.budget.daily,
          spent: 0,
          remaining: input.budget.total
        },
        targeting: input.targeting,
        products: input.products,
        creativeAssets: input.creativeAssets || [],
        schedule: input.schedule,
        attribution: {
          enabled: input.attribution?.enabled ?? true,
          model: input.attribution?.model || 'last_touch',
          windowDays: input.attribution?.windowDays || 7
        },
        status: 'draft'
      });

      await campaign.save();
      logger.info(`Campaign created: ${campaign._id} - ${campaign.name}`);

      // Update metrics
      campaignsTotal.inc();

      return campaign;
    } catch (error) {
      logger.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<IRetailCampaign | null> {
    try {
      const campaign = await RetailCampaign.findById(id);
      return campaign;
    } catch (error) {
      logger.error(`Error fetching campaign ${id}:`, error);
      throw error;
    }
  }

  async list(filters?: {
    retailerId?: string;
    advertiserId?: string;
    status?: CampaignStatus;
    objective?: CampaignObjective;
    limit?: number;
    offset?: number;
  }): Promise<{ campaigns: IRetailCampaign[]; total: number }> {
    try {
      const query: Record<string, unknown> = {};

      if (filters?.retailerId) {
        query.retailerId = filters.retailerId;
      }
      if (filters?.advertiserId) {
        query.advertiserId = filters.advertiserId;
      }
      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.objective) {
        query.objective = filters.objective;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const [campaigns, total] = await Promise.all([
        RetailCampaign.find(query).skip(offset).limit(limit).sort({ createdAt: -1 }),
        RetailCampaign.countDocuments(query)
      ]);

      return { campaigns, total };
    } catch (error) {
      logger.error('Error listing campaigns:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateCampaignInput): Promise<IRetailCampaign | null> {
    try {
      const updateData: Record<string, unknown> = { ...input };

      if (input.budget) {
        const current = await RetailCampaign.findById(id);
        if (current) {
          updateData.budget = {
            ...current.budget.toObject(),
            ...input.budget,
            remaining: (input.budget.total || current.budget.total) - current.budget.spent
          };
        }
      }

      const campaign = await RetailCampaign.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (campaign) {
        logger.info(`Campaign updated: ${id}`);
      }

      return campaign;
    } catch (error) {
      logger.error(`Error updating campaign ${id}:`, error);
      throw error;
    }
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<IRetailCampaign | null> {
    try {
      const campaign = await RetailCampaign.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      );

      if (campaign) {
        logger.info(`Campaign status updated: ${id} - ${status}`);

        // Update active campaigns metric
        const activeCount = await RetailCampaign.countDocuments({ status: 'active' });
        activeCampaigns.set(activeCount);
      }

      return campaign;
    } catch (error) {
      logger.error(`Error updating campaign status ${id}:`, error);
      throw error;
    }
  }

  async addAd(id: string, ad: AddAdInput): Promise<IRetailCampaign | null> {
    try {
      const campaign = await RetailCampaign.findByIdAndUpdate(
        id,
        {
          $push: {
            products: {
              productId: ad.productId,
              name: ad.name,
              category: ad.category,
              bidAmount: ad.bidAmount,
              adSchedule: {
                startDate: ad.adSchedule.startDate,
                endDate: ad.adSchedule.endDate,
                days: ad.adSchedule.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                hours: ad.adSchedule.hours || { start: 0, end: 24 }
              }
            }
          }
        },
        { new: true, runValidators: true }
      );

      if (campaign) {
        logger.info(`Ad added to campaign ${id}: ${ad.productId}`);
      }

      return campaign;
    } catch (error) {
      logger.error(`Error adding ad to campaign ${id}:`, error);
      throw error;
    }
  }

  async updatePerformance(id: string, input: UpdatePerformanceInput): Promise<IRetailCampaign | null> {
    try {
      const updateOps: Record<string, unknown> = {};

      if (input.impressions !== undefined) {
        updateOps['performance.impressions'] = input.impressions;
        adImpressionsTotal.inc({ retailer_id: '', campaign_id: id }, input.impressions);
      }
      if (input.clicks !== undefined) {
        updateOps['performance.clicks'] = input.clicks;
        adClicksTotal.inc({ retailer_id: '', campaign_id: id }, input.clicks);
      }
      if (input.conversions !== undefined) {
        updateOps['performance.conversions'] = input.conversions;
      }
      if (input.revenue !== undefined) {
        updateOps['performance.revenue'] = input.revenue;
      }

      const campaign = await RetailCampaign.findByIdAndUpdate(
        id,
        { $inc: updateOps },
        { new: true }
      );

      if (campaign) {
        // Recalculate derived metrics
        const { impressions, clicks, conversions, revenue } = campaign.performance;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
        const roas = campaign.budget.spent > 0 ? revenue / campaign.budget.spent : 0;
        const avgCpc = clicks > 0 ? campaign.budget.spent / clicks : 0;
        const avgCpm = impressions > 0 ? (campaign.budget.spent / impressions) * 1000 : 0;

        await RetailCampaign.findByIdAndUpdate(id, {
          $set: {
            'performance.ctr': ctr,
            'performance.conversionRate': conversionRate,
            'performance.roas': roas,
            'performance.avgCpc': avgCpc,
            'performance.avgCpm': avgCpm
          }
        });

        logger.info(`Campaign performance updated: ${id}`);
      }

      return campaign;
    } catch (error) {
      logger.error(`Error updating campaign performance ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await RetailCampaign.findByIdAndDelete(id);

      if (result) {
        logger.info(`Campaign deleted: ${id}`);
        campaignsTotal.dec();
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error deleting campaign ${id}:`, error);
      throw error;
    }
  }

  async getActiveCampaigns(retailerId: string): Promise<IRetailCampaign[]> {
    try {
      const now = new Date();
      const campaigns = await RetailCampaign.find({
        retailerId,
        status: 'active',
        'schedule.startDate': { $lte: now },
        'schedule.endDate': { $gte: now }
      });

      return campaigns;
    } catch (error) {
      logger.error(`Error fetching active campaigns for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async getCampaignsByAdvertiser(advertiserId: string): Promise<IRetailCampaign[]> {
    try {
      const campaigns = await RetailCampaign.find({ advertiserId }).sort({ createdAt: -1 });
      return campaigns;
    } catch (error) {
      logger.error(`Error fetching campaigns for advertiser ${advertiserId}:`, error);
      throw error;
    }
  }

  async getPerformanceSummary(
    retailerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    avgRoas: number;
    avgCtr: number;
  }> {
    try {
      const query: Record<string, unknown> = { retailerId };

      if (startDate && endDate) {
        query['schedule.startDate'] = { $gte: startDate };
        query['schedule.endDate'] = { $lte: endDate };
      }

      const campaigns = await RetailCampaign.find(query);

      const totals = campaigns.reduce(
        (acc, campaign) => {
          acc.totalImpressions += campaign.performance.impressions;
          acc.totalClicks += campaign.performance.clicks;
          acc.totalConversions += campaign.performance.conversions;
          acc.totalRevenue += campaign.performance.revenue;
          return acc;
        },
        { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 }
      );

      const activeCount = campaigns.filter((c) => c.status === 'active').length;
      const roasValues = campaigns.filter((c) => c.performance.roas > 0).map((c) => c.performance.roas);
      const ctrValues = campaigns.filter((c) => c.performance.ctr > 0).map((c) => c.performance.ctr);

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCount,
        totalImpressions: totals.totalImpressions,
        totalClicks: totals.totalClicks,
        totalConversions: totals.totalConversions,
        totalRevenue: totals.totalRevenue,
        avgRoas: roasValues.length > 0 ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length : 0,
        avgCtr: ctrValues.length > 0 ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length : 0
      };
    } catch (error) {
      logger.error(`Error getting performance summary for retailer ${retailerId}:`, error);
      throw error;
    }
  }
}

export const campaignService = new CampaignService();
export default campaignService;