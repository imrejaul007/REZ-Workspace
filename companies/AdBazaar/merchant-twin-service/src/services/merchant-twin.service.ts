/**
 * Merchant Twin Service - Business Logic
 */

import { v4 as uuidv4 } from 'uuid';
import { MerchantTwinModel, MerchantTwinDocument } from '../models/merchant-twin.model';
import { MerchantTwin, CreateMerchantTwinInput, UpdateMerchantTwinInput, AudienceInsights, AdvertisingInsights } from '../types';
import logger from '../utils/logger';

export class MerchantTwinService {
  /**
   * Create a new merchant twin
   */
  async createMerchantTwin(input: CreateMerchantTwinInput): Promise<MerchantTwinDocument> {
    const twinId = `twin-${uuidv4().slice(0, 12)}`;

    const twin = new MerchantTwinModel({
      merchantId: input.merchantId,
      twinId,
      business: input.business,
      customerProfile: input.customerProfile || this.generateDefaultCustomerProfile(),
      advertising: input.advertising || this.generateDefaultAdvertising(),
      growth: input.growth || this.generateDefaultGrowth(),
    });

    await twin.save();
    logger.info('Merchant twin created', { merchantId: input.merchantId, twinId });
    return twin;
  }

  /**
   * Get merchant twin by merchantId
   */
  async getMerchantTwin(merchantId: string): Promise<MerchantTwinDocument | null> {
    return MerchantTwinModel.findOne({ merchantId });
  }

  /**
   * Get merchant twin by twinId
   */
  async getMerchantTwinById(twinId: string): Promise<MerchantTwinDocument | null> {
    return MerchantTwinModel.findOne({ twinId });
  }

  /**
   * Update merchant twin
   */
  async updateMerchantTwin(merchantId: string, input: UpdateMerchantTwinInput): Promise<MerchantTwinDocument | null> {
    const updateData: Record<string, unknown> = {};

    if (input.business) {
      Object.keys(input.business).forEach(key => {
        updateData[`business.${key}`] = (input.business as Record<string, unknown>)[key];
      });
    }

    if (input.customerProfile) {
      Object.keys(input.customerProfile).forEach(key => {
        updateData[`customerProfile.${key}`] = (input.customerProfile as Record<string, unknown>)[key];
      });
    }

    if (input.advertising) {
      Object.keys(input.advertising).forEach(key => {
        updateData[`advertising.${key}`] = (input.advertising as Record<string, unknown>)[key];
      });
    }

    if (input.growth) {
      Object.keys(input.growth).forEach(key => {
        updateData[`growth.${key}`] = (input.growth as Record<string, unknown>)[key];
      });
    }

    if (Object.keys(updateData).length === 0) {
      return this.getMerchantTwin(merchantId);
    }

    const twin = await MerchantTwinModel.findOneAndUpdate(
      { merchantId },
      { $set: updateData },
      { new: true }
    );

    if (twin) {
      logger.info('Merchant twin updated', { merchantId });
    }
    return twin;
  }

  /**
   * Delete merchant twin
   */
  async deleteMerchantTwin(merchantId: string): Promise<boolean> {
    const result = await MerchantTwinModel.deleteOne({ merchantId });
    if (result.deletedCount > 0) {
      logger.info('Merchant twin deleted', { merchantId });
      return true;
    }
    return false;
  }

  /**
   * Get merchant's customer audience insights
   */
  async getAudienceInsights(merchantId: string): Promise<AudienceInsights | null> {
    const twin = await this.getMerchantTwin(merchantId);
    if (!twin) {
      return null;
    }

    const { customerProfile, business } = twin;

    // Generate target segments based on demographics
    const targetSegments = this.generateTargetSegments(customerProfile, business);

    // Calculate growth potential
    const growthPotential = this.calculateGrowthPotential(customerProfile, twin.growth);

    return {
      totalCustomers: customerProfile.size,
      demographicBreakdown: customerProfile.demographics,
      behavioralInsights: customerProfile.behavioral,
      growthPotential,
      targetSegments,
    };
  }

  /**
   * Get advertising insights for a merchant
   */
  async getAdvertisingInsights(merchantId: string): Promise<AdvertisingInsights | null> {
    const twin = await this.getMerchantTwin(merchantId);
    if (!twin) {
      return null;
    }

    const { advertising, business } = twin;

    // Calculate average ad spend
    const avgAdSpend = advertising.adSpendHistory.length > 0
      ? advertising.adSpendHistory.reduce((sum, h) => sum + h.amount, 0) / advertising.adSpendHistory.length
      : 0;

    // Generate recommendations
    const recommendations = this.generateAdRecommendations(advertising, business);

    return {
      avgAdSpend,
      preferredChannels: advertising.preferredChannels,
      audienceOverlap: advertising.competitorOverlap,
      effectivenessScore: advertising.adEffectiveness,
      recommendations,
    };
  }

  /**
   * List merchant twins with pagination
   */
  async listMerchantTwins(page: number = 1, limit: number = 20, filters?: {
    category?: string;
    city?: string;
    investmentReadiness?: string;
  }): Promise<{ twins: MerchantTwinDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.category) {
      query['business.category'] = filters.category;
    }
    if (filters?.city) {
      query['business.location.city'] = filters.city;
    }
    if (filters?.investmentReadiness) {
      query['growth.investmentReadiness'] = filters.investmentReadiness;
    }

    const skip = (page - 1) * limit;
    const [twins, total] = await Promise.all([
      MerchantTwinModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      MerchantTwinModel.countDocuments(query),
    ]);

    return { twins, total };
  }

  /**
   * Find similar merchants for targeting
   */
  async findSimilarMerchants(merchantId: string, limit: number = 10): Promise<MerchantTwinDocument[]> {
    const twin = await this.getMerchantTwin(merchantId);
    if (!twin) {
      return [];
    }

    return MerchantTwinModel.find({
      merchantId: { $ne: merchantId },
      $or: [
        { 'business.category': twin.business.category },
        { 'business.location.city': twin.business.location.city },
      ],
    })
      .limit(limit)
      .sort({ 'growth.monthlyGrowth': -1 });
  }

  // Helper methods

  private generateDefaultCustomerProfile() {
    return {
      demographics: {
        ageDistribution: [
          { range: '18-24', percentage: 20 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 25 },
          { range: '45-54', percentage: 15 },
          { range: '55+', percentage: 5 },
        ],
        genderDistribution: { male: 50, female: 48, other: 2 },
        incomeLevel: 'medium',
      },
      behavioral: {
        avgVisitFrequency: 4,
        avgOrderValue: 500,
        peakHours: ['12:00-14:00', '18:00-20:00'],
        popularDays: ['Friday', 'Saturday', 'Sunday'],
        repeatCustomerRate: 0.4,
      },
      size: 0,
    };
  }

  private generateDefaultAdvertising() {
    return {
      adSpendHistory: [],
      preferredChannels: ['social_media', 'local_ads'],
      targetAudience: [],
      competitorOverlap: 30,
      adEffectiveness: 50,
    };
  }

  private generateDefaultGrowth() {
    return {
      monthlyGrowth: 0,
      seasonalPatterns: [],
      expansionPotential: 50,
      investmentReadiness: 'medium',
    };
  }

  private generateTargetSegments(customerProfile: MerchantTwin['customerProfile'], business: MerchantTwin['business']): string[] {
    const segments: string[] = [];

    // Age-based segments
    const dominantAge = customerProfile.demographics.ageDistribution.reduce(
      (max, curr) => (curr.percentage > max.percentage ? curr : max),
      { range: '25-34', percentage: 35 }
    );
    segments.push(`${dominantAge.range} age group`);

    // Gender-based segments
    const genderDist = customerProfile.demographics.genderDistribution;
    if (genderDist.female > 60) segments.push('female-focused');
    if (genderDist.male > 60) segments.push('male-focused');

    // Income-based segments
    segments.push(`${customerProfile.demographics.incomeLevel} income`);

    // Business category segments
    segments.push(business.category.toLowerCase());

    // Location-based segments
    segments.push(`${business.location.city} local`);

    return segments;
  }

  private calculateGrowthPotential(customerProfile: MerchantTwin['customerProfile'], growth: MerchantTwin['growth']): number {
    let potential = 50;

    // Adjust based on customer base
    if (customerProfile.size > 1000) potential += 10;
    if (customerProfile.size > 5000) potential += 10;

    // Adjust based on repeat customer rate
    if (customerProfile.behavioral.repeatCustomerRate > 0.5) potential += 15;
    if (customerProfile.behavioral.repeatCustomerRate > 0.7) potential += 10;

    // Adjust based on growth metrics
    if (growth.monthlyGrowth > 10) potential += 10;
    if (growth.expansionPotential > 70) potential += 10;

    return Math.min(100, potential);
  }

  private generateAdRecommendations(advertising: MerchantTwin['advertising'], business: MerchantTwin['business']): string[] {
    const recommendations: string[] = [];

    // Channel recommendations
    if (advertising.preferredChannels.length < 3) {
      recommendations.push('Consider diversifying ad channels for better reach');
    }

    // Effectiveness recommendations
    if (advertising.adEffectiveness < 50) {
      recommendations.push('Optimize ad creative and targeting to improve effectiveness');
    }

    // Competitor overlap recommendations
    if (advertising.competitorOverlap > 50) {
      recommendations.push('High competitor overlap - consider differentiated messaging');
    }

    // Budget recommendations
    if (advertising.adSpendHistory.length > 0) {
      const avgSpend = advertising.adSpendHistory.reduce((sum, h) => sum + h.amount, 0) / advertising.adSpendHistory.length;
      if (avgSpend < 10000) {
        recommendations.push('Consider increasing ad budget for better visibility');
      }
    }

    // Category-specific recommendations
    if (business.category === 'restaurant') {
      recommendations.push('Focus on food delivery platforms and local SEO');
    } else if (business.category === 'retail') {
      recommendations.push('Leverage social media ads with product showcases');
    }

    return recommendations;
  }
}

export const merchantTwinService = new MerchantTwinService();
export default merchantTwinService;