import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TREATMENTS_DATABASE, getCurrentSeason } from '../config/knowledge';
import { validateBody } from '../middleware/validation';
import { aiRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ApiResponse, PricingAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation schemas
const PricingOptimizationRequestSchema = z.object({
  merchantId: z.string().min(3).max(100),
  treatmentId: z.string().optional(),
  currentPrice: z.number().min(0).optional(),
  factors: z.object({
    seasonality: z.boolean().default(true),
    competition: z.boolean().default(true),
    demand: z.boolean().default(true),
    customerSegment: z.boolean().default(false),
  }).optional(),
  marketData: z.object({
    competitorPrices: z.array(z.number()).optional(),
    marketAverage: z.number().optional(),
  }).optional(),
});

const BulkPricingRequestSchema = z.object({
  merchantId: z.string().min(3).max(100),
  treatmentIds: z.array(z.string()),
  adjustments: z.object({
    percentage: z.number().min(-50).max(100).optional(),
    fixed: z.number().optional(),
    seasonal: z.boolean().default(true),
  }),
});

// POST /pricing/optimize - Optimize pricing for a treatment
router.post(
  '/optimize',
  aiRateLimiter,
  validateBody(PricingOptimizationRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { merchantId, treatmentId, currentPrice, factors, marketData } = req.body;

    logger.info('Pricing optimization requested', {
      merchantId,
      treatmentId,
      currentPrice,
    });

    try {
      // If no treatment ID provided, return market overview
      if (!treatmentId) {
        const marketOverview = getMarketPricingOverview();
        res.status(200).json({
          success: true,
          data: marketOverview,
          meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
          },
        });
        return;
      }

      // Find treatment
      const treatment = TREATMENTS_DATABASE.find((t) => t.treatmentId === treatmentId);
      if (!treatment) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TREATMENT_NOT_FOUND',
            message: `Treatment '${treatmentId}' not found`,
          },
        });
        return;
      }

      // Calculate optimal pricing
      const pricingAnalysis = calculateOptimalPricing(
        treatment,
        currentPrice || treatment.basePrice,
        factors || {
          seasonality: true,
          competition: true,
          demand: true,
          customerSegment: false,
        },
        marketData?.competitorPrices || [],
        marketData?.marketAverage
      );

      logger.info('Pricing optimization completed', {
        merchantId,
        treatmentId,
        recommendedPrice: pricingAnalysis.recommendedPrice.optimalPrice,
        confidence: pricingAnalysis.recommendedPrice.confidence,
        processingTimeMs: Date.now() - startTime,
      });

      const response: ApiResponse<PricingAnalysis> = {
        success: true,
        data: pricingAnalysis,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Pricing optimization failed', { error, merchantId, treatmentId });
      throw error;
    }
  })
);

// POST /pricing/bulk - Bulk pricing update
router.post(
  '/bulk',
  aiRateLimiter,
  validateBody(BulkPricingRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { merchantId, treatmentIds, adjustments } = req.body;

    logger.info('Bulk pricing update requested', {
      merchantId,
      treatmentCount: treatmentIds.length,
      adjustments,
    });

    try {
      const results = treatmentIds.map((treatmentId) => {
        const treatment = TREATMENTS_DATABASE.find((t) => t.treatmentId === treatmentId);
        if (!treatment) {
          return {
            treatmentId,
            success: false,
            error: 'Treatment not found',
          };
        }

        let newPrice = treatment.basePrice;

        if (adjustments.percentage !== undefined) {
          newPrice = treatment.basePrice * (1 + adjustments.percentage / 100);
        } else if (adjustments.fixed !== undefined) {
          newPrice = adjustments.fixed;
        }

        // Apply seasonal multiplier
        if (adjustments.seasonal && treatment.seasonality) {
          const currentSeason = getCurrentSeason();
          newPrice *= treatment.seasonality.priceMultiplier;
        }

        newPrice = Math.round(newPrice * 100) / 100;

        return {
          treatmentId,
          success: true,
          treatmentName: treatment.name,
          previousPrice: treatment.basePrice,
          newPrice,
          adjustment: adjustments,
        };
      });

      logger.info('Bulk pricing completed', {
        merchantId,
        totalTreatments: results.length,
        successful: results.filter((r) => r.success).length,
        processingTimeMs: Date.now() - startTime,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
        },
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Bulk pricing failed', { error, merchantId });
      throw error;
    }
  })
);

// GET /pricing/market - Get market pricing overview
router.get(
  '/market',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category, merchantId } = req.query as any;

    logger.info('Market pricing overview requested', { category, merchantId });

    const overview = getMarketPricingOverview(category);

    const response: ApiResponse<any> = {
      success: true,
      data: overview,
    };

    res.status(200).json(response);
  })
);

// Helper function to calculate optimal pricing
function calculateOptimalPricing(
  treatment: any,
  currentPrice: number,
  factors: {
    seasonality: boolean;
    competition: boolean;
    demand: boolean;
    customerSegment: boolean;
  },
  competitorPrices: number[],
  marketAverage?: number
): PricingAnalysis {
  const factorsList: any[] = [];
  let totalImpact = 0;

  // Seasonality factor
  if (factors.seasonality && treatment.seasonality) {
    const currentSeason = getCurrentSeason();
    const multiplier = treatment.seasonality.priceMultiplier;
    factorsList.push({
      factor: 'Seasonal Demand',
      impact: multiplier > 1 ? 'positive' : multiplier < 1 ? 'negative' : 'neutral',
      weight: 0.25,
      description: `Current ${currentSeason.season} season with ${Math.round((multiplier - 1) * 100)}% demand adjustment`,
    });
    totalImpact += (multiplier - 1) * 0.25;
  }

  // Competition factor
  if (factors.competition && competitorPrices.length > 0) {
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const competitivePosition = currentPrice / avgCompetitorPrice;
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let weight = 0.2;

    if (competitivePosition > 1.1) {
      impact = 'negative';
      totalImpact -= 0.1;
    } else if (competitivePosition < 0.9) {
      impact = 'positive';
      totalImpact += 0.1;
    }

    factorsList.push({
      factor: 'Competitive Position',
      impact,
      weight,
      description: `Your price is ${Math.round((competitivePosition - 1) * 100)}% ${competitivePosition > 1 ? 'above' : 'below'} competitor average`,
    });
  }

  // Demand factor
  if (factors.demand && treatment.popularityScore) {
    const demandLevel = treatment.popularityScore;
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let weight = 0.3;

    if (demandLevel > 0.8) {
      impact = 'positive';
      totalImpact += 0.15;
    } else if (demandLevel < 0.4) {
      impact = 'negative';
      totalImpact -= 0.1;
    }

    factorsList.push({
      factor: 'Demand Level',
      impact,
      weight,
      description: `${Math.round(demandLevel * 100)}% popularity with customers`,
    });
  }

  // Base price factor
  factorsList.push({
    factor: 'Base Price',
    impact: 'neutral',
    weight: 0.25,
    description: `Current base price of $${currentPrice}`,
  });

  // Calculate recommended prices
  const totalMultiplier = 1 + totalImpact;
  let optimalPrice = currentPrice * totalMultiplier;

  // Calculate min and max bounds
  const minPrice = currentPrice * 0.7; // Can go 30% below for promotions
  const maxPrice = currentPrice * 1.5; // Can go 50% above for premium positioning

  // Determine pricing strategy
  let strategy: 'penetration' | 'value' | 'premium' | 'competitive' = 'competitive';
  if (totalImpact > 0.2) strategy = 'premium';
  else if (totalImpact < -0.1) strategy = 'value';

  // Calculate confidence based on available data
  let confidence = 0.5;
  if (factors.seasonality) confidence += 0.15;
  if (factors.competition && competitorPrices.length > 0) confidence += 0.15;
  if (factors.demand && treatment.popularityScore) confidence += 0.15;

  const competitivePosition = marketAverage
    ? currentPrice / marketAverage
    : 1;

  return {
    treatmentId: treatment.treatmentId,
    treatmentName: treatment.name,
    currentPrice,
    recommendedPrice: {
      minPrice: Math.round(minPrice * 100) / 100,
      optimalPrice: Math.round(optimalPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      confidence: Math.min(0.95, confidence),
      strategy,
    },
    factors: factorsList,
    competitivePosition: {
      percentile: Math.round(competitivePosition * 100),
      belowAverage: currentPrice < (marketAverage || currentPrice),
      marketAverage: marketAverage || currentPrice,
      positioning: competitivePosition > 1.2 ? 'premium' : competitivePosition > 0.8 ? 'mid-market' : 'budget',
    },
    seasonalRecommendation: {
      currentSeason: getCurrentSeason().season,
      multiplier: getCurrentSeason().multiplier,
      recommendations: generateSeasonalRecommendations(treatment),
    },
  };
}

// Helper function to get market pricing overview
function getMarketPricingOverview(category?: string): any {
  const treatments = category
    ? TREATMENTS_DATABASE.filter((t) => t.category === category)
    : TREATMENTS_DATABASE;

  const priceRanges = treatments.reduce(
    (acc, t) => {
      acc.min = Math.min(acc.min, t.basePrice);
      acc.max = Math.max(acc.max, t.basePrice);
      acc.avg += t.basePrice;
      acc.count++;
      return acc;
    },
    { min: Infinity, max: 0, avg: 0, count: 0 }
  );

  priceRanges.avg = priceRanges.avg / priceRanges.count || 0;

  const categoryPrices = treatments.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { count: 0, total: 0, avg: 0 };
    }
    acc[t.category].count++;
    acc[t.category].total += t.basePrice;
    acc[t.category].avg = acc[t.category].total / acc[t.category].count;
    return acc;
  }, {} as Record<string, { count: number; total: number; avg: number }>);

  const currentSeason = getCurrentSeason();

  return {
    treatments: treatments.map((t) => ({
      treatmentId: t.treatmentId,
      name: t.name,
      category: t.category,
      basePrice: t.basePrice,
      seasonality: t.seasonality?.priceMultiplier || 1,
    })),
    overview: {
      priceRange: {
        min: Math.round(priceRanges.min),
        max: Math.round(priceRanges.max),
        average: Math.round(priceRanges.avg),
      },
      totalTreatments: priceRanges.count,
      categories: Object.keys(categoryPrices).length,
    },
    categoryBreakdown: categoryPrices,
    currentSeason: currentSeason.season,
    seasonalMultiplier: currentSeason.multiplier,
    recommendations: generateMarketRecommendations(treatments),
  };
}

// Generate seasonal recommendations
function generateSeasonalRecommendations(treatment: any): any[] {
  const recommendations: any[] = [];
  const currentMonth = new Date().getMonth() + 1;

  if (treatment.seasonality) {
    // Peak months
    treatment.seasonality.peakMonths.forEach((month) => {
      recommendations.push({
        month,
        recommendedMultiplier: Math.min(1.3, treatment.seasonality.priceMultiplier * 1.1),
        reason: 'Peak demand period',
      });
    });

    // Low months
    treatment.seasonality.lowMonths.forEach((month) => {
      recommendations.push({
        month,
        recommendedMultiplier: Math.max(0.8, treatment.seasonality.priceMultiplier * 0.9),
        reason: 'Consider promotional pricing',
      });
    });
  }

  return recommendations;
}

// Generate market recommendations
function generateMarketRecommendations(treatments: any[]): string[] {
  const recommendations: string[] = [];

  // Find high-value opportunities
  const highPopularity = treatments.filter((t) => (t.popularityScore || 0) > 0.8);
  if (highPopularity.length > 0) {
    recommendations.push(
      `${highPopularity.length} treatments have >80% popularity - consider premium pricing`
    );
  }

  // Seasonal opportunities
  const currentSeason = getCurrentSeason();
  const seasonalBoosts = treatments.filter(
    (t) => t.seasonality?.peakMonths.includes(new Date().getMonth() + 1)
  );
  if (seasonalBoosts.length > 0) {
    recommendations.push(
      `${seasonalBoosts.length} treatments are trending this ${currentSeason.season} - optimal time for pricing`
    );
  }

  return recommendations;
}

export default router;