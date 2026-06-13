import { v4 as uuidv4 } from 'uuid';
import { GuestTwinModel, IGuestTwin } from '../models/index.js';
import { getEventEmitter, TwinEventType, type GuestCheckInEvent, type GuestCheckOutEvent } from '../events/index.js';
import {
  CreateGuestTwinRequest,
  UpdatePreferencesRequest,
  UpdateSentimentRequest,
  CheckInRequest,
  CheckOutRequest,
  GuestTwin,
} from '../schemas/index.js';

// ============================================================================
// GUEST TWIN SERVICE
// ============================================================================

export interface GuestTwinQuery {
  property_id?: string;
  'loyalty.tier'?: string;
  'sentiment.trend'?: string;
  'lifetime_value.churn_risk'?: string;
  page?: number;
  limit?: number;
}

export interface GuestTwinStats {
  total: number;
  by_tier: Record<string, number>;
  by_sentiment_trend: Record<string, number>;
  avg_sentiment_score: number;
  avg_clv: number;
}

export class GuestTwinService {
  private eventEmitter = getEventEmitter();

  /**
   * Create a new guest twin
   */
  async create(data: CreateGuestTwinRequest): Promise<GuestTwin> {
    // Check if guest already exists
    const existing = await GuestTwinModel.findOne({ guest_id: data.guest_id });
    if (existing) {
      throw new Error(`Guest twin already exists for guest_id: ${data.guest_id}`);
    }

    const twin_id = `twin.hotel.guest.${data.guest_id}`;
    const now = new Date();

    const guestTwin = new GuestTwinModel({
      ...data,
      twin_id,
      loyalty: {
        tier: 'bronze',
        points_balance: 0,
        total_stays: 0,
        total_spend: 0,
        ...data.loyalty,
      },
      preferences: {
        room: {},
        dining: { dietary_restrictions: [], allergies: [], favorite_items: [], beverage_preferences: [] },
        amenities: { spa_interests: [], fitness_habits: false, pool_usage: false, business_amenities: [] },
        communication: { preferred_channel: 'email', opt_ins: [] },
        ...data.preferences,
      },
      stay_patterns: {
        seasonal_patterns: [],
        ...data.stay_patterns,
      },
      sentiment: {
        current_score: 50,
        trend: 'stable',
        key_topics: [],
        ...data.sentiment,
      },
      lifetime_value: {
        clv: 0,
        potential_clv: 0,
        churn_risk: 'low',
        recommendation_eligibility: true,
        ...data.lifetime_value,
      },
      current_stay: {
        adults: 1,
        children: 0,
        special_requests: [],
        ...data.current_stay,
      },
      stay_history: [],
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await guestTwin.save();

    // Emit event
    await this.eventEmitter.emit(TwinEventType.GUEST_TWIN_CREATED, twin_id, 'guest', {
      guest_id: data.guest_id,
      profile: data.profile,
      property_id: data.property_id,
    });

    return this.toGuestTwin(guestTwin);
  }

  /**
   * Get guest twin by ID
   */
  async getById(guest_id: string): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ guest_id });
    if (!twin) return null;
    return this.toGuestTwin(twin);
  }

  /**
   * Get guest twin by twin_id
   */
  async getByTwinId(twin_id: string): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ twin_id });
    if (!twin) return null;
    return this.toGuestTwin(twin);
  }

  /**
   * List guest twins with pagination and filters
   */
  async list(query: GuestTwinQuery = {}): Promise<{ twins: GuestTwin[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.property_id) filter.property_id = query.property_id;
    if (query['loyalty.tier']) filter['loyalty.tier'] = query['loyalty.tier'];
    if (query['sentiment.trend']) filter['sentiment.trend'] = query['sentiment.trend'];
    if (query['lifetime_value.churn_risk']) filter['lifetime_value.churn_risk'] = query['lifetime_value.churn_risk'];

    const [twins, total] = await Promise.all([
      GuestTwinModel.find(filter).skip(skip).limit(limit).sort({ updated_at: -1 }),
      GuestTwinModel.countDocuments(filter),
    ]);

    return {
      twins: twins.map(t => this.toGuestTwin(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update guest twin
   */
  async update(guest_id: string, data: Partial<GuestTwin>): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOneAndUpdate(
      { guest_id },
      {
        $set: {
          ...data,
          version: data.version ? data.version + 1 : undefined,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(TwinEventType.GUEST_TWIN_UPDATED, twin.twin_id, 'guest', {
      guest_id,
      ...data,
    });

    return this.toGuestTwin(twin);
  }

  /**
   * Update guest preferences
   */
  async updatePreferences(guest_id: string, data: UpdatePreferencesRequest): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ guest_id });
    if (!twin) return null;

    const updateData: Record<string, any> = {};
    const changedFields: string[] = [];

    if (data.merge) {
      // Merge with existing preferences
      Object.keys(data.preferences).forEach(category => {
        const categoryData = data.preferences[category as keyof typeof data.preferences];
        if (categoryData && typeof categoryData === 'object') {
          Object.keys(categoryData).forEach(field => {
            const value = (categoryData as any)[field];
            if (value !== undefined) {
              updateData[`preferences.${category}.${field}`] = value;
              changedFields.push(`${category}.${field}`);
            }
          });
        }
      });
    } else {
      // Replace entire preferences
      updateData.preferences = data.preferences;
      changedFields.push('*');
    }

    const updated = await GuestTwinModel.findOneAndUpdate(
      { guest_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.GUEST_PREFERENCES_UPDATED, twin.twin_id, 'guest', {
      guest_id,
      preferences: data.preferences,
      changed_fields: changedFields,
    });

    return this.toGuestTwin(updated);
  }

  /**
   * Update guest sentiment
   */
  async updateSentiment(guest_id: string, data: UpdateSentimentRequest): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ guest_id });
    if (!twin) return null;

    // Calculate trend based on previous score
    const previousScore = twin.sentiment.current_score;
    const newScore = data.score;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';

    if (newScore > previousScore + 5) {
      trend = 'improving';
    } else if (newScore < previousScore - 5) {
      trend = 'declining';
    }

    const updated = await GuestTwinModel.findOneAndUpdate(
      { guest_id },
      {
        $set: {
          'sentiment.current_score': data.score,
          'sentiment.trend': trend,
          'sentiment.last_feedback_date': data.feedback_date ? new Date(data.feedback_date) : new Date(),
          'sentiment.key_topics': data.topics || twin.sentiment.key_topics,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.GUEST_SENTIMENT_UPDATED, twin.twin_id, 'guest', {
      guest_id,
      previous_score: previousScore,
      new_score: newScore,
      trend,
    });

    return this.toGuestTwin(updated);
  }

  /**
   * Process guest check-in
   */
  async checkIn(guest_id: string, data: CheckInRequest): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ guest_id });
    if (!twin) {
      throw new Error(`Guest twin not found: ${guest_id}`);
    }

    // If already checked in, checkout first
    if (twin.current_stay.room_id) {
      throw new Error(`Guest ${guest_id} is already checked in to room ${twin.current_stay.room_id}`);
    }

    const updated = await GuestTwinModel.findOneAndUpdate(
      { guest_id },
      {
        $set: {
          'current_stay': {
            room_id: data.room_id,
            check_in: new Date(data.check_in),
            check_out: new Date(data.check_out),
            adults: data.adults,
            children: data.children,
            rate_code: data.rate_code,
            special_requests: data.special_requests,
            occasion: data.occasion,
          },
          updated_at: new Date(),
        },
        $inc: {
          'loyalty.total_stays': 1,
        },
      },
      { new: true }
    );

    if (!updated) return null;

    const event: GuestCheckInEvent = await this.eventEmitter.emit(
      TwinEventType.GUEST_CHECKIN,
      twin.twin_id,
      'guest',
      {
        guest_id,
        room_id: data.room_id,
        check_in: data.check_in,
        check_out: data.check_out,
      }
    ) as GuestCheckInEvent;

    return this.toGuestTwin(updated);
  }

  /**
   * Process guest check-out
   */
  async checkOut(guest_id: string, data: CheckOutRequest): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ guest_id });
    if (!twin) {
      throw new Error(`Guest twin not found: ${guest_id}`);
    }

    if (!twin.current_stay.room_id) {
      throw new Error(`Guest ${guest_id} is not checked in`);
    }

    const checkOutTime = new Date();
    const totalSpend = data.total_spend || 0;

    // Add to stay history
    const stayRecord = {
      room_id: twin.current_stay.room_id!,
      check_in: twin.current_stay.check_in!,
      check_out: checkOutTime,
      total_spend: totalSpend,
      rating: data.rating,
    };

    const updated = await GuestTwinModel.findOneAndUpdate(
      { guest_id },
      {
        $set: {
          'current_stay': {
            adults: 1,
            children: 0,
            special_requests: [],
          },
          updated_at: checkOutTime,
        },
        $push: {
          stay_history: stayRecord,
        },
        $inc: {
          'loyalty.total_spend': totalSpend,
          version: 1,
        },
      },
      { new: true }
    );

    if (!updated) return null;

    // Update sentiment if feedback provided
    if (data.feedback) {
      // Simple sentiment calculation based on rating
      const sentimentScore = data.rating ? (data.rating / 5) * 100 : 50;
      await this.updateSentiment(guest_id, {
        score: sentimentScore,
        feedback_date: checkOutTime.toISOString(),
      });
    }

    const event: GuestCheckOutEvent = await this.eventEmitter.emit(
      TwinEventType.GUEST_CHECKOUT,
      twin.twin_id,
      'guest',
      {
        guest_id,
        room_id: twin.current_stay.room_id!,
        check_out: checkOutTime.toISOString(),
        rating: data.rating,
        feedback: data.feedback,
        total_spend: totalSpend,
      }
    ) as GuestCheckOutEvent;

    return this.toGuestTwin(updated);
  }

  /**
   * Update loyalty status
   */
  async updateLoyalty(guest_id: string, data: { tier?: string; points_balance?: number }): Promise<GuestTwin | null> {
    const twin = await GuestTwinModel.findOne({ guest_id });
    if (!twin) return null;

    const updateData: Record<string, any> = {};
    if (data.tier) updateData['loyalty.tier'] = data.tier;
    if (data.points_balance !== undefined) updateData['loyalty.points_balance'] = data.points_balance;

    const updated = await GuestTwinModel.findOneAndUpdate(
      { guest_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.GUEST_LOYALTY_UPDATED, twin.twin_id, 'guest', {
      guest_id,
      loyalty: data,
    });

    return this.toGuestTwin(updated);
  }

  /**
   * Get guest twin statistics
   */
  async getStats(property_id?: string): Promise<GuestTwinStats> {
    const filter: Record<string, any> = {};
    if (property_id) filter.property_id = property_id;

    const [twins, tierAgg, sentimentAgg, clvAgg] = await Promise.all([
      GuestTwinModel.find(filter),
      GuestTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: '$loyalty.tier', count: { $sum: 1 } } },
      ]),
      GuestTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: '$sentiment.trend', count: { $sum: 1 } } },
      ]),
      GuestTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: null, avg_clv: { $avg: '$lifetime_value.clv' }, avg_sentiment: { $avg: '$sentiment.current_score' } } },
      ]),
    ]);

    const by_tier: Record<string, number> = {};
    tierAgg.forEach((t: any) => {
      by_tier[t._id] = t.count;
    });

    const by_sentiment_trend: Record<string, number> = {};
    sentimentAgg.forEach((s: any) => {
      by_sentiment_trend[s._id] = s.count;
    });

    return {
      total: twins.length,
      by_tier,
      by_sentiment_trend,
      avg_sentiment_score: clvAgg[0]?.avg_sentiment || 0,
      avg_clv: clvAgg[0]?.avg_clv || 0,
    };
  }

  /**
   * Delete guest twin
   */
  async delete(guest_id: string): Promise<boolean> {
    const result = await GuestTwinModel.deleteOne({ guest_id });
    return result.deletedCount > 0;
  }

  /**
   * Convert Mongoose document to plain GuestTwin object
   */
  private toGuestTwin(doc: IGuestTwin): GuestTwin {
    return {
      guest_id: doc.guest_id,
      twin_id: doc.twin_id,
      property_id: doc.property_id,
      profile: doc.profile,
      loyalty: doc.loyalty,
      preferences: doc.preferences,
      stay_patterns: doc.stay_patterns,
      sentiment: doc.sentiment,
      lifetime_value: doc.lifetime_value,
      current_stay: {
        room_id: doc.current_stay.room_id,
        check_in: doc.current_stay.check_in?.toISOString(),
        check_out: doc.current_stay.check_out?.toISOString(),
        adults: doc.current_stay.adults,
        children: doc.current_stay.children,
        rate_code: doc.current_stay.rate_code,
        special_requests: doc.current_stay.special_requests,
        occasion: doc.current_stay.occasion,
      },
      stay_history: doc.stay_history.map(s => ({
        room_id: s.room_id,
        check_in: s.check_in.toISOString(),
        check_out: s.check_out.toISOString(),
        total_spend: s.total_spend,
        rating: s.rating,
      })),
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      version: doc.version,
    };
  }
}

export const guestTwinService = new GuestTwinService();