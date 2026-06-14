import { v4 as uuidv4 } from 'uuid';
import { RetailMediaCampaign } from '../models/index.js';
import { SponsoredProductRequest, IRetailMediaCampaign } from '../types/index.js';
import { campaignService } from './campaign.service.js';
import { sponsoredProductCreatedTotal } from '../config/metrics.js';

export class SponsoredProductService {
  async createSponsoredProduct(
    merchantId: string,
    data: SponsoredProductRequest
  ): Promise<IRetailMediaCampaign> {
    const campaignId = `SP-${uuidv4().substring(0, 8).toUpperCase()}`;

    const campaign = new RetailMediaCampaign({
      campaignId,
      merchantId,
      name: data.campaignName,
      type: 'sponsored_products',
      products: [
        {
          productId: data.productId,
          bidAmount: data.bidAmount,
          dailyBudget: data.dailyBudget,
        },
      ],
      targeting: data.targeting || {
        category: [],
        keywords: [],
      },
      budget: {
        total: data.dailyBudget * 30, // Default 30-day campaign
        spent: 0,
      },
      metrics: {
        impressions: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
        acos: 0,
      },
      status: 'active',
    });

    await campaign.save();

    // Update metrics
    sponsoredProductCreatedTotal.inc();

    return campaign;
  }

  async updateBidAmount(
    campaignId: string,
    productId: string,
    newBidAmount: number
  ): Promise<IRetailMediaCampaign | null> {
    const campaign = await RetailMediaCampaign.findOne({ campaignId });

    if (!campaign) {
      return null;
    }

    const productIndex = campaign.products?.findIndex(
      (p) => p.productId === productId
    );

    if (productIndex === undefined || productIndex === -1) {
      return null;
    }

    if (campaign.products) {
      campaign.products[productIndex].bidAmount = newBidAmount;
    }

    await campaign.save();

    return campaign;
  }

  async updateDailyBudget(
    campaignId: string,
    productId: string,
    newDailyBudget: number
  ): Promise<IRetailMediaCampaign | null> {
    const campaign = await RetailMediaCampaign.findOne({ campaignId });

    if (!campaign) {
      return null;
    }

    const productIndex = campaign.products?.findIndex(
      (p) => p.productId === productId
    );

    if (productIndex === undefined || productIndex === -1) {
      return null;
    }

    if (campaign.products) {
      campaign.products[productIndex].dailyBudget = newDailyBudget;
    }

    await campaign.save();

    return campaign;
  }

  async getSponsoredProducts(merchantId: string): Promise<IRetailMediaCampaign[]> {
    return RetailMediaCampaign.find({
      merchantId,
      type: 'sponsored_products',
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getProductPerformance(
    campaignId: string,
    productId: string
  ): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalOrders: number;
    totalRevenue: number;
    clickThroughRate: number;
    conversionRate: number;
    acos: number;
  }> {
    const campaign = await RetailMediaCampaign.findOne({ campaignId });

    if (!campaign) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalOrders: 0,
        totalRevenue: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        acos: 0,
      };
    }

    const product = campaign.products?.find((p) => p.productId === productId);

    if (!product) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalOrders: 0,
        totalRevenue: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        acos: 0,
      };
    }

    const ctr =
      campaign.metrics.impressions > 0
        ? (campaign.metrics.clicks / campaign.metrics.impressions) * 100
        : 0;

    const conversionRate =
      campaign.metrics.clicks > 0
        ? (campaign.metrics.orders / campaign.metrics.clicks) * 100
        : 0;

    return {
      totalImpressions: campaign.metrics.impressions,
      totalClicks: campaign.metrics.clicks,
      totalOrders: campaign.metrics.orders,
      totalRevenue: campaign.metrics.revenue,
      clickThroughRate: ctr,
      conversionRate: conversionRate,
      acos: campaign.metrics.acos,
    };
  }

  async getBidRecommendations(
    campaignId: string,
    productId: string
  ): Promise<{
    currentBid: number;
    recommendedBid: number;
    estimatedImpact: {
      impressionsChange: number;
      clicksChange: number;
      ordersChange: number;
    };
    competitiveRange: {
      min: number;
      max: number;
      average: number;
    };
  }> {
    const campaign = await RetailMediaCampaign.findOne({ campaignId });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const product = campaign.products?.find((p) => p.productId === productId);

    if (!product) {
      throw new Error('Product not found in campaign');
    }

    const currentBid = product.bidAmount;

    // Calculate recommended bid based on performance
    // In production, this would use ML model
    const performanceScore = this.calculatePerformanceScore(campaign);
    const recommendedBid = currentBid * (1 + (performanceScore > 0.5 ? 0.1 : -0.1));

    // Estimate impact
    const ctr = campaign.metrics.impressions > 0
      ? campaign.metrics.clicks / campaign.metrics.impressions
      : 0.02;

    const estimatedCTRChange = (recommendedBid - currentBid) / currentBid * 0.1;
    const newCTR = ctr * (1 + estimatedCTRChange);

    const estimatedImpressions = campaign.metrics.impressions * (recommendedBid / currentBid);
    const estimatedClicks = estimatedImpressions * newCTR;
    const estimatedOrders = estimatedClicks * 0.05; // Assume 5% conversion

    return {
      currentBid,
      recommendedBid: Math.round(recommendedBid * 100) / 100,
      estimatedImpact: {
        impressionsChange: Math.round(estimatedImpressions - campaign.metrics.impressions),
        clicksChange: Math.round(estimatedClicks - campaign.metrics.clicks),
        ordersChange: Math.round(estimatedOrders - campaign.metrics.orders),
      },
      competitiveRange: {
        min: currentBid * 0.7,
        max: currentBid * 1.5,
        average: currentBid * 1.1,
      },
    };
  }

  private calculatePerformanceScore(campaign: IRetailMediaCampaign): number {
    // Simple performance scoring based on ACOS and conversion
    const acosScore = campaign.metrics.acos > 0
      ? Math.max(0, 1 - campaign.metrics.acos / 30) // Target ACOS < 30%
      : 0.5;

    const conversionScore = campaign.metrics.clicks > 0
      ? campaign.metrics.orders / campaign.metrics.clicks
      : 0.05;

    return (acosScore + conversionScore) / 2;
  }
}

export const sponsoredProductService = new SponsoredProductService();
