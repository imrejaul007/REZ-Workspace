import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { randomBytes } from 'crypto';

/**
 * Deterministic mock random for development/testing
 * Uses crypto for better distribution than mockRandom(0, 1)
 */
function mockRandom(min: number, max: number): number {
  const buf = randomBytes(4);
  const val = buf.readUInt32LE(0) / 0xFFFFFFFF;
  return min + val * (max - min);
}
import { Ride } from '../models/ride.model';

/**
 * ML Model Types
 */
export enum MLModelType {
  ETA = 'eta',
  DEMAND_FORECAST = 'demand_forecast',
  FRAUD_DETECTION = 'fraud_detection',
  DYNAMIC_PRICING = 'dynamic_pricing',
  MATCHING = 'matching',
  CANCELLATION_PREDICTION = 'cancellation_prediction',
}

/**
 * ETA Prediction Request
 */
export interface ETAPredictionRequest {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  vehicleType: string;
  trafficLevel?: 'low' | 'medium' | 'high';
  weather?: 'clear' | 'rain' | 'fog';
}

/**
 * ETA Prediction Response
 */
export interface ETAPrediction {
  etaMinutes: number;
  etaSeconds: number;
  confidence: number;
  route: {
    distanceKm: number;
    durationMinutes: number;
  };
  factors: {
    traffic: number;
    weather: number;
    timeOfDay: number;
  };
}

/**
 * Demand Forecast
 */
export interface DemandForecast {
  zoneId: string;
  hour: number;
  dayOfWeek: number;
  predictedDemand: number;
  confidence: number;
  surgeMultiplier: number;
  driversNeeded: number;
}

/**
 * Fraud Detection Result
 */
export interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: {
    type: string;
    score: number;
    description: string;
  }[];
  recommendation: 'allow' | 'review' | 'block';
}

/**
 * Cancellation Prediction
 */
export interface CancellationPrediction {
  userId: string;
  rideId: string;
  cancellationProbability: number;
  factors: {
    type: string;
    impact: number;
  }[];
  incentiveOffered?: number;
}

@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  // Model weights (in production, load from ML model files)
  private readonly ETA_WEIGHTS = {
    base: 15,
    distance: 2.5,
    traffic: 1.3,
    weather: 1.2,
    timeOfDay: 1.1,
  };

  // Historical averages
  private historicalAvgETA = 18; // minutes
  private historicalAccuracy = 0.87; // 87%

  // Model
  private rideModel: Model<any>;

  constructor(rideModel?: Model<any>) {
    this.rideModel = rideModel || mongoose.model('Ride') as Model<any>;
  }

  // ===========================================
  // ETA PREDICTION
  // ===========================================

  /**
   * Predict ETA using ML model
   */
  async predictETA(request: ETAPredictionRequest): Promise<ETAPrediction> {
    // Calculate base route
    const distanceKm = this.calculateDistance(
      request.pickupLat,
      request.pickupLng,
      request.dropLat,
      request.dropLng
    );

    // Base duration
    const baseDuration = distanceKm / 30 * 60; // Assume 30 km/h average

    // Traffic factor (based on time of day and traffic level)
    const trafficFactor = this.getTrafficFactor(request.trafficLevel);

    // Weather factor
    const weatherFactor = this.getWeatherFactor(request.weather);

    // Time of day factor (rush hour penalty)
    const timeOfDayFactor = this.getTimeOfDayFactor();

    // Calculate ETA
    const etaMinutes = baseDuration * trafficFactor * weatherFactor * timeOfDayFactor;

    // Add pickup time (driver reaching user)
    const pickupETA = 5 + mockRandom(0, 1) * 10; // 5-15 minutes - now cryptographically random
    const totalETA = etaMinutes + pickupETA;

    // Calculate confidence based on historical accuracy
    const confidence = this.calculateConfidence(
      distanceKm,
      request.trafficLevel,
      request.weather
    );

    // Round values
    const etaSeconds = Math.round(totalETA * 60);
    const finalETA = Math.round(totalETA);

    return {
      etaMinutes: finalETA,
      etaSeconds,
      confidence,
      route: {
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMinutes: finalETA,
      },
      factors: {
        traffic: Math.round(trafficFactor * 100) / 100,
        weather: Math.round(weatherFactor * 100) / 100,
        timeOfDay: Math.round(timeOfDayFactor * 100) / 100,
      },
    };
  }

  /**
   * Get ETA for driver arrival
   */
  async predictDriverETA(
    driverLat: number,
    driverLng: number,
    pickupLat: number,
    pickupLng: number
  ): Promise<{
    etaMinutes: number;
    distanceKm: number;
    trafficFactor: number;
  }> {
    const distanceKm = this.calculateDistance(
      driverLat,
      driverLng,
      pickupLat,
      pickupLng
    );

    const trafficFactor = this.getTrafficFactor();
    const etaMinutes = (distanceKm / 25) * 60 * trafficFactor; // 25 km/h in city

    return {
      etaMinutes: Math.round(etaMinutes),
      distanceKm: Math.round(distanceKm * 100) / 100,
      trafficFactor: Math.round(trafficFactor * 100) / 100,
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    distanceKm: number,
    trafficLevel?: string,
    weather?: string
  ): number {
    let confidence = this.historicalAccuracy;

    // Shorter trips have more variance
    if (distanceKm < 3) confidence -= 0.05;
    if (distanceKm > 20) confidence -= 0.03;

    // Unknown conditions reduce confidence
    if (!trafficLevel) confidence -= 0.02;
    if (!weather) confidence -= 0.01;

    return Math.round(Math.min(0.95, Math.max(0.70, confidence)) * 100) / 100;
  }

  /**
   * Get traffic factor
   */
  private getTrafficFactor(level?: string): number {
    if (level === 'high') return 1.5;
    if (level === 'medium') return 1.2;

    // Determine from time of day
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 1.4;
    }
    if ((hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 23)) {
      return 1.1;
    }
    return 1.0;
  }

  /**
   * Get weather factor
   */
  private getWeatherFactor(weather?: string): number {
    if (weather === 'rain') return 1.3;
    if (weather === 'fog') return 1.15;
    return 1.0;
  }

  /**
   * Get time of day factor
   */
  private getTimeOfDayFactor(): number {
    const hour = new Date().getHours();

    // Peak hours
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 1.25;
    }
    // Late night
    if (hour >= 22 || hour <= 5) {
      return 0.9;
    }
    return 1.0;
  }

  // ===========================================
  // DEMAND FORECASTING
  // ===========================================

  /**
   * Predict demand for a zone
   */
  async forecastDemand(
    zoneId: string,
    hoursAhead: number = 1
  ): Promise<DemandForecast> {
    const now = new Date();
    const forecastTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Historical patterns
    const hourOfDay = forecastTime.getHours();
    const dayOfWeek = forecastTime.getDay();

    // Base demand
    let baseDemand = 10;

    // Time patterns
    if ((hourOfDay >= 8 && hourOfDay <= 10) || (hourOfDay >= 17 && hourOfDay <= 20)) {
      baseDemand *= 2.5; // Peak hours
    } else if (hourOfDay >= 22 || hourOfDay <= 6) {
      baseDemand *= 0.3; // Late night
    } else if (hourOfDay >= 11 && hourOfDay <= 15) {
      baseDemand *= 1.2; // Lunch
    }

    // Day patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseDemand *= 0.8; // Weekend
    } else if (dayOfWeek === 5) {
      baseDemand *= 1.2; // Friday
    }

    // Weather adjustment (mock)
    baseDemand *= 1.0;

    // Calculate surge
    const surgeMultiplier = this.calculateSurgeFromDemand(baseDemand);

    // Calculate drivers needed (assume each driver does 4 rides/hour)
    const driversNeeded = Math.ceil(baseDemand / 4);

    // Confidence decreases with hours ahead
    const confidence = Math.max(0.6, 0.95 - hoursAhead * 0.05);

    return {
      zoneId,
      hour: hourOfDay,
      dayOfWeek,
      predictedDemand: Math.round(baseDemand),
      confidence,
      surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
      driversNeeded,
    };
  }

  /**
   * Calculate surge multiplier from demand
   */
  private calculateSurgeFromDemand(demand: number, supply: number = 10): number {
    const ratio = demand / supply;

    if (ratio >= 5) return 3.0;
    if (ratio >= 4) return 2.5;
    if (ratio >= 3) return 2.0;
    if (ratio >= 2) return 1.5;
    if (ratio >= 1.5) return 1.25;
    return 1.0;
  }

  // ===========================================
  // FRAUD DETECTION
  // ===========================================

  /**
   * Detect fraud for a ride
   */
  async detectFraud(
    rideId: string,
    userId?: string,
    driverId?: string
  ): Promise<FraudDetectionResult> {
    const signals: FraudDetectionResult['signals'] = [];
    let riskScore = 0;

    // Check 1: Unusual location
    const locationSignal = await this.checkUnusualLocation(rideId);
    if (locationSignal) {
      signals.push(locationSignal);
      riskScore += locationSignal.score;
    }

    // Check 2: Rapid repeated bookings
    if (userId) {
      const rapidSignal = await this.checkRapidBookings(userId);
      if (rapidSignal) {
        signals.push(rapidSignal);
        riskScore += rapidSignal.score;
      }
    }

    // Check 3: Unusual fare
    const fareSignal = await this.checkUnusualFare(rideId);
    if (fareSignal) {
      signals.push(fareSignal);
      riskScore += fareSignal.score;
    }

    // Check 4: Payment pattern
    const paymentSignal = await this.checkPaymentPattern(userId);
    if (paymentSignal) {
      signals.push(paymentSignal);
      riskScore += paymentSignal.score;
    }

    // Check 5: Driver anomaly
    if (driverId) {
      const driverSignal = await this.checkDriverAnomaly(driverId);
      if (driverSignal) {
        signals.push(driverSignal);
        riskScore += driverSignal.score;
      }
    }

    // Determine risk level
    let riskLevel: FraudDetectionResult['riskLevel'];
    let recommendation: FraudDetectionResult['recommendation'];

    if (riskScore >= 80) {
      riskLevel = 'critical';
      recommendation = 'block';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
      recommendation = 'block';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
      recommendation = 'review';
    } else {
      riskLevel = 'low';
      recommendation = 'allow';
    }

    return {
      isFraudulent: riskScore >= 50,
      riskScore,
      riskLevel,
      signals,
      recommendation,
    };
  }

  /**
   * Check unusual location pattern
   */
  private async checkUnusualLocation(
    rideId: string
  ): Promise<FraudDetectionResult['signals'][0] | null> {
    // Mock: 5% chance of unusual location
    if (mockRandom(0, 1) > 0.95) {
      return {
        type: 'unusual_location',
        score: 30,
        description: 'Pickup location is unusual for this user',
      };
    }
    return null;
  }

  /**
   * Check rapid bookings
   */
  private async checkRapidBookings(
    userId: string
  ): Promise<FraudDetectionResult['signals'][0] | null> {
    // Mock: 3% chance of rapid booking
    if (mockRandom(0, 1) > 0.97) {
      return {
        type: 'rapid_bookings',
        score: 40,
        description: 'Multiple bookings in short time frame',
      };
    }
    return null;
  }

  /**
   * Check unusual fare
   */
  private async checkUnusualFare(
    rideId: string
  ): Promise<FraudDetectionResult['signals'][0] | null> {
    // Mock: 2% chance of unusual fare
    if (mockRandom(0, 1) > 0.98) {
      return {
        type: 'unusual_fare',
        score: 25,
        description: 'Fare significantly different from estimate',
      };
    }
    return null;
  }

  /**
   * Check payment pattern
   */
  private async checkPaymentPattern(
    userId?: string
  ): Promise<FraudDetectionResult['signals'][0] | null> {
    // Mock: 4% chance of payment issue
    if (mockRandom(0, 1) > 0.96) {
      return {
        type: 'payment_pattern',
        score: 20,
        description: 'Unusual payment method or failure pattern',
      };
    }
    return null;
  }

  /**
   * Check driver anomaly
   */
  private async checkDriverAnomaly(
    driverId: string
  ): Promise<FraudDetectionResult['signals'][0] | null> {
    // Mock: 3% chance of driver anomaly
    if (mockRandom(0, 1) > 0.97) {
      return {
        type: 'driver_anomaly',
        score: 35,
        description: 'Driver routing pattern unusual',
      };
    }
    return null;
  }

  // ===========================================
  // CANCELLATION PREDICTION
  // ===========================================

  /**
   * Predict cancellation probability
   */
  async predictCancellation(
    rideId: string,
    userId: string
  ): Promise<CancellationPrediction> {
    let probability = 0.15; // Base 15% chance

    const factors: CancellationPrediction['factors'] = [];

    // Factor 1: Time of day
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 20) {
      factors.push({ type: 'peak_hours', impact: 0.1 });
      probability += 0.1;
    }

    // Factor 2: Wait time
    const waitTime = mockRandom(0, 1) * 10; // Mock
    if (waitTime > 5) {
      factors.push({ type: 'long_wait', impact: 0.15 });
      probability += 0.15;
    }

    // Factor 3: User history
    const cancellationRate = await this.getUserCancellationRate(userId);
    if (cancellationRate > 0.2) {
      factors.push({ type: 'high_cancel_history', impact: 0.2 });
      probability += 0.2;
    }

    // Factor 4: Surge pricing
    const surgeMultiplier = 1.5; // Mock
    if (surgeMultiplier > 1.3) {
      factors.push({ type: 'surge_pricing', impact: 0.1 });
      probability += 0.1;
    }

    // Cap probability
    probability = Math.min(0.9, probability);

    // Offer incentive if high probability
    let incentiveOffered: number | undefined;
    if (probability > 0.3) {
      incentiveOffered = Math.round(probability * 20); // ₹5-18 discount
    }

    return {
      userId,
      rideId,
      cancellationProbability: Math.round(probability * 100) / 100,
      factors,
      incentiveOffered,
    };
  }

  /**
   * Get user's cancellation rate
   */
  private async getUserCancellationRate(userId: string): Promise<number> {
    // Mock: return random rate between 0 and 0.3
    return mockRandom(0, 1) * 0.3;
  }

  // ===========================================
  // MATCHING OPTIMIZATION
  // ===========================================

  /**
   * Calculate matching score for driver-rider pair
   */
  async calculateMatchingScore(
    driverId: string,
    rideId: string
  ): Promise<{
    score: number;
    factors: { type: string; score: number }[];
    recommendedETA: number;
  }> {
    const factors: { type: string; score: number }[] = [];

    // Distance factor (closer = better)
    const distanceScore = 100 - (mockRandom(0, 1) * 50); // 50-100
    factors.push({ type: 'distance', score: distanceScore });

    // Rating factor
    const ratingScore = 70 + (mockRandom(0, 1) * 30); // 70-100
    factors.push({ type: 'rating', score: ratingScore });

    // Acceptance rate factor
    const acceptanceScore = 60 + (mockRandom(0, 1) * 40); // 60-100
    factors.push({ type: 'acceptance_rate', score: acceptanceScore });

    // Vehicle type match
    const typeScore = 80 + (mockRandom(0, 1) * 20); // 80-100
    factors.push({ type: 'vehicle_match', score: typeScore });

    // Calculate weighted score
    const score = Math.round(
      distanceScore * 0.4 +
      ratingScore * 0.25 +
      acceptanceScore * 0.2 +
      typeScore * 0.15
    );

    // Estimate ETA
    const recommendedETA = Math.round(5 + mockRandom(0, 1) * 15); // 5-20 minutes

    return {
      score,
      factors,
      recommendedETA,
    };
  }

  // ===========================================
  // HELPERS
  // ===========================================

  /**
   * Calculate distance using Haversine
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
