/**
 * ReZ Ride → Commerce Intelligence Integration
 *
 * Connects ReZ Ride to the Commerce Intelligence Network:
 * - Sends ride events to Commerce Graph
 * - Receives cross-sell recommendations
 * - Receives moment triggers
 * - Connects to Ad Decision Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CommerceIntegrationService {
  private readonly logger = new Logger(CommerceIntegrationService.name);
  private readonly commerceGraphUrl: string;
  private readonly adDecisionUrl: string;
  private readonly internalToken: string;

  constructor(private configService: ConfigService) {
    this.commerceGraphUrl = configService.get(
      'COMMERCE_GRAPH_URL',
      'http://localhost:4170'
    );
    this.adDecisionUrl = configService.get(
      'AD_DECISION_URL',
      'http://localhost:4180'
    );
    this.internalToken = configService.get('INTERNAL_SERVICE_TOKEN', '');
  }

  // ============================================
  // RIDE EVENTS → COMMERCE GRAPH
  // ============================================

  /**
   * Record ride completed transaction
   */
  async recordRideTransaction(data: {
    rideId: string;
    userId: string;
    driverId: string;
    pickup: { lat: number; lng: number; address: string };
    drop: { lat: number; lng: number; address: string };
    fare: number;
    vehicleType: string;
    distance: number;
    duration: number;
  }): Promise<void> {
    try {
      await axios.post(`${this.commerceGraphUrl}/api/transactions`, {
        customerId: data.userId,
        merchantId: data.driverId,
        transactionId: `ride_${data.rideId}`,
        type: 'ride',
        amount: data.fare,
        category: 'ride_hailing',
        items: [data.vehicleType],
        paymentMethod: 'wallet',
        coinsEarned: Math.floor(data.fare * 0.05), // 5% cashback in coins
        cashbackEarned: data.fare * 0.05,
        timestamp: new Date(),
        metadata: {
          pickup: data.pickup,
          drop: data.drop,
          distance: data.distance,
          duration: data.duration,
          vehicleType: data.vehicleType,
        },
      });

      this.logger.log(`Ride transaction recorded: ${data.rideId}`);
    } catch (error) {
      this.logger.error(`Failed to record ride transaction: ${error.message}`);
    }
  }

  /**
   * Record ride event
   */
  async recordRideEvent(data: {
    userId: string;
    driverId: string;
    rideId: string;
    eventType: 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled';
    location?: { lat: number; lng: number };
  }): Promise<void> {
    try {
      await axios.post(`${this.commerceGraphUrl}/api/events`, {
        customerId: data.userId,
        merchantId: data.driverId,
        eventType: `ride_${data.eventType}`,
        transactionId: `ride_${data.rideId}`,
        category: 'ride_hailing',
        location: data.location,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to record ride event: ${error.message}`);
    }
  }

  // ============================================
  // CROSS-SELL RECOMMENDATIONS
  // ============================================

  /**
   * Get cross-sell recommendations for rider
   */
  async getCrossSellRecommendations(userId: string): Promise<{
    recommendations: Array<{
      category: string;
      merchantName: string;
      reason: string;
      cashback: number;
    }>;
  }> {
    try {
      const response = await axios.get(
        `${this.commerceGraphUrl}/api/customers/${userId}/cross-sells`,
        {
          headers: { 'X-Internal-Token': this.internalToken },
          params: { limit: 5 },
        }
      );

      return response.data.data || { recommendations: [] };
    } catch (error) {
      this.logger.error(`Failed to get cross-sell recommendations: ${error.message}`);
      return { recommendations: [] };
    }
  }

  /**
   * Get nearby merchants after ride
   */
  async getNearbyMerchants(location: { lat: number; lng: number }, userId?: string): Promise<{
    merchants: Array<{
      merchantId: string;
      name: string;
      category: string;
      distance: number;
      cashback: number;
    }>;
  }> {
    try {
      const response = await axios.get(
        `${this.commerceGraphUrl}/api/location/nearby`,
        {
          headers: { 'X-Internal-Token': this.internalToken },
          params: {
            lat: location.lat,
            lng: location.lng,
            radius: 2, // 2km radius
            userId,
          },
        }
      );

      return response.data.data || { merchants: [] };
    } catch (error) {
      this.logger.error(`Failed to get nearby merchants: ${error.message}`);
      return { merchants: [] };
    }
  }

  // ============================================
  // MOMENT TRIGGERS
  // ============================================

  /**
   * Get moment triggers for user
   */
  async getMomentTriggers(userId: string): Promise<{
    moments: Array<{
      type: string;
      priority: string;
      offers: Array<{
        merchantName: string;
        cashback: number;
        reason: string;
      }>;
    }>;
  }> {
    try {
      const response = await axios.get(
        `${this.commerceGraphUrl}/api/customers/${userId}/moments`,
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );

      return response.data.data || { moments: [] };
    } catch (error) {
      this.logger.error(`Failed to get moment triggers: ${error.message}`);
      return { moments: [] };
    }
  }

  // ============================================
  // AD DECISION
  // ============================================

  /**
   * Get ad decision for ride context
   */
  async getAdDecision(data: {
    userId: string;
    location?: { lat: number; lng: number };
    context: 'ride_request' | 'tracking' | 'completed' | 'rating';
    destination?: { lat: number; lng: number };
  }): Promise<{
    ads: Array<{
      adId: string;
      campaignId: string;
      merchantName: string;
      cashback: number;
      headline: string;
      cta: string;
    }>;
  }> {
    try {
      const response = await axios.post(
        `${this.adDecisionUrl}/api/ads/decide`,
        {
          userId: data.userId,
          location: data.location || data.destination,
          context: data.context === 'completed' ? 'nearby' : 'feed',
          slots: 2,
        },
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );

      const decisions = response.data.data?.decisions || [];

      return {
        ads: decisions.map((d: any) => ({
          adId: d.adId,
          campaignId: d.campaignId,
          merchantName: d.merchantName,
          cashback: d.cashback,
          headline: d.content?.headline || '',
          cta: d.content?.cta || 'View Offer',
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get ad decision: ${error.message}`);
      return { ads: [] };
    }
  }

  /**
   * Record ad impression
   */
  async recordAdImpression(data: {
    adId: string;
    campaignId: string;
    userId: string;
    rideId?: string;
    location?: { lat: number; lng: number };
  }): Promise<void> {
    try {
      await axios.post(
        `${this.adDecisionUrl}/api/ads/impression`,
        {
          adId: data.adId,
          campaignId: data.campaignId,
          userId: data.userId,
          rideId: data.rideId,
          location: data.location,
        },
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );
    } catch (error) {
      this.logger.error(`Failed to record ad impression: ${error.message}`);
    }
  }

  /**
   * Record ad click
   */
  async recordAdClick(data: {
    adId: string;
    campaignId: string;
    userId: string;
  }): Promise<void> {
    try {
      await axios.post(
        `${this.adDecisionUrl}/api/ads/click`,
        {
          adId: data.adId,
          campaignId: data.campaignId,
          userId: data.userId,
        },
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );
    } catch (error) {
      this.logger.error(`Failed to record ad click: ${error.message}`);
    }
  }

  /**
   * Record ad conversion
   */
  async recordAdConversion(data: {
    adId: string;
    campaignId: string;
    userId: string;
    rideId: string;
    revenue: number;
  }): Promise<void> {
    try {
      await axios.post(
        `${this.adDecisionUrl}/api/ads/conversion`,
        {
          adId: data.adId,
          campaignId: data.campaignId,
          userId: data.userId,
          orderId: data.rideId,
          revenue: data.revenue,
        },
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );

      this.logger.log(`Ad conversion recorded: ${data.adId}`);
    } catch (error) {
      this.logger.error(`Failed to record ad conversion: ${error.message}`);
    }
  }

  // ============================================
  // USER PROFILE UPDATES
  // ============================================

  /**
   * Update user predictions after ride
   */
  async updateUserPredictions(userId: string, data: {
    rideFrequency: number;
    avgFare: number;
    preferredVehicleType: string;
    preferredAreas: string[];
  }): Promise<void> {
    try {
      await axios.patch(
        `${this.commerceGraphUrl}/api/customers/${userId}`,
        {
          $set: {
            'behaviors.visitFrequency': data.rideFrequency,
            'behaviors.avgFare': data.avgFare,
            'behaviors.preferredVehicleType': data.preferredVehicleType,
            'behaviors.preferredAreas': data.preferredAreas,
          },
        },
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update user predictions: ${error.message}`);
    }
  }

  /**
   * Get customer 360 from commerce graph
   */
  async getCustomer360(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.commerceGraphUrl}/api/customers/${userId}`,
        {
          headers: { 'X-Internal-Token': this.internalToken },
        }
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get customer 360: ${error.message}`);
      return null;
    }
  }
}
