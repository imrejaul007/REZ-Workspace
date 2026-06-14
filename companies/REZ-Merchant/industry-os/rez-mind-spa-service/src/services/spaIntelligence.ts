import {
  CustomerPreferences,
  Treatment,
  TreatmentRecommendation,
  CustomerSegmentation,
  CustomerTier,
  LifetimeValuePrediction,
  CLVFactor,
  PastVisit,
} from '../types';
import {
  TREATMENTS_DATABASE,
  SKIN_TYPE_TREATMENTS,
  BUDGET_PRICE_RANGES,
  CONCERN_TREATMENTS,
  TIME_OF_DAY_PREFERENCES,
  DURATION_TIERS,
  getCurrentSeason,
  getSeasonalBoostTreatments,
  getTreatmentsByIds,
} from '../config/knowledge';
import { logger } from '../utils/logger';

export class SpaIntelligence {
  /**
   * Get treatment recommendations based on customer preferences
   */
  static async getTreatmentRecommendations(
    preferences: CustomerPreferences,
    pastVisits?: PastVisit[],
    limit: number = 5
  ): Promise<TreatmentRecommendation[]> {
    logger.debug('Generating treatment recommendations', { preferences });

    const recommendations: TreatmentRecommendation[] = [];
    const currentSeason = getCurrentSeason();
    const seasonalBoosts = getSeasonalBoostTreatments();

    // Build initial treatment pool based on preferences
    let candidateTreatments = [...TREATMENTS_DATABASE];

    // Filter by skin type
    if (preferences.skinType) {
      const skinTypeTreatments = SKIN_TYPE_TREATMENTS[preferences.skinType];
      if (skinTypeTreatments && skinTypeTreatments.length > 0) {
        candidateTreatments = candidateTreatments.filter(
          (t) => skinTypeTreatments.includes(t.treatmentId)
        );
      }
    }

    // Filter by budget
    if (preferences.budget) {
      const priceRange = BUDGET_PRICE_RANGES[preferences.budget];
      candidateTreatments = candidateTreatments.filter(
        (t) => t.basePrice >= priceRange.min && t.basePrice <= priceRange.max
      );
    }

    // Filter by duration
    if (preferences.duration) {
      const durationTier = DURATION_TIERS.find(
        (tier) => preferences.duration! <= tier.max
      );
      if (durationTier) {
        candidateTreatments = candidateTreatments.filter((t) =>
          durationTier.treatments.includes(t.treatmentId)
        );
      }
    }

    // Filter by concerns
    if (preferences.concerns && preferences.concerns.length > 0) {
      const concernTreatments: Set<string> = new Set();
      for (const concern of preferences.concerns) {
        const treatments = CONCERN_TREATMENTS[concern.toLowerCase()];
        if (treatments) {
          treatments.forEach((t) => concernTreatments.add(t));
        }
      }
      // Add treatments that match concerns (boost priority)
      const boostedTreatments = candidateTreatments.filter((t) =>
        concernTreatments.has(t.treatmentId)
      );
      // Add other treatments that don't match concerns
      candidateTreatments = [
        ...boostedTreatments,
        ...candidateTreatments.filter((t) => !concernTreatments.has(t.treatmentId)),
      ];
    }

    // Filter by preferred time
    if (preferences.preferredTime) {
      const timeTreatments = TIME_OF_DAY_PREFERENCES[preferences.preferredTime];
      if (timeTreatments && timeTreatments.length > 0) {
        const preferred = candidateTreatments.filter((t) =>
          timeTreatments.includes(t.treatmentId)
        );
        const others = candidateTreatments.filter(
          (t) => !timeTreatments.includes(t.treatmentId)
        );
        candidateTreatments = [...preferred, ...others];
      }
    }

    // Score and rank treatments
    for (const treatment of candidateTreatments) {
      let score = 50; // Base score

      // Skin type match bonus
      if (preferences.skinType) {
        const skinMatch = SKIN_TYPE_TREATMENTS[preferences.skinType]?.includes(
          treatment.treatmentId
        );
        if (skinMatch) score += 25;
      }

      // Concern match bonus
      if (preferences.concerns && preferences.concerns.length > 0) {
        for (const concern of preferences.concerns) {
          const concernMatch = CONCERN_TREATMENTS[concern.toLowerCase()]?.includes(
            treatment.treatmentId
          );
          if (concernMatch) score += 10;
        }
      }

      // Budget match bonus
      if (preferences.budget) {
        const range = BUDGET_PRICE_RANGES[preferences.budget];
        if (treatment.basePrice >= range.min && treatment.basePrice <= range.max) {
          score += 15;
        }
      }

      // Duration match bonus
      if (preferences.duration) {
        const diff = Math.abs(treatment.duration - preferences.duration);
        if (diff <= 15) score += 15;
        else if (diff <= 30) score += 8;
      }

      // Seasonal boost
      if (seasonalBoosts.includes(treatment.treatmentId)) {
        score += 15;
      }

      // Popularity bonus
      if (treatment.popularityScore) {
        score += treatment.popularityScore * 10;
      }

      // Past visit satisfaction bonus
      if (pastVisits && pastVisits.length > 0) {
        const pastVisit = pastVisits.find((v) => v.treatmentId === treatment.treatmentId);
        if (pastVisit) {
          score += pastVisit.satisfaction * 8;
        }
      }

      // Calculate confidence based on available data
      let confidence = 0.5;
      let dataPoints = 0;
      if (preferences.skinType) dataPoints++;
      if (preferences.concerns && preferences.concerns.length > 0) dataPoints++;
      if (preferences.budget) dataPoints++;
      if (preferences.duration) dataPoints++;
      if (pastVisits && pastVisits.length > 0) dataPoints++;

      confidence = Math.min(0.95, 0.4 + dataPoints * 0.1);

      // Calculate seasonal relevance
      const seasonalRelevance = seasonalBoosts.includes(treatment.treatmentId) ? 1 : 0;

      recommendations.push({
        treatment,
        score: Math.min(100, score),
        reason: this.generateRecommendationReason(treatment, preferences),
        upsellPotential: treatment.basePrice > 80,
        seasonalRelevance,
        confidence,
      });
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generate recommendation reason text
   */
  private static generateRecommendationReason(
    treatment: Treatment,
    preferences: CustomerPreferences
  ): string {
    const reasons: string[] = [];

    if (preferences.skinType) {
      if (SKIN_TYPE_TREATMENTS[preferences.skinType]?.includes(treatment.treatmentId)) {
        reasons.push(`ideal for ${preferences.skinType} skin type`);
      }
    }

    if (preferences.concerns && preferences.concerns.length > 0) {
      for (const concern of preferences.concerns) {
        if (CONCERN_TREATMENTS[concern.toLowerCase()]?.includes(treatment.treatmentId)) {
          reasons.push(`addresses ${concern}`);
          break;
        }
      }
    }

    if (treatment.duration <= 60) {
      reasons.push('quick and efficient');
    } else if (treatment.duration >= 90) {
      reasons.push('comprehensive treatment');
    }

    if (treatment.popularityScore && treatment.popularityScore > 0.8) {
      reasons.push('highly popular choice');
    }

    reasons.push(`$${treatment.basePrice} for ${treatment.duration}min`);

    return reasons.join(' - ');
  }

  /**
   * Segment customer based on preferences and history
   */
  static segmentCustomer(
    preferences: CustomerPreferences,
    pastVisits?: PastVisit[],
    totalSpend?: number
  ): CustomerSegmentation {
    logger.debug('Segmenting customer');

    // Calculate engagement score
    let engagementScore = 50;
    if (pastVisits) {
      if (pastVisits.length >= 10) engagementScore += 30;
      else if (pastVisits.length >= 5) engagementScore += 20;
      else if (pastVisits.length >= 2) engagementScore += 10;

      const avgSatisfaction =
        pastVisits.reduce((sum, v) => sum + v.satisfaction, 0) / pastVisits.length;
      if (avgSatisfaction >= 4.5) engagementScore += 10;
      else if (avgSatisfaction >= 4.0) engagementScore += 5;
    }

    if (preferences.budget === 'luxury') engagementScore += 15;
    else if (preferences.budget === 'premium') engagementScore += 10;
    else if (preferences.budget === 'mid-range') engagementScore += 5;

    // Determine segment
    let segmentName: string;
    let tier: CustomerTier;
    let avgLifetimeValue: number;
    let retentionRate: number;

    if (engagementScore >= 85) {
      segmentName = 'VIP Elite';
      tier = 'diamond';
      avgLifetimeValue = 5000;
      retentionRate = 0.95;
    } else if (engagementScore >= 70) {
      segmentName = 'Premium Loyal';
      tier = 'platinum';
      avgLifetimeValue = 2500;
      retentionRate = 0.85;
    } else if (engagementScore >= 55) {
      segmentName = 'Regular Visitor';
      tier = 'gold';
      avgLifetimeValue = 1200;
      retentionRate = 0.75;
    } else if (engagementScore >= 40) {
      segmentName = 'Occasional Guest';
      tier = 'silver';
      avgLifetimeValue = 600;
      retentionRate = 0.60;
    } else {
      segmentName = 'Newbie';
      tier = 'bronze';
      avgLifetimeValue = 300;
      retentionRate = 0.40;
    }

    // Generate characteristics
    const characteristics: string[] = [];
    if (pastVisits && pastVisits.length > 5) {
      characteristics.push('Frequent visitor');
    }
    if (preferences.budget === 'luxury' || preferences.budget === 'premium') {
      characteristics.push('High-value customer');
    }
    if (preferences.concerns && preferences.concerns.length > 0) {
      characteristics.push(`Focused on: ${preferences.concerns.join(', ')}`);
    }
    if (pastVisits) {
      const avgSatisfaction =
        pastVisits.reduce((sum, v) => sum + v.satisfaction, 0) / pastVisits.length;
      if (avgSatisfaction >= 4.5) {
        characteristics.push('Highly satisfied');
      }
    }

    return {
      segmentId: `seg_${tier}_${Date.now().toString(36)}`,
      segmentName,
      characteristics,
      preferences,
      avgLifetimeValue,
      retentionRate,
      preferredChannels: ['app', 'email', 'in-store'],
    };
  }

  /**
   * Predict customer lifetime value
   */
  static predictLifetimeValue(
    preferences: CustomerPreferences,
    pastVisits?: PastVisit[],
    segmentation?: CustomerSegmentation
  ): LifetimeValuePrediction {
    logger.debug('Predicting customer lifetime value');

    const seg = segmentation || this.segmentCustomer(preferences, pastVisits);
    const factors: CLVFactor[] = [];

    // Base CLV from segmentation
    let predictedCLV = seg.avgLifetimeValue;

    // Factor: Visit frequency
    if (pastVisits && pastVisits.length > 0) {
      const visitsPerMonth = pastVisits.length / 12; // Rough estimate
      if (visitsPerMonth >= 2) {
        predictedCLV *= 1.3;
        factors.push({ factor: 'High visit frequency', impact: 0.3, weight: 0.25 });
      } else if (visitsPerMonth >= 1) {
        predictedCLV *= 1.15;
        factors.push({ factor: 'Regular visits', impact: 0.15, weight: 0.2 });
      }
    }

    // Factor: Budget level
    if (preferences.budget) {
      switch (preferences.budget) {
        case 'luxury':
          predictedCLV *= 1.5;
          factors.push({ factor: 'Luxury budget', impact: 0.5, weight: 0.3 });
          break;
        case 'premium':
          predictedCLV *= 1.2;
          factors.push({ factor: 'Premium budget', impact: 0.2, weight: 0.25 });
          break;
        case 'mid-range':
          predictedCLV *= 1.0;
          factors.push({ factor: 'Mid-range budget', impact: 0, weight: 0.2 });
          break;
        case 'economy':
          predictedCLV *= 0.7;
          factors.push({ factor: 'Economy budget', impact: -0.3, weight: 0.15 });
          break;
      }
    }

    // Factor: Satisfaction from past visits
    if (pastVisits && pastVisits.length > 0) {
      const avgSatisfaction =
        pastVisits.reduce((sum, v) => sum + v.satisfaction, 0) / pastVisits.length;
      if (avgSatisfaction >= 4.5) {
        predictedCLV *= 1.2;
        factors.push({ factor: 'High satisfaction', impact: 0.2, weight: 0.25 });
      } else if (avgSatisfaction >= 4.0) {
        predictedCLV *= 1.1;
        factors.push({ factor: 'Good satisfaction', impact: 0.1, weight: 0.2 });
      }
    }

    // Factor: Number of concerns (engaged customer)
    if (preferences.concerns && preferences.concerns.length >= 3) {
      predictedCLV *= 1.15;
      factors.push({ factor: 'Multiple concerns', impact: 0.15, weight: 0.1 });
    }

    // Calculate confidence
    let confidence = 0.5;
    if (pastVisits && pastVisits.length >= 5) confidence += 0.2;
    if (preferences.budget) confidence += 0.15;
    if (preferences.skinType) confidence += 0.1;
    if (preferences.concerns && preferences.concerns.length > 0) confidence += 0.1;
    confidence = Math.min(0.95, confidence);

    // Generate recommendations
    const recommendations: string[] = [];
    if (seg.tier === 'bronze' || seg.tier === 'silver') {
      recommendations.push('Offer loyalty program enrollment');
      recommendations.push('Send personalized treatment packages');
    }
    if (predictedCLV > 2000) {
      recommendations.push('Provide VIP concierge services');
      recommendations.push('Offer exclusive early access to new treatments');
    }
    recommendations.push('Continue tracking satisfaction to improve predictions');

    return {
      predictedCLV: Math.round(predictedCLV),
      confidence,
      factors,
      tier: seg.tier,
      recommendations,
    };
  }

  /**
   * Analyze seasonal patterns
   */
  static analyzeSeasonalPatterns(month?: number): {
    season: string;
    multiplier: number;
    recommendedTreatments: Treatment[];
    trend: string;
  } {
    const current = getCurrentSeason();
    const targetMonth = month || new Date().getMonth() + 1;

    // Find treatments with seasonal data
    const seasonalTreatments = TREATMENTS_DATABASE.filter((t) => {
      if (!t.seasonality) return false;
      return t.seasonality.peakMonths.includes(targetMonth);
    });

    // Determine trend
    let trend = 'stable';
    if (current.season === 'winter') trend = 'increasing';
    else if (current.season === 'summer') trend = 'decreasing';

    return {
      season: current.season,
      multiplier: current.multiplier,
      recommendedTreatments: seasonalTreatments,
      trend,
    };
  }

  /**
   * Get treatment categories for the spa
   */
  static getTreatmentCategories(): string[] {
    return [...new Set(TREATMENTS_DATABASE.map((t) => t.category))];
  }

  /**
   * Get all treatments
   */
  static getAllTreatments(): Treatment[] {
    return TREATMENTS_DATABASE;
  }
}

export default SpaIntelligence;