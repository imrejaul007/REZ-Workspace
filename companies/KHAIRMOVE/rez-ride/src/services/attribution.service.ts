/**
 * Attribution Service Integration
 *
 * Connects to REZ-attribution-hub (4100)
 * - Track conversion attribution
 * - LTV by channel
 * - Attribution models (first-touch, last-touch, multi-touch)
 */

import axios from 'axios';
import { Logger } from '@nestjs/common';

export interface AttributionEvent {
  userId: string;
  event: 'impression' | 'click' | 'search' | 'book' | 'complete';
  channel: 'organic' | 'paid_search' | 'social' | 'referral' | 'email' | 'qr';
  campaignId?: string;
  adId?: string;
  creativeId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversionAttribution {
  userId: string;
  conversionId: string;
  conversionValue: number;
  attributedChannels: {
    channel: string;
    credit: number; // 0-100%
    touchpoints: number;
  }[];
  model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';
}

export interface LTVByChannel {
  channel: string;
  ltv: number;
  conversions: number;
  avgOrderValue: number;
  conversionRate: number;
}

export class AttributionService {
  private readonly logger = new Logger('AttributionService');

  private readonly ATTRIBUTION_URL = process.env.REZ_ATTRIBUTION_URL || 'http://localhost:4100';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http = axios.create({
    timeout: 500,
    headers: {
      'X-Internal-Token': this.INTERNAL_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  // Local queue for batch sending
  private eventQueue: AttributionEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushInterval();
  }

  /**
   * Track ride search (attribution touchpoint)
   */
  trackSearch(userId: string, channel: AttributionEvent['channel'] = 'organic'): void {
    this.enqueue({
      userId,
      event: 'search',
      channel,
      timestamp: new Date(),
    });
  }

  /**
   * Track ride booking (conversion)
   */
  trackBooking(userId: string, data: {
    rideId: string;
    fare: number;
    vehicleType: string;
    channel?: AttributionEvent['channel'];
    campaignId?: string;
  }): void {
    this.enqueue({
      userId,
      event: 'book',
      channel: data.channel || 'organic',
      campaignId: data.campaignId,
      timestamp: new Date(),
      metadata: {
        rideId: data.rideId,
        fare: data.fare,
        vehicleType: data.vehicleType,
      },
    });
  }

  /**
   * Track ride completion (conversion with value)
   */
  trackCompletion(userId: string, data: {
    rideId: string;
    fare: number;
    distance: number;
    cashback: number;
    channel?: AttributionEvent['channel'];
    campaignId?: string;
  }): void {
    this.enqueue({
      userId,
      event: 'complete',
      channel: data.channel || 'organic',
      campaignId: data.campaignId,
      timestamp: new Date(),
      metadata: {
        rideId: data.rideId,
        fare: data.fare,
        distance: data.distance,
        cashback: data.cashback,
      },
    });
  }

  /**
   * Track ad impression
   */
  trackImpression(userId: string, data: {
    adId: string;
    campaignId: string;
    creativeId?: string;
  }): void {
    this.enqueue({
      userId,
      event: 'impression',
      channel: 'social',
      adId: data.adId,
      campaignId: data.campaignId,
      creativeId: data.creativeId,
      timestamp: new Date(),
    });
  }

  /**
   * Track ad click
   */
  trackClick(userId: string, data: {
    adId: string;
    campaignId: string;
    creativeId?: string;
  }): void {
    this.enqueue({
      userId,
      event: 'click',
      channel: 'social',
      adId: data.adId,
      campaignId: data.campaignId,
      creativeId: data.creativeId,
      timestamp: new Date(),
    });
  }

  /**
   * Get conversion attribution for user
   */
  async getAttribution(userId: string, conversionId?: string): Promise<ConversionAttribution | null> {
    try {
      const params: any = {};
      if (conversionId) params.conversionId = conversionId;

      const response = await this.http.get(`${this.ATTRIBUTION_URL}/api/attribution/${userId}`, { params });
      return response.data;
    } catch (error) {
      this.logger.warn(`Attribution lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get LTV by channel
   */
  async getLTVByChannel(): Promise<LTVByChannel[] | null> {
    try {
      const response = await this.http.get(`${this.ATTRIBUTION_URL}/api/ltv/by-channel`);
      return response.data.channels;
    } catch (error) {
      this.logger.warn(`LTV by channel lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get channel performance
   */
  async getChannelPerformance(dateRange: {
    start: Date;
    end: Date;
  }): Promise<{
    channels: {
      name: string;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
      ctr: number;
      cvr: number;
      roas: number;
    }[];
    total: {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    };
  } | null> {
    try {
      const response = await this.http.get(`${this.ATTRIBUTION_URL}/api/channels/performance`, {
        params: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Channel performance lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get campaign ROI
   */
  async getCampaignROI(campaignId: string): Promise<{
    campaignId: string;
    spend: number;
    revenue: number;
    conversions: number;
    roi: number;
    cpa: number;
    roas: number;
  } | null> {
    try {
      const response = await this.http.get(`${this.ATTRIBUTION_URL}/api/campaigns/${campaignId}/roi`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Campaign ROI lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user acquisition source
   */
  async getAcquisitionSource(userId: string): Promise<{
    channel: string;
    campaign?: string;
    touchpointCount: number;
    firstTouchDate: Date;
    lastTouchDate: Date;
  } | null> {
    try {
      const response = await this.http.get(`${this.ATTRIBUTION_URL}/api/users/${userId}/acquisition`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Acquisition source lookup failed: ${error.message}`);
      return null;
    }
  }

  // Private methods
  private enqueue(event: AttributionEvent): void {
    this.eventQueue.push(event);
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000); // Flush every 10 seconds
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.http.post(`${this.ATTRIBUTION_URL}/api/events/batch`, { events });
      this.logger.debug(`Flushed ${events.length} attribution events`);
    } catch (error) {
      // Re-queue on failure
      this.eventQueue = [...events, ...this.eventQueue];
      this.logger.warn(`Event flush failed, re-queued ${events.length} events`);
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

export const attributionService = new AttributionService();
