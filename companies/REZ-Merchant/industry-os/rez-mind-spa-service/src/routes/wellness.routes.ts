import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SpaIntelligence } from '../services/spaIntelligence';
import { RecommendationsService } from '../services/recommendations';
import { WellnessInsight } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { validateQuery, validateParams } from '../middleware/validation';
import { aiRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ApiResponse, WellnessInsight as WellnessInsightType } from '../types';

const router = Router();

// Validation schemas
const RecommendationsParamsSchema = z.object({
  merchantId: z.string().min(3).max(100),
});

const RecommendationsQuerySchema = z.object({
  customerId: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  category: z.string().optional(),
  skinType: z.enum(['normal', 'dry', 'oily', 'combination', 'sensitive', 'acne-prone', 'mature']).optional(),
  concerns: z.string().optional(),
});

// GET /wellness/recommendations/:merchantId - Get wellness recommendations
router.get(
  '/recommendations/:merchantId',
  aiRateLimiter,
  validateParams(RecommendationsParamsSchema),
  validateQuery(RecommendationsQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const { customerId, limit = 10, category, skinType, concerns } = req.query as any;

    logger.info('Wellness recommendations requested', {
      merchantId,
      customerId,
      limit,
    });

    try {
      // Get all treatments
      let treatments = SpaIntelligence.getAllTreatments();

      // Filter by category if specified
      if (category) {
        treatments = treatments.filter((t) => t.category === category);
      }

      // Get trending treatments
      const trendingTreatments = RecommendationsService.getTrendingTreatments(5);

      // Get seasonal patterns
      const seasonalPatterns = SpaIntelligence.analyzeSeasonalPatterns();

      // Build recommendations with enhanced metadata
      const recommendations = treatments.slice(0, limit).map((treatment) => ({
        treatmentId: treatment.treatmentId,
        name: treatment.name,
        category: treatment.category,
        duration: treatment.duration,
        basePrice: treatment.basePrice,
        benefits: treatment.benefits,
        suitableFor: treatment.suitableFor,
        seasonalRelevance: seasonalPatterns.recommendedTreatments.some(
          (t) => t.treatmentId === treatment.treatmentId
        ),
        popularityScore: treatment.popularityScore || 0,
        reasons: generateRecommendationReasons(treatment),
      }));

      // Generate insights
      const insights = await generateWellnessInsights(merchantId, {
        skinType,
        concerns,
        customerId,
      });

      logger.info('Wellness recommendations generated', {
        merchantId,
        recommendationsCount: recommendations.length,
        processingTimeMs: Date.now() - startTime,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: {
          merchantId,
          recommendations,
          trendingTreatments: trendingTreatments.map((t) => ({
            treatmentId: t.treatmentId,
            name: t.name,
            reason: 'Currently trending due to season',
          })),
          seasonalInfo: {
            season: seasonalPatterns.season,
            multiplier: seasonalPatterns.multiplier,
            trend: seasonalPatterns.trend,
          },
          categories: SpaIntelligence.getTreatmentCategories(),
          insights,
        },
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Wellness recommendations failed', { error, merchantId });
      throw error;
    }
  })
);

// GET /wellness/trending - Get trending treatments
router.get(
  '/trending',
  aiRateLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { limit = 5, category } = req.query as any;

    logger.info('Trending treatments requested', { category, limit });

    let trending = RecommendationsService.getTrendingTreatments(Number(limit));

    if (category) {
      trending = trending.filter((t) => t.category === category);
    }

    const seasonalPatterns = SpaIntelligence.analyzeSeasonalPatterns();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        treatments: trending,
        season: seasonalPatterns.season,
        trend: seasonalPatterns.trend,
      },
    };

    res.status(200).json(response);
  })
);

// GET /wellness/packages - Get available wellness packages
router.get(
  '/packages',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category, minPrice, maxPrice } = req.query as any;

    // Get package data from recommendations service
    // This would typically come from database
    const { TREATMENTS_DATABASE, WELLNESS_PACKAGES } = await import('../config/knowledge');

    let packages = [...WELLNESS_PACKAGES];

    // Apply filters
    if (category) {
      // Filter packages containing treatments of specified category
      packages = packages.filter((pkg) => {
        const pkgTreatments = TREATMENTS_DATABASE.filter((t) =>
          pkg.treatments.includes(t.treatmentId)
        );
        return pkgTreatments.some((t) => t.category === category);
      });
    }

    if (minPrice !== undefined) {
      packages = packages.filter((p) => p.packagePrice >= Number(minPrice));
    }

    if (maxPrice !== undefined) {
      packages = packages.filter((p) => p.packagePrice <= Number(maxPrice));
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        packages,
        count: packages.length,
      },
    };

    res.status(200).json(response);
  })
);

// Helper function to generate recommendation reasons
function generateRecommendationReasons(treatment: any): string[] {
  const reasons: string[] = [];

  if (treatment.suitableFor && treatment.suitableFor.length > 0) {
    reasons.push(`Ideal for ${treatment.suitableFor[0]}`);
  }

  if (treatment.duration <= 60) {
    reasons.push('Perfect for quick sessions');
  } else if (treatment.duration >= 90) {
    reasons.push('Comprehensive treatment experience');
  }

  if (treatment.benefits && treatment.benefits.length > 0) {
    reasons.push(`Main benefits: ${treatment.benefits.slice(0, 2).join(', ')}`);
  }

  return reasons;
}

// Helper function to generate wellness insights
async function generateWellnessInsights(
  merchantId: string,
  filters: { skinType?: string; concerns?: string; customerId?: string }
): Promise<any[]> {
  const insights: any[] = [];

  // Get existing insights from database
  const existingInsights = await WellnessInsight.findActiveInsights(merchantId);

  if (existingInsights.length > 0) {
    return existingInsights.slice(0, 5).map((insight) => ({
      insightId: insight.insightId,
      type: insight.type,
      title: insight.payload.title,
      description: insight.payload.description,
      confidence: insight.confidence,
      priority: insight.metadata.priority,
    }));
  }

  // Generate new insights based on filters
  if (filters.skinType) {
    insights.push({
      insightId: uuidv4(),
      type: 'treatment',
      title: `${filters.skinType} Skin Care Focus`,
      description: `Customers with ${filters.skinType} skin benefit most from hydrating and soothing treatments.`,
      confidence: 0.85,
      priority: 'medium',
    });
  }

  if (filters.concerns) {
    const concernList = filters.concerns.split(',');
    insights.push({
      insightId: uuidv4(),
      type: 'treatment',
      title: 'Multi-Concern Treatment Plan',
      description: `For customers with ${concernList.length} concerns, combination treatments show 40% higher satisfaction.`,
      confidence: 0.78,
      priority: 'high',
    });
  }

  // Seasonal insight
  const month = new Date().getMonth() + 1;
  insights.push({
    insightId: uuidv4(),
    type: 'upsell',
    title: 'Seasonal Wellness Opportunity',
    description: getSeasonalInsight(month),
    confidence: 0.82,
    priority: 'medium',
  });

  return insights;
}

// Get seasonal insight based on month
function getSeasonalInsight(month: number): string {
  const seasonalInsights: Record<number, string> = {
    1: 'Start-of-year wellness packages show 30% higher conversion in January.',
    2: 'Pre-spring detox treatments are trending - consider promotional pricing.',
    3: 'Spring renewal treatments can boost bookings by 25%.',
    4: 'April sees increased interest in holistic wellness - bundle opportunities.',
    5: 'Pre-summer skin care packages see 40% growth in bookings.',
    6: 'Hydration-focused treatments are popular during summer months.',
    7: 'Quick refresh treatments appeal to vacationers and busy professionals.',
    8: 'Late-summer maintenance treatments keep customers engaged.',
    9: 'Back-to-routine: Stress relief and work-life balance treatments peak.',
    10: 'Fall wellness season begins - anti-aging treatments show strong demand.',
    11: 'Pre-holiday grooming packages increase average transaction value by 35%.',
    12: 'Holiday spa packages drive 50% of monthly revenue - focus on bundles.',
  };

  return seasonalInsights[month] || 'Seasonal wellness opportunity available.';
}

export default router;