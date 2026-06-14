/**
 * REZ Mind Hotel Service - Pricing Routes
 *
 * Dynamic pricing API endpoints:
 * - GET  /ai/pricing/:hotelId/:roomTypeId  - Calculate dynamic price
 * - GET  /ai/pricing/forecast/:hotelId    - Forecast demand for date range
 * - GET  /ai/pricing/recommendations/:hotelId - Get rate recommendations
 *
 * Integrates with REZ-Intelligence:
 * - Signal Aggregator (4121)
 * - Predictive Engine (4123)
 * - Unified Profile (4120)
 */

import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import { dynamicPricingEngine } from '../services/dynamic-pricing-engine';
import { hotelIntelligence, HotelCheckoutSignal } from '../integrations/rezIntelligence';

const router = Router();

// ─── Query Param Interfaces ────────────────────────────────────────────────────

interface PricingQuery {
  checkIn?: string | string[];
  checkOut?: string | string[];
  userId?: string | string[];
  baseRate?: string | string[];
}

interface ForecastQuery {
  startDate?: string | string[];
  endDate?: string | string[];
}

// Helper to extract string from query param
function toString(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

// ─── GET /ai/pricing/:hotelId/:roomTypeId ─────────────────────────────────────

/**
 * Calculate dynamic price for a specific room type
 *
 * Query params:
 * - checkIn: ISO date string (required)
 * - checkOut: ISO date string (required)
 * - userId: User ID for personalized pricing (optional)
 * - baseRate: Base rate in paise (optional, will use default if not provided)
 *
 * Response:
 * - baseRate: Original base rate
 * - finalRate: Calculated dynamic price
 * - factors: Breakdown of all pricing factors
 * - confidence: Algorithm confidence (0-1)
 * - validUntil: When this price expires
 * - priceBreakdown: Detailed adjustment amounts
 */
router.get('/pricing/:hotelId/:roomTypeId', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const query = req.query as PricingQuery;
    const checkIn = toString(query.checkIn);
    const checkOut = toString(query.checkOut);
    const userId = toString(query.userId);
    const baseRateStr = toString(query.baseRate);

    // Validate required parameters
    if (!checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'checkIn and checkOut query parameters are required',
        example: '/ai/pricing/:hotelId/:roomTypeId?checkIn=2024-03-15&checkOut=2024-03-18',
      });
      return;
    }

    // Parse dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate date formats
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format: YYYY-MM-DD',
      });
      return;
    }

    // Validate check-out is after check-in
    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'checkOut must be after checkIn',
      });
      return;
    }

    // Use provided base rate or default
    const baseRateValue = baseRateStr ? parseInt(baseRateStr, 10) : 5000;

    // Calculate dynamic price
    const pricing = await dynamicPricingEngine.calculatePrice(
      hotelId,
      roomTypeId,
      {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        userId,
        baseRate: baseRateValue,
      }
    );

    // Get personalization from REZ-Intelligence
    let personalization = null;
    let intentPrediction = null;
    if (userId) {
      try {
        [personalization, intentPrediction] = await Promise.all([
          hotelIntelligence.getPreferences(userId),
          hotelIntelligence.predictIntent(userId, { hotelId, checkIn: checkInDate }),
        ]);
      } catch (e) {
        logger.info('[Pricing] REZ-Intelligence not available');
      }
    }

    // Send pricing signal to REZ-Intelligence
    await hotelIntelligence.sendEvent('hotel:price:calculated', {
      hotelId,
      roomTypeId,
      userId,
      baseRate: baseRateValue,
      finalRate: pricing.finalRate,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
    });

    // Format response with human-readable units (for display)
    const response = {
      success: true,
      data: {
        hotelId,
        roomTypeId,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        nights: Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
        pricing: {
          baseRatePaise: pricing.baseRate,
          baseRateDisplay: formatCurrency(pricing.baseRate),
          finalRatePaise: pricing.finalRate,
          finalRateDisplay: formatCurrency(pricing.finalRate),
          totalPaise: pricing.finalRate * Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
          totalDisplay: formatCurrency(
            pricing.finalRate *
            Math.ceil(
              (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          ),
        },
        factors: {
          demandFactor: pricing.factors.demandFactor,
          eventFactor: pricing.factors.eventFactor,
          competitorFactor: pricing.factors.competitorFactor,
          userFactor: pricing.factors.userFactor,
          seasonalityFactor: pricing.factors.seasonalityFactor,
          leadTimeFactor: pricing.factors.leadTimeFactor,
        },
        confidence: pricing.confidence,
        validUntil: pricing.validUntil.toISOString(),
        priceBreakdown: {
          baseAmountPaise: pricing.priceBreakdown.baseAmount,
          demandAdjustmentPaise: pricing.priceBreakdown.demandAdjustment,
          eventAdjustmentPaise: pricing.priceBreakdown.eventAdjustment,
          competitorAdjustmentPaise: pricing.priceBreakdown.competitorAdjustment,
          userAdjustmentPaise: pricing.priceBreakdown.userAdjustment,
          seasonalityAdjustmentPaise: pricing.priceBreakdown.seasonalityAdjustment,
          leadTimeAdjustmentPaise: pricing.priceBreakdown.leadTimeAdjustment,
        },
        // REZ-Intelligence Data
        personalization: personalization ? {
          preferredAmenities: personalization.preferredAmenities,
          priceSensitivity: personalization.priceSensitivity,
          loyaltyTier: personalization.loyaltyTier,
        } : null,
        intentPrediction: intentPrediction || null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Pricing] Calculate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate dynamic pricing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── GET /ai/pricing/forecast/:hotelId ────────────────────────────────────────

/**
 * Forecast demand for a hotel over a date range
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 *
 * Response:
 * - Array of daily forecasts with predicted occupancy and recommended rates
 */
router.get('/pricing/forecast/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const query = req.query as ForecastQuery;
    const startDate = toString(query.startDate);
    const endDate = toString(query.endDate);

    // Validate required parameters
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
        example: '/ai/pricing/forecast/:hotelId?startDate=2024-03-01&endDate=2024-03-07',
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date formats
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format: YYYY-MM-DD',
      });
      return;
    }

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 90 days',
      });
      return;
    }

    if (end <= start) {
      res.status(400).json({
        success: false,
        message: 'endDate must be after startDate',
      });
      return;
    }

    // Get demand forecast
    const forecasts = await dynamicPricingEngine.forecastDemand(hotelId, start, end);

    // Calculate summary statistics
    const occupancyRates = forecasts.map(f => f.predictedOccupancy);
    const avgOccupancy = occupancyRates.reduce((a, b) => a + b, 0) / occupancyRates.length;
    const maxOccupancy = Math.max(...occupancyRates);
    const minOccupancy = Math.min(...occupancyRates);
    const highDemandDays = forecasts.filter(f => f.predictedOccupancy > 80).length;
    const lowDemandDays = forecasts.filter(f => f.predictedOccupancy < 50).length;

    const response = {
      success: true,
      data: {
        hotelId,
        forecastPeriod: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          totalDays: forecasts.length,
        },
        summary: {
          averageOccupancy: Math.round(avgOccupancy),
          maxOccupancy,
          minOccupancy,
          highDemandDays,
          lowDemandDays,
        },
        dailyForecasts: forecasts.map(f => ({
          date: f.date.toISOString().split('T')[0],
          predictedOccupancy: f.predictedOccupancy,
          confidence: f.confidence,
          recommendedRatePaise: f.recommendedRate,
          recommendedRateDisplay: formatCurrency(f.recommendedRate),
          occupancyLevel: getOccupancyLevel(f.predictedOccupancy),
        })),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Pricing] Forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate demand forecast',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── GET /ai/pricing/recommendations/:hotelId ──────────────────────────────────

/**
 * Get rate recommendations for a hotel
 *
 * Response:
 * - currentRate: Hotel's current rate
 * - recommendedRate: AI-suggested rate
 * - reason: Explanation for the recommendation
 * - adjustments: Breakdown of factor adjustments
 */
router.get('/pricing/recommendations/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    // Get rate recommendations
    const recommendations = await dynamicPricingEngine.getRateRecommendations(hotelId);

    const response = {
      success: true,
      data: {
        hotelId,
        currentRatePaise: recommendations.currentRate,
        currentRateDisplay: formatCurrency(recommendations.currentRate),
        recommendedRatePaise: recommendations.recommendedRate,
        recommendedRateDisplay: formatCurrency(recommendations.recommendedRate),
        rateChangePaise: recommendations.recommendedRate - recommendations.currentRate,
        rateChangePercent: Math.round(
          ((recommendations.recommendedRate - recommendations.currentRate) /
            recommendations.currentRate) *
          100
        ),
        reason: recommendations.reason,
        adjustments: recommendations.adjustments.map(a => ({
          factor: a.factor,
          currentPaise: a.current,
          recommendedPaise: a.recommended,
          impactPercent: a.impact,
        })),
        generatedAt: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Pricing] Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── GET /ai/pricing/tier/:userId ─────────────────────────────────────────────

/**
 * Get user's loyalty tier and discount eligibility
 */
router.get('/pricing/tier/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const tierInfo = await dynamicPricingEngine.getUserTier(userId);

    const response = {
      success: true,
      data: {
        userId,
        tier: tierInfo.tier.toUpperCase(),
        totalBookings: tierInfo.totalBookings,
        discountPercent: tierInfo.discount * 100,
        nextTier: tierInfo.nextTier?.toUpperCase(),
        bookingsToNextTier: tierInfo.bookingsToNextTier,
        benefits: getTierBenefits(tierInfo.tier),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[Pricing] Tier info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user tier information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Format paise to display currency (INR)
 */
function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Get occupancy level label
 */
function getOccupancyLevel(occupancy: number): string {
  if (occupancy >= 90) return 'sold_out';
  if (occupancy >= 80) return 'very_high';
  if (occupancy >= 60) return 'high';
  if (occupancy >= 40) return 'moderate';
  if (occupancy >= 20) return 'low';
  return 'very_low';
}

/**
 * Get benefits for a tier
 */
function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    platinum: [
      '10% discount on all bookings',
      'Priority room upgrades',
      'Free breakfast included',
      'Flexible check-in/check-out',
      'Access to executive lounge',
    ],
    gold: [
      '7% discount on all bookings',
      'Room upgrade priority',
      'Complimentary breakfast',
      'Late checkout until 2 PM',
    ],
    silver: [
      '5% discount on all bookings',
      'Early check-in subject to availability',
      'Welcome drink on arrival',
    ],
    bronze: [
      '2% discount on all bookings',
      'Best available room',
    ],
    standard: [
      'Best available room',
      'Standard check-in time',
    ],
  };

  return benefits[tier] || benefits.standard;
}

export default router;
