/**
 * ReZ Intelligence Integration Service
 *
 * Connects ReZ Ride to all ReZ Intelligence services for:
 * - Intent prediction
 * - Churn prediction
 * - LTV attribution
 * - Real-time segmentation
 * - Unified profiles
 * - Recommendations
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';

export interface UserSegment {
  segment: 'champion' | 'active' | 'at_risk' | 'churning';
  score: number;
  features: string[];
}

export interface IntentPrediction {
  topDestinations: { address: string; lat: number; lng: number; probability: number }[];
  preferredVehicle: 'auto' | 'cab' | 'suv' | 'bike';
  optimalDepartureTime: Date;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface LTVData {
  ltv: number;
  frequency: number;
  monetaryValue: number;
  lastRide: Date;
  predictedLifetime: number;
  segment: string;
}

export interface ChurnPrediction {
  score: number; // 0-100
  risk: 'low' | 'medium' | 'high' | 'critical';
  factors: { reason: string; impact: number }[];
  recommendedActions: { action: string; priority: 'low' | 'medium' | 'high' }[];
  retentionOffer?: {
    discount: number;
    cashback: number;
    freeRides: number;
  };
}

export interface DriverInsight {
  churnRisk: 'low' | 'medium' | 'high';
  earningsPotential: number;
  optimalHours: { start: number; end: number }[];
  trainingNeeds: string[];
  qualityScore: number;
}

export class IntelligenceService {
  private readonly logger = new Logger('IntelligenceService');

  // Service URLs
  private readonly INTENT_URL = process.env.REZ_INTENT_URL || 'http://localhost:4018';
  private readonly PREDICTIVE_URL = process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123';
  private readonly PROFILE_URL = process.env.REZ_PROFILE_URL || 'http://localhost:4120';
  private readonly SEGMENTS_URL = process.env.REZ_SEGMENTS_URL || 'http://localhost:4126';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 5000,
      headers: {
        'X-Internal-Token': this.INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  // ===========================================
  // USER INTELLIGENCE
  // ===========================================

  /**
   * Get user segment in real-time
   */
  async getUserSegment(userId: string): Promise<UserSegment> {
    try {
      const response = await this.http.get(`${this.SEGMENTS_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Segment lookup failed, using default: ${error.message}`);
      return this.getDefaultSegment();
    }
  }

  /**
   * Predict user intent (next destination, preferred vehicle, etc.)
   */
  async predictIntent(userId: string, context: {
    lat: number;
    lng: number;
    time: Date;
  }): Promise<IntentPrediction> {
    try {
      const response = await this.http.post(`${this.INTENT_URL}/predict`, {
        userId,
        location: context,
        context: {
          timeOfDay: context.time.getHours(),
          dayOfWeek: context.time.getDay(),
          weather: 'clear', // Could integrate weather API
        },
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Intent prediction failed: ${error.message}`);
      return this.getDefaultIntentPrediction();
    }
  }

  /**
   * Calculate and update user LTV
   */
  async updateLTV(userId: string, rideData: {
    fare: number;
    distance: number;
    vehicleType: string;
  }): Promise<LTVData> {
    try {
      const response = await this.http.post(`${this.PREDICTIVE_URL}/ltv/update`, {
        userId,
        ...rideData,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`LTV update failed: ${error.message}`);
      return this.calculateLocalLTV(rideData);
    }
  }

  /**
   * Predict user churn risk
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    try {
      const response = await this.http.get(`${this.PREDICTIVE_URL}/churn/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Churn prediction failed: ${error.message}`);
      return this.getDefaultChurnPrediction();
    }
  }

  /**
   * Trigger retention campaign for at-risk users
   */
  async triggerRetention(userId: string, churnRisk: ChurnPrediction): Promise<void> {
    if (churnRisk.risk === 'low') return;

    try {
      await this.http.post(`${this.PREDICTIVE_URL}/retention/trigger`, {
        userId,
        risk: churnRisk.risk,
        offer: churnRisk.retentionOffer,
        actions: churnRisk.recommendedActions,
      });
    } catch (error) {
      this.logger.error(`Retention trigger failed: ${error.message}`);
    }
  }

  // ===========================================
  // UNIFIED PROFILE
  // ===========================================

  /**
   * Get unified user profile across all ReZ products
   */
  async getUnifiedProfile(userId: string): Promise<any> {
    try {
      const response = await this.http.get(`${this.PROFILE_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Profile lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Update unified profile with ride data
   */
  async updateProfile(userId: string, data: {
    totalRides?: number;
    totalSpent?: number;
    lastRide?: Date;
    avgRating?: number;
    preferredVehicle?: string;
    frequentRoutes?: { from: string; to: string; count: number }[];
  }): Promise<void> {
    try {
      await this.http.patch(`${this.PROFILE_URL}/user/${userId}`, data);
    } catch (error) {
      this.logger.warn(`Profile update failed: ${error.message}`);
    }
  }

  // ===========================================
  // DRIVER INTELLIGENCE
  // ===========================================

  /**
   * Get driver insights for optimization
   */
  async getDriverInsights(driverId: string): Promise<DriverInsight> {
    try {
      const response = await this.http.get(`${this.PREDICTIVE_URL}/driver/${driverId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Driver insights failed: ${error.message}`);
      return this.getDefaultDriverInsight();
    }
  }

  /**
   * Update driver quality score
   */
  async updateDriverScore(driverId: string, data: {
    rideRating: number;
    acceptanceRate: number;
    cancellationRate: number;
    completionRate: number;
  }): Promise<void> {
    try {
      await this.http.post(`${this.PREDICTIVE_URL}/driver/score`, {
        driverId,
        ...data,
      });
    } catch (error) {
      this.logger.warn(`Driver score update failed: ${error.message}`);
    }
  }

  // ===========================================
  // RECOMMENDATIONS
  // ===========================================

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(userId: string, context: {
    lat: number;
    lng: number;
    time: Date;
  }): Promise<{
    promotions: { type: string; value: number; expires: Date }[];
    optimalDeparture: { time: Date; savings: number };
    poolSuggestions: { userId: string; route: string }[];
  }> {
    try {
      const response = await this.http.post(`${this.INTENT_URL}/recommend`, {
        userId,
        context,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Recommendations failed: ${error.message}`);
      return { promotions: [], optimalDeparture: { time: new Date(), savings: 0 }, poolSuggestions: [] };
    }
  }

  /**
   * Get dynamic surge prediction
   */
  async predictSurge(lat: number, lng: number, hoursAhead: number = 0): Promise<{
    surge: number;
    confidence: number;
    reasons: string[];
  }> {
    try {
      const response = await this.http.post(`${this.PREDICTIVE_URL}/surge/predict`, {
        lat,
        lng,
        hoursAhead,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Surge prediction failed: ${error.message}`);
      return { surge: 1.0, confidence: 0.5, reasons: ['insufficient data'] };
    }
  }

  // ===========================================
  // EVENT TRACKING
  // ===========================================

  /**
   * Track event for ML training
   */
  async trackEvent(event: {
    type: string;
    userId: string;
    data: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    try {
      await this.http.post(`${this.INTENT_URL}/events`, event);
    } catch (error) {
      this.logger.warn(`Event tracking failed: ${error.message}`);
    }
  }

  // ===========================================
  // FALLBACK METHODS
  // ===========================================

  private getDefaultSegment(): UserSegment {
    return {
      segment: 'active',
      score: 50,
      features: ['recent_user'],
    };
  }

  private getDefaultIntentPrediction(): IntentPrediction {
    return {
      topDestinations: [],
      preferredVehicle: 'cab',
      optimalDepartureTime: new Date(),
      churnRisk: 'low',
    };
  }

  private getDefaultChurnPrediction(): ChurnPrediction {
    return {
      score: 20,
      risk: 'low',
      factors: [],
      recommendedActions: [],
    };
  }

  private getDefaultDriverInsight(): DriverInsight {
    return {
      churnRisk: 'low',
      earningsPotential: 500,
      optimalHours: [{ start: 9, end: 21 }],
      trainingNeeds: [],
      qualityScore: 4.5,
    };
  }

  private calculateLocalLTV(rideData: { fare: number }): LTVData {
    return {
      ltv: rideData.fare * 10,
      frequency: 1,
      monetaryValue: rideData.fare,
      lastRide: new Date(),
      predictedLifetime: 365,
      segment: 'new',
    };
  }
}

export const intelligenceService = new IntelligenceService();
