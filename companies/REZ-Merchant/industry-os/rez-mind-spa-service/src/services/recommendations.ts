import {
  Treatment,
  TreatmentRecommendation,
  WellnessPackage,
  UpsellOpportunity,
  UpsellType,
  CustomerPreferences,
  PastVisit,
} from '../types';
import {
  TREATMENTS_DATABASE,
  WELLNESS_PACKAGES,
  getTreatmentsByIds,
  getCurrentSeason,
  getSeasonalBoostTreatments,
} from '../config/knowledge';
import { logger } from '../utils/logger';
import { SpaIntelligence } from './spaIntelligence';

export class RecommendationsService {
  /**
   * Get upsell opportunities based on current treatment and customer preferences
   */
  static getUpsellOpportunities(
    currentTreatmentId: string,
    preferences: CustomerPreferences,
    allRecommendations?: TreatmentRecommendation[]
  ): UpsellOpportunity[] {
    logger.debug('Generating upsell opportunities', { currentTreatmentId });

    const upsells: UpsellOpportunity[] = [];
    const currentTreatment = TREATMENTS_DATABASE.find(
      (t) => t.treatmentId === currentTreatmentId
    );

    if (!currentTreatment) {
      logger.warn('Current treatment not found', { currentTreatmentId });
      return upsells;
    }

    // Find compatible treatments for upselling
    const potentialUpsells = TREATMENTS_DATABASE.filter((t) => {
      // Don't upsell same treatment
      if (t.treatmentId === currentTreatmentId) return false;

      // Prefer complementary categories
      const complementaryCategories: Record<string, string[]> = {
        massage: ['facial', 'body-treatment', 'aromatherapy'],
        facial: ['massage', 'body-treatment', 'hydrotherapy'],
        'body-treatment': ['massage', 'facial', 'hydrotherapy'],
      };

      const compatible = complementaryCategories[currentTreatment.category] || [];
      return compatible.includes(t.category);
    });

    // Calculate upsell scores
    for (const treatment of potentialUpsells) {
      let score = 50;
      let upsellType: UpsellType = 'addon';

      // Price synergy (add-on makes sense)
      if (treatment.basePrice <= currentTreatment.basePrice * 0.5) {
        score += 20;
        upsellType = 'addon';
      }

      // Bundle potential (similar duration combined)
      if (
        Math.abs(treatment.duration - currentTreatment.duration) <= 30 &&
        treatment.basePrice > currentTreatment.basePrice * 0.3
      ) {
        score += 15;
        upsellType = 'bundle';
      }

      // Premium upgrade potential
      if (treatment.basePrice > currentTreatment.basePrice * 1.5) {
        score += 10;
        upsellType = 'upgrade';
      }

      // Customer preference match
      if (preferences.concerns && preferences.concerns.length > 0) {
        const matchesConcern = treatment.suitableFor.some((s) =>
          preferences.concerns!.some((c) => s.toLowerCase().includes(c.toLowerCase()))
        );
        if (matchesConcern) score += 15;
      }

      // Seasonal boost
      const seasonalBoosts = getSeasonalBoostTreatments();
      if (seasonalBoosts.includes(treatment.treatmentId)) {
        score += 10;
      }

      // Past visit alignment
      if (preferences.skinType) {
        const skinMatch = treatment.suitableFor.some((s) =>
          s.toLowerCase().includes(preferences.skinType!)
        );
        if (skinMatch) score += 10;
      }

      // Calculate savings for bundle
      const bundleSavings = treatment.basePrice * 0.15;

      // Conversion probability based on score
      const conversionProbability = Math.min(0.85, score / 120);

      upsells.push({
        type: upsellType,
        treatment,
        currentTreatment,
        savings: Math.round(bundleSavings),
        message: this.generateUpsellMessage(treatment, currentTreatment, upsellType),
        conversionProbability,
      });
    }

    // Sort by conversion probability and return top 5
    return upsells.sort((a, b) => b.conversionProbability - a.conversionProbability).slice(0, 5);
  }

  /**
   * Generate upsell message
   */
  private static generateUpsellMessage(
    treatment: Treatment,
    currentTreatment: Treatment,
    type: UpsellType
  ): string {
    switch (type) {
      case 'addon':
        return `Add our ${treatment.name} (${treatment.duration}min) for just $${treatment.basePrice} to complete your wellness experience.`;
      case 'bundle':
        return `Combine ${currentTreatment.name} with ${treatment.name} and save 15%!`;
      case 'upgrade':
        return `Upgrade to ${treatment.name} for a more intensive ${treatment.duration}min experience - only $${treatment.basePrice - currentTreatment.basePrice} more.`;
      default:
        return `You might also enjoy our ${treatment.name} (${treatment.duration}min) - $${treatment.basePrice}.`;
    }
  }

  /**
   * Get suggested wellness packages
   */
  static getSuggestedPackages(
    preferences: CustomerPreferences,
    recommendations?: TreatmentRecommendation[]
  ): WellnessPackage[] {
    logger.debug('Generating wellness package suggestions');

    const suggestedPackages: WellnessPackage[] = [];

    for (const pkg of WELLNESS_PACKAGES) {
      let score = 30; // Base score

      // Check if package treatments match customer profile
      const pkgTreatments = getTreatmentsByIds(pkg.treatments);

      // Match based on recommended treatments
      if (recommendations && recommendations.length > 0) {
        const recommendedIds = recommendations.map((r) => r.treatment.treatmentId);
        const overlap = pkg.treatments.filter((t) => recommendedIds.includes(t));
        score += overlap.length * 15;
      }

      // Match based on "recommended for" keywords
      for (const keyword of pkg.recommendedFor) {
        if (preferences.concerns) {
          const concernMatch = preferences.concerns.some((c) =>
            keyword.toLowerCase().includes(c.toLowerCase())
          );
          if (concernMatch) score += 10;
        }
        if (keyword.toLowerCase().includes('stress') && preferences.preferredTime === 'evening') {
          score += 5;
        }
      }

      // Budget alignment
      const totalPrice = pkgTreatments.reduce((sum, t) => sum + t.basePrice, 0);
      if (preferences.budget) {
        const ranges: Record<string, { min: number; max: number }> = {
          economy: { min: 0, max: 150 },
          'mid-range': { min: 150, max: 350 },
          premium: { min: 350, max: 600 },
          luxury: { min: 600, max: Infinity },
        };
        const range = ranges[preferences.budget];
        if (totalPrice >= range.min && totalPrice <= range.max) {
          score += 15;
        }
      }

      // Seasonal relevance
      const currentSeason = getCurrentSeason();
      const seasonalPackages = ['package-detox-revival', 'package-anti-aging-luxury'];
      if (seasonalPackages.includes(pkg.packageId) && currentSeason.season === 'winter') {
        score += 10;
      }

      // Add to suggested if score is high enough
      if (score >= 50) {
        suggestedPackages.push(pkg);
      }
    }

    // Return top 3 packages by score
    return suggestedPackages.sort((a, b) => {
      const scoreA = a.packagePrice * (1 + WELLNESS_PACKAGES.indexOf(a) * 0.1);
      const scoreB = b.packagePrice * (1 + WELLNESS_PACKAGES.indexOf(b) * 0.1);
      return scoreA - scoreB;
    }).slice(0, 3);
  }

  /**
   * Get personalized treatment sequence (for multi-treatment packages)
   */
  static getTreatmentSequence(
    treatmentIds: string[],
    customerPreferences: CustomerPreferences
  ): string[] {
    const treatments = getTreatmentsByIds(treatmentIds);
    const sequence: string[] = [];

    // Sort treatments by recommended order:
    // 1. Prep treatments (scrubs, steams)
    // 2. Main treatments (massage, facials)
    // 3. Finishing treatments (aromatherapy, masks)

    const prepTreatments = treatments.filter((t) =>
      ['scrub', 'steam'].includes(t.category)
    );
    const mainTreatments = treatments.filter(
      (t) =>
        !['scrub', 'steam', 'wrap'].includes(t.category)
    );
    const finishingTreatments = treatments.filter((t) =>
      ['wrap', 'aromatherapy'].includes(t.category)
    );

    sequence.push(
      ...prepTreatments.map((t) => t.treatmentId),
      ...mainTreatments.map((t) => t.treatmentId),
      ...finishingTreatments.map((t) => t.treatmentId)
    );

    return sequence;
  }

  /**
   * Calculate package value
   */
  static calculatePackageValue(packageId: string): {
    originalPrice: number;
    packagePrice: number;
    savings: number;
    savingsPercentage: number;
  } | null {
    const pkg = WELLNESS_PACKAGES.find((p) => p.packageId === packageId);
    if (!pkg) return null;

    const originalPrice = pkg.originalPrice;
    const packagePrice = pkg.packagePrice;
    const savings = originalPrice - packagePrice;
    const savingsPercentage = (savings / originalPrice) * 100;

    return {
      originalPrice,
      packagePrice,
      savings,
      savingsPercentage: Math.round(savingsPercentage),
    };
  }

  /**
   * Get trending treatments based on current month
   */
  static getTrendingTreatments(limit: number = 5): Treatment[] {
    const seasonalBoosts = getSeasonalBoostTreatments();
    const trending: Treatment[] = [];

    for (const treatmentId of seasonalBoosts) {
      const treatment = TREATMENTS_DATABASE.find((t) => t.treatmentId === treatmentId);
      if (treatment) {
        trending.push(treatment);
      }
    }

    // Add popular treatments sorted by popularity score
    const popularTreatments = TREATMENTS_DATABASE
      .filter((t) => !seasonalBoosts.includes(t.treatmentId) && t.popularityScore)
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, limit - trending.length);

    return [...trending, ...popularTreatments].slice(0, limit);
  }

  /**
   * Get complementary treatments for a given treatment
   */
  static getComplementaryTreatments(treatmentId: string, limit: number = 3): Treatment[] {
    const treatment = TREATMENTS_DATABASE.find((t) => t.treatmentId === treatmentId);
    if (!treatment) return [];

    // Define complementary category mappings
    const complementaryMap: Record<string, string[]> = {
      massage: ['facial', 'body-treatment', 'aromatherapy', 'hydrotherapy'],
      facial: ['massage', 'body-treatment', 'aromatherapy'],
      'body-treatment': ['massage', 'hydrotherapy', 'facial'],
      'hot-stone': ['facial', 'aromatherapy'],
      'deep-tissue': ['hydrotherapy', 'reflexology'],
      'swedish': ['facial', 'aromatherapy', 'reflexology'],
    };

    const complementaryCategories = complementaryMap[treatment.category] || [];
    if (complementaryCategories.length === 0) return [];

    return TREATMENTS_DATABASE.filter(
      (t) =>
        complementaryCategories.includes(t.category) &&
        t.treatmentId !== treatmentId
    ).slice(0, limit);
  }
}

export default RecommendationsService;