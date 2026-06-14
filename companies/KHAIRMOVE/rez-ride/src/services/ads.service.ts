import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride } from '../models/ride.model';
import { User } from '../models/user.model';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AdContext {
  rideId: string;
  userId: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  vehicleType: 'auto' | 'cab' | 'suv' | 'bike' | 'bus';
  timeOfDay: string;
  dayOfWeek: string;
}

export interface TargetedAd {
  adId: string;
  campaignId: string;
  creative: {
    type: 'image' | 'video' | 'card';
    url: string;
    title: string;
    description: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  targetingScore: number;
  cpm: number;
}

export interface ImpressionEvent {
  adId: string;
  rideId: string;
  userId: string;
  servedAt: Date;
  viewedDuration: number;
  interacted: boolean;
  interactionType?: 'tap' | 'swipe';
}

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);
  private readonly adsbazaarUrl: string;
  private readonly internalToken: string;
  private readonly rezMindUrl: string;

  // Active ride ads tracking
  private activeRideAds: Map<string, {
    startedAt: Date;
    impressions: number;
    lastAdServed: Date;
  }> = new Map();

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {
    this.adsbazaarUrl = configService.get('ADSBAZAAR_URL', 'http://localhost:4007');
    this.internalToken = configService.get('INTERNAL_SERVICE_TOKEN', '');
    this.rezMindUrl = configService.get('REZ_MIND_SERVICE_URL', 'http://localhost:4018');
  }

  /**
   * Start serving ads for a ride
   */
  async startRideAds(ride: Ride): Promise<void> {
    const rideId = ride._id.toString();

    // Initialize tracking
    this.activeRideAds.set(rideId, {
      startedAt: new Date(),
      impressions: 0,
      lastAdServed: new Date(),
    });

    this.logger.log(`Started ad serving for ride: ${rideId}`);

    // Request ad targeting
    await this.requestTargetedAd({
      rideId,
      userId: ride.userId.toString(),
      pickup: ride.pickup,
      drop: ride.drop,
      vehicleType: ride.vehicleType,
      timeOfDay: new Date().getHours().toString(),
      dayOfWeek: new Date().getDay().toString(),
    });
  }

  /**
   * Stop serving ads and calculate impressions
   */
  async stopRideAds(rideId: string): Promise<number> {
    const tracking = this.activeRideAds.get(rideId);

    if (!tracking) {
      return 0;
    }

    const impressions = tracking.impressions;
    this.activeRideAds.delete(rideId);

    this.logger.log(`Stopped ad serving for ride: ${rideId}, impressions: ${impressions}`);

    return impressions;
  }

  /**
   * Get targeted ad for ride
   */
  async requestTargetedAd(context: AdContext): Promise<TargetedAd | null> {
    try {
      // Get user intent from ReZ Mind
      const userIntent = await this.getUserIntent(context.userId);

      // Get ads from AdsBazaar
      const response = await axios.post(
        `${this.adsbazaarUrl}/api/ads/target`,
        {
          context: {
            ride_id: context.rideId,
            user_id: context.userId,
            vehicle_type: context.vehicleType,
            time_of_day: context.timeOfDay,
            day_of_week: context.dayOfWeek,
          },
          targeting: {
            categories: userIntent?.top_categories || [],
            urgency: userIntent?.purchase_intent?.level || 'medium',
            location: {
              pickup: context.pickup,
              drop: context.drop,
            },
          },
          limit: 1,
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ads?.[0]) {
        return response.data.ads[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get targeted ad: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user intent from ReZ Mind
   */
  private async getUserIntent(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.rezMindUrl}/api/intent/profile/${userId}`,
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.debug(`Failed to get user intent: ${error.message}`);
      return null;
    }
  }

  /**
   * Record impression
   */
  async recordImpression(event: ImpressionEvent): Promise<void> {
    try {
      // Update local tracking
      const tracking = this.activeRideAds.get(event.rideId);
      if (tracking) {
        tracking.impressions += 1;
        tracking.lastAdServed = new Date();
      }

      // Send to AdsBazaar
      await axios.post(
        `${this.adsbazaarUrl}/api/ads/impression`,
        {
          impression_id: `${event.rideId}_${event.adId}_${Date.now()}`,
          ad_id: event.adId,
          ride_id: event.rideId,
          user_id: event.userId,
          served_at: event.servedAt.toISOString(),
          viewed_duration: event.viewedDuration,
          interacted: event.interacted,
          interaction_type: event.interactionType,
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug(`Impression recorded for ride: ${event.rideId}`);
    } catch (error) {
      this.logger.error(`Failed to record impression: ${error.message}`);
    }
  }

  /**
   * Record interaction (tap)
   */
  async recordInteraction(
    rideId: string,
    adId: string,
    userId: string,
    interactionType: 'tap' | 'swipe',
    viewDuration: number,
  ): Promise<void> {
    try {
      await axios.post(
        `${this.adsbazaarUrl}/api/ads/interaction`,
        {
          impression_id: `${rideId}_${adId}`,
          ad_id: adId,
          ride_id: rideId,
          interaction_type: interactionType,
          view_duration: viewDuration,
        },
        {
          headers: {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug(`Interaction recorded for ad: ${adId}`);
    } catch (error) {
      this.logger.error(`Failed to record interaction: ${error.message}`);
    }
  }

  /**
   * Get ad report for a ride
   */
  async getRideAdReport(rideId: string): Promise<{
    impressions: number;
    interactions: number;
    revenue: number;
  }> {
    try {
      const response = await axios.get(
        `${this.adsbazaarUrl}/api/ads/report/${rideId}`,
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get ad report: ${error.message}`);
      return { impressions: 0, interactions: 0, revenue: 0 };
    }
  }

  /**
   * Calculate ad revenue for a ride
   */
  async calculateAdRevenue(rideId: string, impressions: number): Promise<number> {
    // Average CPM of ₹25 for targeted ads
    const cpm = 25;
    const revenue = (impressions / 1000) * cpm;

    // Driver gets 60%
    return revenue * 0.6;
  }

  /**
   * Get dashboard stats
   */
  async getAdStats(): Promise<{
    totalImpressions: number;
    totalInteractions: number;
    avgCtr: number;
    totalRevenue: number;
  }> {
    try {
      const response = await axios.get(
        `${this.adsbazaarUrl}/api/ads/stats`,
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get ad stats: ${error.message}`);
      return {
        totalImpressions: 0,
        totalInteractions: 0,
        avgCtr: 0,
        totalRevenue: 0,
      };
    }
  }

  /**
   * Get creatives for screen
   */
  async getScreenCreatives(screenId: string): Promise<TargetedAd[]> {
    try {
      const response = await axios.get(
        `${this.adsbazaarUrl}/api/ads/screen/${screenId}/creatives`,
        {
          headers: {
            'X-Internal-Token': this.internalToken,
          },
        }
      );

      return response.data.ads || [];
    } catch (error) {
      this.logger.error(`Failed to get screen creatives: ${error.message}`);
      return [];
    }
  }
}
