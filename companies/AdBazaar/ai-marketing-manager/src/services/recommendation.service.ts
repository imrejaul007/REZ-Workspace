import { AIMarketingManager } from '../models';
import { Recommendation } from '../types';
import logger from 'utils/logger.js';

export interface RecommendationContext {
  merchantId: string;
  businessProfile: {
    name: string;
    category: string;
    location: string;
    priceRange?: string;
  };
  currentPerformance?: {
    totalReach: number;
    totalEngagement: number;
    totalConversions: number;
    roas: number;
  };
  activeCampaignsCount: number;
  competitors?: string[];
}

export class RecommendationService {
  /**
   * Generate AI-powered marketing recommendations based on business profile and performance
   */
  async generateRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    logger.info(`Generating recommendations for merchant: ${context.merchantId}`);

    const recommendations: Recommendation[] = [];

    // Category-specific recommendations
    const categoryRecs = this.getCategoryRecommendations(context);
    recommendations.push(...categoryRecs);

    // Performance-based recommendations
    const performanceRecs = this.getPerformanceBasedRecommendations(context);
    recommendations.push(...performanceRecs);

    // Competitive recommendations
    if (context.competitors && context.competitors.length > 0) {
      const competitiveRecs = this.getCompetitiveRecommendations(context);
      recommendations.push(...competitiveRecs);
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  /**
   * Get category-specific recommendations
   */
  private getCategoryRecommendations(context: RecommendationContext): Recommendation[] {
    const { category } = context.businessProfile;
    const recs: Recommendation[] = [];

    const categoryTemplates: Record<string, Partial<Recommendation>[]> = {
      restaurant: [
        {
          priority: 'high',
          category: 'social_media',
          action: 'Create Instagram Reels showcasing signature dishes',
          description: 'Visual content drives 2x engagement for restaurants. Post 3x per week with high-quality food imagery.',
          expectedImpact: '40% increase in engagement',
          estimatedCost: 0,
        },
        {
          priority: 'high',
          category: 'review_management',
          action: 'Implement automated review request system',
          description: 'Send personalized review requests 1 hour after dining experience.',
          expectedImpact: '3x increase in reviews, 0.5 star rating improvement',
          estimatedCost: 0,
        },
        {
          priority: 'medium',
          category: 'whatsapp',
          action: 'Set up WhatsApp ordering and reservation system',
          description: 'Enable customers to order and book via WhatsApp for convenience.',
          expectedImpact: '25% increase in repeat customers',
          estimatedCost: 0,
        },
        {
          priority: 'medium',
          category: 'local_seo',
          action: 'Optimize Google Business Profile with photos and posts',
          description: 'Post weekly updates with menu highlights and special offers.',
          expectedImpact: '50% more direction requests',
          estimatedCost: 0,
        },
      ],
      retail: [
        {
          priority: 'high',
          category: 'local_seo',
          action: 'Complete Google Business Profile optimization',
          description: 'Add photos, business hours, and respond to all reviews.',
          expectedImpact: '50% more store visits',
          estimatedCost: 0,
        },
        {
          priority: 'high',
          category: 'loyalty',
          action: 'Launch digital loyalty program',
          description: 'Offer points for every purchase that can be redeemed for discounts.',
          expectedImpact: '30% increase in customer retention',
          estimatedCost: 500,
        },
        {
          priority: 'medium',
          category: 'social_media',
          action: 'Create Facebook/Instagram shop',
          description: 'Enable in-app shopping to reduce purchase friction.',
          expectedImpact: '20% increase in conversions',
          estimatedCost: 0,
        },
      ],
      salon: [
        {
          priority: 'high',
          category: 'whatsapp',
          action: 'Implement automated appointment reminders',
          description: 'Send reminders 24 hours and 2 hours before appointments.',
          expectedImpact: '40% reduction in no-shows',
          estimatedCost: 0,
        },
        {
          priority: 'high',
          category: 'review_management',
          action: 'Request reviews after each service',
          description: 'Send automated review requests with direct Google review link.',
          expectedImpact: '50% more reviews',
          estimatedCost: 0,
        },
        {
          priority: 'medium',
          category: 'loyalty',
          action: 'Create referral program for existing customers',
          description: 'Offer discounts for successful referrals.',
          expectedImpact: '20% new customer acquisition',
          estimatedCost: 0,
        },
      ],
      fitness: [
        {
          priority: 'high',
          category: 'social_media',
          action: 'Post daily workout tips and transformation stories',
          description: 'Content marketing to showcase results and expertise.',
          expectedImpact: '35% increase in leads',
          estimatedCost: 0,
        },
        {
          priority: 'high',
          category: 'whatsapp',
          action: 'Set up fitness challenge broadcast list',
          description: 'Create community challenges with WhatsApp group coordination.',
          expectedImpact: '45% engagement increase',
          estimatedCost: 0,
        },
        {
          priority: 'medium',
          category: 'local_seo',
          action: 'List in local fitness directories',
          description: 'Get listed in all major fitness and wellness directories.',
          expectedImpact: '25% more discovery',
          estimatedCost: 0,
        },
      ],
      default: [
        {
          priority: 'high',
          category: 'brand_awareness',
          action: 'Run Facebook/Instagram awareness campaign',
          description: 'Target local audience with engaging visual content.',
          expectedImpact: '40% increase in brand awareness',
          estimatedCost: 1000,
        },
        {
          priority: 'medium',
          category: 'local_seo',
          action: 'Complete local business listings',
          description: 'Ensure consistent NAP (Name, Address, Phone) across all directories.',
          expectedImpact: '30% increase in local search visibility',
          estimatedCost: 0,
        },
        {
          priority: 'medium',
          category: 'social_media',
          action: 'Develop content calendar',
          description: 'Plan and schedule consistent posts across platforms.',
          expectedImpact: '50% improvement in engagement',
          estimatedCost: 0,
        },
      ],
    };

    const categoryKey = category.toLowerCase();
    const templates = categoryTemplates[categoryKey] || categoryTemplates.default;

    templates.forEach(template => {
      recs.push({
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...template,
        status: 'pending',
      } as Recommendation);
    });

    return recs;
  }

  /**
   * Get performance-based recommendations
   */
  private getPerformanceBasedRecommendations(context: RecommendationContext): Recommendation[] {
    const { currentPerformance, activeCampaignsCount } = context;
    const recs: Recommendation[] = [];

    if (!currentPerformance) {
      // First-time setup recommendations
      recs.push({
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        priority: 'high',
        category: 'getting_started',
        action: 'Launch first marketing campaign',
        description: 'Start with a simple awareness campaign to establish baseline metrics.',
        expectedImpact: 'Foundation for performance tracking',
        estimatedCost: 500,
        status: 'pending',
      });
      return recs;
    }

    // Low ROAS recommendation
    if (currentPerformance.roas < 1 && currentPerformance.totalSpend > 1000) {
      recs.push({
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        priority: 'high',
        category: 'optimization',
        action: 'Audit and optimize underperforming campaigns',
        description: 'Review ad creative, targeting, and landing pages for improvements.',
        expectedImpact: '50% improvement in ROAS',
        estimatedCost: 0,
        status: 'pending',
      });
    }

    // Low engagement recommendation
    if (currentPerformance.totalEngagement < 100 && activeCampaignsCount > 0) {
      recs.push({
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        priority: 'medium',
        category: 'content',
        action: 'Refresh content strategy',
        description: 'Test new content formats and posting times to boost engagement.',
        expectedImpact: '30% increase in engagement',
        estimatedCost: 0,
        status: 'pending',
      });
    }

    // No active campaigns
    if (activeCampaignsCount === 0) {
      recs.push({
        id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        priority: 'high',
        category: 'campaigns',
        action: 'Launch seasonal promotion',
        description: 'Create a limited-time offer to drive immediate conversions.',
        expectedImpact: 'Quick revenue boost',
        estimatedCost: 500,
        status: 'pending',
      });
    }

    return recs;
  }

  /**
   * Get competitive recommendations
   */
  private getCompetitiveRecommendations(context: RecommendationContext): Recommendation[] {
    const recs: Recommendation[] = [];

    recs.push({
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      priority: 'medium',
      category: 'competitive',
      action: 'Monitor competitor social media activity',
      description: 'Track competitor posting frequency and content performance.',
      expectedImpact: 'Stay ahead of competition',
      estimatedCost: 0,
      status: 'pending',
    });

    return recs;
  }

  /**
   * Update recommendations for a merchant
   */
  async updateRecommendations(merchantId: string): Promise<Recommendation[]> {
    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      throw new Error(`Manager not found for merchant: ${merchantId}`);
    }

    const context: RecommendationContext = {
      merchantId,
      businessProfile: manager.businessProfile,
      currentPerformance: manager.performance,
      activeCampaignsCount: manager.activeCampaigns.length,
      competitors: manager.businessProfile.competitors,
    };

    const newRecommendations = await this.generateRecommendations(context);

    // Merge with existing recommendations (keep approved/executed ones)
    const existingRecommendations = manager.recommendations.filter(
      r => r.status === 'approved' || r.status === 'executed'
    );

    manager.recommendations = [...existingRecommendations, ...newRecommendations];
    await manager.save();

    return manager.recommendations;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;