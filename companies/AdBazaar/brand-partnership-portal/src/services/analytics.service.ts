/**
 * Analytics Service - Business logic for analytics and dashboards
 */

import { Brand, PartnershipCampaign, PartnershipProposal, PartnershipContract, InfluencerApplication } from '../models';
import logger from 'utils/logger.js';

export interface BrandDashboard {
  totalBrands: number;
  verifiedBrands: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalProposals: number;
  pendingProposals: number;
  totalContracts: number;
  activeContracts: number;
  totalBudget: number;
  avgProposalRate: number;
  conversionRate: number;
}

export interface InfluencerDashboard {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  totalContracts: number;
  activeContracts: number;
  totalEarnings: number;
  avgContractValue: number;
}

export interface PortalAnalytics {
  totalBrands: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalProposals: number;
  totalContracts: number;
  activeContracts: number;
  totalValue: number;
  avgDealSize: number;
  topIndustries: Array<{ industry: string; count: number }>;
  topBrands: Array<{ brandId: string; name: string; campaigns: number }>;
  conversionFunnel: {
    campaigns: number;
    proposals: number;
    contracts: number;
    conversionRate: number;
  };
}

export class AnalyticsService {
  /**
   * Get brand dashboard data
   */
  async getBrandDashboard(brandId: string): Promise<BrandDashboard> {
    const [campaigns, proposals, contracts] = await Promise.all([
      PartnershipCampaign.find({ brandId }),
      PartnershipProposal.find({ brandId }),
      PartnershipContract.find({ brandId })
    ]);

    const pendingProposals = proposals.filter(p => p.status === 'pending').length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const totalProposals = proposals.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;

    const conversionRate = totalProposals > 0
      ? (acceptedProposals / totalProposals) * 100
      : 0;

    const avgProposalRate = proposals.length > 0
      ? proposals.reduce((sum, p) => sum + p.proposedRate, 0) / proposals.length
      : 0;

    return {
      totalBrands: 1,
      verifiedBrands: 0,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalProposals,
      pendingProposals,
      totalContracts: contracts.length,
      activeContracts,
      totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
      avgProposalRate: Math.round(avgProposalRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  /**
   * Get influencer dashboard data
   */
  async getInfluencerDashboard(influencerId: string): Promise<InfluencerDashboard> {
    const [applications, proposals, contracts] = await Promise.all([
      InfluencerApplication.find({ influencerId }),
      PartnershipProposal.find({ influencerId }),
      PartnershipContract.find({ influencerId })
    ]);

    const pendingApplications = applications.filter(a => a.status === 'pending').length;
    const acceptedApplications = applications.filter(a => a.status === 'accepted').length;
    const pendingProposals = proposals.filter(p => p.status === 'pending').length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;

    const totalEarnings = contracts.reduce((sum, c) => {
      return sum + c.paymentSchedule
        .filter(p => p.paid)
        .reduce((s, p) => s + p.amount, 0);
    }, 0);

    const avgContractValue = contracts.length > 0
      ? contracts.reduce((sum, c) => {
        return sum + c.paymentSchedule.reduce((s, p) => s + p.amount, 0);
      }, 0) / contracts.length
      : 0;

    return {
      totalApplications: applications.length,
      pendingApplications,
      acceptedApplications,
      totalProposals: proposals.length,
      pendingProposals,
      acceptedProposals,
      totalContracts: contracts.length,
      activeContracts,
      totalEarnings,
      avgContractValue: Math.round(avgContractValue * 100) / 100
    };
  }

  /**
   * Get portal-wide analytics
   */
  async getPortalAnalytics(): Promise<PortalAnalytics> {
    const [brands, campaigns, proposals, contracts] = await Promise.all([
      Brand.find(),
      PartnershipCampaign.find(),
      PartnershipProposal.find(),
      PartnershipContract.find()
    ]);

    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const activeContracts = contracts.filter(c => c.status === 'active');

    const totalValue = contracts.reduce((sum, c) => {
      return sum + c.paymentSchedule.reduce((s, p) => s + p.amount, 0);
    }, 0);

    const avgDealSize = contracts.length > 0 ? totalValue / contracts.length : 0;

    // Top industries
    const industryCounts: Record<string, number> = {};
    brands.forEach(b => {
      industryCounts[b.industry] = (industryCounts[b.industry] || 0) + 1;
    });
    const topIndustries = Object.entries(industryCounts)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top brands
    const brandCampaignCounts: Record<string, { name: string; campaigns: number }> = {};
    campaigns.forEach(c => {
      if (!brandCampaignCounts[c.brandId]) {
        const brand = brands.find(b => b.brandId === c.brandId);
        brandCampaignCounts[c.brandId] = {
          name: brand?.name || c.brandId,
          campaigns: 0
        };
      }
      brandCampaignCounts[c.brandId].campaigns++;
    });
    const topBrands = Object.entries(brandCampaignCounts)
      .map(([brandId, data]) => ({ brandId, ...data }))
      .sort((a, b) => b.campaigns - a.campaigns)
      .slice(0, 10);

    // Conversion funnel
    const conversionRate = proposals.length > 0
      ? (contracts.length / proposals.length) * 100
      : 0;

    return {
      totalBrands: brands.length,
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalProposals: proposals.length,
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      totalValue,
      avgDealSize: Math.round(avgDealSize * 100) / 100,
      topIndustries,
      topBrands,
      conversionFunnel: {
        campaigns: campaigns.length,
        proposals: proposals.length,
        contracts: contracts.length,
        conversionRate: Math.round(conversionRate * 100) / 100
      }
    };
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<any> {
    const campaign = await PartnershipCampaign.findOne({ campaignId });
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const proposals = await PartnershipProposal.find({ campaignId });
    const contracts = await PartnershipContract.find({ campaignId });

    const avgProposalRate = proposals.length > 0
      ? proposals.reduce((sum, p) => sum + p.proposedRate, 0) / proposals.length
      : 0;

    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const conversionRate = proposals.length > 0
      ? (acceptedProposals / proposals.length) * 100
      : 0;

    return {
      campaignId,
      status: campaign.status,
      budget: campaign.budget,
      totalViews: campaign.totalViews,
      totalEngagement: campaign.totalEngagement,
      engagementRate: campaign.totalViews > 0
        ? (campaign.totalEngagement / campaign.totalViews) * 100
        : 0,
      totalProposals: proposals.length,
      pendingProposals: proposals.filter(p => p.status === 'pending').length,
      acceptedProposals,
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'active').length,
      avgProposalRate: Math.round(avgProposalRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }
}

export const analyticsService = new AnalyticsService();