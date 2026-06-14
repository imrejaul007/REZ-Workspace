/**
 * REZ Mind Hotel Recommendations Engine
 *
 * AI-powered recommendation engine that powers StayOwn's "For You" section:
 * - Personalized hotel recommendations based on user behavior and preferences
 * - Upsell recommendations for active bookings
 * - Rebooking prediction to drive repeat bookings
 *
 * Uses collaborative filtering and content-based approaches:
 * - User signals: search history, bookings, service usage
 * - User preferences: star ratings, amenities, price range
 * - Similar users: guests with similar behavior patterns
 * - Hotel rankings: popularity, ratings, availability
 */

import {
  HotelSearchEvent,
  HotelBookingEvent,
  ServiceRequestEvent,
  CheckoutEvent,
  GuestPreference,
} from '../models/event-schemas';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Recommendation {
  hotelId: string;
  hotelName: string;
  city: string;
  score: number;
  scoreBreakdown: {
    preference: number;
    popularity: number;
    similarity: number;
    budget: number;
  };
  reason: string;
  amenities: string[];
  basePricePaise: number;
  discountedPricePaise?: number;
  starRating: number;
  matchFactors: string[];
}

export interface Upsell {
  type: 'room_upgrade' | 'service' | 'package' | 'amenity';
  itemId: string;
  itemName: string;
  description: string;
  pricePaise: number;
  conversionProbability: number;
  reason: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface RebookingPrediction {
  willRebook: boolean;
  probability: number;
  confidence: number;
  recommendedHotels: string[];
  recommendedCities: string[];
  optimalTimingDays: number;
  factors: {
    loyaltyScore: number;
    stayFrequencyScore: number;
    recentSatisfactionScore: number;
    searchActivityScore: number;
  };
}

export interface UserSignals {
  searchCount: number;
  bookingCount: number;
  totalSpentPaise: number;
  avgBookingValuePaise: number;
  citiesVisited: string[];
  hotelsVisited: string[];
  preferredStarRatings: number[];
  preferredAmenities: string[];
  serviceUsageCounts: Record<string, number>;
  lastBookingDate?: Date;
  lastSearchDate?: Date;
}

export interface RecommendationContext {
  city?: string;
  checkIn?: Date;
  checkOut?: Date;
  budget?: number;
  guests?: number;
}

// ─── Cache ─────────────────────────────────────────────────────────────────────

interface SimilarUser {
  userId: string;
  similarity: number;
  commonHotels: string[];
}

const userSignalsCache = new Map<string, { signals: UserSignals; updatedAt: Date }>();
const similarUsersCache = new Map<string, { users: SimilarUser[]; updatedAt: Date }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Recommendations Engine ─────────────────────────────────────────────────────

export const recommendationsEngine = {
  /**
   * Get personalized recommendations for a user
   *
   * Algorithm:
   * 1. Collect user signals (searches, bookings, service usage)
   * 2. Build user preference profile
   * 3. Find similar users (collaborative filtering)
   * 4. Get hotel rankings (popularity-based)
   * 5. Apply personalization scoring
   * 6. Return ranked list with explanations
   */
  async getRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<{
    recommendations: Recommendation[];
    signalSummary: UserSignals;
  }> {
    // Step 1: Get user signals
    const signals = await this.getUserSignals(userId);

    // Step 2: Get user preferences (explicit + implicit)
    const preferences = await this.getUserPreferences(userId);

    // Step 3: Find similar users
    const similarUsers = await this.findSimilarUsers(userId, signals);

    // Step 4: Get hotel rankings
    const rankedHotels = await this.getHotelRankings(context);

    // Step 5: Apply personalization scoring
    const recommendations = await this.scoreAndRankHotels(
      rankedHotels,
      signals,
      preferences,
      similarUsers,
      context
    );

    return {
      recommendations: recommendations.slice(0, 10),
      signalSummary: signals,
    };
  },

  /**
   * Get upsell recommendations for an active booking
   *
   * Algorithm:
   * 1. Get booking details and user history
   * 2. Analyze user preferences and service usage patterns
   * 3. Generate contextual upsell options
   * 4. Rank by conversion probability and value
   */
  async getUpsells(bookingId: string): Promise<{
    upsells: Upsell[];
    bookingContext: {
      hotelId: string;
      roomTypeId: string;
      checkIn: Date;
      checkOut: Date;
      totalAmountPaise: number;
    };
  }> {
    // Step 1: Get booking details
    const booking = await HotelBookingEvent.findOne({ bookingId });
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    // Step 2: Get user preferences
    const userPrefs = await this.getUserPreferences(booking.userId);
    const signals = await this.getUserSignals(booking.userId);

    // Step 3: Generate upsell options
    const upsells = this.generateUpsellOptions(
      booking,
      userPrefs,
      signals
    );

    // Step 4: Rank upsells by conversion probability
    upsells.sort((a, b) => b.conversionProbability - a.conversionProbability);

    return {
      upsells,
      bookingContext: {
        hotelId: booking.hotelId,
        roomTypeId: booking.roomTypeId,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        totalAmountPaise: booking.totalAmountPaise,
      },
    };
  },

  /**
   * Predict likelihood of user rebooking and recommend next hotels
   *
   * Algorithm:
   * 1. Calculate loyalty score (tenure, frequency, spend)
   * 2. Calculate satisfaction score (from past bookings)
   * 3. Analyze recent search activity
   * 4. Generate rebooking probability
   * 5. Recommend next destinations based on patterns
   */
  async predictRebooking(userId: string): Promise<RebookingPrediction> {
    // Get user signals
    const signals = await this.getUserSignals(userId);

    // Get checkout events for satisfaction analysis
    const checkouts = await CheckoutEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5);

    // Get recent search activity
    const recentSearches = await HotelSearchEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Calculate individual scores
    const loyaltyScore = this.calculateLoyaltyScore(signals);
    const stayFrequencyScore = this.calculateStayFrequencyScore(signals);
    const satisfactionScore = this.calculateSatisfactionScore(checkouts);
    const searchActivityScore = this.calculateSearchActivityScore(recentSearches);

    // Calculate overall probability
    const probability = Math.min(0.95,
      (loyaltyScore * 0.25) +
      (stayFrequencyScore * 0.25) +
      (satisfactionScore * 0.30) +
      (searchActivityScore * 0.20)
    );

    // Calculate confidence based on data availability
    const dataPoints = signals.bookingCount + signals.searchCount;
    const confidence = Math.min(0.95, 0.5 + (dataPoints * 0.02));

    // Get recommended hotels based on user patterns
    const recommendedHotels = await this.getRecommendedHotelsForRebooking(signals, recentSearches);
    const recommendedCities = this.getRecommendedCities(signals, recentSearches);

    // Calculate optimal timing
    const optimalTimingDays = this.calculateOptimalTiming(signals);

    return {
      willRebook: probability > 0.5,
      probability: Math.round(probability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      recommendedHotels,
      recommendedCities,
      optimalTimingDays,
      factors: {
        loyaltyScore: Math.round(loyaltyScore * 100) / 100,
        stayFrequencyScore: Math.round(stayFrequencyScore * 100) / 100,
        recentSatisfactionScore: Math.round(satisfactionScore * 100) / 100,
        searchActivityScore: Math.round(searchActivityScore * 100) / 100,
      },
    };
  },

  // ─── Core Methods ─────────────────────────────────────────────────────────────

  /**
   * Collect user signals from event data
   */
  async getUserSignals(userId: string): Promise<UserSignals> {
    // Check cache
    const cached = userSignalsCache.get(userId);
    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
      return cached.signals;
    }

    // Fetch events in parallel
    const [searches, bookings, services, checkouts] = await Promise.all([
      HotelSearchEvent.find({ userId }).sort({ timestamp: -1 }).limit(100),
      HotelBookingEvent.find({ userId }).sort({ timestamp: -1 }).limit(50),
      ServiceRequestEvent.find({ userId }).limit(100),
      CheckoutEvent.find({ userId }).sort({ timestamp: -1 }).limit(20),
    ]);

    const signals: UserSignals = {
      searchCount: searches.length,
      bookingCount: bookings.length,
      totalSpentPaise: 0,
      avgBookingValuePaise: 0,
      citiesVisited: [],
      hotelsVisited: [],
      preferredStarRatings: [],
      preferredAmenities: [],
      serviceUsageCounts: {},
      lastBookingDate: bookings[0]?.timestamp,
      lastSearchDate: searches[0]?.timestamp,
    };

    // Calculate spending
    if (bookings.length > 0) {
      signals.totalSpentPaise = bookings.reduce((sum, b) => sum + b.totalAmountPaise, 0);
      signals.avgBookingValuePaise = signals.totalSpentPaise / bookings.length;
    }

    // Extract cities and hotels
    const citySet = new Set<string>();
    const hotelSet = new Set<string>();

    bookings.forEach((b) => {
      if (b.hotelId) hotelSet.add(b.hotelId);
    });

    searches.forEach((s) => {
      if (s.city) citySet.add(s.city.toLowerCase());
    });

    signals.citiesVisited = Array.from(citySet);
    signals.hotelsVisited = Array.from(hotelSet);

    // Count service usage
    services.forEach((s) => {
      signals.serviceUsageCounts[s.requestType] =
        (signals.serviceUsageCounts[s.requestType] || 0) + 1;
    });

    // Determine preferred star ratings (from booking data - simplified)
    if (bookings.length >= 3) {
      signals.preferredStarRatings = [4, 5]; // Higher-rated hotels
    } else if (bookings.length >= 1) {
      signals.preferredStarRatings = [3, 4];
    }

    // Determine preferred amenities based on service usage
    if (signals.serviceUsageCounts['room_service'] > 2) {
      signals.preferredAmenities.push('restaurant');
    }
    if (signals.serviceUsageCounts['housekeeping'] > 2) {
      signals.preferredAmenities.push('daily_cleaning');
    }

    // Cache signals
    userSignalsCache.set(userId, { signals, updatedAt: new Date() });

    return signals;
  },

  /**
   * Get explicit and implicit user preferences
   */
  async getUserPreferences(userId: string): Promise<{
    explicitPrefs;
    implicitPrefs: {
      priceRange: { min: number; max: number };
      preferredCities: string[];
      preferredAmenities: string[];
    };
  }> {
    const guestPref = await GuestPreference.findOne({ userId });

    const explicitPrefs = guestPref?.preferences || null;

    // Derive implicit preferences from behavior
    const signals = await this.getUserSignals(userId);

    const avgPrice = signals.avgBookingValuePaise;
    const implicitPrefs = {
      priceRange: {
        min: Math.max(0, avgPrice * 0.7),
        max: avgPrice * 1.5,
      },
      preferredCities: signals.citiesVisited.slice(0, 5),
      preferredAmenities: signals.preferredAmenities,
    };

    return { explicitPrefs, implicitPrefs };
  },

  /**
   * Find users with similar behavior patterns (collaborative filtering)
   */
  async findSimilarUsers(
    userId: string,
    userSignals: UserSignals,
    limit: number = 20
  ): Promise<SimilarUser[]> {
    // Check cache
    const cached = similarUsersCache.get(userId);
    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
      return cached.users.slice(0, limit);
    }

    // Find users with similar booking patterns
    const similarUsers: SimilarUser[] = [];

    // Get users who booked the same hotels
    for (const hotelId of userSignals.hotelsVisited.slice(0, 5)) {
      const otherBookings = await HotelBookingEvent.find({
        hotelId,
        userId: { $ne: userId },
      })
        .sort({ timestamp: -1 })
        .limit(20);

      otherBookings.forEach((booking) => {
        const existing = similarUsers.find((u) => u.userId === booking.userId);
        if (existing) {
          existing.similarity += 1;
          if (!existing.commonHotels.includes(hotelId)) {
            existing.commonHotels.push(hotelId);
          }
        } else {
          similarUsers.push({
            userId: booking.userId,
            similarity: 1,
            commonHotels: [hotelId],
          });
        }
      });
    }

    // Sort by similarity and normalize
    similarUsers.sort((a, b) => b.similarity - a.similarity);

    const maxSimilarity = similarUsers[0]?.similarity || 1;
    const normalized = similarUsers.slice(0, 50).map((u) => ({
      ...u,
      similarity: u.similarity / maxSimilarity,
    }));

    // Cache
    similarUsersCache.set(userId, { users: normalized, updatedAt: new Date() });

    return normalized.slice(0, limit);
  },

  /**
   * Get ranked hotels based on popularity and relevance
   */
  async getHotelRankings(context: RecommendationContext): Promise<Array<{
    hotelId: string;
    hotelName: string;
    city: string;
    basePricePaise: number;
    starRating: number;
    amenities: string[];
    popularityScore: number;
  }>> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get popular hotels from searches and bookings
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
          ...(context.city ? { city: new RegExp(context.city, 'i') } : {}),
        },
      },
      {
        $facet: {
          fromSearches: [
            {
              $group: {
                _id: '$selectedHotelId',
                searchCount: { $sum: 1 },
              },
            },
          ],
          fromBookings: [
            {
              $group: {
                _id: '$hotelId',
                bookingCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          combined: {
            $concatArrays: ['$fromSearches', '$fromBookings'],
          },
        },
      },
      {
        $unwind: '$combined',
      },
      {
        $group: {
          _id: '$combined._id',
          popularityScore: {
            $sum: [
              { $ifNull: ['$combined.searchCount', 0] },
              { $multiply: [{ $ifNull: ['$combined.bookingCount', 0] }, 3] },
            ],
          },
        },
      },
      { $sort: { popularityScore: -1 } },
      { $limit: 50 },
    ];

    const popularHotels = await HotelSearchEvent.aggregate(pipeline as unknown);

    // Generate hotel data (in production, fetch from hotel service)
    return popularHotels.map((h, index) => ({
      hotelId: h._id || `hotel_${index}`,
      hotelName: `Hotel ${index + 1}`,
      city: context.city || 'Unknown',
      basePricePaise: 300000 + Math.random() * 500000, // 3000-8000 INR in paise
      starRating: 3 + Math.floor(Math.random() * 3),
      amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'],
      popularityScore: h.popularityScore,
    }));
  },

  /**
   * Score and rank hotels using personalized scoring
   */
  async scoreAndRankHotels(
    hotels: Array<{
      hotelId: string;
      hotelName: string;
      city: string;
      basePricePaise: number;
      starRating: number;
      amenities: string[];
      popularityScore: number;
    }>,
    signals: UserSignals,
    preferences: { explicitPrefs; implicitPrefs: unknown },
    similarUsers: SimilarUser[],
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const maxPopularity = Math.max(...hotels.map((h) => h.popularityScore), 1);

    return hotels.map((hotel) => {
      const scoreBreakdown = {
        preference: 0,
        popularity: 0,
        similarity: 0,
        budget: 0,
      };

      // Preference score (20 points max)
      if (signals.preferredStarRatings.includes(hotel.starRating)) {
        scoreBreakdown.preference += 10;
      }
      if (signals.preferredAmenities.some((a) => hotel.amenities.includes(a))) {
        scoreBreakdown.preference += 5;
      }
      if (preferences.implicitPrefs.preferredCities.includes(hotel.city.toLowerCase())) {
        scoreBreakdown.preference += 5;
      }

      // Popularity score (25 points max)
      scoreBreakdown.popularity = (hotel.popularityScore / maxPopularity) * 25;

      // Similar users score (25 points max)
      const similarHotelCount = similarUsers.reduce(
        (sum, user) => sum + (user.commonHotels.includes(hotel.hotelId) ? user.similarity : 0),
        0
      );
      scoreBreakdown.similarity = Math.min(25, similarHotelCount * 5);

      // Budget score (30 points max)
      const userBudget = context.budget ? context.budget * 100 : signals.avgBookingValuePaise;
      const priceRatio = hotel.basePricePaise / userBudget;
      if (priceRatio <= 0.8) {
        scoreBreakdown.budget = 30;
      } else if (priceRatio <= 1.0) {
        scoreBreakdown.budget = 25;
      } else if (priceRatio <= 1.2) {
        scoreBreakdown.budget = 15;
      } else {
        scoreBreakdown.budget = 5;
      }

      // Calculate total score
      const totalScore =
        scoreBreakdown.preference +
        scoreBreakdown.popularity +
        scoreBreakdown.similarity +
        scoreBreakdown.budget;

      // Generate match factors
      const matchFactors: string[] = [];
      if (scoreBreakdown.preference > 15) matchFactors.push('Matches your preferences');
      if (scoreBreakdown.popularity > 15) matchFactors.push('Popular choice');
      if (scoreBreakdown.similarity > 15) matchFactors.push('Recommended by similar guests');
      if (scoreBreakdown.budget > 20) matchFactors.push('Great value');

      // Generate reason
      const reason = this.generateRecommendationReason(scoreBreakdown, matchFactors);

      // Calculate discount if applicable
      let discountedPricePaise: number | undefined;
      if (hotel.basePricePaise > signals.avgBookingValuePaise * 1.3) {
        discountedPricePaise = Math.round(signals.avgBookingValuePaise);
      }

      return {
        hotelId: hotel.hotelId,
        hotelName: hotel.hotelName,
        city: hotel.city,
        score: Math.round(totalScore * 10) / 10,
        scoreBreakdown,
        reason,
        amenities: hotel.amenities,
        basePricePaise: Math.round(hotel.basePricePaise),
        discountedPricePaise,
        starRating: hotel.starRating,
        matchFactors,
      };
    }).sort((a, b) => b.score - a.score);
  },

  /**
   * Generate upsell options for a booking
   */
  generateUpsellOptions(
    booking: InstanceType<typeof HotelBookingEvent>,
    userPrefs: { explicitPrefs; implicitPrefs: unknown },
    signals: UserSignals
  ): Upsell[] {
    const upsells: Upsell[] = [];
    const bookingDate = new Date(booking.checkIn);
    const daysUntilCheckIn = Math.max(0, Math.ceil((bookingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // Room upgrade upsells
    if (signals.avgBookingValuePaise > 400000) {
      upsells.push({
        type: 'room_upgrade',
        itemId: 'upgrade_suite',
        itemName: 'Executive Suite Upgrade',
        description: 'Upgrade to our Executive Suite with panoramic city views, separate living area, and premium amenities.',
        pricePaise: 150000,
        conversionProbability: 0.35,
        reason: 'Based on your typical booking value, you may enjoy our premium suites.',
        urgency: daysUntilCheckIn < 3 ? 'high' : 'medium',
      });
    }

    // Late checkout upsell
    upsells.push({
      type: 'amenity',
      itemId: 'late_checkout',
      itemName: 'Late Checkout (2 PM)',
      description: 'Extend your stay and enjoy a relaxed departure without morning rush.',
      pricePaise: 25000,
      conversionProbability: 0.45,
      reason: 'Add flexibility to your departure.',
      urgency: 'low',
    });

    // Service-based upsells
    if (signals.serviceUsageCounts['room_service'] > 2) {
      upsells.push({
        type: 'service',
        itemId: 'dining_credit',
        itemName: 'Rs. 500 Dining Credit',
        description: 'Pre-loaded credit for our award-winning restaurant and room service.',
        pricePaise: 45000,
        conversionProbability: 0.40,
        reason: 'You frequently use our dining services.',
        urgency: 'low',
      });
    }

    // Spa package upsell
    upsells.push({
      type: 'package',
      itemId: 'spa_package',
      itemName: 'Relaxation Spa Package',
      description: '60-minute full body massage, access to steam room, and complimentary mocktail.',
      pricePaise: 80000,
      conversionProbability: 0.30,
      reason: 'Enhance your stay with relaxation.',
      urgency: 'medium',
    });

    // Airport transfer upsell
    upsells.push({
      type: 'amenity',
      itemId: 'airport_transfer',
      itemName: 'Premium Airport Transfer',
      description: 'Luxury vehicle pickup and drop-off with meet & greet service.',
      pricePaise: 35000,
      conversionProbability: 0.25,
      reason: 'Travel in comfort.',
      urgency: 'low',
    });

    // Early check-in upsell (if check-in is soon)
    if (daysUntilCheckIn < 2) {
      upsells.push({
        type: 'amenity',
        itemId: 'early_checkin',
        itemName: 'Early Check-in (10 AM)',
        description: 'Arrive early and start enjoying your stay right away.',
        pricePaise: 30000,
        conversionProbability: 0.50,
        reason: 'Limited availability for early check-in.',
        urgency: 'high',
      });
    }

    return upsells;
  },

  // ─── Helper Methods ─────────────────────────────────────────────────────────────

  generateRecommendationReason(
    scoreBreakdown: { preference: number; popularity: number; similarity: number; budget: number },
    matchFactors: string[]
  ): string {
    const topFactors = Object.entries(scoreBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    const reasons: string[] = [];

    for (const [factor, score] of topFactors) {
      if (score > 15) {
        switch (factor) {
          case 'preference':
            reasons.push('strongly matches your preferences');
            break;
          case 'popularity':
            reasons.push('popular among travelers');
            break;
          case 'similarity':
            reasons.push('favored by guests like you');
            break;
          case 'budget':
            reasons.push('excellent value for money');
            break;
        }
      }
    }

    return reasons.length > 0
      ? reasons.join(' and ')
      : 'Recommended based on availability';
  },

  calculateLoyaltyScore(signals: UserSignals): number {
    // Based on tenure (bookings) and total spend
    const bookingScore = Math.min(1, signals.bookingCount / 10);
    const spendScore = Math.min(1, signals.totalSpentPaise / 5000000); // 50K INR threshold
    return (bookingScore * 0.6 + spendScore * 0.4);
  },

  calculateStayFrequencyScore(signals: UserSignals): number {
    if (signals.bookingCount < 2) return 0;

    // Calculate average days between bookings
    if (!signals.lastBookingDate) return 0;

    // Simplified: higher booking count = higher frequency score
    const frequencyScore = Math.min(1, signals.bookingCount / 12); // 12 bookings = max
    return frequencyScore;
  },

  calculateSatisfactionScore(checkouts: InstanceType<typeof CheckoutEvent>[]): number {
    if (checkouts.length === 0) return 0.5; // Default neutral

    // Check for any negative indicators (simplified)
    const negativeCount = checkouts.filter(
      (c) => c.paymentStatus === 'failed' || c.serviceChargesPaise > c.roomChargesPaise * 0.5
    ).length;

    // Base satisfaction score
    const baseScore = 0.8 - (negativeCount * 0.1);
    return Math.max(0.3, Math.min(1, baseScore));
  },

  calculateSearchActivityScore(
    searches: InstanceType<typeof HotelSearchEvent>[]
  ): number {
    if (searches.length === 0) return 0;

    // More recent searches = higher activity
    const mostRecent = searches[0];
    const daysSinceLastSearch = Math.ceil(
      (Date.now() - mostRecent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSearch > 14) return 0;
    if (daysSinceLastSearch > 7) return 0.3;
    if (daysSinceLastSearch > 3) return 0.6;
    return 0.9;
  },

  async getRecommendedHotelsForRebooking(
    signals: UserSignals,
    recentSearches: InstanceType<typeof HotelSearchEvent>[]
  ): Promise<string[]> {
    // Get hotels from recent searches (potential next destinations)
    const searchHotelIds = recentSearches
      .filter((s) => s.selectedHotelId)
      .map((s) => s.selectedHotelId as string);

    // Add hotels from cities user has visited
    const visitedHotels = signals.hotelsVisited;

    // Combine and deduplicate
    const allHotels = [...new Set([...searchHotelIds, ...visitedHotels])];

    return allHotels.slice(0, 5);
  },

  getRecommendedCities(
    signals: UserSignals,
    recentSearches: InstanceType<typeof HotelSearchEvent>[]
  ): string[] {
    // Cities from recent searches (new destinations)
    const searchedCities = recentSearches
      .filter((s) => s.city && !signals.citiesVisited.includes(s.city.toLowerCase()))
      .map((s) => s.city as string);

    // Add some popular alternatives (in production, use ML model)
    const popularCities = ['Mumbai', 'Bangalore', 'Goa', 'Jaipur', 'Kerala'];

    // Combine and deduplicate
    const allCities = [...new Set([...searchedCities, ...signals.citiesVisited.slice(0, 2), ...popularCities.slice(0, 2)])];

    return allCities.slice(0, 5);
  },

  calculateOptimalTiming(signals: UserSignals): number {
    if (signals.bookingCount < 2) return 30; // Default 30 days

    // Calculate average stay interval
    const avgIntervalDays = 90; // Simplified: assume quarterly stays
    return avgIntervalDays;
  },
};
