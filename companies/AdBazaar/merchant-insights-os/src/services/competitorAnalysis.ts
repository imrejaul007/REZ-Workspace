import { Competitor, Merchant, RevenueRecord } from '../models/index.js';
import type { CompetitorAnalysis, CompetitorData } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format } from 'date-fns';

export class CompetitorAnalysisService {
  /**
   * Get comprehensive competitor analysis for a merchant
   */
  async getCompetitorAnalysis(
    merchantId: string,
    radius: number = 5,
    limit: number = 10
  ): Promise<CompetitorAnalysis> {
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get competitors
    const competitors = await Competitor.find({ merchantId })
      .sort({ estimatedRevenue: -1 })
      .limit(limit);

    // Get merchant's own metrics
    const merchantMetrics = await this.getMerchantMetrics(merchantId);

    // Calculate market positioning
    const positioning = this.calculatePositioning(merchant, competitors, merchantMetrics);

    // Calculate market share
    const marketShare = this.calculateMarketShare(merchantMetrics, competitors);

    // Identify opportunities
    const opportunities = this.identifyOpportunities(merchant, competitors, positioning);

    return {
      merchantId,
      merchant: {
        name: merchant.name,
        rating: merchantMetrics.rating,
        estimatedRevenue: merchantMetrics.revenue,
      },
      competitors: competitors.map(c => this.mapCompetitorData(c)),
      positioning,
      marketShare,
      opportunities,
    };
  }

  /**
   * Update competitor data
   */
  async updateCompetitor(
    merchantId: string,
    competitorData: Partial<CompetitorData>
  ): Promise<CompetitorData> {
    const competitor = await Competitor.findOneAndUpdate(
      { merchantId, competitorId: competitorData.competitorId },
      {
        $set: {
          name: competitorData.name,
          location: competitorData.location,
          pricePosition: competitorData.pricePosition,
          estimatedRevenue: competitorData.estimatedRevenue,
          rating: competitorData.rating,
          reviewCount: competitorData.reviewCount,
          strengths: competitorData.strengths,
          weaknesses: competitorData.weaknesses,
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return this.mapCompetitorData(competitor);
  }

  private async getMerchantMetrics(merchantId: string): Promise<{
    revenue: number;
    rating: number;
  }> {
    // Get recent revenue
    const startDate = subDays(new Date(), 30);
    const records = await RevenueRecord.find({
      merchantId,
      date: { $gte: startDate },
    });

    const revenue = records.reduce((sum, r) => sum + r.revenue, 0);

    // For rating, we would typically fetch from merchant profile
    // Using a default for now
    const rating = 4.2; // Placeholder

    return { revenue, rating };
  }

  private calculatePositioning(
    merchant: InstanceType<typeof Merchant>,
    competitors: InstanceType<typeof Competitor>[],
    merchantMetrics: { revenue: number; rating: number }
  ): CompetitorAnalysis['positioning'] {
    // Calculate relative position
    const competitorRevenues = competitors.map(c => c.estimatedRevenue);
    const avgCompetitorRevenue = competitorRevenues.length > 0
      ? competitorRevenues.reduce((a, b) => a + b, 0) / competitorRevenues.length
      : 0;

    const avgCompetitorRating = competitors.length > 0
      ? competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length
      : 0;

    // Determine market position
    let relativeToMarket: 'leader' | 'challenger' | 'follower' | 'niche';
    if (merchantMetrics.revenue > avgCompetitorRevenue * 1.2) {
      relativeToMarket = 'leader';
    } else if (merchantMetrics.revenue > avgCompetitorRevenue * 0.8) {
      relativeToMarket = 'challenger';
    } else if (merchantMetrics.revenue > avgCompetitorRevenue * 0.5) {
      relativeToMarket = 'follower';
    } else {
      relativeToMarket = 'niche';
    }

    // Determine price position based on category
    const pricePosition = this.determinePricePosition(merchant.category);

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (merchantMetrics.rating > avgCompetitorRating) {
      strengths.push('Higher customer rating than competitors');
    } else {
      weaknesses.push('Customer rating below competitor average');
    }

    if (merchantMetrics.revenue > avgCompetitorRevenue) {
      strengths.push('Higher revenue than local competitors');
    }

    return {
      relativeToMarket,
      pricePosition,
      strengths,
      weaknesses,
    };
  }

  private determinePricePosition(category: string): 'premium' | 'mid' | 'budget' {
    // This would typically be based on actual pricing data
    // Using category-based heuristics for now
    const premiumCategories = ['luxury', 'premium', 'gourmet'];
    const budgetCategories = ['budget', 'value', 'discount'];

    if (premiumCategories.some(c => category.toLowerCase().includes(c))) {
      return 'premium';
    }
    if (budgetCategories.some(c => category.toLowerCase().includes(c))) {
      return 'budget';
    }
    return 'mid';
  }

  private calculateMarketShare(
    merchantMetrics: { revenue: number; rating: number },
    competitors: InstanceType<typeof Competitor>[]
  ): CompetitorAnalysis['marketShare'] {
    const totalMarketRevenue = merchantMetrics.revenue +
      competitors.reduce((sum, c) => sum + c.estimatedRevenue, 0);

    const merchantShare = totalMarketRevenue > 0
      ? (merchantMetrics.revenue / totalMarketRevenue) * 100
      : 0;

    const competitorsShare = competitors.map(c => ({
      name: c.name,
      share: totalMarketRevenue > 0
        ? (c.estimatedRevenue / totalMarketRevenue) * 100
        : 0,
    }));

    return {
      merchantShare,
      competitorsShare,
    };
  }

  private identifyOpportunities(
    merchant: InstanceType<typeof Merchant>,
    competitors: InstanceType<typeof Competitor>[],
    positioning: CompetitorAnalysis['positioning']
  ): CompetitorAnalysis['opportunities'] {
    const opportunities: CompetitorAnalysis['opportunities'] = [];

    // Gap analysis based on competitor weaknesses
    for (const competitor of competitors.slice(0, 3)) {
      // Check for service gaps
      if (competitor.weaknesses.length > 0) {
        opportunities.push({
          gap: `Competitor ${competitor.name} weakness: ${competitor.weaknesses[0]}`,
          potential: 'Capture dissatisfied customers',
          action: `Highlight your strengths in this area in marketing campaigns`,
        });
      }

      // Check for rating gap
      if (competitor.rating < 4.0 && merchant.name) {
        opportunities.push({
          gap: `${competitor.name} has low rating (${competitor.rating})`,
          potential: 'Win customers looking for better quality',
          action: 'Emphasize your quality and service in reviews',
        });
      }
    }

    // Market position opportunities
    if (positioning.relativeToMarket === 'follower' || positioning.relativeToMarket === 'niche') {
      opportunities.push({
        gap: 'Limited market share',
        potential: 'Increase share by10-15%',
        action: 'Focus on differentiation and targeted marketing',
      });
    }

    // Price position opportunities
    if (positioning.pricePosition === 'mid') {
      opportunities.push({
        gap: 'Mid-market saturation',
        potential: 'Premium or budget positioning',
        action: 'Consider either quality differentiation or cost leadership',
      });
    }

    return opportunities;
  }

  private mapCompetitorData(competitor: InstanceType<typeof Competitor>): CompetitorData {
    return {
      competitorId: competitor.competitorId,
      name: competitor.name,
      location: competitor.location,
      pricePosition: competitor.pricePosition,
      estimatedRevenue: competitor.estimatedRevenue,
      rating: competitor.rating,
      reviewCount: competitor.reviewCount,
      strengths: competitor.strengths,
      weaknesses: competitor.weaknesses,
      lastUpdated: competitor.lastUpdated,
    };
  }
}

export default new CompetitorAnalysisService();