/**
 * Signal Aggregator Service Integration
 *
 * Connects to REZ-signal-aggregator (4142)
 * - Aggregates all behavioral signals
 * - Location, behavioral, social, competitor, engagement
 * - Real-time signal scores
 */

import axios from 'axios';
import { Logger } from '@nestjs/common';

export interface UserSignals {
  location: {
    signals: {
      type: string;
      score: number;
      timestamp: Date;
    }[];
    totalScore: number;
  };
  behavioral: {
    signals: {
      type: string;
      score: number;
      timestamp: Date;
    }[];
    totalScore: number;
  };
  social: {
    signals: {
      type: string;
      score: number;
      timestamp: Date;
    }[];
    totalScore: number;
  };
  competitor: {
    signals: {
      type: string;
      score: number;
      timestamp: Date;
    }[];
    totalScore: number;
  };
  engagement: {
    signals: {
      type: string;
      score: number;
      timestamp: Date;
    }[];
    totalScore: number;
  };
}

export interface SignalScore {
  overall: number; // 0-100
  signals: UserSignals;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: Date;
}

export type SignalType =
  | 'ride_frequency'
  | 'avg_fare'
  | 'peak_hours'
  | 'multi_platform'
  | 'social_shares'
  | 'referral_count'
  | 'competitor_app_usage'
  | 'review_sentiment'
  | 'support_tickets'
  | 'promo_responsiveness';

export class SignalAggregatorService {
  private readonly logger = new Logger('SignalAggregatorService');

  private readonly SIGNAL_URL = process.env.REZ_SIGNAL_AGGREGATOR_URL || 'http://localhost:4142';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http = axios.create({
    timeout: 500,
    headers: {
      'X-Internal-Token': this.INTERNAL_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  /**
   * Get aggregated signals for user
   */
  async getUserSignals(userId: string): Promise<SignalScore | null> {
    try {
      const response = await this.http.get(`${this.SIGNAL_URL}/api/signals/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Signal lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Push new signal event
   */
  async pushSignal(data: {
    userId: string;
    signalType: SignalType;
    value: number;
    metadata?: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    try {
      await this.http.post(`${this.SIGNAL_URL}/api/signals`, data);
    } catch (error) {
      this.logger.warn(`Signal push failed: ${error.message}`);
    }
  }

  /**
   * Push ride completion signal
   */
  async pushRideSignal(userId: string, data: {
    rideId: string;
    fare: number;
    distance: number;
    vehicleType: string;
    rating?: number;
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
  }): Promise<void> {
    // Push multiple signals from single ride
    await Promise.all([
      this.pushSignal({
        userId,
        signalType: 'ride_frequency',
        value: 1,
        metadata: { rideId: data.rideId },
        timestamp: new Date(),
      }),
      this.pushSignal({
        userId,
        signalType: 'avg_fare',
        value: data.fare,
        metadata: { vehicleType: data.vehicleType },
        timestamp: new Date(),
      }),
      this.pushSignal({
        userId,
        signalType: 'peak_hours',
        value: new Date().getHours(),
        metadata: { rideId: data.rideId },
        timestamp: new Date(),
      }),
    ]);

    // Push rating signal if available
    if (data.rating) {
      await this.pushSignal({
        userId,
        signalType: 'review_sentiment',
        value: data.rating,
        metadata: { rideId: data.rideId },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get intent signals for user
   */
  async getIntentSignals(userId: string): Promise<{
    purchaseIntent: number;
    churnRisk: number;
    upgradePotential: number;
    referralLikelihood: number;
  } | null> {
    try {
      const response = await this.http.get(`${this.SIGNAL_URL}/api/signals/${userId}/intent`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Intent signals lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get competitor signals
   */
  async getCompetitorSignals(userId: string): Promise<{
    competitorUsage: number;
    lastCompetitorApp: string;
    lastUsed: Date;
    switchingSignals: string[];
  } | null> {
    try {
      const response = await this.http.get(`${this.SIGNAL_URL}/api/signals/${userId}/competitor`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Competitor signals lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get social signals
   */
  async getSocialSignals(userId: string): Promise<{
    referralCount: number;
    socialShares: number;
    networkSize: number;
    influenceScore: number;
  } | null> {
    try {
      const response = await this.http.get(`${this.SIGNAL_URL}/api/signals/${userId}/social`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Social signals lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Batch push signals
   */
  async batchPush(signals: {
    userId: string;
    signalType: SignalType;
    value: number;
    metadata?: Record<string, any>;
    timestamp: Date;
  }[]): Promise<void> {
    try {
      await this.http.post(`${this.SIGNAL_URL}/api/signals/batch`, { signals });
    } catch (error) {
      this.logger.warn(`Batch signal push failed: ${error.message}`);
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(userId: string): Promise<{
    sessionsPerWeek: number;
    avgSessionDuration: number;
    featureAdoption: Record<string, boolean>;
    lastActive: Date;
    streak: number;
  } | null> {
    try {
      const response = await this.http.get(`${this.SIGNAL_URL}/api/signals/${userId}/engagement`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Engagement metrics lookup failed: ${error.message}`);
      return null;
    }
  }
}

export const signalAggregatorService = new SignalAggregatorService();
