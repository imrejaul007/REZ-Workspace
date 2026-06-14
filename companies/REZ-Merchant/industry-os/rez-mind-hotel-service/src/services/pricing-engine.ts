/**
 * REZ Mind Hotel Service - Pricing Engine
 *
 * Dynamic pricing service that:
 * - Gets demand signals from search/booking data
 * - Gets event calendar (local events, holidays)
 * - Gets competitor rates
 * - Gets user preferences and segmentation
 * - Returns optimized dynamic prices
 */

import {
  HotelSearchEvent,
  HotelBookingEvent,
  CheckoutEvent,
  GuestPreference,
} from '../models/event-schemas';
import { signalStore, SignalType } from './signal-store';
import { toLocalEvents } from '../data/festivals';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Hotel profile data required for occupancy calculations.
 * The hotelProfile.totalRooms is used instead of a hardcoded estimate.
 */
export interface HotelProfile {
  hotelId: string;
  name?: string;
  totalRooms: number;
  starRating?: number;
  city?: string;
  location?: string;
}

export interface PricingRequest {
  hotelId: string;
  roomTypeId: string;
  baseRate: number;
  checkIn: string;
  checkOut: string;
  userId?: string;
  /** Hotel profile data for occupancy calculations. Uses totalRooms if provided. */
  hotelProfile?: HotelProfile;
}

export interface PricingResponse {
  baseRate: number;
  suggestedRate: number;
  minRate: number;
  maxRate: number;
  discountPercent: number;
  confidence: number;
  reason: string;
  factors: PricingFactors;
  validUntil: string;
}

export interface PricingFactors {
  demand: DemandFactor;
  seasonality: SeasonalityFactor;
  competitor: CompetitorFactor;
  userSegment: UserSegmentFactor;
  eventCalendar: EventFactor;
}

export interface DemandFactor {
  value: number;
  weight: number;
  searches: number;
  bookings: number;
  occupancyRate: number;
}

export interface SeasonalityFactor {
  value: number;
  weight: number;
  month: number;
  isWeekend: boolean;
  isHoliday: boolean;
}

export interface CompetitorFactor {
  value: number;
  weight: number;
  avgCompetitorRate: number;
  rateDiffPercent: number;
  competitorCount: number;
}

export interface UserSegmentFactor {
  value: number;
  weight: number;
  segment: string;
  priceSensitivity: number;
}

export interface EventFactor {
  value: number;
  weight: number;
  eventName?: string;
  eventType?: string;
  expectedDemandIncrease: number;
}

// ─── Event Calendar Interface ─────────────────────────────────────────────────

interface LocalEvent {
  name: string;
  type: 'festival' | 'holiday' | 'vacation' | 'conference' | 'sports' | 'concert' | 'other';
  date: Date;
  expectedAttendance?: number;
  impact: number; // 0-1, how much it affects hotel demand
  duration?: number; // Number of days the event spans
  region?: string; // Optional regional scope
}

// ─── Pricing Engine Class ─────────────────────────────────────────────────────

export class PricingEngine {
  private eventCalendar: LocalEvent[] = [];
  private competitorRatesCache: Map<string, { rate: number; timestamp: Date }> = new Map();
  private CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.initializeEventCalendar();
  }

  /**
   * Initialize event calendar with known events from external festival calendar
   * The festival calendar covers multiple years (2024-2027) and is easy to update
   * in src/data/festivals.ts
   */
  private initializeEventCalendar(): void {
    // Load all festivals from the external calendar (spans 2024-2027)
    this.eventCalendar = toLocalEvents();
  }

  /**
   * Get dynamic price for a room
   */
  async getDynamicPrice(request: PricingRequest): Promise<PricingResponse> {
    const { hotelId, roomTypeId, baseRate, checkIn, checkOut, userId } = request;

    // Calculate all pricing factors
    const [demandFactor, seasonalityFactor, competitorFactor, userSegmentFactor, eventFactor] =
      await Promise.all([
        this.getDemandFactor(hotelId, checkIn, checkOut, request.hotelProfile),
        this.getSeasonalityFactor(checkIn, checkOut),
        this.getCompetitorFactor(hotelId, baseRate),
        this.getUserSegmentFactor(userId, hotelId),
        this.getEventFactor(checkIn, checkOut),
      ]);

    // Calculate weights (should sum to 1)
    const weights = {
      demand: 0.3,
      seasonality: 0.2,
      competitor: 0.2,
      userSegment: 0.15,
      eventCalendar: 0.15,
    };

    // Calculate weighted multiplier
    const demandMultiplier = demandFactor.value;
    const seasonalityMultiplier = seasonalityFactor.value;
    const competitorMultiplier = competitorFactor.value;
    const userMultiplier = userSegmentFactor.value;
    const eventMultiplier = eventFactor.value;

    const totalMultiplier =
      demandMultiplier * weights.demand +
      seasonalityMultiplier * weights.seasonality +
      competitorMultiplier * weights.competitor +
      userMultiplier * weights.userSegment +
      eventMultiplier * weights.eventCalendar;

    // Calculate suggested rate
    const suggestedRate = Math.round(baseRate * totalMultiplier);
    const minRate = Math.round(baseRate * 0.7); // Floor at 70% of base
    const maxRate = Math.round(baseRate * 2.0); // Cap at 200% of base

    // Apply bounds
    const boundedRate = Math.max(minRate, Math.min(maxRate, suggestedRate));
    const discountPercent = boundedRate < baseRate
      ? Math.round((1 - boundedRate / baseRate) * 100)
      : 0;

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(demandFactor, competitorFactor);

    // Generate pricing reason
    const reason = this.generatePricingReason(
      demandFactor,
      seasonalityFactor,
      competitorFactor,
      eventFactor,
      userSegmentFactor
    );

    return {
      baseRate,
      suggestedRate: boundedRate,
      minRate,
      maxRate,
      discountPercent,
      confidence,
      reason,
      factors: {
        demand: demandFactor,
        seasonality: seasonalityFactor,
        competitor: competitorFactor,
        userSegment: userSegmentFactor,
        eventCalendar: eventFactor,
      },
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Valid for 15 minutes
    };
  }

  /**
   * Default total rooms used for occupancy calculation when hotelProfile is not provided.
   * This is a fallback value and should be overridden by passing hotelProfile.
   */
  private static readonly DEFAULT_TOTAL_ROOMS = 30;

  /**
   * Get demand signals from search and booking data
   */
  async getDemandFactor(
    hotelId: string,
    checkIn: string,
    checkOut: string,
    hotelProfile?: HotelProfile
  ): Promise<DemandFactor> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get recent searches for similar dates
    const recentSearches = await HotelSearchEvent.countDocuments({
      city: { $exists: true },
      timestamp: { $gte: sevenDaysAgo },
      checkIn: { $regex: checkInDate.toISOString().split('T')[0].substring(0, 7) }, // Match month
    });

    // Get recent bookings for this hotel
    const recentBookings = await HotelBookingEvent.countDocuments({
      hotelId,
      status: { $in: ['confirmed', 'created'] },
      timestamp: { $gte: sevenDaysAgo },
    });

    // Get signal store data for demand
    const signalDemand = await signalStore.getAggregatedSignals({
      hotelId,
      startDate: sevenDaysAgo,
      groupBy: 'type',
    });

    const signalSearches = signalDemand.find((s) => s._id === SignalType.SEARCH)?.count || 0;
    const signalBookings = signalDemand.find((s) => s._id === SignalType.BOOKING)?.count || 0;

    // Calculate occupancy rate using hotel's actual room count
    // Uses hotelProfile.totalRooms if available, otherwise falls back to DEFAULT_TOTAL_ROOMS
    const totalRooms = hotelProfile?.totalRooms ?? PricingEngine.DEFAULT_TOTAL_ROOMS;
    const daysDiff = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000));
    const occupancyRate = Math.min(1, (recentBookings * daysDiff) / (totalRooms * 7));

    // Calculate demand multiplier
    let demandValue = 1.0;

    // High search volume indicates interest
    if (recentSearches > 50) demandValue += 0.3;
    else if (recentSearches > 20) demandValue += 0.15;
    else if (recentSearches < 5) demandValue -= 0.1;

    // Signal-based demand
    if (signalSearches > 100) demandValue += 0.2;
    if (signalBookings > 20) demandValue += 0.15;

    // Occupancy affects price
    if (occupancyRate > 0.8) demandValue += 0.2;
    else if (occupancyRate > 0.6) demandValue += 0.1;
    else if (occupancyRate < 0.3) demandValue -= 0.15;

    // Bound demand value
    demandValue = Math.max(0.7, Math.min(1.5, demandValue));

    return {
      value: Math.round(demandValue * 100) / 100,
      weight: 0.3,
      searches: recentSearches + signalSearches,
      bookings: recentBookings + signalBookings,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }

  /**
   * Get seasonality factor based on date
   */
  async getSeasonalityFactor(checkIn: string, checkOut: string): Promise<SeasonalityFactor> {
    const checkInDate = new Date(checkIn);
    const month = checkInDate.getMonth();
    const dayOfWeek = checkInDate.getDay();

    let seasonalityValue = 1.0;

    // Peak seasons in India
    // October to March is generally peak season for tourism
    if (month >= 9 && month <= 2) {
      seasonalityValue = 1.2;
    } else if (month >= 3 && month <= 5) {
      // Summer - lower demand except for hill stations
      seasonalityValue = 0.9;
    } else {
      // Monsoon - generally lower
      seasonalityValue = 0.85;
    }

    // Weekend premium
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    if (isWeekend) {
      seasonalityValue *= 1.1;
    }

    // Check for holidays in the date range
    const isHoliday = this.eventCalendar.some(
      (event) =>
        event.date >= checkInDate &&
        event.date <= new Date(checkOut) &&
        event.type === 'holiday'
    );

    if (isHoliday) {
      seasonalityValue *= 1.15;
    }

    return {
      value: Math.round(seasonalityValue * 100) / 100,
      weight: 0.2,
      month: month + 1,
      isWeekend,
      isHoliday,
    };
  }

  /**
   * Get competitor pricing factor
   */
  async getCompetitorFactor(hotelId: string, baseRate: number): Promise<CompetitorFactor> {
    // Check cache
    const cached = this.competitorRatesCache.get(hotelId);
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL_MS) {
      const rateDiff = (baseRate - cached.rate) / cached.rate;
      return {
        value: 1 + rateDiff * 0.1, // Adjust based on diff
        weight: 0.2,
        avgCompetitorRate: cached.rate,
        rateDiffPercent: Math.round(rateDiff * 100),
        competitorCount: 5, // Estimated
      };
    }

    // In production, fetch from competitor rate API
    // For now, simulate competitor data
    const competitorRates = [0.85, 0.95, 1.0, 1.05, 1.1].map((mult) => baseRate * mult);
    const avgCompetitorRate = competitorRates.reduce((a, b) => a + b, 0) / competitorRates.length;

    // Cache the rate
    this.competitorRatesCache.set(hotelId, {
      rate: avgCompetitorRate,
      timestamp: new Date(),
    });

    const rateDiff = (baseRate - avgCompetitorRate) / avgCompetitorRate;
    let competitorValue = 1.0;

    // If we're priced lower than competitors, we can increase
    if (rateDiff < -0.1) competitorValue = 0.95; // Room for increase
    else if (rateDiff > 0.1) competitorValue = 1.1; // Need to be competitive

    return {
      value: Math.round(competitorValue * 100) / 100,
      weight: 0.2,
      avgCompetitorRate: Math.round(avgCompetitorRate),
      rateDiffPercent: Math.round(rateDiff * 100),
      competitorCount: competitorRates.length,
    };
  }

  /**
   * Get user segment factor
   */
  async getUserSegmentFactor(userId?: string, hotelId?: string): Promise<UserSegmentFactor> {
    let segment = 'standard';
    let priceSensitivity = 0.5;

    if (userId) {
      // Get user preferences
      const preferences = await GuestPreference.findOne({ userId });

      if (preferences) {
        // Check booking history
        const bookings = await HotelBookingEvent.find({ userId })
          .sort({ timestamp: -1 })
          .limit(5);

        if (bookings.length > 0) {
          const avgSpend = bookings.reduce((sum, b) => sum + b.totalAmountPaise, 0) / bookings.length;

          if (avgSpend > 100000) {
            segment = 'premium';
            priceSensitivity = 0.2; // Less sensitive to price
          } else if (avgSpend > 50000) {
            segment = 'regular';
            priceSensitivity = 0.5;
          } else {
            segment = 'budget';
            priceSensitivity = 0.8; // More sensitive to price
          }
        }
      }
    }

    // Calculate segment multiplier
    let segmentValue = 1.0;

    switch (segment) {
      case 'premium':
        segmentValue = 1.15; // Can charge more
        break;
      case 'regular':
        segmentValue = 1.0; // Standard
        break;
      case 'budget':
        segmentValue = 0.9; // Discount for price-sensitive
        break;
      default:
        segmentValue = 1.0;
    }

    return {
      value: Math.round(segmentValue * 100) / 100,
      weight: 0.15,
      segment,
      priceSensitivity,
    };
  }

  /**
   * Get event calendar factor
   * Considers both single-day and multi-day festivals
   */
  async getEventFactor(checkIn: string, checkOut: string): Promise<EventFactor> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    let eventValue = 1.0;
    let eventName: string | undefined;
    let eventType: string | undefined;
    let expectedDemandIncrease = 0;

    // Find matching events (including multi-day events that overlap with stay period)
    const matchingEvents = this.eventCalendar.filter((event) => {
      const eventEndDate = new Date(event.date);
      if (event.duration && event.duration > 1) {
        eventEndDate.setDate(eventEndDate.getDate() + event.duration - 1);
      }

      // Check if any day of the event overlaps with the stay period
      // Event overlaps if: event starts before checkout AND event ends on or after checkin
      return event.date <= checkOutDate && eventEndDate >= checkInDate;
    });

    if (matchingEvents.length > 0) {
      // Use the highest impact event
      const highestImpactEvent = matchingEvents.reduce((max, e) =>
        e.impact > max.impact ? e : max
      );

      eventName = highestImpactEvent.name;
      eventType = highestImpactEvent.type;
      expectedDemandIncrease = highestImpactEvent.impact;
      eventValue = 1 + highestImpactEvent.impact * 0.5; // Scale impact
    }

    return {
      value: Math.round(eventValue * 100) / 100,
      weight: 0.15,
      eventName,
      eventType,
      expectedDemandIncrease: Math.round(expectedDemandIncrease * 100) / 100,
    };
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(
    demandFactor: DemandFactor,
    competitorFactor: CompetitorFactor
  ): number {
    let confidence = 0.5; // Base confidence

    // More searches = higher confidence
    if (demandFactor.searches > 100) confidence += 0.15;
    else if (demandFactor.searches > 50) confidence += 0.1;
    else if (demandFactor.searches > 20) confidence += 0.05;

    // More bookings = higher confidence
    if (demandFactor.bookings > 50) confidence += 0.15;
    else if (demandFactor.bookings > 20) confidence += 0.1;
    else if (demandFactor.bookings > 5) confidence += 0.05;

    // Competitor data availability
    if (competitorFactor.competitorCount > 3) confidence += 0.1;

    return Math.min(1, Math.max(0.3, Math.round(confidence * 100) / 100));
  }

  /**
   * Generate pricing reason
   */
  private generatePricingReason(
    demandFactor: DemandFactor,
    seasonalityFactor: SeasonalityFactor,
    competitorFactor: CompetitorFactor,
    eventFactor: EventFactor,
    userSegmentFactor: UserSegmentFactor
  ): string {
    const reasons: string[] = [];

    // Demand reasons
    if (demandFactor.occupancyRate > 0.8) {
      reasons.push('high occupancy');
    } else if (demandFactor.occupancyRate < 0.3) {
      reasons.push('low occupancy');
    }

    if (demandFactor.searches > 100) {
      reasons.push('high search interest');
    }

    // Seasonality reasons
    if (seasonalityFactor.isHoliday) {
      reasons.push('holiday period');
    }
    if (seasonalityFactor.isWeekend) {
      reasons.push('weekend rate');
    }

    // Event reasons
    if (eventFactor.eventName) {
      reasons.push(`${eventFactor.eventType}: ${eventFactor.eventName}`);
    }

    // Competitor reasons
    if (competitorFactor.rateDiffPercent > 10) {
      reasons.push('below competitor average');
    } else if (competitorFactor.rateDiffPercent < -10) {
      reasons.push('above competitor average');
    }

    // Segment reasons
    if (userSegmentFactor.segment === 'premium') {
      reasons.push('premium guest segment');
    }

    if (reasons.length === 0) {
      return 'Standard pricing based on current market conditions';
    }

    return `Adjusted for ${reasons.join(', ')}`;
  }

  /**
   * Get pricing history for analytics
   */
  async getPricingHistory(hotelId: string, startDate: Date, endDate: Date): Promise<unknown[]> {
    // In production, would query pricing history collection
    // For now, return mock data
    return [];
  }

  /**
   * Add event to calendar (for testing or manual events)
   * Supports both Date objects and ISO date strings (YYYY-MM-DD)
   */
  addEventToCalendar(event: Omit<LocalEvent, 'impact'> & { impact?: number; date?: Date | string }): void {
    let eventDate = event.date;
    if (typeof eventDate === 'string') {
      eventDate = new Date(eventDate);
    } else if (!eventDate) {
      eventDate = new Date();
    }

    this.eventCalendar.push({
      name: event.name,
      type: event.type,
      date: eventDate,
      impact: event.impact || 0.5,
      duration: (event as unknown).duration,
      region: (event as unknown).region,
    });
  }

  /**
   * Reload the event calendar from the external festival data
   * Useful when festival calendar has been updated without restarting
   */
  reloadEventCalendar(): void {
    this.eventCalendar = toLocalEvents();
  }

  /**
   * Get the current event calendar for debugging/inspection
   */
  getEventCalendar(): LocalEvent[] {
    return [...this.eventCalendar];
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const pricingEngine = new PricingEngine();
