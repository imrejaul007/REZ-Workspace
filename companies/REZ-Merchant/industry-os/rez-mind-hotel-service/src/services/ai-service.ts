/**
 * REZ Mind Hotel AI Service
 *
 * AI-powered features:
 * - Hotel recommendations
 * - Dynamic pricing
 * - Satisfaction prediction
 * - SLA prediction
 * - Service upselling
 */

import {
  HotelSearchEvent,
  HotelBookingEvent,
  RoomQREvent,
  ServiceRequestEvent,
  CheckoutEvent,
} from '../models/event-schemas';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface HotelRecommendation {
  hotelId: string;
  hotelName: string;
  score: number;
  reason: string;
  amenities: string[];
  basePrice: number;
  discount?: number;
}

export interface DynamicPricing {
  baseRate: number;
  suggestedRate: number;
  discountPercent: number;
  reason: string;
  factors: {
    demand: number;
    seasonality: number;
    competitor: number;
    userSegment: number;
  };
}

export interface SatisfactionPrediction {
  score: number;
  riskFactors: string[];
  recommendations: string[];
  atRisk: boolean;
}

export interface SLAPrediction {
  predictedTimeMs: number;
  confidence: number;
  currentLoad: number;
  staffAvailable: number;
}

export interface UpsellRecommendation {
  type: 'room_upgrade' | 'service' | 'package';
  item: string;
  description: string;
  estimatedValuePaise: number;
  conversionProbability: number;
}

// ─── User Behavior Cache ───────────────────────────────────────────────────────

interface UserProfile {
  userId: string;
  preferredCities: string[];
  preferredStarRatings: number[];
  avgBookingValue: number;
  totalBookings: number;
  preferredAmenities: string[];
  dietaryPreferences: string[];
  stayFrequency: number; // bookings per month
  lastBookingDate?: Date;
  serviceUsagePatterns: Record<string, number>;
}

// In-memory cache (would use Redis in production)
const userProfileCache = new Map<string, { profile: UserProfile; updatedAt: Date }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── AI Service ──────────────────────────────────────────────────────────────

export const hotelAIService = {
  /**
   * Get personalized hotel recommendations for a user
   */
  async getRecommendations(
    userId: string,
    context: {
      city?: string;
      checkIn?: string;
      checkOut?: string;
      budget?: number;
      guests?: number;
    }
  ): Promise<{
    recommendedHotels: HotelRecommendation[];
    upsells: UpsellRecommendation[];
  }> {
    // Get user profile
    const userProfile = await getUserProfile(userId);

    // Get popular hotels in the city
    const popularHotels = await getPopularHotels(context.city || '', context.checkIn);

    // Score and rank hotels
    const scoredHotels = scoreHotels(popularHotels, userProfile, context);

    // Generate upsell recommendations
    const upsells = await generateUpsells(userId, userProfile);

    return {
      recommendedHotels: scoredHotels.slice(0, 10),
      upsells,
    };
  },

  /**
   * Calculate dynamic pricing for a hotel room
   */
  async getDynamicPricing(
    hotelId: string,
    roomTypeId: string,
    baseRate: number,
    checkIn: string,
    checkOut: string
  ): Promise<DynamicPricing> {
    // Calculate demand factor based on recent searches/bookings
    const demandFactor = await calculateDemandFactor(hotelId, checkIn, checkOut);

    // Calculate seasonality factor
    const seasonalityFactor = calculateSeasonality(new Date(checkIn));

    // Simulate competitor pricing factor
    const competitorFactor = 1 + (Math.random() - 0.5) * 0.1;

    // Calculate user segment factor (higher for business travelers)
    const userSegmentFactor = 1.1;

    // Calculate final multiplier
    const totalMultiplier = demandFactor * seasonalityFactor * competitorFactor * userSegmentFactor;
    const suggestedRate = Math.round(baseRate * totalMultiplier);
    const discountPercent = suggestedRate > baseRate ? 0 : Math.round((1 - suggestedRate / baseRate) * 100);

    return {
      baseRate,
      suggestedRate: Math.max(suggestedRate, Math.round(baseRate * 0.7)),
      discountPercent,
      reason: generatePricingReason(demandFactor, seasonalityFactor),
      factors: {
        demand: demandFactor,
        seasonality: seasonalityFactor,
        competitor: competitorFactor,
        userSegment: userSegmentFactor,
      },
    };
  },

  /**
   * Predict guest satisfaction based on stay events
   */
  async predictSatisfaction(
    bookingId: string,
    events: {
      checkInTime: number;
      serviceResponseTimes: number[];
      totalCharges: number;
      specialRequests: number;
      ratings?: number[];
    }
  ): Promise<SatisfactionPrediction> {
    let score = 85; // Base score

    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Check-in time factor
    if (events.checkInTime > 30) {
      score -= 10;
      riskFactors.push('Long check-in time');
      recommendations.push('Consider pre-registration or express check-in');
    }

    // Service response time factor
    const avgResponse = events.serviceResponseTimes.length > 0
      ? events.serviceResponseTimes.reduce((a, b) => a + b, 0) / events.serviceResponseTimes.length
      : 0;

    if (avgResponse > 15 * 60 * 1000) {
      score -= 15;
      riskFactors.push('Slow service response times');
      recommendations.push('Increase staff during peak hours');
    }

    // Charge amount factor
    if (events.totalCharges > 100000) {
      score += 5; // High spenders tend to be satisfied
    }

    // Special requests factor
    if (events.specialRequests > 3) {
      score += 5; // Engaged guests
    } else if (events.specialRequests === 0) {
      score -= 5;
      recommendations.push('Encourage guests to use services');
    }

    // Ratings factor
    if (events.ratings && events.ratings.length > 0) {
      const avgRating = events.ratings.reduce((a, b) => a + b, 0) / events.ratings.length;
      score = avgRating * 20; // Convert to 100 scale
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      riskFactors,
      recommendations,
      atRisk: score < 60,
    };
  },

  /**
   * Predict service request SLA based on hotel load
   */
  async predictSLA(
    hotelId: string,
    requestType: string
  ): Promise<SLAPrediction> {
    // Get current service request count
    const pendingRequests = await ServiceRequestEvent.countDocuments({
      hotelId,
      status: { $in: ['pending', 'in_progress'] },
      timestamp: {
        $gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    });

    // Base SLA times by service type (in minutes)
    const baseSLATimes: Record<string, number> = {
      room_service: 20,
      housekeeping: 30,
      laundry: 120,
      concierge: 15,
      checkout: 10,
    };

    const baseTimeMs = (baseSLATimes[requestType] || 30) * 60 * 1000;

    // Load factor (increase time based on pending requests)
    const loadFactor = 1 + pendingRequests * 0.05;
    const predictedTimeMs = Math.round(baseTimeMs * loadFactor);

    // Confidence decreases as load increases
    const confidence = Math.max(0.5, 1 - pendingRequests * 0.02);

    // Staff availability (simulated)
    const staffAvailable = Math.max(1, 5 - Math.floor(pendingRequests / 3));

    return {
      predictedTimeMs,
      confidence: Math.round(confidence * 100) / 100,
      currentLoad: Math.min(100, pendingRequests * 10),
      staffAvailable,
    };
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function getUserProfile(userId: string): Promise<UserProfile> {
  // Check cache
  const cached = userProfileCache.get(userId);
  if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
    return cached.profile;
  }

  // Build profile from events
  const bookings = await HotelBookingEvent.find({ userId })
    .sort({ timestamp: -1 })
    .limit(20);

  const serviceEvents = await ServiceRequestEvent.find({ userId })
    .sort({ timestamp: -1 })
    .limit(50);

  const preferences: UserProfile = {
    userId,
    preferredCities: [],
    preferredStarRatings: [],
    avgBookingValue: 0,
    totalBookings: bookings.length,
    preferredAmenities: [],
    dietaryPreferences: [],
    stayFrequency: 0,
    lastBookingDate: bookings[0]?.timestamp,
    serviceUsagePatterns: {},
  };

  if (bookings.length > 0) {
    const totalValue = bookings.reduce((sum, b) => sum + b.totalAmountPaise, 0);
    preferences.avgBookingValue = totalValue / bookings.length;
  }

  // Calculate stay frequency
  if (bookings.length >= 2) {
    const firstDate = bookings[bookings.length - 1].timestamp;
    const lastDate = bookings[0].timestamp;
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    preferences.stayFrequency = bookings.length / (daysDiff / 30); // bookings per month
  }

  // Service usage patterns
  serviceEvents.forEach((event) => {
    preferences.serviceUsagePatterns[event.requestType] =
      (preferences.serviceUsagePatterns[event.requestType] || 0) + 1;
  });

  // Cache the profile
  userProfileCache.set(userId, { profile: preferences, updatedAt: new Date() });

  return preferences;
}

async function getPopularHotels(city: string, checkIn?: string): Promise<unknown[]> {
  // Get hotels from search events in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const popularHotelIds = await HotelSearchEvent.aggregate([
    {
      $match: {
        city: new RegExp(city, 'i'),
        timestamp: { $gte: thirtyDaysAgo },
        selectedHotelId: { $exists: true },
      },
    },
    {
      $group: {
        _id: '$selectedHotelId',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  // Return mock hotel data (in production, fetch from hotel service)
  return popularHotelIds.map((h, i) => ({
    hotelId: h._id,
    hotelName: `Hotel ${i + 1} ${city}`,
    city,
    basePrice: 3000 + Math.random() * 5000,
    amenities: ['WiFi', 'Pool', 'Spa', 'Gym'],
    starRating: 3 + Math.floor(Math.random() * 3),
  }));
}

function scoreHotels(
  hotels: unknown[],
  userProfile: UserProfile,
  context: { budget?: number; guests?: number }
): HotelRecommendation[] {
  return hotels.map((hotel) => {
    let score = 50;

    // Price score
    if (hotel.basePrice <= (context.budget || 10000)) {
      score += 20;
    } else {
      score -= 20;
    }

    // User preference match (simulated)
    if (userProfile.preferredStarRatings.includes(hotel.starRating)) {
      score += 15;
    }

    // Popularity boost
    score += Math.random() * 15;

    // Budget fit
    const budgetFit = context.budget ? (hotel.basePrice / context.budget) * 100 : 50;
    score = score * (budgetFit / 100);

    return {
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      score: Math.round(score),
      reason: 'Based on your preferences and availability',
      amenities: hotel.amenities,
      basePrice: Math.round(hotel.basePrice),
    };
  }).sort((a, b) => b.score - a.score);
}

async function generateUpsells(
  userId: string,
  userProfile: UserProfile
): Promise<UpsellRecommendation[]> {
  const upsells: UpsellRecommendation[] = [];

  // Room upgrade recommendation
  if (userProfile.avgBookingValue > 500000) {
    upsells.push({
      type: 'room_upgrade',
      item: 'Executive Suite',
      description: 'Upgrade to our Executive Suite for a premium experience',
      estimatedValuePaise: 200000,
      conversionProbability: 0.3,
    });
  }

  // Service recommendation based on usage patterns
  const topService = Object.entries(userProfile.serviceUsagePatterns)
    .sort(([, a], [, b]) => b - a)[0];

  if (topService) {
    upsells.push({
      type: 'service',
      item: `${topService[0].replace('_', ' ')} package`,
      description: 'Pre-book our popular service for priority access',
      estimatedValuePaise: 50000,
      conversionProbability: 0.4,
    });
  }

  // Package recommendation
  upsells.push({
    type: 'package',
    item: 'Stay & Spa Package',
    description: 'Include daily spa access and late checkout',
    estimatedValuePaise: 150000,
    conversionProbability: 0.25,
  });

  return upsells;
}

async function calculateDemandFactor(
  hotelId: string,
  checkIn: string,
  checkOut: string
): Promise<number> {
  const checkInDate = new Date(checkIn);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Count searches and bookings for this date range
  const recentSearches = await HotelSearchEvent.countDocuments({
    city: { $exists: true },
    timestamp: { $gte: sevenDaysAgo },
  });

  const recentBookings = await HotelBookingEvent.countDocuments({
    hotelId,
    checkIn: checkIn,
    timestamp: { $gte: sevenDaysAgo },
  });

  // Calculate demand factor
  let demand = 1.0;
  if (recentSearches > 100) demand += 0.2;
  if (recentBookings > 10) demand += 0.1;

  return demand;
}

function calculateSeasonality(date: Date): number {
  const month = date.getMonth();

  // Peak seasons
  if (month >= 9 && month <= 11) return 1.3; // Oct-Dec
  if (month >= 3 && month <= 5) return 1.2; // Apr-Jun

  // Off seasons
  if (month === 1 || month === 2) return 0.8; // Feb-Mar
  if (month === 6 || month === 7) return 0.9; // Jul-Aug

  return 1.0;
}

function generatePricingReason(demand: number, seasonality: number): string {
  const reasons: string[] = [];

  if (demand > 1.2) reasons.push('high demand');
  else if (demand < 0.9) reasons.push('low demand');

  if (seasonality > 1.15) reasons.push('peak season');
  else if (seasonality < 0.9) reasons.push('off-season rates');

  return reasons.length > 0
    ? `Adjusted for ${reasons.join(' and ')}`
    : 'Standard pricing';
}
