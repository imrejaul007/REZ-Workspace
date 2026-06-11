/**
 * GLAMAI - Beauty Advisor Service
 * Salon AI Operating System
 *
 * AI Employee: Provides beauty recommendations, styling tips, and product matching.
 */

import { Service, Customer, ICustomer, IService, ServiceCategory } from '../models';
import { OCCASION_SERVICES, LOYALTY } from '../config';
import { ServiceWithScore, BeautyAdvisorResponse } from '../types';
import { logger } from '../middleware/logger';

/**
 * Get services based on occasion
 */
const getOccasionServices = (occasion: string): string[] => {
  return OCCASION_SERVICES[occasion.toLowerCase()] || [];
};

/**
 * Calculate relevance score for a service recommendation
 */
const calculateRelevanceScore = (
  service: IService,
  customer: ICustomer | null,
  occasion?: string
): number => {
  let score = 50;

  // Customer preference matching
  if (customer?.preferences?.includes(service.category)) {
    score += 25;
  }

  // Occasion matching
  if (occasion) {
    const occasionServices = getOccasionServices(occasion);
    if (
      occasionServices.includes(service.name.toLowerCase()) ||
      service.category.toLowerCase().includes(occasion.toLowerCase())
    ) {
      score += 20;
    }
  }

  // Loyalty tier bonus
  if (customer?.loyaltyTier === 'platinum') score += 15;
  else if (customer?.loyaltyTier === 'gold') score += 10;
  else if (customer?.loyaltyTier === 'silver') score += 5;

  // Popular service bonus (Hair is most requested)
  if (service.category === 'Hair') score += 5;

  return Math.min(score, 100);
};

/**
 * Generate recommendation reason for a service
 */
const generateRecommendationReason = (
  service: IService,
  customer: ICustomer | null,
  occasion?: string
): string => {
  if (customer?.preferences?.includes(service.category)) {
    return `Based on your love for ${service.category.toLowerCase()} services`;
  }
  if (occasion) {
    return `Perfect for your ${occasion} occasion!`;
  }
  return `Popular ${service.category.toLowerCase()} service (${service.duration} min)`;
};

/**
 * Generate AI message for recommendations
 */
const generateBeautyAdvisorMessage = (
  recommendations: ServiceWithScore[],
  occasion?: string,
  customer?: ICustomer
): string => {
  if (!recommendations || recommendations.length === 0) {
    return "I couldn't find perfect recommendations for you. Please try adjusting your preferences.";
  }

  const topRecommendation = recommendations[0];
  let message = `Based on your ${occasion || 'general'} needs`;

  if (customer) {
    message += `, ${customer.name}, `;
    if (customer.loyaltyTier !== 'bronze') {
      const tier = LOYALTY.TIERS[customer.loyaltyTier];
      message += `as a ${tier.name} member, you get ${tier.discountPercent}% `;
      message += 'off! ';
    }
  }

  message += `I recommend our ${topRecommendation.name} (${topRecommendation.duration} min) - `;
  message += `a top-rated ${topRecommendation.category.toLowerCase()} service.`;

  return message;
};

/**
 * Calculate discount based on loyalty tier
 */
const calculateDiscount = (price: number, loyaltyTier?: string): number => {
  if (loyaltyTier === 'platinum') return Math.round(price * 0.1);
  if (loyaltyTier === 'gold') return Math.round(price * 0.05);
  if (loyaltyTier === 'silver') return Math.round(price * 0.03);
  return 0;
};

/**
 * Beauty Advisor Service Class
 */
export class BeautyAdvisorService {
  /**
   * Get service recommendations for a customer
   */
  async getRecommendations(params: {
    customerId?: string;
    budget?: number;
    occasion?: string;
    preferences?: string[];
    serviceCategory?: ServiceCategory;
  }): Promise<BeautyAdvisorResponse> {
    const { customerId, budget, occasion, preferences, serviceCategory } = params;

    logger.info('Beauty Advisor: Generating recommendations', {
      customerId,
      occasion,
      budget,
      serviceCategory,
    });

    // Build query for services
    const serviceQuery: any = { isActive: true };
    if (serviceCategory) {
      serviceQuery.category = serviceCategory;
    }

    let services = await Service.find(serviceQuery);

    // Filter by budget if provided
    if (budget) {
      services = services.filter(s => s.price <= budget);
    }

    // Get customer if provided
    let customer: ICustomer | null = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }

    // AI recommendation logic based on occasion
    let recommendations = services;
    if (occasion) {
      const occasionServices = getOccasionServices(occasion);
      if (occasionServices.length > 0) {
        recommendations = recommendations.filter(
          s =>
            occasionServices.includes(s.name.toLowerCase()) ||
            s.category.toLowerCase().includes(occasion.toLowerCase())
        );
      }
    }

    // If no occasion match, use all services
    if (recommendations.length === 0) {
      recommendations = services;
    }

    // Score and rank recommendations
    const ranked = recommendations.map(s => {
      const serviceObj = s.toObject ? s.toObject() : s;
      return {
        ...serviceObj,
        aiScore: calculateRelevanceScore(s, customer, occasion),
        aiReason: generateRecommendationReason(s, customer, occasion),
        discount: calculateDiscount(s.price, customer?.loyaltyTier),
      } as ServiceWithScore;
    }).sort((a, b) => b.aiScore - a.aiScore);

    const aiMessage = generateBeautyAdvisorMessage(ranked, occasion, customer);

    logger.info('Beauty Advisor: Recommendations generated', {
      customerId,
      recommendationCount: ranked.length,
    });

    return {
      success: true,
      recommendations: ranked.slice(0, 5),
      aiMessage,
      customerProfile: customer
        ? {
            name: customer.name,
            loyaltyTier: customer.loyaltyTier,
            totalSpent: customer.totalSpent,
            visits: customer.visits,
            preferences: customer.preferences,
          }
        : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: ServiceCategory): Promise<IService[]> {
    return Service.find({ category, isActive: true }).sort({ price: 1 });
  }

  /**
   * Get trending services
   */
  async getTrendingServices(limit: number = 5): Promise<IService[]> {
    // For now, return top-priced services as trending
    // In production, this would use analytics data
    return Service.find({ isActive: true })
      .sort({ price: -1 })
      .limit(limit);
  }
}

export default new BeautyAdvisorService();