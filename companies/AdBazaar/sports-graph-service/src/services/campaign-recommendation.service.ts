import { ISportsEventDocument } from '../models/sports-event.model.js';
import { FootfallPrediction, CampaignRecommendation, CampaignTiming, TargetAudience } from '../types/index.js';
import { placeGraphService, apartmentTargetingService } from './ecosystem.service.js';
import logger from '../config/logger.js';
import { campaignRecommendationsTotal } from '../config/metrics.js';

interface MerchantCategoryConfig {
  name: string;
  targetAudience: TargetAudience[];
  baseBudget: number;
  channelMix: { dooh: number; social: number; sms: number; push: number };
  messaging: {
    primary: string;
    cta: string;
  };
}

const MERCHANT_CATEGORY_CONFIGS: Record<string, MerchantCategoryConfig> = {
  restaurant: {
    name: 'restaurants',
    targetAudience: ['sports_fans', 'young_adults', 'families'],
    baseBudget: 25000,
    channelMix: { dooh: 0.4, social: 0.4, sms: 0.1, push: 0.1 },
    messaging: {
      primary: 'Special match day menu - Watch the game with great food!',
      cta: 'Book your table now'
    }
  },
  bar: {
    name: 'bars',
    targetAudience: ['sports_fans', 'young_adults'],
    baseBudget: 30000,
    channelMix: { dooh: 0.3, social: 0.5, sms: 0.1, push: 0.1 },
    messaging: {
      primary: 'Match day specials - Drinks, food, and the big game!',
      cta: 'Reserve your spot'
    }
  },
  hotel: {
    name: 'hotels',
    targetAudience: ['sports_fans', 'families', 'corporate'],
    baseBudget: 40000,
    channelMix: { dooh: 0.2, social: 0.3, sms: 0.2, push: 0.3 },
    messaging: {
      primary: 'Watch the match in luxury - Match day packages available',
      cta: 'Book your stay'
    }
  },
  retail: {
    name: 'retails',
    targetAudience: ['sports_fans', 'families'],
    baseBudget: 15000,
    channelMix: { dooh: 0.5, social: 0.3, sms: 0.1, push: 0.1 },
    messaging: {
      primary: 'Team jersey sale - Support your team in style!',
      cta: 'Shop now'
    }
  },
  entertainment: {
    name: 'entertainment',
    targetAudience: ['sports_fans', 'young_adults', 'families'],
    baseBudget: 35000,
    channelMix: { dooh: 0.35, social: 0.45, sms: 0.1, push: 0.1 },
    messaging: {
      primary: 'Pre-match entertainment - Start the celebration early!',
      cta: 'Get tickets'
    }
  }
};

export class CampaignRecommendationService {
  /**
   * Generate campaign recommendations for a sports event
   */
  async generateRecommendations(
    event: ISportsEventDocument,
    prediction: FootfallPrediction,
    merchantCategory?: string
  ): Promise<CampaignRecommendation[]> {
    const recommendations: CampaignRecommendation[] = [];

    const categories = merchantCategory
      ? [merchantCategory]
      : Object.keys(MERCHANT_CATEGORY_CONFIGS);

    for (const category of categories) {
      const config = MERCHANT_CATEGORY_CONFIGS[category];
      if (!config) continue;

      const recommendation = this.createRecommendation(
        event,
        prediction,
        category,
        config
      );
      recommendations.push(recommendation);
      campaignRecommendationsTotal.inc({ merchant_category: category });
    }

    logger.info('Campaign recommendations generated', {
      eventId: event._id,
      recommendationCount: recommendations.length
    });

    return recommendations;
  }

  /**
   * Create a single campaign recommendation
   */
  private createRecommendation(
    event: ISportsEventDocument,
    prediction: FootfallPrediction,
    merchantCategory: string,
    config: MerchantCategoryConfig
  ): CampaignRecommendation {
    // Calculate optimal timing based on event date
    const timing = this.determineOptimalTiming(event);

    // Calculate budget based on footfall and category
    const budget = this.calculateOptimalBudget(event, prediction, config);

    // Calculate estimated reach
    const estimatedReach = this.calculateEstimatedReach(prediction, config);

    return {
      eventId: event._id.toString(),
      merchantCategory,
      recommendedTiming: timing,
      optimalBudget: budget,
      targetAudience: config.targetAudience,
      messaging: {
        primary: this.personalizeMessage(config.messaging.primary, event),
        secondary: this.personalizeMessage(config.messaging.cta, event),
        cta: config.messaging.cta
      },
      channelMix: config.channelMix,
      estimatedReach,
      estimatedConversion: this.calculateConversionRate(merchantCategory),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Determine optimal campaign timing based on event date
   */
  private determineOptimalTiming(event: ISportsEventDocument): CampaignTiming[] {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const timings: CampaignTiming[] = [];

    if (daysUntilEvent >= 7) {
      timings.push('pre_event_week', 'pre_event_2_days', 'pre_event_day');
    } else if (daysUntilEvent >= 2) {
      timings.push('pre_event_2_days', 'pre_event_day', 'during_event');
    } else if (daysUntilEvent >= 1) {
      timings.push('pre_event_day', 'during_event', 'post_event_day');
    } else {
      timings.push('during_event', 'post_event_day');
    }

    // Add post-event week for high-impact events
    if (event.tournament?.toLowerCase().includes('ipl') ||
        event.tournament?.toLowerCase().includes('world cup') ||
        event.metadata?.isFinal) {
      timings.push('post_event_week');
    }

    return [...new Set(timings)];
  }

  /**
   * Calculate optimal budget based on event and prediction
   */
  private calculateOptimalBudget(
    event: ISportsEventDocument,
    prediction: FootfallPrediction,
    config: MerchantCategoryConfig
  ): number {
    let budget = config.baseBudget;

    // Scale by footfall
    const footfallMultiplier = prediction.predictedCrowd / 50000; // Normalize to 50K
    budget *= Math.max(0.5, Math.min(3, footfallMultiplier));

    // Major tournaments get premium budget
    if (event.tournament?.toLowerCase().includes('ipl') ||
        event.tournament?.toLowerCase().includes('world cup') ||
        event.tournament?.toLowerCase().includes('champions')) {
      budget *= 1.5;
    }

    // Finals get extra budget
    if (event.metadata?.isFinal) {
      budget *= 1.25;
    }

    // Cricket typically has higher budgets
    if (event.sport === 'cricket') {
      budget *= 1.2;
    }

    return Math.round(budget / 1000) * 1000; // Round to nearest 1000
  }

  /**
   * Calculate estimated reach based on prediction
   */
  private calculateEstimatedReach(
    prediction: FootfallPrediction,
    config: MerchantCategoryConfig
  ): number {
    // Base reach is 2x the expected footfall (includes TV, streaming, social)
    const baseReach = prediction.predictedCrowd * 2;

    // Channel mix affects final reach
    const socialReach = baseReach * config.channelMix.social * 3; // Social amplifies
    const doohReach = baseReach * config.channelMix.dooh * 0.1; // DOOH reaches nearby

    return Math.round(baseReach + socialReach + doohReach);
  }

  /**
   * Calculate conversion rate based on merchant category
   */
  private calculateConversionRate(merchantCategory: string): number {
    const conversionRates: Record<string, number> = {
      restaurant: 0.08,  // 8% conversion
      bar: 0.06,         // 6% conversion
      hotel: 0.04,       // 4% conversion
      retail: 0.12,      // 12% conversion
      entertainment: 0.10 // 10% conversion
    };

    return conversionRates[merchantCategory] || 0.07;
  }

  /**
   * Personalize message based on event details
   */
  private personalizeMessage(message: string, event: ISportsEventDocument): string {
    let personalized = message;

    // Insert team names for team sports
    if (event.teams && event.teams.length >= 2) {
      personalized = personalized.replace('{team1}', event.teams[0].name);
      personalized = personalized.replace('{team2}', event.teams[1].name);
    }

    // Insert tournament name
    if (event.tournament) {
      personalized = personalized.replace('{tournament}', event.tournament);
    }

    // Insert venue name
    personalized = personalized.replace('{venue}', event.venue.name);

    return personalized;
  }

  /**
   * Get best timing for a specific merchant category
   */
  async getBestTimingForCategory(
    event: ISportsEventDocument,
    category: string
  ): Promise<{ timing: CampaignTiming; expectedROI: number }[]> {
    const timingRois: { timing: CampaignTiming; expectedROI: number }[] = [];

    const timingOptions: CampaignTiming[] = [
      'pre_event_week',
      'pre_event_2_days',
      'pre_event_day',
      'during_event',
      'post_event_day',
      'post_event_week'
    ];

    for (const timing of timingOptions) {
      const roi = this.calculateTimingROI(timing, event, category);
      timingRois.push({ timing, expectedROI: roi });
    }

    // Sort by ROI descending
    return timingRois.sort((a, b) => b.expectedROI - a.expectedROI);
  }

  /**
   * Calculate expected ROI for a timing option
   */
  private calculateTimingROI(
    timing: CampaignTiming,
    event: ISportsEventDocument,
    category: string
  ): number {
    // Base ROI varies by timing
    const baseRois: Record<CampaignTiming, number> = {
      pre_event_week: 2.5,
      pre_event_2_days: 3.5,
      pre_event_day: 4.0,
      during_event: 3.0,
      post_event_day: 2.0,
      post_event_week: 1.5
    };

    let roi = baseRois[timing] || 1.0;

    // Adjust for event type
    if (event.sport === 'cricket') roi *= 1.2;
    if (event.metadata?.isFinal) roi *= 1.3;

    // Adjust for category
    if (category === 'restaurant' || category === 'bar') roi *= 1.15;

    return Math.round(roi * 100) / 100;
  }

  /**
   * Get audience insights for targeting
   */
  async getAudienceInsights(
    event: ISportsEventDocument,
    prediction: FootfallPrediction
  ): Promise<{
    demographics: { age: string; percentage: number }[];
    behaviors: { behavior: string; percentage: number }[];
    locations: { area: string; concentration: number }[];
  }> {
    // Get apartment targeting data for demographic insights
    const apartments = await apartmentTargetingService.getTargetableApartments(
      event.venue.latitude,
      event.venue.longitude,
      5
    );

    // Get nearby places for location concentration
    const nearbyPlaces = await placeGraphService.getNearbyPlaces(
      event.venue.latitude,
      event.venue.longitude,
      5
    );

    // Generate audience insights
    return {
      demographics: this.generateDemographicInsights(event, apartments),
      behaviors: this.generateBehaviorInsights(event, prediction),
      locations: this.generateLocationInsights(nearbyPlaces)
    };
  }

  private generateDemographicInsights(
    event: ISportsEventDocument,
    apartments: { residents: number }[]
  ): { age: string; percentage: number }[] {
    // Base demographics on sport type
    if (event.sport === 'cricket' || event.sport === 'football') {
      return [
        { age: '18-25', percentage: 30 },
        { age: '26-35', percentage: 40 },
        { age: '36-45', percentage: 20 },
        { age: '45+', percentage: 10 }
      ];
    }

    return [
      { age: '18-25', percentage: 35 },
      { age: '26-35', percentage: 35 },
      { age: '36-45', percentage: 20 },
      { age: '45+', percentage: 10 }
    ];
  }

  private generateBehaviorInsights(
    event: ISportsEventDocument,
    prediction: FootfallPrediction
  ): { behavior: string; percentage: number }[] {
    return [
      { behavior: 'watch_at_venue', percentage: 0.4 },
      { behavior: 'watch_at_home', percentage: 0.35 },
      { behavior: 'watch_at_bar_restaurant', percentage: 0.15 },
      { behavior: 'follow_social_media', percentage: 0.1 }
    ];
  }

  private generateLocationInsights(
    nearbyPlaces: { address: string; category: string }[]
  ): { area: string; concentration: number }[] {
    // Group by address area
    const areaMap = new Map<string, number>();

    for (const place of nearbyPlaces) {
      const area = place.address.split(' ').slice(-1)[0]; // Take last part of address
      areaMap.set(area, (areaMap.get(area) || 0) + 1);
    }

    const total = nearbyPlaces.length || 1;

    return Array.from(areaMap.entries())
      .map(([area, count]) => ({
        area,
        concentration: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.concentration - a.concentration)
      .slice(0, 5);
  }
}

export const campaignRecommendationService = new CampaignRecommendationService();