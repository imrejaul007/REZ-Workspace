import mongoose from 'mongoose';
import { SportsEventModel } from '../models/sports-event.model.js';
import { TeamModel } from '../models/team.model.js';
import { PlayerModel } from '../models/player.model.js';
import { SportsAnalyticsModel } from '../models/sports-analytics.model.js';
import logger from '../config/logger.js';
import { dbQueryDuration, campaignRecommendationsTotal } from '../config/metrics.js';

export interface TargetingData {
  eventId: string;
  radiusKm?: number;
  merchantCategories?: string[];
  targetAudience?: string[];
}

export interface CampaignRecommendation {
  eventId: string;
  merchantCategory: string;
  recommendedTiming: string[];
  optimalBudget: number;
  targetAudience: string[];
  messaging: {
    primary: string;
    secondary?: string;
    cta: string;
  };
  channelMix: {
    dooh: number;
    social: number;
    sms: number;
    push: number;
  };
  estimatedReach: number;
  estimatedConversion: number;
  generatedAt: string;
}

export class TargetingService {
  async getTargetingData(eventId: string, options: { radiusKm?: number; merchantCategories?: string[] } = {}): Promise<{
    event: any;
    teams: any[];
    players: any[];
    analytics: any;
    targetingOptions: {
      location: { lat: number; lng: number; radius: number };
      demographics: any;
      engagement: any;
      timing: string[];
    };
  }> {
    const startTime = Date.now();

    try {
      const [event, teams, players, analytics] = await Promise.all([
        SportsEventModel.findById(eventId).lean(),
        TeamModel.find({ eventId: new mongoose.Types.ObjectId(eventId) }).lean(),
        PlayerModel.find({ eventId: new mongoose.Types.ObjectId(eventId) }).lean(),
        SportsAnalyticsModel.findOne({ eventId: new mongoose.Types.ObjectId(eventId) }).lean()
      ]);

      if (!event) {
        throw new Error('Event not found');
      }

      const targetingOptions = {
        location: {
          lat: event.venue.latitude,
          lng: event.venue.longitude,
          radius: options.radiusKm || 5
        },
        demographics: analytics?.demographics || this.generateDefaultDemographics(event.sport),
        engagement: analytics?.engagement || { social: 0, streaming: 0, tv: 0 },
        timing: this.calculateOptimalTiming(event)
      };

      logger.info('Targeting data generated', { eventId });
      return {
        event,
        teams,
        players,
        analytics,
        targetingOptions
      };
    } catch (error) {
      logger.error('Failed to get targeting data', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'targeting' }, (Date.now() - startTime) / 1000);
    }
  }

  async generateCampaignRecommendations(eventId: string, merchantCategory: string): Promise<CampaignRecommendation> {
    const startTime = Date.now();

    try {
      const event = await SportsEventModel.findById(eventId).lean();
      if (!event) {
        throw new Error('Event not found');
      }

      const analytics = await SportsAnalyticsModel.findOne({ eventId: new mongoose.Types.ObjectId(eventId) }).lean();
      const estimatedReach = analytics?.viewership || Math.floor(event.venue.capacity * 10);

      const recommendation: CampaignRecommendation = {
        eventId,
        merchantCategory,
        recommendedTiming: this.calculateOptimalTiming(event),
        optimalBudget: this.calculateOptimalBudget(merchantCategory, estimatedReach),
        targetAudience: this.getTargetAudienceForCategory(merchantCategory),
        messaging: this.generateMessaging(event, merchantCategory),
        channelMix: this.calculateChannelMix(merchantCategory),
        estimatedReach,
        estimatedConversion: this.estimateConversion(merchantCategory),
        generatedAt: new Date().toISOString()
      };

      campaignRecommendationsTotal.inc({ merchant_category: merchantCategory });
      logger.info('Campaign recommendation generated', { eventId, merchantCategory });

      return recommendation;
    } catch (error) {
      logger.error('Failed to generate campaign recommendation', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'aggregate', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async getNearbyMerchants(eventId: string, radiusKm: number = 5): Promise<any[]> {
    const startTime = Date.now();

    try {
      const event = await SportsEventModel.findById(eventId).lean();
      if (!event) {
        throw new Error('Event not found');
      }

      // In a real implementation, this would query a merchant service
      // For now, return mock data structure
      const merchants = [
        {
          id: 'merchant-1',
          name: 'Stadium Food Court',
          category: 'restaurant',
          distance: 0.5,
          coordinates: { lat: event.venue.latitude, lng: event.venue.longitude }
        },
        {
          id: 'merchant-2',
          name: 'City Hotel',
          category: 'hotel',
          distance: 1.2,
          coordinates: { lat: event.venue.latitude + 0.01, lng: event.venue.longitude + 0.01 }
        }
      ];

      return merchants;
    } catch (error) {
      logger.error('Failed to get nearby merchants', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'geo', collection: 'merchants' }, (Date.now() - startTime) / 1000);
    }
  }

  async getAudienceSegments(eventId: string): Promise<{
    segments: Array<{
      name: string;
      size: number;
      demographics: any;
      interests: string[];
      preferredChannels: string[];
    }>;
    totalReach: number;
  }> {
    const startTime = Date.now();

    try {
      const event = await SportsEventModel.findById(eventId).lean();
      if (!event) {
        throw new Error('Event not found');
      }

      const analytics = await SportsAnalyticsModel.findOne({ eventId: new mongoose.Types.ObjectId(eventId) }).lean();
      const baseAudience = analytics?.viewership || event.venue.capacity;

      const segments = [
        {
          name: 'Die-hard Fans',
          size: Math.floor(baseAudience * 0.15),
          demographics: { age: '25-45', gender: 'Male dominant' },
          interests: ['live_sports', 'merchandise', 'streaming'],
          preferredChannels: ['dooh', 'social', 'push']
        },
        {
          name: 'Casual Viewers',
          size: Math.floor(baseAudience * 0.35),
          demographics: { age: '18-55', gender: 'Balanced' },
          interests: ['entertainment', 'social_media', 'food'],
          preferredChannels: ['social', 'sms', 'push']
        },
        {
          name: 'Hospitality Seekers',
          size: Math.floor(baseAudience * 0.2),
          demographics: { age: '30-60', gender: 'Balanced' },
          interests: ['dining', 'hotels', 'travel'],
          preferredChannels: ['dooh', 'sms', 'push']
        },
        {
          name: 'Family Groups',
          size: Math.floor(baseAudience * 0.2),
          demographics: { age: '30-50', gender: 'Balanced' },
          interests: ['family_activities', 'food', 'shopping'],
          preferredChannels: ['social', 'push', 'sms']
        },
        {
          name: 'Corporate Audience',
          size: Math.floor(baseAudience * 0.1),
          demographics: { age: '25-55', gender: 'Balanced' },
          interests: ['business', 'networking', 'hospitality'],
          preferredChannels: ['dooh', 'email', 'push']
        }
      ];

      return {
        segments,
        totalReach: baseAudience
      };
    } catch (error) {
      logger.error('Failed to get audience segments', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'aggregate', collection: 'sports_analytics' }, (Date.now() - startTime) / 1000);
    }
  }

  private generateDefaultDemographics(sport: string): any {
    return {
      ageGroups: { '18-24': 0.2, '25-34': 0.35, '35-44': 0.25, '45+': 0.2 },
      genderSplit: sport === 'cricket' ? { male: 0.7, female: 0.3 } : { male: 0.6, female: 0.4 },
      regions: { local: 0.5, regional: 0.3, national: 0.2 }
    };
  }

  private calculateOptimalTiming(event: any): string[] {
    const eventDate = new Date(event.startDate);
    const timing: string[] = [];

    // Pre-event timings
    timing.push('pre_event_week');
    timing.push('pre_event_2_days');
    timing.push('pre_event_day');

    // During event
    timing.push('during_event');

    // Post-event
    timing.push('post_event_day');
    timing.push('post_event_week');

    return timing;
  }

  private getTargetAudienceForCategory(category: string): string[] {
    const audienceMap: Record<string, string[]> = {
      restaurant: ['sports_fans', 'casual_viewers', 'families'],
      hotel: ['sports_fans', 'hospitality', 'corporate'],
      retail: ['sports_fans', 'families', 'young_adults'],
      transport: ['sports_fans', 'casual_viewers', 'families'],
      entertainment: ['casual_viewers', 'families', 'young_adults']
    };

    return audienceMap[category] || ['sports_fans', 'casual_viewers'];
  }

  private generateMessaging(event: any, category: string): { primary: string; secondary?: string; cta: string } {
    const sportMessages: Record<string, string> = {
      cricket: 'Cricket Fever',
      football: 'Football Mania',
      hockey: 'Hockey Heroes',
      tennis: 'Tennis Tournament',
      basketball: 'Basketball Blitz',
      other: 'Sports Spectacular'
    };

    const categoryMessages: Record<string, string> = {
      restaurant: 'Catch the game with great food!',
      hotel: 'Experience the thrill live!',
      retail: 'Gear up for game day!',
      transport: 'Get there on time!',
      entertainment: 'Join the excitement!'
    };

    return {
      primary: `${sportMessages[event.sport] || 'Sports Event'} - ${event.name}`,
      secondary: categoryMessages[category] || 'Limited time offer!',
      cta: 'Book Now'
    };
  }

  private calculateChannelMix(category: string): { dooh: number; social: number; sms: number; push: number } {
    const mixMap: Record<string, { dooh: number; social: number; sms: number; push: number }> = {
      restaurant: { dooh: 0.3, social: 0.4, sms: 0.15, push: 0.15 },
      hotel: { dooh: 0.4, social: 0.3, sms: 0.2, push: 0.1 },
      retail: { dooh: 0.2, social: 0.5, sms: 0.15, push: 0.15 },
      transport: { dooh: 0.5, social: 0.2, sms: 0.2, push: 0.1 },
      entertainment: { dooh: 0.3, social: 0.4, sms: 0.1, push: 0.2 }
    };

    return mixMap[category] || { dooh: 0.25, social: 0.4, sms: 0.15, push: 0.2 };
  }

  private calculateOptimalBudget(category: string, reach: number): number {
    const cpmRates: Record<string, number> = {
      restaurant: 150, // INR per 1000 impressions
      hotel: 200,
      retail: 120,
      transport: 180,
      entertainment: 140
    };

    const cpm = cpmRates[category] || 150;
    return Math.round((reach / 1000) * cpm);
  }

  private estimateConversion(category: string): number {
    const conversionRates: Record<string, number> = {
      restaurant: 0.035,
      hotel: 0.025,
      retail: 0.045,
      transport: 0.03,
      entertainment: 0.04
    };

    return conversionRates[category] || 0.03;
  }
}

export const targetingService = new TargetingService();