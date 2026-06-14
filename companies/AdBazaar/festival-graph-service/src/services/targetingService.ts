import { Festival, FestivalAnalytics, Artist } from '../models/index.js';
import { logger } from '../config/logger.js';
import mongoose from 'mongoose';

export interface TargetingCriteria {
  demographics: {
    ageGroups: string[];
    gender: string[];
  };
  interests: string[];
  locations: Array<{
    city: string;
    radius: number; // in km
  }>;
  deviceTypes: string[];
  timeWindows: Array<{
    start: string; // HH:mm
    end: string;
    days: number[]; // 0-6 (Sunday-Saturday)
  }>;
}

export interface AdTargetingConfig {
  festivalId: string;
  campaignObjectives: string[];
  budget: number;
  targeting: TargetingCriteria;
  estimatedReach: number;
  estimatedCPM: number;
  recommendedChannels: string[];
  creativeSuggestions: string[];
  competitorInsights: string[];
}

export interface AudienceSegment {
  segmentId: string;
  name: string;
  size: number;
  demographics: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
  };
  interests: Record<string, number>;
  topLocations: Array<{
    city: string;
    percentage: number;
  }>;
  activeHours: Record<string, number>; // hour -> percentage
  preferredDevices: Record<string, number>;
}

export class TargetingService {
  async getTargetingConfig(festivalId: string): Promise<AdTargetingConfig | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const festival = await Festival.findById(festivalId);
      if (!festival) {
        return null;
      }

      const analytics = await FestivalAnalytics.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        period: 'overall',
      });

      // Build targeting criteria based on festival type and analytics
      const targeting = this.buildTargetingCriteria(festival, analytics);

      // Estimate reach based on expected attendance
      const estimatedReach = Math.round(festival.expectedAttendance * 10); // 10x multiplier for ad reach

      // Calculate estimated CPM based on channel
      const estimatedCPM = this.calculateEstimatedCPM(festival.type);

      // Recommend channels based on festival type
      const recommendedChannels = this.getRecommendedChannels(festival.type);

      // Generate creative suggestions
      const creativeSuggestions = this.generateCreativeSuggestions(festival);

      // Generate competitor insights
      const competitorInsights = this.generateCompetitorInsights(festival);

      const config: AdTargetingConfig = {
        festivalId,
        campaignObjectives: this.getCampaignObjectives(festival.type),
        budget: this.estimateBudget(festival.expectedAttendance, estimatedCPM),
        targeting,
        estimatedReach,
        estimatedCPM,
        recommendedChannels,
        creativeSuggestions,
        competitorInsights,
      };

      logger.info('Targeting config generated', { festivalId });
      return config;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get targeting config', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async getAudienceSegments(festivalId: string): Promise<AudienceSegment[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const festival = await Festival.findById(festivalId);
      if (!festival) {
        throw new Error('Festival not found');
      }

      const analytics = await FestivalAnalytics.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        period: 'overall',
      });

      // Generate audience segments based on festival characteristics
      const segments: AudienceSegment[] = [];

      // Primary audience segment
      const primarySegment = this.generatePrimarySegment(festival, analytics);
      segments.push(primarySegment);

      // Secondary segments based on festival type
      const secondarySegments = this.generateSecondarySegments(festival, analytics);
      segments.push(...secondarySegments);

      return segments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get audience segments', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async getOptimalAdSlots(festivalId: string): Promise<Array<{
    slotId: string;
    location: string;
    deviceType: string;
    estimatedImpressions: number;
    costPerSlot: number;
    effectiveness: number;
  }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const festival = await Festival.findById(festivalId);
      if (!festival) {
        throw new Error('Festival not found');
      }

      // Generate optimal ad slots based on festival location and type
      const slots = this.generateOptimalSlots(festival);

      return slots;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get optimal ad slots', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async getNearbyMerchants(festivalId: string, radiusKm: number = 10): Promise<Array<{
    merchantId: string;
    name: string;
    category: string;
    distance: number;
    potentialReach: number;
    recommendedAdType: string;
  }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const festival = await Festival.findById(festivalId);
      if (!festival) {
        throw new Error('Festival not found');
      }

      // In a real implementation, this would query the place graph service
      // For now, return mock data based on festival characteristics
      const merchants = this.generateNearbyMerchants(festival, radiusKm);

      return merchants;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get nearby merchants', { error: errorMessage, festivalId, radiusKm });
      throw error;
    }
  }

  private buildTargetingCriteria(festival: any, analytics: any): TargetingCriteria {
    // Default demographics based on festival type
    const typeDemographics: Record<string, { ageGroups: string[]; gender: string[]; interests: string[] }> = {
      music: {
        ageGroups: ['18-24', '25-34', '35-44'],
        gender: ['male', 'female', 'other'],
        interests: ['music', 'concerts', 'live events', 'festivals'],
      },
      food: {
        ageGroups: ['25-34', '35-44', '45-54'],
        gender: ['male', 'female'],
        interests: ['food', 'dining', 'culinary', 'restaurants'],
      },
      cultural: {
        ageGroups: ['18-24', '25-34', '35-44', '45-54', '55+'],
        gender: ['male', 'female'],
        interests: ['culture', 'art', 'heritage', 'traditions'],
      },
      sports: {
        ageGroups: ['18-24', '25-34', '35-44'],
        gender: ['male', 'female'],
        interests: ['sports', 'fitness', 'competition'],
      },
      arts: {
        ageGroups: ['25-34', '35-44', '45-54'],
        gender: ['male', 'female'],
        interests: ['art', 'design', 'creative', 'galleries'],
      },
      technology: {
        ageGroups: ['18-24', '25-34', '35-44'],
        gender: ['male', 'female'],
        interests: ['technology', 'innovation', 'startups', 'AI'],
      },
    };

    const defaults = typeDemographics[festival.type] || typeDemographics.cultural;

    // Override with analytics data if available
    const demographics = {
      ageGroups: analytics?.targeting?.demographics?.ageGroups
        ? Object.keys(analytics.targeting.demographics.ageGroups)
        : defaults.ageGroups,
      gender: analytics?.targeting?.demographics?.gender
        ? Object.keys(analytics.targeting.demographics.gender)
        : defaults.gender,
    };

    const interests = analytics?.targeting?.interests
      ? Object.keys(analytics.targeting.interests)
      : defaults.interests;

    // Build locations targeting
    const locations = [
      {
        city: festival.venue.city,
        radius: festival.impactRadius,
      },
    ];

    // Add top performing locations from analytics
    if (analytics?.targeting?.locations?.length > 0) {
      const topLocations = analytics.targeting.locations.slice(0, 3);
      topLocations.forEach((loc: any) => {
        if (loc.city !== festival.venue.city) {
          locations.push({
            city: loc.city,
            radius: 10,
          });
        }
      });
    }

    return {
      demographics,
      interests,
      locations,
      deviceTypes: ['mobile', 'dooh', 'desktop'],
      timeWindows: [
        {
          start: '09:00',
          end: '12:00',
          days: [1, 2, 3, 4, 5], // Weekdays
        },
        {
          start: '18:00',
          end: '23:00',
          days: [5, 6, 0], // Friday, Saturday, Sunday
        },
      ],
    };
  }

  private calculateEstimatedCPM(festivalType: string): number {
    const cpmRates: Record<string, number> = {
      music: 150,
      food: 120,
      cultural: 100,
      religious: 80,
      sports: 180,
      arts: 130,
      film: 140,
      literary: 90,
      technology: 200,
      mixed: 150,
    };
    return cpmRates[festivalType] || 150;
  }

  private getRecommendedChannels(festivalType: string): string[] {
    const channels: Record<string, string[]> = {
      music: ['instagram', 'youtube', 'spotify', 'dooh', 'tiktok'],
      food: ['instagram', 'google', 'facebook', 'dooh'],
      cultural: ['facebook', 'instagram', 'dooh', 'print'],
      sports: ['youtube', 'espn', 'dooh', 'sports apps'],
      arts: ['instagram', 'pinterest', 'dooh', 'art blogs'],
      technology: ['linkedin', 'twitter', 'tech blogs', 'youtube'],
      mixed: ['instagram', 'facebook', 'google', 'dooh'],
    };
    return channels[festivalType] || channels.mixed;
  }

  private generateCreativeSuggestions(festival: any): string[] {
    const suggestions: string[] = [];
    const type = festival.type;

    suggestions.push(`"Experience ${festival.name} - Get Your Tickets Now!"`);
    suggestions.push(`"Join ${festival.expectedAttendance.toLocaleString()}+ Attendees at ${festival.venue.name}"`);

    if (type === 'music') {
      suggestions.push('"The Ultimate Music Experience Awaits"');
      suggestions.push('"Live Performances You Cannot Miss"');
    } else if (type === 'food') {
      suggestions.push('"A Culinary Journey Like No Other"');
      suggestions.push('"Taste the Best of Local& Global Cuisines"');
    } else if (type === 'cultural') {
      suggestions.push('"Celebrate Our Heritage & Culture"');
      suggestions.push('"Immerse Yourself in Tradition"');
    }

    return suggestions;
  }

  private generateCompetitorInsights(festival: any): string[] {
    const insights: string[] = [];

    insights.push(`Similar festivals in ${festival.venue.city} achieved60-80% ticket sellout2 weeks before event`);
    insights.push('DOOH advertising near venue increases footfall by 25%');
    insights.push('Social media campaigns targeting 25-34 age group show highest engagement');

    return insights;
  }

  private getCampaignObjectives(festivalType: string): string[] {
    const objectives: Record<string, string[]> = {
      music: ['ticket_sales', 'brand_awareness', 'social_engagement'],
      food: ['foot_traffic', 'brand_awareness', 'social_sharing'],
      cultural: ['ticket_sales', 'community_engagement', 'cultural_awareness'],
      sports: ['ticket_sales', 'live_streaming', 'merchandise_sales'],
      arts: ['ticket_sales', 'artisan_exposure', 'cultural_awareness'],
      technology: ['registrations', 'lead_generation', 'brand_thought_leadership'],
      mixed: ['ticket_sales', 'brand_awareness', 'engagement'],
    };
    return objectives[festivalType] || objectives.mixed;
  }

  private estimateBudget(expectedAttendance: number, cpm: number): number {
    // Budget = (expected attendance * 0.5) * (CPM / 1000)
    const targetImpressions = expectedAttendance * 0.5;
    return Math.round((targetImpressions * cpm) / 1000);
  }

  private generatePrimarySegment(festival: any, analytics: any): AudienceSegment {
    const baseSize = festival.expectedAttendance;

    return {
      segmentId: 'primary-' + festival._id,
      name: `${festival.type.charAt(0).toUpperCase() + festival.type.slice(1)} Enthusiasts`,
      size: Math.round(baseSize * 1.5),
      demographics: {
        ageGroups: { '25-34': 40, '18-24': 30, '35-44': 20, '45+': 10 },
        gender: { female: 55, male: 42, other: 3 },
      },
      interests: this.getInterestsForType(festival.type),
      topLocations: [
        { city: festival.venue.city, percentage: 60 },
        { city: 'Mumbai', percentage: 15 },
        { city: 'Delhi', percentage: 15 },
        { city: 'Bangalore', percentage: 10 },
      ],
      activeHours: {
        '10': 5, '11': 8, '12': 10, '13': 8, '14': 6, '15': 5,
        '16': 8, '17': 12, '18': 20, '19': 25, '20': 30, '21': 25, '22': 15,
      },
      preferredDevices: { mobile: 65, desktop: 20, tablet: 10, dooh: 5 },
    };
  }

  private generateSecondarySegments(festival: any, analytics: any): AudienceSegment[] {
    const segments: AudienceSegment[] = [];

    // Family segment for cultural/food festivals
    if (['cultural', 'food', 'mixed'].includes(festival.type)) {
      segments.push({
        segmentId: 'family-' + festival._id,
        name: 'Families& Groups',
        size: Math.round(festival.expectedAttendance * 0.3),
        demographics: {
          ageGroups: { '35-44': 40, '45-54': 35, '25-34': 15, '55+': 10 },
          gender: { female: 55, male: 45 },
        },
        interests: ['family_outings', 'food', 'entertainment', 'kids_activities'],
        topLocations: [
          { city: festival.venue.city, percentage: 75 },
          { city: 'Nearby suburbs', percentage: 25 },
        ],
        activeHours: {
          '10': 15, '11': 20, '12': 25, '13': 20, '14': 15, '15': 10,
          '16': 8, '17': 10, '18': 15, '19': 20, '20': 15, '21': 10,
        },
        preferredDevices: { mobile: 50, desktop: 15, tablet: 25, dooh: 10 },
      });
    }

    // Young professionals for music/technology
    if (['music', 'technology', 'arts'].includes(festival.type)) {
      segments.push({
        segmentId: 'young-pros-' + festival._id,
        name: 'Young Professionals',
        size: Math.round(festival.expectedAttendance * 0.4),
        demographics: {
          ageGroups: { '18-24': 45, '25-34': 50, '35-44': 5 },
          gender: { male: 55, female: 42, other: 3 },
        },
        interests: ['trending', 'social_media', 'networking', 'innovation', 'music'],
        topLocations: [
          { city: festival.venue.city, percentage: 50 },
          { city: 'Mumbai', percentage: 20 },
          { city: 'Delhi', percentage: 15 },
          { city: 'Bangalore', percentage: 15 },
        ],
        activeHours: {
          '18': 10, '19': 20, '20': 30, '21': 35, '22': 30, '23': 20,
        },
        preferredDevices: { mobile: 75, desktop: 15, tablet: 5, dooh: 5 },
      });
    }

    return segments;
  }

  private generateOptimalSlots(festival: any): Array<any> {
    const slots = [];

    // Venue-based slots
    slots.push({
      slotId: 'venue-entrance-' + festival._id,
      location: `${festival.venue.name} - Main Entrance`,
      deviceType: 'dooh',
      estimatedImpressions: Math.round(festival.expectedAttendance * 0.8),
      costPerSlot: 50000,
      effectiveness: 95,
    });

    slots.push({
      slotId: 'venue-lobby-' + festival._id,
      location: `${festival.venue.name} - Lobby`,
      deviceType: 'dooh',
      estimatedImpressions: Math.round(festival.expectedAttendance * 0.6),
      costPerSlot: 30000,
      effectiveness: 85,
    });

    // City-wide mobile targeting
    slots.push({
      slotId: 'city-mobile-' + festival._id,
      location: `${festival.venue.city} - Mobile Users`,
      deviceType: 'mobile',
      estimatedImpressions: Math.round(festival.expectedAttendance * 5),
      costPerSlot: 20000,
      effectiveness: 70,
    });

    return slots;
  }

  private generateNearbyMerchants(festival: any, radiusKm: number): Array<any> {
    const merchants = [];
    const categories = ['restaurants', 'hotels', 'transportation', 'retail', 'entertainment'];

    categories.forEach((category, index) => {
      merchants.push({
        merchantId: `merchant-${index}-${festival._id}`,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} near ${festival.venue.name}`,
        category,
        distance: Math.round((index + 1) *2 * 10) / 10,
        potentialReach: Math.round(festival.expectedAttendance * 0.1 * (1 - index * 0.1)),
        recommendedAdType: category === 'restaurants' ? 'local_ad' : 'brand_awareness',
      });
    });

    return merchants;
  }

  private getInterestsForType(type: string): Record<string, number> {
    const interestsMap: Record<string, Record<string, number>> = {
      music: { 'live_music': 90, 'festivals': 80, 'concerts': 85, 'nightlife': 70 },
      food: { 'dining': 90, 'foodie': 85, 'culinary': 80, 'restaurants': 75 },
      cultural: { 'culture': 90, 'art': 80, 'heritage': 75, 'traditions': 70 },
      sports: { 'sports': 90, 'fitness': 80, 'competition': 75, 'teams': 70 },
      arts: { 'art': 90, 'design': 80, 'creative': 75, 'galleries': 70 },
      technology: { 'tech': 90, 'innovation': 85, 'startups': 80, 'AI': 75 },
    };
    return interestsMap[type] || interestsMap.cultural;
  }
}

export const targetingService = new TargetingService();