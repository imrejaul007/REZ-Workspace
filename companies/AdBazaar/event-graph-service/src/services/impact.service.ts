import axios from 'axios';
import config from '../config/index.js';
import logger from '../config/logger.js';
import { EventService } from './event.service.js';
import { ImpactAnalysis, CampaignSuggestion, EventType, Location } from '../types/index.js';

const impactLogger = logger.child({ component: 'ImpactService' });

// Category relevance scores based on event type
const CATEGORY_RELEVANCE: Record<EventType, Record<string, number>> = {
  wedding: {
    restaurant: 0.9,
    banquet_hall: 0.95,
    catering: 0.95,
    photography: 0.85,
    florist: 0.8,
    jewelry: 0.7,
    fashion: 0.75,
    transport: 0.6,
    accommodation: 0.5,
    entertainment: 0.7
  },
  festival: {
    restaurant: 0.7,
    shopping: 0.9,
    grocery: 0.85,
    sweets: 0.9,
    clothing: 0.85,
    gifts: 0.8,
    decoration: 0.75,
    entertainment: 0.7,
    transport: 0.6
  },
  conference: {
    restaurant: 0.8,
    accommodation: 0.85,
    transport: 0.7,
    stationery: 0.6,
    tech: 0.7,
    coffee: 0.75,
    entertainment: 0.4
  },
  sports: {
    restaurant: 0.85,
    bar: 0.8,
    merchandise: 0.9,
    transport: 0.7,
    accommodation: 0.5,
    entertainment: 0.6,
    sports_shop: 0.8
  },
  religious: {
    restaurant: 0.5,
    sweets: 0.7,
    flowers: 0.8,
    transport: 0.6,
    accommodation: 0.3,
    charity: 0.5
  },
  community: {
    restaurant: 0.6,
    community_center: 0.8,
    entertainment: 0.6,
    transport: 0.4
  },
  corporate: {
    restaurant: 0.85,
    accommodation: 0.8,
    transport: 0.75,
    tech: 0.7,
    entertainment: 0.5
  },
  entertainment: {
    restaurant: 0.85,
    bar: 0.8,
    entertainment: 0.9,
    merchandise: 0.6,
    transport: 0.5
  },
  political: {
    restaurant: 0.6,
    transport: 0.5,
    accommodation: 0.4,
    entertainment: 0.3
  },
  other: {
    restaurant: 0.7,
    entertainment: 0.6,
    transport: 0.5
  }
};

// Peak hours based on event type
const PEAK_HOURS: Record<EventType, string[]> = {
  wedding: ['12:00-14:00', '19:00-22:00'],
  festival: ['10:00-14:00', '17:00-21:00'],
  conference: ['09:00-10:00', '12:00-13:00', '17:00-18:00'],
  sports: ['17:00-21:00', '14:00-17:00'],
  religious: ['06:00-09:00', '17:00-20:00'],
  community: ['10:00-13:00', '15:00-18:00'],
  corporate: ['09:00-10:00', '12:00-14:00', '18:00-20:00'],
  entertainment: ['19:00-23:00', '21:00-24:00'],
  political: ['10:00-13:00', '17:00-20:00'],
  other: ['12:00-15:00', '18:00-21:00']
};

export class ImpactService {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  /**
   * Analyze the impact of an event on nearby merchants
   */
  async analyzeImpact(eventId: string): Promise<ImpactAnalysis | null> {
    try {
      const event = await this.eventService.getEventById(eventId);
      if (!event) {
        impactLogger.warn('Event not found for impact analysis', { eventId });
        return null;
      }

      // Calculate expected footfall based on event type
      const expectedFootfall = this.calculateExpectedFootfall(event.type, event.expectedFootfall);

      // Get nearby merchants from apartment targeting service
      const nearbyMerchants = await this.getNearbyMerchants(event.location, expectedFootfall);

      // Calculate impact metrics
      const duration = this.calculateDuration(event);
      const estimatedRevenueImpact = this.calculateRevenueImpact(expectedFootfall, nearbyMerchants.length);
      const adOpportunityScore = this.calculateAdOpportunityScore(event, nearbyMerchants.length, expectedFootfall);

      // Get affected categories
      const affectedCategories = this.getAffectedCategories(event.type);

      // Generate recommendations
      const recommendations = this.generateRecommendations(event, nearbyMerchants, expectedFootfall);

      const impact: ImpactAnalysis = {
        eventId: event._id.toString(),
        eventName: event.name,
        eventType: event.type,
        date: event.date.toISOString(),
        expectedFootfall,
        location: event.location,
        impactMetrics: {
          nearbyMerchants: nearbyMerchants.length,
          affectedCategories,
          peakHours: PEAK_HOURS[event.type],
          duration,
          estimatedRevenueImpact,
          adOpportunityScore
        },
        affectedAreas: nearbyMerchants.slice(0, 5).map(m => ({
          name: m.area,
          radius: 500,
          merchantCount: m.count,
          averageDistance: m.avgDistance
        })),
        recommendations
      };

      impactLogger.info('Impact analysis completed', { eventId, score: adOpportunityScore });
      return impact;
    } catch (error) {
      impactLogger.error('Failed to analyze impact', { error, eventId });
      throw error;
    }
  }

  /**
   * Generate campaign suggestions for nearby merchants
   */
  async generateCampaignSuggestions(eventId: string): Promise<CampaignSuggestion | null> {
    try {
      const event = await this.eventService.getEventById(eventId);
      if (!event) {
        impactLogger.warn('Event not found for campaign suggestions', { eventId });
        return null;
      }

      // Get nearby merchants
      const nearbyMerchants = await this.getNearbyMerchants(event.location, event.expectedFootfall || 1000);

      // Calculate optimal timing
      const campaignTiming = this.calculateOptimalTiming(event);

      // Generate budget recommendations by category
      const budgetRecommendations = this.generateBudgetRecommendations(event, nearbyMerchants);

      // Generate targeting options
      const targetingOptions = this.generateTargetingOptions(event, nearbyMerchants);

      const suggestion: CampaignSuggestion = {
        eventId: event._id.toString(),
        eventName: event.name,
        nearbyMerchants: nearbyMerchants.map(m => ({
          merchantId: m.id,
          name: m.name,
          category: m.category,
          distance: m.distance,
          relevanceScore: m.relevanceScore
        })),
        campaignTiming,
        budgetRecommendations,
        targetingOptions,
        totalRecommendedBudget: budgetRecommendations.reduce((sum, b) => sum + b.maxBudget, 0)
      };

      impactLogger.info('Campaign suggestions generated', { eventId, merchantCount: nearbyMerchants.length });
      return suggestion;
    } catch (error) {
      impactLogger.error('Failed to generate campaign suggestions', { error, eventId });
      throw error;
    }
  }

  /**
   * Calculate expected footfall based on event type
   */
  private calculateExpectedFootfall(type: EventType, baseFootfall?: number): number {
    if (baseFootfall) {
      return baseFootfall;
    }

    // Default footfall estimates by event type
    const defaultFootfall: Record<EventType, number> = {
      wedding: 500,
      festival: 5000,
      conference: 1000,
      sports: 10000,
      religious: 2000,
      community: 300,
      corporate: 500,
      entertainment: 2000,
      political: 5000,
      other: 500
    };

    return defaultFootfall[type] || 500;
  }

  /**
   * Get nearby merchants from ecosystem services
   */
  private async getNearbyMerchants(
    location: Location,
    expectedFootfall: number
  ): Promise<Array<{
    id: string;
    name: string;
    category: string;
    distance: number;
    relevanceScore: number;
    area: string;
    count: number;
    avgDistance: number;
  }>> {
    try {
      // Try to get data from apartment targeting service
      const response = await axios.get(`${config.services.apartmentTargeting}/api/merchants/nearby`, {
        params: {
          lat: location.coordinates[1],
          lng: location.coordinates[0],
          radius: config.business.defaultRadius
        },
        timeout: 3000
      });

      return response.data.merchants || [];
    } catch (error) {
      // Fallback to mock data if service unavailable
      impactLogger.warn('Apartment targeting service unavailable, using fallback data');
      return this.getMockMerchants(expectedFootfall);
    }
  }

  /**
   * Generate mock merchant data as fallback
   */
  private getMockMerchants(footfall: number): Array<{
    id: string;
    name: string;
    category: string;
    distance: number;
    relevanceScore: number;
    area: string;
    count: number;
    avgDistance: number;
  }> {
    const categories = ['restaurant', 'shopping', 'grocery', 'entertainment', 'transport'];
    const merchantCount = Math.min(Math.floor(footfall / 100), 50);

    return Array.from({ length: merchantCount }, (_, i) => ({
      id: `merchant_${i + 1}`,
      name: `Merchant ${i + 1}`,
      category: categories[i % categories.length],
      distance: Math.random() * 2000 + 100,
      relevanceScore: Math.random() * 0.5 + 0.5,
      area: `Area ${i % 5 + 1}`,
      count: Math.floor(Math.random() * 10) + 1,
      avgDistance: Math.random() * 500 + 100
    }));
  }

  /**
   * Calculate event duration in hours
   */
  private calculateDuration(event: { date: Date; endDate?: Date }): number {
    if (!event.endDate) {
      return 4; // Default 4 hours
    }
    const duration = event.endDate.getTime() - event.date.getTime();
    return Math.max(1, Math.round(duration / (1000 * 60 * 60)));
  }

  /**
   * Calculate estimated revenue impact
   */
  private calculateRevenueImpact(footfall: number, merchantCount: number): number {
    // Average spend per person = ₹500
    // Average merchant share = 10%
    const baseRevenue = footfall * 500;
    const merchantShare = merchantCount > 0 ? (baseRevenue * 0.1) / merchantCount : 0;
    return Math.round(merchantShare * merchantCount * config.business.adBudgetMultiplier);
  }

  /**
   * Calculate ad opportunity score (0-100)
   */
  private calculateAdOpportunityScore(
    event: { type: EventType; expectedFootfall?: number },
    merchantCount: number,
    footfall: number
  ): number {
    const footfallScore = Math.min(footfall / 1000, 100) * 0.4;
    const merchantScore = Math.min(merchantCount / 20, 1) * 0.3;
    const typeMultiplier = config.business.footfallMultiplier[event.type] || 1;
    const typeScore = (typeMultiplier - 0.5) * 100 * 0.3;

    return Math.round(Math.min(100, Math.max(0, footfallScore + merchantScore + typeScore)));
  }

  /**
   * Get affected merchant categories
   */
  private getAffectedCategories(type: EventType): string[] {
    const categories = CATEGORY_RELEVANCE[type];
    return Object.entries(categories)
      .filter(([_, score]) => score >= 0.6)
      .map(([category]) => category)
      .slice(0, 5);
  }

  /**
   * Generate impact recommendations
   */
  private generateRecommendations(
    event: { type: EventType; name: string; expectedFootfall?: number },
    merchants: Array<{ category: string; relevanceScore: number }>,
    footfall: number
  ): ImpactAnalysis['recommendations'] {
    const recommendations: ImpactAnalysis['recommendations'] = [];
    const categories = CATEGORY_RELEVANCE[event.type];

    // Get top 3 categories by relevance
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topCategories.forEach(([category, relevance]) => {
      const merchantCount = merchants.filter(m => m.category === category).length;
      const estimatedReach = Math.round(footfall * relevance * 0.3);
      const suggestedBudget = Math.round(estimatedReach * config.business.adBudgetMultiplier);

      recommendations.push({
        category,
        action: `Target ${category} customers with ${event.name}`,
        priority: relevance >= 0.8 ? 'high' : relevance >= 0.6 ? 'medium' : 'low',
        estimatedReach,
        suggestedBudget
      });
    });

    return recommendations;
  }

  /**
   * Calculate optimal campaign timing
   */
  private calculateOptimalTiming(event: { date: Date; type: EventType }): CampaignSuggestion['campaignTiming'] {
    const eventDate = new Date(event.date);
    const daysUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Optimal start: 7 days before for large events, 3 days for small
    const daysBefore = event.expectedFootfall && event.expectedFootfall > 5000 ? 7 : 3;
    const optimalStart = new Date(eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    const optimalEnd = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after

    return {
      optimalStart: optimalStart.toISOString(),
      optimalEnd: optimalEnd.toISOString(),
      peakHours: PEAK_HOURS[event.type],
      recommendedDuration: daysUntilEvent > 7 ? 14 : 7
    };
  }

  /**
   * Generate budget recommendations by category
   */
  private generateBudgetRecommendations(
    event: { type: EventType; expectedFootfall?: number },
    merchants: Array<{ category: string; relevanceScore: number }>
  ): CampaignSuggestion['budgetRecommendations'] {
    const footfall = this.calculateExpectedFootfall(event.type, event.expectedFootfall);
    const categories = CATEGORY_RELEVANCE[event.type];

    return Object.entries(categories)
      .filter(([_, relevance]) => relevance >= 0.6)
      .slice(0, 5)
      .map(([category, relevance]) => {
        const merchantCount = merchants.filter(m => m.category === category).length;
        const reach = Math.round(footfall * relevance * 0.2);
        const minBudget = Math.round(reach * 0.3);
        const maxBudget = Math.round(reach * 0.5);

        return {
          category,
          minBudget,
          maxBudget,
          expectedROI: Math.round(relevance * 100),
          adFormat: this.getAdFormat(category)
        };
      });
  }

  /**
   * Get appropriate ad format for category
   */
  private getAdFormat(category: string): string {
    const formatMap: Record<string, string> = {
      restaurant: 'Image + Offer',
      shopping: 'Carousel',
      grocery: 'Catalog',
      entertainment: 'Video',
      transport: 'Banner'
    };
    return formatMap[category] || 'Image';
  }

  /**
   * Generate targeting options
   */
  private generateTargetingOptions(
    event: { type: EventType },
    merchants: Array<{ distance: number }>
  ): CampaignSuggestion['targetingOptions'] {
    const avgDistance = merchants.length > 0
      ? merchants.reduce((sum, m) => sum + m.distance, 0) / merchants.length
      : 1000;

    const demographicsMap: Record<EventType, string[]> = {
      wedding: ['25-45', 'married'],
      festival: ['18-65', 'all'],
      conference: ['25-55', 'professional'],
      sports: ['18-45', 'sports_fans'],
      religious: ['25-65', 'faith_based'],
      community: ['18-60', 'local_residents'],
      corporate: ['25-50', 'professional'],
      entertainment: ['18-35', 'entertainment_seekers'],
      political: ['25-65', 'registered_voters'],
      other: ['18-65', 'all']
    };

    const interestsMap: Record<EventType, string[]> = {
      wedding: ['wedding', 'celebration', 'fashion'],
      festival: ['festivals', 'celebration', 'culture'],
      conference: ['business', 'technology', 'networking'],
      sports: ['sports', 'entertainment', 'teams'],
      religious: ['faith', 'community', 'spirituality'],
      community: ['community', 'local', 'networking'],
      corporate: ['business', 'professional', 'networking'],
      entertainment: ['entertainment', 'music', 'movies'],
      political: ['politics', 'community', 'civic'],
      other: ['events', 'local', 'community']
    };

    return {
      radius: Math.round(Math.max(1000, avgDistance)),
      demographics: demographicsMap[event.type],
      interests: interestsMap[event.type]
    };
  }
}

export const impactService = new ImpactService();