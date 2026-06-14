/**
 * Fraud Detection Service Integration
 *
 * Connects to REZ-fraud-detection-service (3007)
 * - Ride request fraud
 * - Payment fraud
 * - Fake locations
 * - Promo abuse
 */

import axios from 'axios';
import { Logger } from '@nestjs/common';

export interface FraudCheck {
  ride: {
    userId: string;
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
    vehicleType: string;
    estimatedFare: number;
  };
  device: {
    deviceId: string;
    ip: string;
    userAgent: string;
  };
}

export interface FraudResult {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  flags: string[];
  recommendedAction: 'allow' | 'review' | 'block';
}

export interface PaymentFraudCheck {
  userId: string;
  amount: number;
  paymentMethod: 'wallet' | 'card' | 'upi';
  transactionHistory: {
    count: number;
    totalAmount: number;
    failedCount: number;
  };
  deviceId: string;
}

export class FraudDetectionService {
  private readonly logger = new Logger('FraudDetectionService');

  private readonly FRAUD_URL = process.env.REZ_FRAUD_SERVICE_URL || 'http://localhost:3007';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http = axios.create({
    timeout: 500,
    headers: {
      'X-Internal-Token': this.INTERNAL_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  // Local fallback
  private localRules = {
    maxRidesPerHour: 5,
    maxCancellationRate: 0.5,
    minFareForHighValue: 5000,
    suspiciousDistanceKm: 100,
  };

  /**
   * Check ride request for fraud
   */
  async checkRideRequest(data: FraudCheck): Promise<FraudResult> {
    try {
      const response = await this.http.post(`${this.FRAUD_URL}/api/check/ride`, data);
      return response.data;
    } catch (error) {
      this.logger.warn(`Fraud check failed, using local: ${error.message}`);
      return this.localFraudCheck(data);
    }
  }

  /**
   * Check payment for fraud
   */
  async checkPayment(data: PaymentFraudCheck): Promise<{
    isFraudulent: boolean;
    riskScore: number;
    action: 'allow' | 'review' | 'block';
  }> {
    try {
      const response = await this.http.post(`${this.FRAUD_URL}/api/check/payment`, data);
      return response.data;
    } catch (error) {
      this.logger.warn(`Payment fraud check failed: ${error.message}`);
      return { isFraudulent: false, riskScore: 20, action: 'allow' };
    }
  }

  /**
   * Check promo code abuse
   */
  async checkPromoAbuse(userId: string, promoCode: string): Promise<{
    isAbuse: boolean;
    reason: string;
  }> {
    try {
      const response = await this.http.post(`${this.FRAUD_URL}/api/check/promo`, {
        userId,
        promoCode,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Promo check failed: ${error.message}`);
      return { isAbuse: false, reason: '' };
    }
  }

  /**
   * Check for fake GPS/location
   */
  async checkLocationSpoofing(
    userId: string,
    locations: { lat: number; lng: number; timestamp: Date }[]
  ): Promise<{
    isSpoofed: boolean;
    confidence: number;
    indicators: string[];
  }> {
    try {
      const response = await this.http.post(`${this.FRAUD_URL}/api/check/location`, {
        userId,
        locations,
      });
      return response.data;
    } catch (error) {
      // Local check
      return this.checkLocationSpoofingLocal(locations);
    }
  }

  /**
   * Report confirmed fraud
   */
  async reportFraud(data: {
    type: 'ride' | 'payment' | 'promo';
    userId: string;
    details: Record<string, any>;
  }): Promise<void> {
    try {
      await this.http.post(`${this.FRAUD_URL}/api/report`, data);
    } catch (error) {
      this.logger.error(`Failed to report fraud: ${error.message}`);
    }
  }

  // Local fallback fraud check
  private localFraudCheck(data: FraudCheck): FraudResult {
    const reasons: string[] = [];
    const flags: string[] = [];
    let riskScore = 0;

    // Check distance
    const distance = this.calculateDistance(
      data.ride.pickup.lat,
      data.ride.pickup.lng,
      data.ride.drop.lat,
      data.ride.drop.lng
    );

    if (distance > this.localRules.suspiciousDistanceKm) {
      reasons.push(`Suspicious long distance: ${distance.toFixed(0)}km`);
      riskScore += 30;
    }

    // Check fare anomaly
    const avgFarePerKm = distance > 0 ? data.ride.estimatedFare / distance : 0;
    if (avgFarePerKm < 5) {
      flags.push('Low fare per km');
      riskScore += 20;
    }

    if (avgFarePerKm > 50) {
      flags.push('High fare per km');
      riskScore += 15;
    }

    // Check device trust (simplified)
    if (!data.device.deviceId) {
      flags.push('No device ID');
      riskScore += 25;
    }

    const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
    const action = riskScore >= 80 ? 'block' : riskScore >= 50 ? 'review' : 'allow';

    return {
      isFraudulent: riskScore >= 80,
      riskScore,
      riskLevel,
      reasons,
      flags,
      recommendedAction: action,
    };
  }

  private checkLocationSpoofingLocal(
    locations: { lat: number; lng: number; timestamp: Date }[]
  ): { isSpoofed: boolean; confidence: number; indicators: string[] } {
    const indicators: string[] = [];
    let suspiciousCount = 0;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];

      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000; // seconds
      const dist = this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);

      // Impossible speed check (>200 km/h)
      if (timeDiff > 0 && (dist / (timeDiff / 3600)) > 200) {
        suspiciousCount++;
        indicators.push(`Impossible speed detected`);
      }

      // Jump check (>10km in <10 seconds)
      if (timeDiff < 10 && dist > 10) {
        suspiciousCount++;
        indicators.push(`Location jump: ${dist.toFixed(1)}km in ${timeDiff}s`);
      }
    }

    return {
      isSpoofed: suspiciousCount > 2,
      confidence: Math.min(suspiciousCount * 20, 100),
      indicators: [...new Set(indicators)],
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const fraudDetectionService = new FraudDetectionService();
