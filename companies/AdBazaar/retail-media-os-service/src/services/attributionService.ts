import { RetailCampaign, RetailInventory, Store } from '../models';
import { logger } from '../utils/logger';

export interface AttributionInput {
  campaignId: string;
  storeId?: string;
  startDate: Date;
  endDate: Date;
  attributionModel: 'last_touch' | 'first_touch' | 'linear' | 'data_driven';
  windowDays: number;
}

export interface AttributionResult {
  campaignId: string;
  totalAttributedSales: number;
  totalAttributedTransactions: number;
  attributedRevenue: number;
  roas: number;
  byStore: Array<{
    storeId: string;
    storeName: string;
    attributedSales: number;
    attributedTransactions: number;
    attributedRevenue: number;
    percentage: number;
  }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    attributedSales: number;
    attributedTransactions: number;
    attributedRevenue: number;
    percentage: number;
  }>;
  byDay: Array<{
    date: string;
    attributedSales: number;
    attributedTransactions: number;
    attributedRevenue: number;
  }>;
}

export interface AttributionSummary {
  totalCampaigns: number;
  campaignsWithAttribution: number;
  totalAttributedSales: number;
  totalAttributedRevenue: number;
  avgRoas: number;
  topPerformingCampaign: {
    id: string;
    name: string;
    roas: number;
  } | null;
}

class AttributionService {
  async calculateAttribution(input: AttributionInput): Promise<AttributionResult> {
    try {
      const campaign = await RetailCampaign.findById(input.campaignId);

      if (!campaign) {
        throw new Error(`Campaign not found: ${input.campaignId}`);
      }

      // Get all stores for this retailer
      const query: Record<string, unknown> = { retailerId: campaign.retailerId };
      if (input.storeId) {
        query._id = input.storeId;
      }

      const stores = await Store.find(query);

      // Calculate attribution based on model
      let attributedSales = 0;
      let attributedTransactions = 0;
      let attributedRevenue = 0;

      const byStore: AttributionResult['byStore'] = [];
      const byProduct: AttributionResult['byProduct'] = [];
      const byDay: AttributionResult['byDay'] = [];

      // Simulate attribution calculation (in production, this would integrate with POS data)
      for (const store of stores) {
        const storeAttribution = this.calculateStoreAttribution(
          store,
          campaign,
          input.attributionModel,
          input.windowDays
        );

        attributedSales += storeAttribution.sales;
        attributedTransactions += storeAttribution.transactions;
        attributedRevenue += storeAttribution.revenue;

        byStore.push({
          storeId: store._id.toString(),
          storeName: store.name,
          attributedSales: storeAttribution.sales,
          attributedTransactions: storeAttribution.transactions,
          attributedRevenue: storeAttribution.revenue,
          percentage: 0 // Will calculate after totals
        });
      }

      // Calculate percentages
      byStore.forEach((s) => {
        s.percentage = attributedSales > 0 ? (s.attributedSales / attributedSales) * 100 : 0;
      });

      // Product attribution
      for (const product of campaign.products) {
        const productAttribution = this.calculateProductAttribution(
          product.productId,
          campaign,
          input.attributionModel
        );

        byProduct.push({
          productId: product.productId,
          productName: product.name,
          attributedSales: productAttribution.sales,
          attributedTransactions: productAttribution.transactions,
          attributedRevenue: productAttribution.revenue,
          percentage: attributedSales > 0 ? (productAttribution.sales / attributedSales) * 100 : 0
        });
      }

      // Daily attribution
      const days = this.getDaysBetweenDates(input.startDate, input.endDate);
      for (const day of days) {
        const dayAttribution = this.calculateDayAttribution(day, campaign, input.attributionModel);

        byDay.push({
          date: day.toISOString().split('T')[0],
          attributedSales: dayAttribution.sales,
          attributedTransactions: dayAttribution.transactions,
          attributedRevenue: dayAttribution.revenue
        });
      }

      const roas = campaign.budget.spent > 0 ? attributedRevenue / campaign.budget.spent : 0;

      logger.info(`Attribution calculated for campaign ${input.campaignId}: ROAS ${roas.toFixed(2)}`);

      return {
        campaignId: input.campaignId,
        totalAttributedSales: attributedSales,
        totalAttributedTransactions: attributedTransactions,
        attributedRevenue,
        roas,
        byStore,
        byProduct,
        byDay
      };
    } catch (error) {
      logger.error(`Error calculating attribution for campaign ${input.campaignId}:`, error);
      throw error;
    }
  }

  async getAttributionSummary(retailerId: string): Promise<AttributionSummary> {
    try {
      const campaigns = await RetailCampaign.find({ retailerId });

      let totalAttributedSales = 0;
      let totalAttributedRevenue = 0;
      let campaignsWithAttribution = 0;
      let maxRoas = 0;
      let topPerformingCampaign: AttributionSummary['topPerformingCampaign'] = null;

      for (const campaign of campaigns) {
        if (campaign.attribution.enabled) {
          campaignsWithAttribution++;

          // Simulate attribution calculation
          const attributedRevenue = campaign.performance.revenue;
          const roas = campaign.budget.spent > 0 ? attributedRevenue / campaign.budget.spent : 0;

          totalAttributedSales += campaign.performance.conversions;
          totalAttributedRevenue += attributedRevenue;

          if (roas > maxRoas) {
            maxRoas = roas;
            topPerformingCampaign = {
              id: campaign._id.toString(),
              name: campaign.name,
              roas
            };
          }
        }
      }

      const avgRoas = campaignsWithAttribution > 0 ? totalAttributedRevenue / campaigns.reduce((acc, c) => acc + c.budget.spent, 0) : 0;

      return {
        totalCampaigns: campaigns.length,
        campaignsWithAttribution,
        totalAttributedSales,
        totalAttributedRevenue,
        avgRoas,
        topPerformingCampaign
      };
    } catch (error) {
      logger.error(`Error getting attribution summary for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async getMultiTouchAttribution(
    campaignId: string,
    customerId: string
  ): Promise<{
    touchpoints: Array<{
      channel: string;
      timestamp: Date;
      interaction: string;
      weight: number;
    }>;
    attributedChannels: Array<{
      channel: string;
      weight: number;
      revenue: number;
    }>;
  }> {
    try {
      // Simulate multi-touch attribution data
      const touchpoints = [
        {
          channel: 'display_ad',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          interaction: 'impression',
          weight: 0.2
        },
        {
          channel: 'search_ad',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          interaction: 'click',
          weight: 0.4
        },
        {
          channel: 'email',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          interaction: 'open',
          weight: 0.2
        },
        {
          channel: 'loyalty_program',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          interaction: 'conversion',
          weight: 0.2
        }
      ];

      const attributedChannels = touchpoints.reduce((acc, tp) => {
        const existing = acc.find((c) => c.channel === tp.channel);
        if (existing) {
          existing.weight += tp.weight;
        } else {
          acc.push({ channel: tp.channel, weight: tp.weight, revenue: 0 });
        }
        return acc;
      }, [] as Array<{ channel: string; weight: number; revenue: number }>);

      return { touchpoints, attributedChannels };
    } catch (error) {
      logger.error(`Error getting multi-touch attribution for customer ${customerId}:`, error);
      throw error;
    }
  }

  private calculateStoreAttribution(
    store: InstanceType<typeof Store>,
    campaign: InstanceType<typeof RetailCampaign>,
    model: string,
    windowDays: number
  ): { sales: number; transactions: number; revenue: number } {
    // Simulate store attribution based on model
    const baseMultiplier = store.attributes?.avgDailyVisitors
      ? store.attributes.avgDailyVisitors / 1000
      : 1;

    let multiplier = baseMultiplier;

    switch (model) {
      case 'last_touch':
        multiplier *= 1.0;
        break;
      case 'first_touch':
        multiplier *= 0.8;
        break;
      case 'linear':
        multiplier *= 0.9;
        break;
      case 'data_driven':
        multiplier *= 1.1;
        break;
      default:
        multiplier *= 0.85;
    }

    return {
      sales: Math.round(campaign.performance.conversions * multiplier * 0.1),
      transactions: Math.round(campaign.performance.conversions * multiplier * 0.1),
      revenue: campaign.performance.revenue * multiplier * 0.1
    };
  }

  private calculateProductAttribution(
    productId: string,
    campaign: InstanceType<typeof RetailCampaign>,
    model: string
  ): { sales: number; transactions: number; revenue: number } {
    const product = campaign.products.find((p) => p.productId === productId);
    if (!product) {
      return { sales: 0, transactions: 0, revenue: 0 };
    }

    const productShare = 1 / campaign.products.length;

    return {
      sales: Math.round(campaign.performance.conversions * productShare),
      transactions: Math.round(campaign.performance.conversions * productShare),
      revenue: campaign.performance.revenue * productShare
    };
  }

  private calculateDayAttribution(
    date: Date,
    campaign: InstanceType<typeof RetailCampaign>,
    model: string
  ): { sales: number; transactions: number; revenue: number } {
    const days = this.getDaysBetweenDates(campaign.schedule.startDate, campaign.schedule.endDate);
    const dayIndex = days.findIndex(
      (d) => d.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );

    if (dayIndex === -1) {
      return { sales: 0, transactions: 0, revenue: 0 };
    }

    const dayShare = 1 / days.length;

    return {
      sales: Math.round(campaign.performance.conversions * dayShare),
      transactions: Math.round(campaign.performance.conversions * dayShare),
      revenue: campaign.performance.revenue * dayShare
    };
  }

  private getDaysBetweenDates(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }
}

export const attributionService = new AttributionService();
export default attributionService;