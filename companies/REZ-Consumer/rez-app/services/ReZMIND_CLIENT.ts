// @ts-nocheck
/**
 * ReZ Mind AI Client
 *
 * AI service for trial recommendations, pricing optimization, and success prediction.
 * Connects to REZ Intelligence services for AI-powered features.
 *
 * Endpoints:
 * - POST /api/rez-mind/recommendations - Trial recommendations
 * - POST /api/rez-mind/pricing - Pricing optimization
 * - POST /api/rez-mind/predict - Success prediction
 * - POST /api/rez-mind/segment - User segmentation
 * - POST /api/rez-mind/events - Event logging
 */

import { logger } from '@/utils/logger';
import apiClient from './apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserIntentSignal {
  userId: string;
  categoriesExplored: string[];
  categoriesBooked: string[];
  avgPricePoint: number;
  completionRate: number;
  preferredTimes: string[];
  location: { lat: number; lng: number };
  sessionDuration: number;
  searchQueries: string[];
}

export interface TrialScoringInput {
  trial: {
    id: string;
    category: string;
    coinPrice: number;
    originalPrice: number;
    rating: number;
    ratingCount: number;
    slotsRemaining: number;
    distance: number;
    merchantQuality: number;
  };
  userSignals: UserIntentSignal;
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    weather?: string;
    activeMissions: string[];
  };
}

export interface ScoringFactor {
  name: string;
  weight: number;
  contribution: number;
}

export interface TrialScore {
  trialId: string;
  score: number;
  factors: ScoringFactor[];
  explanation: string;
  confidence: number;
}

export interface PricingSuggestion {
  coinPrice: number;
  commitmentFee: number;
  expectedConversion: number;
  confidence: number;
  reasoning: string[];
}

export interface SuccessPrediction {
  willSucceed: boolean;
  probability: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface UserSegmentation {
  segment: 'budget_seeker' | 'quality_focused' | 'adventure_seeker' | 'occasional_tryer' | 'power_user';
  score: number;
  characteristics: string[];
}

// ============================================================================
// ReZ Mind Client
// ============================================================================

class ReZMINDClient {
  private baseUrl: string;
  private useMock: boolean;

  constructor() {
    // Connect to REZ Intelligence service
    this.baseUrl = process.env.EXPO_PUBLIC_REZ_MIND_URL || 'https://REZ-intelligence.onrender.com';
    // Use mock data when API is not available (development mode)
    this.useMock = process.env.NODE_ENV === 'development' || !process.env.EXPO_PUBLIC_REZ_MIND_URL;
  }

  /**
   * Make API request with fallback to mock data
   */
  private async withFallback<T>(
    apiCall: () => Promise<T>,
    mockData: T
  ): Promise<T> {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      logger.warn('[ReZ Mind] API unavailable, using mock data:', error);
      return mockData;
    }
  }

  /**
   * Get personalized trial recommendations for a user
   */
  async getRecommendations(
    userId: string,
    availableTrials: unknown[],
    context: {
      timeOfDay: string;
      dayOfWeek: string;
      weather?: string;
      activeMissions: string[];
    },
  ): Promise<TrialScore[]> {
    logger.debug('[ReZ Mind] Getting recommendations for user:', userId);

    // Mock implementation for fallback
    const mockData = availableTrials.map(trial => this.mockScoreTrial(trial));

    if (this.useMock) {
      return mockData;
    }

    return this.withFallback(async () => {
      const response = await apiClient.post<{ scores: TrialScore[] }>(
        `${this.baseUrl}/api/rez-mind/recommendations`,
        { userId, trials: availableTrials, context }
      );
      return response.data?.scores ?? mockData;
    }, mockData);
  }

  /**
   * Score a single trial based on mock AI factors
   */
  private mockScoreTrial(trial): TrialScore {
    const factors: ScoringFactor[] = [];

    // Category match factor (30% weight)
    const categoryScore = 22.5;
    factors.push({ name: 'category_match', weight: 0.3, contribution: categoryScore });

    // Price match factor (20% weight)
    const priceRatio = trial.coinPrice / (trial.originalPrice || 1);
    const priceScore = priceRatio < 0.3 ? 15 : priceRatio < 0.5 ? 10 : 5;
    factors.push({ name: 'price_match', weight: 0.2, contribution: priceScore });

    // Distance factor (15% weight)
    const distanceScore = trial.distance < 2 ? 12 : trial.distance < 5 ? 8 : 4;
    factors.push({ name: 'distance', weight: 0.15, contribution: distanceScore });

    // Quality factor (20% weight)
    const qualityScore = (trial.rating || 3) * 4;
    factors.push({ name: 'quality_score', weight: 0.2, contribution: qualityScore });

    // Availability factor (15% weight)
    const availabilityScore = trial.slotsRemaining > 10 ? 12 : trial.slotsRemaining > 5 ? 8 : 4;
    factors.push({ name: 'availability', weight: 0.15, contribution: availabilityScore });

    const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

    return {
      trialId: trial.id,
      score: Math.round(Math.min(100, totalScore)),
      factors,
      explanation: this.generateExplanation(factors),
      confidence: 0.75 + Math.random() * 0.2,
    };
  }

  /**
   * Generate human-readable explanation from scoring factors
   */
  private generateExplanation(factors: ScoringFactor[]): string {
    const topFactors = factors
      .filter(f => f.contribution > 10)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 2);

    if (topFactors.length === 0) {
      return 'Recommended based on overall quality';
    }

    const descriptions: Record<string, string> = {
      category_match: 'Matches your preferred categories',
      price_match: 'Great value for the price',
      distance: 'Conveniently located near you',
      quality_score: 'Highly rated by other users',
      availability: 'Plenty of slots available',
    };

    return topFactors.map(f => descriptions[f.name] || f.name).join(' and ');
  }

  /**
   * Get AI-suggested pricing for a trial
   */
  async suggestTrialPricing(params: {
    category: string;
    merchantQuality: number;
    competitorPrices: number[];
    targetConversion: number;
    originalPrice: number;
  }): Promise<PricingSuggestion> {
    logger.debug('[ReZ Mind] Getting pricing suggestion for:', params.category);

    // Mock implementation
    const mockData = this.mockPricing(params);

    if (this.useMock) {
      return mockData;
    }

    return this.withFallback(async () => {
      const response = await apiClient.post<PricingSuggestion>(
        `${this.baseUrl}/api/rez-mind/pricing`,
        params
      );
      return response.data ?? mockData;
    }, mockData);
  }

  private mockPricing(params: {
    merchantQuality: number;
    competitorPrices: number[];
    targetConversion: number;
    originalPrice: number;
  }): PricingSuggestion {
    const { merchantQuality, competitorPrices, targetConversion, originalPrice } = params;

    const avgCompetitorPrice = competitorPrices.length > 0
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
      : originalPrice * 0.4;

    const qualityMultiplier = 0.8 + (merchantQuality / 5) * 0.4;
    const conversionMultiplier = 1.2 - (targetConversion / 100) * 0.4;

    const suggestedCoinPrice = Math.round(
      Math.max(20, Math.min(avgCompetitorPrice * qualityMultiplier * conversionMultiplier, originalPrice * 0.7))
    );

    const commitmentFee = Math.round(suggestedCoinPrice * (0.3 + (1 - targetConversion / 100) * 0.2));
    const expectedConversion = Math.round(
      Math.max(10, Math.min(80, 100 - (suggestedCoinPrice / originalPrice) * 100))
    );

    return {
      coinPrice: suggestedCoinPrice,
      commitmentFee,
      expectedConversion,
      confidence: 0.75 + Math.random() * 0.15,
      reasoning: [
        `Based on ${competitorPrices.length} competitor prices in the market`,
        `Merchant quality score: ${merchantQuality}/5`,
        `Target conversion rate: ${targetConversion}%`,
      ],
    };
  }

  /**
   * Predict trial booking success
   */
  async predictTrialSuccess(trialId: string, userId: string): Promise<SuccessPrediction> {
    logger.debug('[ReZ Mind] Predicting success for trial:', trialId);

    const mockData = this.mockPrediction();

    if (this.useMock) {
      return mockData;
    }

    return this.withFallback(async () => {
      const response = await apiClient.post<SuccessPrediction>(
        `${this.baseUrl}/api/rez-mind/predict`,
        { trialId, userId }
      );
      return response.data ?? mockData;
    }, mockData);
  }

  private mockPrediction(): SuccessPrediction {
    const probability = 0.6 + Math.random() * 0.3;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (probability < 0.7) {
      riskFactors.push('Limited slots may cause booking frustration');
      recommendations.push('Consider increasing daily slot capacity');
    }

    if (probability < 0.8) {
      riskFactors.push('Commitment fee may deter price-sensitive users');
      recommendations.push('Review pricing strategy for this category');
    }

    return {
      willSucceed: probability >= 0.5,
      probability: Math.round(probability * 100) / 100,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Segment user for personalized experiences
   */
  async segmentUser(userSignals: UserIntentSignal): Promise<UserSegmentation> {
    logger.debug('[ReZ Mind] Segmenting user:', userSignals.userId);

    const mockData = this.mockSegmentation(userSignals);

    if (this.useMock) {
      return mockData;
    }

    return this.withFallback(async () => {
      const response = await apiClient.post<UserSegmentation>(
        `${this.baseUrl}/api/rez-mind/segment`,
        userSignals
      );
      return response.data ?? mockData;
    }, mockData);
  }

  private mockSegmentation(userSignals: UserIntentSignal): UserSegmentation {
    const { avgPricePoint, completionRate, categoriesBooked, sessionDuration } = userSignals;

    let segment: UserSegmentation['segment'];
    let characteristics: string[] = [];

    if (completionRate > 0.8 && categoriesBooked.length > 5) {
      segment = 'power_user';
      characteristics = [
        'High engagement with trial program',
        'Consistently completes bookings',
        'Explores multiple categories',
        'Values quality experiences',
      ];
    } else if (avgPricePoint > 100) {
      segment = 'quality_focused';
      characteristics = [
        'Willing to pay for premium experiences',
        'Values quality over quantity',
        'Researches options before booking',
      ];
    } else if (categoriesBooked.length > 3) {
      segment = 'adventure_seeker';
      characteristics = [
        'Enjoys exploring new categories',
        'Curious about different experiences',
        'Open to trying new things',
      ];
    } else if (avgPricePoint < 50 && completionRate < 0.5) {
      segment = 'budget_seeker';
      characteristics = [
        'Price-conscious decision maker',
        'Looking for best value',
        'May hesitate at commitment fees',
      ];
    } else {
      segment = 'occasional_tryer';
      characteristics = [
        'Tries trials occasionally',
        'Not a frequent user yet',
        'Potential for increased engagement',
      ];
    }

    return {
      segment,
      score: Math.round((completionRate * 100 + sessionDuration / 60) / 2),
      characteristics,
    };
  }

  /**
   * Get contextual recommendations based on mission alignment
   */
  async getMissionAlignedTrials(trials: unknown[], activeMissions: string[]): Promise<TrialScore[]> {
    logger.debug('[ReZ Mind] Getting mission-aligned trials');

    const alignedTrials = trials.map(trial => {
      const missionMatch = activeMissions.some(mission =>
        trial.category.toLowerCase().includes(mission.toLowerCase()) ||
        trial.title.toLowerCase().includes(mission.toLowerCase())
      );

      return {
        ...trial,
        _missionBoost: missionMatch ? 20 : 0,
      };
    });

    return alignedTrials
      .sort((a, b) => (b._missionBoost || 0) - (a._missionBoost || 0))
      .slice(0, 10)
      .map(trial => ({
        trialId: trial.id,
        score: 70 + (trial._missionBoost || 0),
        factors: [
          { name: 'mission_alignment', weight: 0.4, contribution: trial._missionBoost || 0 },
          { name: 'overall_quality', weight: 0.6, contribution: 30 },
        ],
        explanation: 'This trial helps complete your active mission',
        confidence: 0.85,
      }));
  }

  /**
   * Log user interaction for continuous learning
   */
  async logInteraction(params: {
    userId: string;
    trialId: string;
    action: 'view' | 'click' | 'book' | 'complete' | 'cancel';
    context: Record<string, unknown>;
    timestamp: string;
  }): Promise<void> {
    logger.debug('[ReZ Mind] Logging interaction:', params.action);

    if (this.useMock) {
      return; // Skip logging in mock mode
    }

    try {
      await apiClient.post(`${this.baseUrl}/api/rez-mind/events`, params);
    } catch (error) {
      logger.warn('[ReZ Mind] Failed to log interaction:', error);
    }
  }
}

// Export singleton instance
export const rezMindClient = new ReZMINDClient();
export default rezMindClient;
