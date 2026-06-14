/**
 * REZ Mind Hotel - User Knowledge Base Service
 *
 * Stores and manages user signals for personalization:
 * - User preference tracking
 * - Booking history analysis
 * - Behavioral signal aggregation
 * - Personalized recommendations
 *
 * Connects to unified knowledge base for cross-service data sharing
 */

import mongoose, { Schema, Document } from 'mongoose';
import axios from 'axios';

const KNOWLEDGE_SERVICE_URL = process.env.KNOWLEDGE_SERVICE_URL || 'http://localhost:4018';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface UserSignal {
  userId: string;
  eventType: string;
  eventData: object;
  timestamp: Date;
  source: string;
  context: {
    hotelId?: string;
    roomId?: string;
    bookingId?: string;
    location?: string;
    device?: string;
  };
}

export interface UserPreferences {
  roomType?: string;
  bedType?: string;
  floor?: string;
  smoking?: boolean;
  earlyCheckin?: boolean;
  lateCheckout?: boolean;
}

export interface UserHistory {
  bookings: number;
  avgStay: number;
  favoriteHotels: string[];
  favoriteCities: string[];
  avgRating: number;
}

export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  history: UserHistory;
  signals: UserSignal[];
}

// ─── Unified Knowledge Base Types ──────────────────────────────────────────────

export interface UniversalSignal {
  id: string;
  userId: string;
  type: string;
  action: string;
  data: Record<string, unknown>;
  source: string;
  timestamp: Date;
  context?: {
    hotelId?: string;
    roomId?: string;
    bookingId?: string;
    location?: string;
    device?: string;
  };
}

export interface HotelPreferences extends UserPreferences {
  dietaryRestrictions?: string[];
  amenities?: string[];
  loyaltyTier?: string;
}

// ─── Unified Knowledge Base Integration ──────────────────────────────────────

class UserKnowledgeIntegration {
  private knowledgeUrl: string;

  constructor(baseUrl: string = KNOWLEDGE_SERVICE_URL) {
    this.knowledgeUrl = baseUrl;
  }

  /**
   * Get user signals from unified knowledge base
   * Used by: Dynamic Pricing, Recommendations, Predictions
   */
  async getUserSignals(
    userId: string,
    options?: {
      type?: string;
      limit?: number;
      startDate?: Date;
    }
  ): Promise<UniversalSignal[]> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      if (options?.type) params.append('type', options.type);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.startDate) params.append('startDate', options.startDate.toISOString());

      const response = await axios.get<{ signals: UniversalSignal[] }>(
        `${this.knowledgeUrl}/signals?${params.toString()}`,
        { timeout: 5000 }
      );

      return response.data.signals || [];
    } catch (error) {
      // Fallback to local MongoDB data if unified service unavailable
      console.warn('Unified knowledge service unavailable, using local data:', error);
      return this.getLocalSignals(userId, options);
    }
  }

  /**
   * Get user signals from local MongoDB as fallback
   */
  private async getLocalSignals(
    userId: string,
    options?: {
      type?: string;
      limit?: number;
      startDate?: Date;
    }
  ): Promise<UniversalSignal[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.type) query.eventType = options.type;
    if (options?.startDate) query.timestamp = { $gte: options.startDate };

    const signals = await UserKnowledge.findOne({ userId })
      .select('signals')
      .lean();

    if (!signals) return [];

    let result = signals.signals as unknown as UniversalSignal[];

    if (options?.startDate) {
      result = result.filter(
        (s) => new Date(s.timestamp) >= options.startDate!
      );
    }

    return result.slice(0, options?.limit || 100);
  }

  /**
   * Get user preferences from unified knowledge base
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await axios.get<{ preferences: UserPreferences }>(
        `${this.knowledgeUrl}/preferences/${userId}`,
        { timeout: 5000 }
      );

      return response.data.preferences || {};
    } catch (error) {
      // Fallback to local MongoDB data
      console.warn('Unified knowledge service unavailable, using local preferences:', error);
      const doc = await UserKnowledge.findOne({ userId })
        .select('preferences')
        .lean();
      return doc?.preferences || {};
    }
  }

  /**
   * Update user profile based on hotel behavior
   */
  async updateHotelPreferences(
    userId: string,
    preferences: HotelPreferences
  ): Promise<void> {
    // Update local MongoDB first
    await UserKnowledge.findOneAndUpdate(
      { userId },
      {
        $set: {
          preferences: {
            ...preferences,
            updatedAt: new Date(),
          },
        },
      },
      { upsert: true }
    );

    // Sync to unified knowledge base
    try {
      await axios.put(
        `${this.knowledgeUrl}/preferences/${userId}`,
        {
          app: 'hotel',
          preferences,
        },
        { timeout: 5000 }
      );
    } catch (error) {
      console.warn('Failed to sync preferences to unified knowledge base:', error);
      // Don't throw - local update succeeded
    }
  }

  /**
   * Send hotel signal to unified knowledge base
   */
  async sendHotelSignal(
    userId: string,
    type: string,
    data: object
  ): Promise<void> {
    // Store locally first
    await userKnowledgeService.addSignal(userId, {
      eventType: type,
      eventData: data,
      timestamp: new Date(),
      source: 'rez-mind',
      context: data as UserSignal['context'],
    });

    // Sync to unified knowledge base
    try {
      await axios.post(
        `${this.knowledgeUrl}/signal`,
        {
          userId,
          type: 'hotel',
          action: type,
          data,
          source: 'rez-mind',
          timestamp: new Date().toISOString(),
        },
        { timeout: 5000 }
      );
    } catch (error) {
      console.warn('Failed to sync signal to unified knowledge base:', error);
      // Don't throw - local storage succeeded
    }
  }
}

// Export singleton instance
export const userKnowledgeIntegration = new UserKnowledgeIntegration();

// ─── MongoDB Schemas ──────────────────────────────────────────────────────────

export interface IUserSignalDocument extends Omit<UserSignal, 'timestamp'>, Document {
  timestamp: Date;
}

export interface IUserKnowledgeDocument extends Document {
  userId: string;
  preferences: UserPreferences;
  history: UserHistory;
  signals: IUserSignalDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSignalSchema = new Schema<IUserSignalDocument>({
  userId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  eventData: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, required: true, index: true },
  source: { type: String, required: true },
  context: {
    hotelId: String,
    roomId: String,
    bookingId: String,
    location: String,
    device: String,
  },
});

const UserKnowledgeSchema = new Schema<IUserKnowledgeDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    preferences: {
      roomType: String,
      bedType: String,
      floor: String,
      smoking: Boolean,
      earlyCheckin: Boolean,
      lateCheckout: Boolean,
    },
    history: {
      bookings: { type: Number, default: 0 },
      avgStay: { type: Number, default: 0 },
      favoriteHotels: { type: [String], default: [] },
      favoriteCities: { type: [String], default: [] },
      avgRating: { type: Number, default: 0 },
    },
    signals: [UserSignalSchema],
  },
  { timestamps: true }
);

// Indexes for efficient queries
UserKnowledgeSchema.index({ 'history.favoriteHotels': 1 });
UserKnowledgeSchema.index({ 'history.favoriteCities': 1 });
UserKnowledgeSchema.index({ signals: 1 });
UserKnowledgeSchema.index({ updatedAt: -1 });

export const UserKnowledge = mongoose.model<IUserKnowledgeDocument>(
  'UserKnowledge',
  UserKnowledgeSchema
);

// ─── In-Memory Cache ───────────────────────────────────────────────────────────

interface CacheEntry {
  profile: UserProfile;
  expiresAt: number;
}

const profileCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(userId: string): UserProfile | null {
  const entry = profileCache.get(userId);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.profile;
  }
  profileCache.delete(userId);
  return null;
}

function setCachedProfile(userId: string, profile: UserProfile): void {
  profileCache.set(userId, {
    profile,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function invalidateCache(userId: string): void {
  profileCache.delete(userId);
}

// ─── User Knowledge Service ────────────────────────────────────────────────────

export const userKnowledgeService = {
  /**
   * Add a new signal for a user
   */
  async addSignal(
    userId: string,
    signal: Omit<UserSignal, 'userId'>
  ): Promise<UserSignal> {
    const fullSignal: UserSignal = {
      ...signal,
      userId,
      timestamp: signal.timestamp || new Date(),
    };

    // Upsert user knowledge document
    const result = await UserKnowledge.findOneAndUpdate(
      { userId },
      {
        $push: {
          signals: {
            $each: [fullSignal],
            $position: 0, // Add to beginning for recent-first ordering
            $slice: 1000, // Keep only last 1000 signals
          },
        },
        $setOnInsert: {
          userId,
          preferences: {},
          history: {
            bookings: 0,
            avgStay: 0,
            favoriteHotels: [],
            favoriteCities: [],
            avgRating: 0,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Update history based on signal type
    await this.updateHistoryFromSignal(userId, fullSignal);

    // Invalidate cache
    invalidateCache(userId);

    return fullSignal;
  },

  /**
   * Get the complete user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    const cached = getCachedProfile(userId);
    if (cached) {
      return cached;
    }

    const doc = await UserKnowledge.findOne({ userId }).lean();

    if (!doc) {
      return null;
    }

    const profile: UserProfile = {
      userId: doc.userId,
      preferences: doc.preferences,
      history: doc.history,
      signals: doc.signals as UserSignal[],
    };

    // Cache the result
    setCachedProfile(userId, profile);

    return profile;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const doc = await UserKnowledge.findOneAndUpdate(
      { userId },
      {
        $set: {
          preferences: {
            ...preferences,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Invalidate cache
    invalidateCache(userId);

    return doc.preferences;
  },

  /**
   * Get personalization data for the user
   */
  async getPersonalization(userId: string): Promise<{
    userId: string;
    preferences: UserPreferences;
    history: UserHistory;
    segment: string;
    scoreFactors: Record<string, number>;
    lastUpdated: Date;
  }> {
    const profile = await this.getProfile(userId);

    if (!profile) {
      // Return default personalization for new users
      return {
        userId,
        preferences: {},
        history: {
          bookings: 0,
          avgStay: 0,
          favoriteHotels: [],
          favoriteCities: [],
          avgRating: 0,
        },
        segment: 'new_user',
        scoreFactors: {
          loyalty: 0,
          spend: 0,
          engagement: 0,
        },
        lastUpdated: new Date(),
      };
    }

    // Calculate user segment
    const segment = this.calculateUserSegment(profile);

    // Calculate score factors
    const scoreFactors = this.calculateScoreFactors(profile);

    return {
      userId,
      preferences: profile.preferences,
      history: profile.history,
      segment,
      scoreFactors,
      lastUpdated: new Date(),
    };
  },

  /**
   * Get recommendations based on user profile
   */
  async getRecommendations(userId: string): Promise<{
    hotels: Array<{
      hotelId: string;
      score: number;
      reason: string;
      matchFactors: string[];
    }>;
    services: Array<{
      serviceType: string;
      score: number;
      reason: string;
    }>;
    personalizationTips: string[];
  }> {
    const profile = await this.getProfile(userId);

    const hotelRecommendations: Array<{
      hotelId: string;
      score: number;
      reason: string;
      matchFactors: string[];
    }> = [];

    const serviceRecommendations: Array<{
      serviceType: string;
      score: number;
      reason: string;
    }> = [];

    const personalizationTips: string[] = [];

    if (!profile) {
      // Default recommendations for new users
      return {
        hotels: [],
        services: [
          { serviceType: 'room_service', score: 0.5, reason: 'Popular with new guests' },
          { serviceType: 'housekeeping', score: 0.5, reason: 'Standard service' },
          { serviceType: 'concierge', score: 0.3, reason: 'Get local recommendations' },
        ],
        personalizationTips: [
          'Book your first stay to unlock personalized recommendations',
          'Update your preferences to improve suggestions',
        ],
      };
    }

    // Analyze signals for recommendations
    const recentSignals = profile.signals.slice(0, 50);
    const signalTypes = new Map<string, number>();

    recentSignals.forEach((signal) => {
      signalTypes.set(signal.eventType, (signalTypes.get(signal.eventType) || 0) + 1);
    });

    // Hotel recommendations based on favorite cities
    profile.history.favoriteCities.forEach((city, index) => {
      hotelRecommendations.push({
        hotelId: `hotel_${city.toLowerCase().replace(/\s+/g, '_')}`,
        score: Math.max(0.9 - index * 0.1, 0.5),
        reason: `Based on your visits to ${city}`,
        matchFactors: ['city_preference', 'historical_booking'],
      });
    });

    // Hotel recommendations based on favorite hotels
    profile.history.favoriteHotels.forEach((hotelId, index) => {
      hotelRecommendations.push({
        hotelId,
        score: Math.max(0.95 - index * 0.05, 0.7),
        reason: 'You have enjoyed this hotel before',
        matchFactors: ['repeat_booking', 'high_satisfaction'],
      });
    });

    // Service recommendations based on preferences
    if (profile.preferences.earlyCheckin) {
      serviceRecommendations.push({
        serviceType: 'early_checkin',
        score: 0.9,
        reason: 'You prefer early check-in',
      });
    }

    if (profile.preferences.lateCheckout) {
      serviceRecommendations.push({
        serviceType: 'late_checkout',
        score: 0.9,
        reason: 'You prefer late check-out',
      });
    }

    // Service recommendations based on signal patterns
    if (signalTypes.has('room_service')) {
      serviceRecommendations.push({
        serviceType: 'room_service',
        score: 0.85,
        reason: 'Based on your ordering patterns',
      });
    }

    if (signalTypes.has('housekeeping')) {
      serviceRecommendations.push({
        serviceType: 'housekeeping',
        score: 0.8,
        reason: 'Regular housekeeping user',
      });
    }

    if (signalTypes.has('laundry')) {
      serviceRecommendations.push({
        serviceType: 'laundry',
        score: 0.75,
        reason: 'Based on past usage',
      });
    }

    // Generate personalization tips
    if (profile.history.bookings < 3) {
      personalizationTips.push('Book more stays to unlock better recommendations');
    }

    if (profile.history.favoriteCities.length < 2) {
      personalizationTips.push('Try hotels in different cities to discover new preferences');
    }

    if (Object.keys(profile.preferences).length < 3) {
      personalizationTips.push('Update your room preferences for more accurate matches');
    }

    if (profile.history.avgRating > 4) {
      personalizationTips.push('Your high ratings show you appreciate quality - consider premium options');
    }

    // Sort by score
    hotelRecommendations.sort((a, b) => b.score - a.score);
    serviceRecommendations.sort((a, b) => b.score - a.score);

    return {
      hotels: hotelRecommendations.slice(0, 10),
      services: serviceRecommendations.slice(0, 5),
      personalizationTips,
    };
  },

  // ─── Private Helper Methods ─────────────────────────────────────────────────

  /**
   * Update user history based on a signal
   */
  async updateHistoryFromSignal(userId: string, signal: UserSignal): Promise<void> {
    const updates: Record<string, unknown> = {};

    switch (signal.eventType) {
      case 'booking_completed':
        updates['history.bookings'] = await this.getBookingCount(userId);
        updates['history.avgStay'] = await this.calculateAvgStay(userId);
        if (signal.context.location) {
          updates['history.favoriteCities'] = signal.context.location;
        }
        if (signal.context.hotelId) {
          await this.updateFavoriteHotels(userId, signal.context.hotelId);
        }
        break;

      case 'rating_given':
        if (typeof signal.eventData === 'object' && 'rating' in signal.eventData) {
          updates['history.avgRating'] = await this.calculateAvgRating(userId);
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await UserKnowledge.updateOne({ userId }, { $set: updates });
    }
  },

  async getBookingCount(userId: string): Promise<number> {
    const count = await UserKnowledge.countDocuments({
      userId,
      signals: {
        $elemMatch: { eventType: 'booking_completed' },
      },
    });
    return count;
  },

  async calculateAvgStay(userId: string): Promise<number> {
    const doc = await UserKnowledge.findOne({ userId });
    if (!doc) return 0;

    const bookingSignals = doc.signals.filter((s) => s.eventType === 'booking_completed');
    if (bookingSignals.length < 2) return 0;

    const stays: number[] = [];
    for (const signal of bookingSignals) {
      const data = signal.eventData as { checkIn?: string; checkOut?: string };
      if (data.checkIn && data.checkOut) {
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        stays.push((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    if (stays.length === 0) return 0;
    return stays.reduce((a, b) => a + b, 0) / stays.length;
  },

  async updateFavoriteHotels(userId: string, hotelId: string): Promise<void> {
    const doc = await UserKnowledge.findOne({ userId });
    if (!doc) return;

    const favorites = [...doc.history.favoriteHotels];

    // Remove if already exists to avoid duplicates
    const existingIndex = favorites.indexOf(hotelId);
    if (existingIndex !== -1) {
      favorites.splice(existingIndex, 1);
    }

    // Add to beginning
    favorites.unshift(hotelId);

    // Keep only top 5
    const trimmed = favorites.slice(0, 5);

    await UserKnowledge.updateOne(
      { userId },
      { $set: { 'history.favoriteHotels': trimmed } }
    );
  },

  async calculateAvgRating(userId: string): Promise<number> {
    const doc = await UserKnowledge.findOne({ userId });
    if (!doc) return 0;

    const ratingSignals = doc.signals.filter((s) => s.eventType === 'rating_given');
    if (ratingSignals.length === 0) return 0;

    let totalRating = 0;
    let count = 0;

    for (const signal of ratingSignals) {
      const data = signal.eventData as { rating?: number };
      if (data.rating) {
        totalRating += data.rating;
        count++;
      }
    }

    return count > 0 ? totalRating / count : 0;
  },

  /**
   * Calculate user segment based on profile
   */
  calculateUserSegment(profile: UserProfile): string {
    const { history } = profile;
    const { bookings, avgStay } = history;

    if (bookings === 0) return 'new_user';
    if (bookings >= 10) return 'loyal_customer';
    if (avgStay >= 7) return 'long_stay_traveler';
    if (history.avgRating >= 4.5) return 'quality_seeker';
    if (bookings >= 3 && bookings < 10) return 'returning_customer';

    return 'occasional_traveler';
  },

  /**
   * Calculate score factors for personalization
   */
  calculateScoreFactors(profile: UserProfile): Record<string, number> {
    const { history, signals } = profile;
    const { bookings } = history;

    // Loyalty score (0-100)
    const loyalty = Math.min(bookings * 10, 100);

    // Spend score based on average rating and bookings
    const spend = Math.min(history.avgRating * 20 + bookings * 5, 100);

    // Engagement score based on recent signal activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignals = signals.filter((s) => s.timestamp > thirtyDaysAgo);
    const engagement = Math.min(recentSignals.length * 5, 100);

    return {
      loyalty: Math.round(loyalty),
      spend: Math.round(spend),
      engagement: Math.round(engagement),
    };
  },
};

export default userKnowledgeService;
