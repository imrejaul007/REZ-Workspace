import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

/**
 * AI Driver Matching Service
 * Uses ReZ Intelligence for intelligent driver-rider matching
 */

export interface AIDriverMatch {
  driverId: string;
  driverName: string;
  score: number;
  factors: {
    type: string;
    weight: number;
    score: number;
  }[];
  eta: number;
  distance: number;
  reasons: string[];
}

export interface MatchRequest {
  pickup: { lat: number; lng: number };
  drop?: { lat: number; lng: number };
  vehicleType: string;
  userId: string;
  preferences?: UserPreferences;
  context?: MatchContext;
}

export interface UserPreferences {
  preferredDriverGender?: 'male' | 'female' | 'any';
  acRequired?: boolean;
  language?: string;
  minRating?: number;
}

export interface MatchContext {
  timeOfDay: string;
  dayOfWeek: string;
  weather?: string;
  surge?: number;
  purpose?: 'commute' | 'business' | 'leisure' | 'urgent';
}

@Injectable()
export class AIMatchingService {
  private readonly logger = new Logger(AIMatchingService.name);

  // AI weights (from ReZ Intelligence)
  private readonly MATCH_WEIGHTS = {
    distance: 0.30,
    rating: 0.20,
    acceptanceRate: 0.15,
    recency: 0.10,
    preferences: 0.15,
    context: 0.10,
  };

  constructor(
    @InjectModel('Ride') private rideModel: Model<any>,
  ) {}

  // ===========================================
  // AI MATCHING
  // ===========================================

  /**
   * Find best driver using AI matching
   */
  async findBestDriver(request: MatchRequest): Promise<AIDriverMatch[]> {
    const startTime = Date.now();

    // 1. Get intent prediction from ReZ Intelligence
    const intentContext = await this.getIntentPrediction(request);

    // 2. Get nearby drivers
    const nearbyDrivers = await this.getNearbyDrivers(request);

    // 3. Score each driver using AI
    const scoredDrivers: AIDriverMatch[] = [];

    for (const driver of nearbyDrivers) {
      const score = this.calculateAIScore(driver, request, intentContext);
      scoredDrivers.push(score);
    }

    // 4. Rank and return top matches
    scoredDrivers.sort((a, b) => b.score - a.score);

    this.logger.log(`AI matching: ${scoredDrivers.length} drivers scored in ${Date.now() - startTime}ms`);

    return scoredDrivers.slice(0, 5);
  }

  // ===========================================
  // INTENT PREDICTION (ReZ Intelligence Integration)
  // ===========================================

  /**
   * Get intent prediction from ReZ Mind
   */
  private async getIntentPrediction(request: MatchRequest): Promise<{
    userSegment: string;
    rideProbability: number;
    preferredVehicle: string;
    surgeSensitive: boolean;
  }> {
    // In production, call REZ Intelligence:
    // const response = await axios.get(`${REZ_INTELLIGENCE_URL}/api/intent/${request.userId}`);

    // Mock intent prediction based on context
    const hour = new Date().getHours();

    let userSegment = 'regular';
    let rideProbability = 0.8;
    let preferredVehicle = request.vehicleType;
    let surgeSensitive = false;

    // Morning commute pattern
    if (hour >= 7 && hour <= 9) {
      userSegment = 'commuter';
      rideProbability = 0.95;
      preferredVehicle = 'auto';
    }
    // Evening rush
    else if (hour >= 17 && hour <= 20) {
      userSegment = 'evening_rush';
      rideProbability = 0.9;
      surgeSensitive = true;
    }
    // Late night
    else if (hour >= 22 || hour <= 5) {
      userSegment = 'night_owl';
      rideProbability = 0.6;
      preferredVehicle = 'cab';
    }

    return { userSegment, rideProbability, preferredVehicle, surgeSensitive };
  }

  // ===========================================
  // AI SCORING
  // ===========================================

  /**
   * Calculate AI match score for driver
   */
  private calculateAIScore(
    driver: any,
    request: MatchRequest,
    intentContext: any
  ): AIDriverMatch {
    const factors: AIDriverMatch['factors'] = [];
    let totalScore = 0;

    // 1. Distance score (closer = better)
    const distanceScore = this.scoreDistance(driver.distanceKm);
    factors.push({ type: 'distance', weight: 0.30, score: distanceScore });
    totalScore += distanceScore * 0.30;

    // 2. Rating score
    const ratingScore = this.scoreRating(driver.rating);
    factors.push({ type: 'rating', weight: 0.20, score: ratingScore });
    totalScore += ratingScore * 0.20;

    // 3. Acceptance rate score
    const acceptanceScore = this.scoreAcceptance(driver.acceptanceRate);
    factors.push({ type: 'acceptance', weight: 0.15, score: acceptanceScore });
    totalScore += acceptanceScore * 0.15;

    // 4. Recency score (active drivers preferred)
    const recencyScore = this.scoreRecency(driver.lastActive);
    factors.push({ type: 'recency', weight: 0.10, score: recencyScore });
    totalScore += recencyScore * 0.10;

    // 5. Preference match
    const prefScore = this.scorePreferences(driver, request.preferences);
    factors.push({ type: 'preferences', weight: 0.15, score: prefScore });
    totalScore += prefScore * 0.15;

    // 6. Context match (time, weather, purpose)
    const contextScore = this.scoreContext(driver, request.context);
    factors.push({ type: 'context', weight: 0.10, score: contextScore });
    totalScore += contextScore * 0.10;

    // Generate reasons
    const reasons = this.generateReasons(factors);

    return {
      driverId: driver.id,
      driverName: driver.name,
      score: Math.round(totalScore * 100) / 100,
      factors,
      eta: driver.eta || 5,
      distance: driver.distanceKm || 1,
      reasons,
    };
  }

  private scoreDistance(distanceKm: number): number {
    if (distanceKm <= 0.5) return 100;
    if (distanceKm <= 1) return 90;
    if (distanceKm <= 2) return 80;
    if (distanceKm <= 3) return 70;
    if (distanceKm <= 5) return 60;
    return Math.max(40, 60 - distanceKm * 4);
  }

  private scoreRating(rating: number): number {
    return Math.round((rating / 5) * 100);
  }

  private scoreAcceptance(rate: number): number {
    return Math.round(rate * 100);
  }

  private scoreRecency(lastActive: Date): number {
    const minutesAgo = (Date.now() - new Date(lastActive).getTime()) / 60000;
    if (minutesAgo < 5) return 100;
    if (minutesAgo < 15) return 90;
    if (minutesAgo < 30) return 70;
    return Math.max(50, 80 - minutesAgo);
  }

  private scorePreferences(driver: any, prefs?: UserPreferences): number {
    if (!prefs) return 70;

    let score = 70;

    if (prefs.minRating && driver.rating >= prefs.minRating) score += 15;
    if (prefs.language && driver.language === prefs.language) score += 15;

    return Math.min(100, score);
  }

  private scoreContext(driver: any, context?: MatchContext): number {
    if (!context) return 70;

    let score = 70;

    // Surge-sensitive users get better deals during non-surge
    if (context.surge && context.surge > 1.5) {
      // During surge, prefer 5-star drivers
      if (driver.rating >= 4.8) score += 20;
    }

    return Math.min(100, score);
  }

  private generateReasons(factors: AIDriverMatch['factors']): string[] {
    const reasons: string[] = [];

    const topFactors = factors
      .filter(f => f.score >= 85)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    for (const factor of topFactors) {
      if (factor.type === 'distance') reasons.push('Very close to pickup');
      if (factor.type === 'rating') reasons.push('Highly rated driver');
      if (factor.type === 'acceptance') reasons.push('Quick accepter');
    }

    return reasons;
  }

  // ===========================================
  // NEARBY DRIVERS (Mock - Replace with Redis)
  // ===========================================

  private async getNearbyDrivers(request: MatchRequest): Promise<any[]> {
    // Mock nearby drivers with scores
    return [
      {
        id: 'DRV_001',
        name: 'Rajesh K',
        rating: 4.8,
        acceptanceRate: 0.92,
        lastActive: new Date(Date.now() - 5 * 60000),
        distanceKm: 0.8,
        eta: 4,
        language: 'kannada',
      },
      {
        id: 'DRV_002',
        name: 'Priya S',
        rating: 4.9,
        acceptanceRate: 0.95,
        lastActive: new Date(Date.now() - 2 * 60000),
        distanceKm: 1.2,
        eta: 6,
        language: 'english',
      },
      {
        id: 'DRV_003',
        name: 'Amit M',
        rating: 4.6,
        acceptanceRate: 0.88,
        lastActive: new Date(Date.now() - 10 * 60000),
        distanceKm: 0.5,
        eta: 3,
        language: 'hindi',
      },
    ];
  }
}
