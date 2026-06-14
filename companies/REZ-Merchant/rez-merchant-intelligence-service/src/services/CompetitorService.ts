import { MerchantProfileDocument, MerchantProfileModel } from '../models';
import {
  CompetitorAnalysis,
  Competitor,
  MarketPosition,
} from '../types';
import config from '../config';

export class CompetitorService {
  private similarityThreshold = config.competitorAnalysis.similarityThreshold;
  private maxCompetitors = config.competitorAnalysis.maxCompetitors;

  /**
   * Analyze competitors for a merchant
   */
  async analyzeCompetitors(profile: MerchantProfileDocument): Promise<CompetitorAnalysis> {
    const competitors = await this.findSimilarMerchants(profile);
    const marketPosition = await this.calculateMarketPosition(profile, competitors);
    const { competitiveAdvantages, competitiveDisadvantages } = this.analyzeCompetitiveDifferences(profile, competitors);

    return {
      merchantId: profile.merchantId,
      competitors,
      marketPosition,
      competitiveAdvantages,
      competitiveDisadvantages,
      generatedAt: new Date(),
    };
  }

  /**
   * Find similar merchants as competitors
   */
  private async findSimilarMerchants(profile: MerchantProfileDocument): Promise<Competitor[]> {
    // Find merchants in the same category
    const candidateMerchants = await MerchantProfileModel.find({
      merchantId: { $ne: profile.merchantId },
      category: profile.category,
    }).limit(100);

    // Calculate similarity scores and filter
    const competitors: Competitor[] = [];

    for (const candidate of candidateMerchants) {
      const similarity = this.calculateSimilarity(profile, candidate);

      if (similarity >= this.similarityThreshold) {
        const competitor = this.buildCompetitor(profile, candidate, similarity);
        competitors.push(competitor);
      }
    }

    // Sort by similarity and limit
    return competitors
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.maxCompetitors);
  }

  /**
   * Calculate similarity between two merchants
   */
  private calculateSimilarity(m1: MerchantProfileDocument, m2: MerchantProfileDocument): number {
    let similarity = 0;
    let factors = 0;

    // Category match (high weight)
    if (m1.category === m2.category) similarity += 0.3;
    factors += 0.3;

    // Subcategory match
    if (m1.subcategory && m2.subcategory && m1.subcategory === m2.subcategory) {
      similarity += 0.15;
    }
    factors += 0.15;

    // Business type match
    if (m1.businessType === m2.businessType) similarity += 0.15;
    factors += 0.15;

    // Location similarity
    const m1City = m1.location?.city?.toLowerCase() || '';
    const m2City = m2.location?.city?.toLowerCase() || '';
    if (m1City && m2City && m1City === m2City) similarity += 0.2;
    else if (m1City && m2City && m1City !== m2City) similarity += 0.1;
    factors += 0.2;

    // Price point similarity (based on AOV)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m1Aov = (m1 as unknown).revenuePatterns?.averageOrderValue || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m2Aov = (m2 as unknown).revenuePatterns?.averageOrderValue || 0;
    if (m1Aov && m2Aov) {
      const aovDiff = Math.abs(m1Aov - m2Aov) / Math.max(m1Aov, m2Aov);
      if (aovDiff < 0.2) similarity += 0.2;
      else if (aovDiff < 0.4) similarity += 0.1;
      factors += 0.2;
    }

    return factors > 0 ? similarity / (factors / 0.3) : 0;
  }

  /**
   * Build competitor object
   */
  private buildCompetitor(
    profile: MerchantProfileDocument,
    competitor: MerchantProfileDocument,
    similarity: number
  ): Competitor {
    const profileRevenue = profile.revenuePatterns?.totalRevenue || 0;
    const competitorRevenue = competitor.revenuePatterns?.totalRevenue || 0;

    const profileOrders = profile.orderVolume?.total || 0;
    const competitorOrders = competitor.orderVolume?.total || 0;

    const profileAov = profile.revenuePatterns?.averageOrderValue || 0;
    const competitorAov = competitor.revenuePatterns?.averageOrderValue || 0;

    const profileCustomers = profile.customerDemographics?.totalCustomers || 0;
    const competitorCustomers = competitor.customerDemographics?.totalCustomers || 0;

    return {
      competitorId: competitor.merchantId,
      businessName: competitor.businessName,
      category: competitor.category,
      similarity: Math.round(similarity * 100) / 100,
      metrics: {
        revenue: competitorRevenue,
        orderVolume: competitorOrders,
        averageOrderValue: competitorAov,
        customerCount: competitorCustomers,
        rating: 4.2, // Mock rating - would come from review system
      },
      comparison: {
        strengths: this.identifyCompetitorStrengths(profile, competitor),
        weaknesses: this.identifyCompetitorWeaknesses(profile, competitor),
        differences: [
          {
            metric: 'Revenue',
            theirs: competitorRevenue,
            yours: profileRevenue,
          },
          {
            metric: 'Order Volume',
            theirs: competitorOrders,
            yours: profileOrders,
          },
          {
            metric: 'Average Order Value',
            theirs: competitorAov,
            yours: profileAov,
          },
        ],
      },
    };
  }

  /**
   * Identify competitor strengths (where they beat us)
   */
  private identifyCompetitorStrengths(profile: MerchantProfileDocument, competitor: MerchantProfileDocument): string[] {
    const strengths: string[] = [];

    const profileAov = profile.revenuePatterns?.averageOrderValue || 0;
    const competitorAov = competitor.revenuePatterns?.averageOrderValue || 0;
    if (competitorAov > profileAov * 1.2) {
      strengths.push(`Higher average order value ($${competitorAov.toFixed(2)} vs $${profileAov.toFixed(2)})`);
    }

    const profileRetention = profile.customerDemographics?.retentionRate || 0;
    const competitorRetention = competitor.customerDemographics?.retentionRate || 0;
    if (competitorRetention > profileRetention * 1.1) {
      strengths.push(`Better customer retention (${(competitorRetention * 100).toFixed(0)}% vs ${(profileRetention * 100).toFixed(0)}%)`);
    }

    const profileGrowth = profile.revenuePatterns?.revenueGrowth?.mom || 0;
    const competitorGrowth = competitor.revenuePatterns?.revenueGrowth?.mom || 0;
    if (competitorGrowth > profileGrowth * 1.2) {
      strengths.push(`Faster revenue growth (${competitorGrowth.toFixed(1)}% vs ${profileGrowth.toFixed(1)}% MoM)`);
    }

    return strengths;
  }

  /**
   * Identify competitor weaknesses (where we beat them)
   */
  private identifyCompetitorWeaknesses(profile: MerchantProfileDocument, competitor: MerchantProfileDocument): string[] {
    const weaknesses: string[] = [];

    const profileAov = profile.revenuePatterns?.averageOrderValue || 0;
    const competitorAov = competitor.revenuePatterns?.averageOrderValue || 0;
    if (profileAov > competitorAov * 1.2) {
      weaknesses.push(`Lower average order value ($${competitorAov.toFixed(2)} vs $${profileAov.toFixed(2)})`);
    }

    const profileCustomers = profile.customerDemographics?.totalCustomers || 0;
    const competitorCustomers = competitor.customerDemographics?.totalCustomers || 0;
    if (profileCustomers > competitorCustomers * 1.2) {
      weaknesses.push(`Smaller customer base (${competitorCustomers} vs ${profileCustomers})`);
    }

    return weaknesses;
  }

  /**
   * Calculate market position
   */
  private async calculateMarketPosition(profile: MerchantProfileDocument, competitors: Competitor[]): Promise<MarketPosition> {
    const allMerchants = [profile, ...(await MerchantProfileModel.find({ category: profile.category }).lean())];

    // Calculate total market revenue
    const totalMarketRevenue = allMerchants.reduce(
      (sum, m) => sum + (m.revenuePatterns?.totalRevenue || 0),
      0
    );

    const profileRevenue = profile.revenuePatterns?.totalRevenue || 0;
    const marketShare = totalMarketRevenue > 0 ? (profileRevenue / totalMarketRevenue) * 100 : 0;

    // Calculate ranks
    const sortedByRevenue = [...allMerchants].sort(
      (a, b) => (b.revenuePatterns?.totalRevenue || 0) - (a.revenuePatterns?.totalRevenue || 0)
    );
    const revenueRank = sortedByRevenue.findIndex(m => m.merchantId === profile.merchantId) + 1;

    const sortedByOrders = [...allMerchants].sort(
      (a, b) => (b.orderVolume?.total || 0) - (a.orderVolume?.total || 0)
    );
    const orderVolumeRank = sortedByOrders.findIndex(m => m.merchantId === profile.merchantId) + 1;

    const sortedByCustomers = [...allMerchants].sort(
      (a, b) => (b.customerDemographics?.totalCustomers || 0) - (a.customerDemographics?.totalCustomers || 0)
    );
    const customerRank = sortedByCustomers.findIndex(m => m.merchantId === profile.merchantId) + 1;

    // Overall rank (average of all ranks)
    const overallRank = Math.round((revenueRank + orderVolumeRank + customerRank) / 3);

    return {
      revenueRank,
      orderVolumeRank,
      customerRank,
      overallRank,
      marketShare: Math.round(marketShare * 100) / 100,
    };
  }

  /**
   * Analyze competitive differences
   */
  private analyzeCompetitiveDifferences(
    profile: MerchantProfileDocument,
    competitors: Competitor[]
  ): { competitiveAdvantages: string[]; competitiveDisadvantages: string[] } {
    const advantages: string[] = [];
    const disadvantages: string[] = [];

    if (competitors.length === 0) {
      return { competitiveAdvantages: advantages, competitiveDisadvantages: disadvantages };
    }

    // Calculate averages
    const avgCompetitorRevenue = competitors.reduce((sum, c) => sum + c.metrics.revenue, 0) / competitors.length;
    const avgCompetitorOrders = competitors.reduce((sum, c) => sum + c.metrics.orderVolume, 0) / competitors.length;
    const avgCompetitorAov = competitors.reduce((sum, c) => sum + c.metrics.averageOrderValue, 0) / competitors.length;

    const profileRevenue = profile.revenuePatterns?.totalRevenue || 0;
    const profileOrders = profile.orderVolume?.total || 0;
    const profileAov = profile.revenuePatterns?.averageOrderValue || 0;

    // Compare
    if (profileRevenue > avgCompetitorRevenue * 1.2) {
      advantages.push(`Revenue exceeds category average by ${Math.round((profileRevenue / avgCompetitorRevenue - 1) * 100)}%`);
    } else if (profileRevenue < avgCompetitorRevenue * 0.8) {
      disadvantages.push(`Revenue below category average by ${Math.round((1 - profileRevenue / avgCompetitorRevenue) * 100)}%`);
    }

    if (profileOrders > avgCompetitorOrders * 1.2) {
      advantages.push(`Order volume exceeds category average`);
    } else if (profileOrders < avgCompetitorOrders * 0.8) {
      disadvantages.push(`Order volume below category average`);
    }

    if (profileAov > avgCompetitorAov * 1.2) {
      advantages.push(`Average order value exceeds category average`);
    } else if (profileAov < avgCompetitorAov * 0.8) {
      disadvantages.push(`Average order value below category average`);
    }

    return {
      competitiveAdvantages: advantages,
      competitiveDisadvantages: disadvantages,
    };
  }
}

export const competitorService = new CompetitorService();
export default competitorService;
