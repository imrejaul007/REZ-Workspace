/**
 * REZ Mind - Dynamic Pricing Engine
 *
 * Real-time pricing calculation based on:
 * - Occupancy/demand factors
 * - Local events and holidays
 * - Competitor pricing
 * - User tier and history
 * - Seasonality
 * - Lead time before check-in
 *
 * Prices are calculated in paise (Indian currency) to avoid floating point issues
 */

import {
  HotelBookingEvent,
  HotelSearchEvent,
  HotelAnalytics,
} from '../models/event-schemas';

// ─── Pricing Factors Interface ─────────────────────────────────────────────────

export interface PricingFactors {
  baseRate: number;
  demandFactor: number;       // 0.8 - 2.0 based on occupancy
  eventFactor: number;          // 1.0 - 1.5 for local events
  competitorFactor: number;     // 0.9 - 1.1 vs competitors
  userFactor: number;           // 0.9 - 1.2 based on user tier
  seasonalityFactor: number;    // Peak/off-peak
  leadTimeFactor: number;       // Days before check-in
}

export interface PriceCalculation {
  baseRate: number;
  finalRate: number;
  factors: PricingFactors;
  confidence: number;
  validUntil: Date;
  priceBreakdown: {
    baseAmount: number;
    demandAdjustment: number;
    eventAdjustment: number;
    competitorAdjustment: number;
    userAdjustment: number;
    seasonalityAdjustment: number;
    leadTimeAdjustment: number;
  };
}

export interface DemandForecast {
  date: Date;
  predictedOccupancy: number;
  confidence: number;
  recommendedRate: number;
}

export interface RateRecommendation {
  currentRate: number;
  recommendedRate: number;
  reason: string;
  adjustments: {
    factor: string;
    current: number;
    recommended: number;
    impact: number;
  }[];
}

// ─── User Tier Configuration ──────────────────────────────────────────────────

interface UserTierConfig {
  discount: number;
  minBookings: number;
}

const USER_TIERS: Record<string, UserTierConfig> = {
  platinum: { discount: 0.10, minBookings: 50 },
  gold: { discount: 0.07, minBookings: 20 },
  silver: { discount: 0.05, minBookings: 5 },
  bronze: { discount: 0.02, minBookings: 1 },
  standard: { discount: 0, minBookings: 0 },
};

// ─── Event Calendar (would be fetched from external source in production) ──────

interface LocalEvent {
  name: string;
  date: Date;
  impactFactor: number;
  type: 'festival' | 'conference' | 'sports' | 'concert' | 'holiday';
}

// ─── Dynamic Pricing Engine ───────────────────────────────────────────────────

export const dynamicPricingEngine = {
  /**
   * Calculate dynamic price for a hotel room
   */
  async calculatePrice(
    hotelId: string,
    roomTypeId: string,
    params: {
      checkIn: Date;
      checkOut: Date;
      userId?: string;
      baseRate: number;
    }
  ): Promise<PriceCalculation> {
    const { checkIn, checkOut, userId, baseRate } = params;

    // Calculate all factors in parallel for performance
    const [
      demandFactor,
      eventFactor,
      competitorFactor,
      userFactor,
      seasonalityFactor,
      leadTimeFactor,
    ] = await Promise.all([
      this.calculateDemandFactor(hotelId, checkIn),
      this.calculateEventFactor(hotelId, checkIn),
      this.calculateCompetitorFactor(hotelId, checkIn),
      this.calculateUserFactor(userId),
      this.calculateSeasonalityFactor(checkIn),
      this.calculateLeadTimeFactor(checkIn),
    ]);

    // Build factors object
    const factors: PricingFactors = {
      baseRate,
      demandFactor,
      eventFactor,
      competitorFactor,
      userFactor,
      seasonalityFactor,
      leadTimeFactor,
    };

    // Calculate final rate
    const totalMultiplier =
      demandFactor * eventFactor * competitorFactor * userFactor * seasonalityFactor * leadTimeFactor;

    const finalRate = Math.round(baseRate * totalMultiplier);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(hotelId, checkIn);

    // Calculate price breakdown
    const priceBreakdown = {
      baseAmount: baseRate,
      demandAdjustment: Math.round(baseRate * (demandFactor - 1)),
      eventAdjustment: Math.round(baseRate * (eventFactor - 1)),
      competitorAdjustment: Math.round(baseRate * (competitorFactor - 1)),
      userAdjustment: Math.round(baseRate * (userFactor - 1)),
      seasonalityAdjustment: Math.round(baseRate * (seasonalityFactor - 1)),
      leadTimeAdjustment: Math.round(baseRate * (leadTimeFactor - 1)),
    };

    return {
      baseRate,
      finalRate,
      factors,
      confidence,
      validUntil: new Date(Date.now() + 15 * 60 * 1000), // Valid for 15 minutes
      priceBreakdown,
    };
  },

  /**
   * Calculate demand factor based on occupancy and booking velocity
   * Range: 0.8 (low demand) to 2.0 (very high demand)
   */
  async calculateDemandFactor(hotelId: string, checkIn: Date): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get historical occupancy for similar dates
    const analytics = await HotelAnalytics.findOne({
      hotelId,
      date: {
        $gte: thirtyDaysAgo,
        $lte: checkIn,
      },
    }).sort({ date: -1 });

    // Get recent booking velocity
    const recentBookings = await HotelBookingEvent.countDocuments({
      hotelId,
      checkIn: checkIn.toISOString().split('T')[0],
      timestamp: { $gte: sevenDaysAgo },
    });

    const recentSearches = await HotelSearchEvent.countDocuments({
      hotelId: hotelId,
      checkIn: checkIn.toISOString().split('T')[0],
      timestamp: { $gte: sevenDaysAgo },
    });

    // Base demand from analytics
    let occupancyRate = 0.6; // Default assumption
    if (analytics?.roomOccupancy) {
      occupancyRate = analytics.roomOccupancy;
    }

    // Booking velocity factor (more bookings = higher demand)
    let velocityFactor = 1.0;
    if (recentBookings > 10) velocityFactor = 1.3;
    else if (recentBookings > 5) velocityFactor = 1.15;
    else if (recentBookings < 2) velocityFactor = 0.9;

    // Search-to-booking ratio (high ratio = intent but not committed)
    const searchBookRatio = recentSearches > 0 ? recentBookings / recentSearches : 0.1;

    // Calculate final demand factor
    const baseDemand = occupancyRate * 0.5 + velocityFactor * 0.3 + (1 - searchBookRatio) * 0.2;

    // Clamp between 0.8 and 2.0
    return Math.max(0.8, Math.min(2.0, baseDemand));
  },

  /**
   * Calculate event factor based on local events
   * Range: 1.0 (no events) to 1.5 (major event)
   */
  async calculateEventFactor(hotelId: string, checkIn: Date): Promise<number> {
    const events = await this.getLocalEvents(checkIn);

    if (events.length === 0) return 1.0;

    // Get the highest impact event
    const maxImpact = Math.max(...events.map((e) => e.impactFactor));

    // Apply diminishing returns for multiple events
    const combinedImpact = events.reduce((acc, e, i) => {
      return acc + e.impactFactor * Math.pow(0.5, i);
    }, 0);

    return Math.max(1.0, Math.min(1.5, combinedImpact));
  },

  /**
   * Get local events for a date (would connect to external API in production)
   */
  async getLocalEvents(date: Date): Promise<LocalEvent[]> {
    const month = date.getMonth();
    const day = date.getDate();

    const events: LocalEvent[] = [];

    // Major Indian festivals and events
    const festivalDates: Record<string, { month: number; day: number; factor: number }> = {
      'diwali': { month: 10, day: 12, factor: 1.4 },
      'holi': { month: 2, day: 14, factor: 1.3 },
      'ganesh_chaturthi': { month: 8, day: 7, factor: 1.25 },
      'durga_puja': { month: 9, day: 10, factor: 1.35 },
      'christmas': { month: 11, day: 25, factor: 1.2 },
      'new_year': { month: 0, day: 1, factor: 1.5 },
      'Republic_Day': { month: 0, day: 26, factor: 1.2 },
      'Independence_Day': { month: 7, day: 15, factor: 1.2 },
    };

    for (const [name, config] of Object.entries(festivalDates)) {
      if (config.month === month && Math.abs(config.day - day) <= 3) {
        events.push({
          name: name.replace('_', ' '),
          date,
          impactFactor: config.factor,
          type: 'festival',
        });
      }
    }

    // Weekend boost (Fri-Sat check-in)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      events.push({
        name: 'Weekend',
        date,
        impactFactor: 1.15,
        type: 'holiday',
      });
    }

    return events;
  },

  /**
   * Calculate competitor factor based on market rates
   * Range: 0.9 (below market) to 1.1 (above market)
   * In production, this would fetch real competitor data
   */
  async calculateCompetitorFactor(hotelId: string, checkIn: Date): Promise<number> {
    // In production: fetch competitor rates from external service
    // For now, simulate with small random variation
    const seed = hashCode(`${hotelId}-${checkIn.toISOString()}`);
    const variation = (seed % 21 - 10) / 100; // -0.10 to +0.10

    return 1.0 + variation;
  },

  /**
   * Calculate user factor based on tier/discount eligibility
   * Range: 0.9 (loyalty discount) to 1.0 (standard)
   */
  async calculateUserFactor(userId?: string): Promise<number> {
    if (!userId) return 1.0;

    // Count user's past bookings
    const bookingCount = await HotelBookingEvent.countDocuments({
      userId,
      status: 'confirmed',
    });

    // Determine tier
    let tier = 'standard';
    if (bookingCount >= USER_TIERS.platinum.minBookings) tier = 'platinum';
    else if (bookingCount >= USER_TIERS.gold.minBookings) tier = 'gold';
    else if (bookingCount >= USER_TIERS.silver.minBookings) tier = 'silver';
    else if (bookingCount >= USER_TIERS.bronze.minBookings) tier = 'bronze';

    const config = USER_TIERS[tier];

    // Apply discount as factor
    return 1.0 - config.discount;
  },

  /**
   * Calculate seasonality factor
   * Range: 0.8 (off-peak) to 1.4 (peak season)
   */
  async calculateSeasonalityFactor(date: Date): Promise<number> {
    const month = date.getMonth();

    // Peak seasons in India
    if (month >= 9 && month <= 11) return 1.3;  // Oct-Dec: Festival season
    if (month >= 3 && month <= 5) return 1.2;   // Apr-Jun: Summer travel

    // Off-peak seasons
    if (month === 1 || month === 2) return 0.85;  // Feb-Mar: Post-holiday lull
    if (month === 6 || month === 7) return 0.9;    // Jul-Aug: Monsoon

    return 1.0; // Normal season
  },

  /**
   * Calculate lead time factor
   * Range: 0.85 (very early booking) to 1.3 (last minute)
   */
  async calculateLeadTimeFactor(checkIn: Date): Promise<number> {
    const now = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilCheckIn < 0) return 1.0; // Past date
    if (daysUntilCheckIn <= 1) return 1.3;  // Same day/next day: premium
    if (daysUntilCheckIn <= 3) return 1.2;  // 2-3 days: high
    if (daysUntilCheckIn <= 7) return 1.1;  // 1 week: elevated
    if (daysUntilCheckIn <= 14) return 1.0; // 2 weeks: normal
    if (daysUntilCheckIn <= 30) return 0.95; // 1 month: slight discount
    if (daysUntilCheckIn <= 60) return 0.9;  // 2 months: good discount
    if (daysUntilCheckIn <= 90) return 0.85; // 3 months: best early bird

    return 0.85; // Very early bookings get maximum discount
  },

  /**
   * Forecast demand for a date range
   * PERFORMANCE FIX: Process dates in parallel batches for 10x faster forecasts
   */
  async forecastDemand(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DemandForecast[]> {
    // Generate all dates in the range
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Helper function to calculate forecast for a single date
    const calculateDayForecast = async (date: Date): Promise<DemandForecast> => {
      // Calculate all factors in parallel for each day
      const [demandFactor, seasonalityFactor, eventFactor] = await Promise.all([
        this.calculateDemandFactor(hotelId, date),
        this.calculateSeasonalityFactor(date),
        this.calculateEventFactor(hotelId, date),
      ]);

      // Combine factors for occupancy prediction
      const combinedFactor = (demandFactor + seasonalityFactor + eventFactor) / 3;
      const predictedOccupancy = Math.min(100, Math.round(combinedFactor * 50));

      // Calculate confidence based on how far in the future
      const daysUntil = Math.ceil(
        (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const confidence = Math.max(0.5, 1 - daysUntil * 0.005);

      // Recommended rate based on predicted demand
      const baseRate = 5000; // Would come from hotel config
      const recommendedRate = Math.round(
        baseRate * demandFactor * seasonalityFactor * eventFactor
      );

      return {
        date: new Date(date),
        predictedOccupancy,
        confidence: Math.round(confidence * 100) / 100,
        recommendedRate,
      };
    };

    // PERFORMANCE FIX: Process dates in parallel batches
    const BATCH_SIZE = 10;
    const forecasts: DemandForecast[] = [];

    for (let i = 0; i < dates.length; i += BATCH_SIZE) {
      const batch = dates.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(calculateDayForecast));
      forecasts.push(...batchResults);
    }

    return forecasts;
  },

  /**
   * Get rate recommendations for a hotel
   */
  async getRateRecommendations(hotelId: string): Promise<RateRecommendation> {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get current performance metrics
    const analytics = await HotelAnalytics.findOne({
      hotelId,
      date: {
        $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lte: today,
      },
    }).sort({ date: -1 });

    // Get recent bookings for occupancy calculation
    const recentBookings = await HotelBookingEvent.countDocuments({
      hotelId,
      checkIn: {
        $gte: today.toISOString().split('T')[0],
        $lte: sevenDaysLater.toISOString().split('T')[0],
      },
      status: { $in: ['confirmed', 'created'] },
    });

    // Current rate (would come from hotel configuration)
    const currentRate = 5000; // Example base rate in paise
    const currentOccupancy = analytics?.roomOccupancy || 60;

    // Calculate factors for recommendation
    const [demandFactor, eventFactor, seasonalityFactor] = await Promise.all([
      this.calculateDemandFactor(hotelId, sevenDaysLater),
      this.calculateEventFactor(hotelId, sevenDaysLater),
      this.calculateSeasonalityFactor(sevenDaysLater),
    ]);

    // Determine recommendation
    let recommendedRate = currentRate;
    let reason = 'Market competitive';
    const adjustments: RateRecommendation['adjustments'] = [];

    if (currentOccupancy > 85 && demandFactor > 1.2) {
      // High demand - increase rate
      recommendedRate = Math.round(currentRate * 1.15);
      reason = 'High occupancy and strong demand - increase rates';
      adjustments.push({
        factor: 'demand',
        current: currentRate,
        recommended: recommendedRate,
        impact: 15,
      });
    } else if (currentOccupancy < 50) {
      // Low occupancy - decrease rate
      recommendedRate = Math.round(currentRate * 0.9);
      reason = 'Low occupancy - competitive pricing recommended';
      adjustments.push({
        factor: 'occupancy',
        current: currentRate,
        recommended: recommendedRate,
        impact: -10,
      });
    }

    // Apply seasonality adjustment
    if (seasonalityFactor !== 1.0) {
      const seasonalityAdjustment = Math.round(currentRate * (seasonalityFactor - 1));
      adjustments.push({
        factor: 'seasonality',
        current: currentRate,
        recommended: currentRate + seasonalityAdjustment,
        impact: Math.round((seasonalityFactor - 1) * 100),
      });
      recommendedRate = Math.round(recommendedRate * seasonalityFactor);
    }

    // Apply event adjustment
    if (eventFactor > 1.0) {
      adjustments.push({
        factor: 'events',
        current: currentRate,
        recommended: Math.round(currentRate * eventFactor),
        impact: Math.round((eventFactor - 1) * 100),
      });
      recommendedRate = Math.round(recommendedRate * eventFactor);
    }

    return {
      currentRate,
      recommendedRate,
      reason,
      adjustments,
    };
  },

  /**
   * Calculate confidence score based on data availability
   */
  calculateConfidence(hotelId: string, checkIn: Date): number {
    // More historical data = higher confidence
    const daysUntil = Math.ceil(
      (checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Confidence decreases as we predict further into the future
    if (daysUntil <= 7) return 0.95;
    if (daysUntil <= 14) return 0.85;
    if (daysUntil <= 30) return 0.75;
    if (daysUntil <= 60) return 0.65;
    return 0.55;
  },

  /**
   * Get user's tier information
   */
  async getUserTier(userId: string): Promise<{
    tier: string;
    totalBookings: number;
    discount: number;
    nextTier?: string;
    bookingsToNextTier?: number;
  }> {
    const bookingCount = await HotelBookingEvent.countDocuments({
      userId,
      status: { $in: ['confirmed', 'created'] },
    });

    let tier = 'standard';
    let nextTier: string | undefined;
    let bookingsToNextTier: number | undefined;

    if (bookingCount >= USER_TIERS.platinum.minBookings) {
      tier = 'platinum';
    } else if (bookingCount >= USER_TIERS.gold.minBookings) {
      tier = 'gold';
      nextTier = 'platinum';
      bookingsToNextTier = USER_TIERS.platinum.minBookings - bookingCount;
    } else if (bookingCount >= USER_TIERS.silver.minBookings) {
      tier = 'silver';
      nextTier = 'gold';
      bookingsToNextTier = USER_TIERS.gold.minBookings - bookingCount;
    } else if (bookingCount >= USER_TIERS.bronze.minBookings) {
      tier = 'bronze';
      nextTier = 'silver';
      bookingsToNextTier = USER_TIERS.silver.minBookings - bookingCount;
    } else if (bookingCount >= USER_TIERS.standard.minBookings) {
      tier = 'standard';
      nextTier = 'bronze';
      bookingsToNextTier = USER_TIERS.bronze.minBookings - bookingCount;
    }

    return {
      tier,
      totalBookings: bookingCount,
      discount: USER_TIERS[tier].discount,
      nextTier,
      bookingsToNextTier,
    };
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Simple string hash function for deterministic randomness
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default dynamicPricingEngine;
