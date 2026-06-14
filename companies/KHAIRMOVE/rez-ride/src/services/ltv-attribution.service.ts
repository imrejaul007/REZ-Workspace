import { Injectable, Logger } from '@nestjs/common';

/**
 * LTV Attribution Service
 * Uses ReZ Intelligence for lifetime value and attribution
 */

export interface UserLTV {
  userId: string;
  lifetimeValue: number;
  lifetimeRides: number;
  avgRideValue: number;
  acquisitionSource: string;
  channels: ChannelAttribution[];
  predictions: LTVPrediction;
  segment: 'new' | 'active' | 'at_risk' | 'churning' | 'champion';
}

export interface ChannelAttribution {
  channel: 'organic' | 'referral' | 'ads' | 'social' | 'direct' | 'unknown';
  rides: number;
  value: number;
  firstTouch: Date;
  lastTouch: Date;
}

export interface LTVPrediction {
  predictedLTV3Month: number;
  predictedLTV6Month: number;
  confidence: number;
  factors: LTVFactor[];
}

export interface LTVFactor {
  type: string;
  impact: number;
  description: string;
}

export interface AttributionEvent {
  userId: string;
  rideId: string;
  channel: string;
  campaign?: string;
  touchpoint: string;
  timestamp: Date;
  value: number;
}

@Injectable()
export class LTVAttributionService {
  private readonly logger = new Logger(LTVAttributionService.name);

  constructor() {}

  // ===========================================
  // LTV CALCULATION
  // ===========================================

  /**
   * Calculate user LTV
   */
  async calculateLTV(userId: string): Promise<UserLTV> {
    // Get ride history from ReZ Intelligence
    const rides = await this.getUserRides(userId);
    const channels = await this.getChannelAttribution(userId);
    const predictions = await this.predictLTV(rides);
    const segment = this.segmentUser(rides);

    const lifetimeValue = rides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const lifetimeRides = rides.length;
    const avgRideValue = lifetimeRides > 0 ? lifetimeValue / lifetimeRides : 0;
    const acquisitionSource = this.getPrimaryChannel(channels);

    return {
      userId,
      lifetimeValue,
      lifetimeRides,
      avgRideValue,
      acquisitionSource,
      channels,
      predictions,
      segment,
    };
  }

  // ===========================================
  // USER DATA
  // ===========================================

  private async getUserRides(userId: string): Promise<any[]> {
    // From ReZ Intelligence ride data
    // In production, query LTV attribution service
    return [
      { rideId: 'R001', fare: 150, timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { rideId: 'R002', fare: 200, timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { rideId: 'R003', fare: 180, timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { rideId: 'R004', fare: 220, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];
  }

  // ===========================================
  // CHANNEL ATTRIBUTION
  // ===========================================

  /**
   * Track ride attribution
   */
  async trackAttribution(event: AttributionEvent): Promise<void> {
    // Store in ReZ Intelligence attribution-hub
    this.logger.log(`Attribution: ${event.channel} → ${event.userId} = ₹${event.value}`);
  }

  private async getChannelAttribution(userId: string): Promise<ChannelAttribution[]> {
    // From ReZ-attribution-hub
    return [
      {
        channel: 'referral',
        rides: 2,
        value: 400,
        firstTouch: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastTouch: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        channel: 'organic',
        rides: 5,
        value: 900,
        firstTouch: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastTouch: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  private getPrimaryChannel(channels: ChannelAttribution[]): string {
    if (channels.length === 0) return 'unknown';

    // First touch attribution
    return channels.sort((a, b) => a.firstTouch.getTime() - b.firstTouch.getTime())[0].channel;
  }

  // ===========================================
  // PREDICTION
  // ===========================================

  /**
   * Predict future LTV
   */
  private async predictLTV(rides: any[]): Promise<LTVPrediction> {
    const recentRides = rides.slice(0, 10);
    const avgValue = recentRides.reduce((sum, r) => sum + (r.fare || 0), 0) / recentRides.length;
    const rideFrequency = this.calculateFrequency(recentRides);

    // Simple linear projection
    const ltv3Month = avgValue * rideFrequency * 30;
    const ltv6Month = avgValue * rideFrequency * 60;

    const factors: LTVFactor[] = [];

    // Add prediction factors
    if (rideFrequency > 0.5) {
      factors.push({
        type: 'high_frequency',
        impact: 0.3,
        description: 'User rides frequently',
      });
    }

    if (avgValue > 200) {
      factors.push({
        type: 'high_value',
        impact: 0.2,
        description: 'High average ride value',
      });
    }

    return {
      predictedLTV3Month: Math.round(ltv3Month),
      predictedLTV6Month: Math.round(ltv6Month),
      confidence: 0.75,
      factors,
    };
  }

  private calculateFrequency(rides: any[]): number {
    if (rides.length < 2) return 0;

    const first = new Date(rides[rides.length - 1].timestamp);
    const last = new Date(rides[0].timestamp);
    const days = (last.getTime() - first.getTime()) / (24 * 60 * 60 * 1000);

    return days > 0 ? rides.length / days : 0;
  }

  // ===========================================
  // USER SEGMENTATION
  // ===========================================

  private segmentUser(rides: any[]): UserLTV['segment'] {
    const daysSinceLast = rides.length > 0
      ? (Date.now() - new Date(rides[0].timestamp).getTime()) / (24 * 60 * 60 * 1000)
      : 999;

    if (rides.length === 0 || daysSinceLast > 60) return 'churning';
    if (rides.length < 3 || daysSinceLast > 30) return 'at_risk';
    if (rides.length >= 20) return 'champion';
    if (daysSinceLast <= 7) return 'active';
    return 'new';
  }

  // ===========================================
  // CAMPAIGN ATTRIBUTION
  // ===========================================

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    impressions: number;
    clicks: number;
    bookings: number;
    revenue: number;
    roi: number;
    attributedUsers: string[];
  }> {
    // From ReZ-attribution-platform
    return {
      impressions: 10000,
      clicks: 500,
      bookings: 50,
      revenue: 15000,
      roi: 3.5,
      attributedUsers: [],
    };
  }

  /**
   * Track campaign conversion
   */
  async trackConversion(
    campaignId: string,
    userId: string,
    rideId: string,
    value: number
  ): Promise<void> {
    // Store in attribution system
    this.logger.log(`Conversion: Campaign ${campaignId} → User ${userId} = ₹${value}`);
  }

  // ===========================================
  // COhort ANALYSIS
  // ===========================================

  /**
   * Get cohort analysis
   */
  async cohortAnalysis(cohortMonth: string): Promise<{
    cohort: string;
    initialUsers: number;
    retention: number[];
    ltv: number[];
  }> {
    // Analyze cohort retention from ReZ Intelligence
    return {
      cohort: cohortMonth,
      initialUsers: 1000,
      retention: [100, 65, 45, 35, 28, 22, 18, 15],
      ltv: [0, 120, 280, 450, 620, 780, 920, 1050],
    };
  }
}
