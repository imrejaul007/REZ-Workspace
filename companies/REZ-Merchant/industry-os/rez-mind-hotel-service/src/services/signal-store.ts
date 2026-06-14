/**
 * REZ Mind Hotel Service - Signal Store
 *
 * Centralized signal storage for all signal types:
 * - Search signals (user search behavior, preferences)
 * - Booking signals (booking intent, conversion, abandonment)
 * - Service signals (service usage, response times, satisfaction)
 * - Feedback signals (ratings, reviews, complaints)
 * - Behavioral signals (session data, engagement metrics)
 */

import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// ─── Signal Types ─────────────────────────────────────────────────────────────

export enum SignalType {
  SEARCH = 'search',
  BOOKING = 'booking',
  SERVICE = 'service',
  FEEDBACK = 'feedback',
  BEHAVIORAL = 'behavioral',
}

export enum SignalSource {
  HOTEL_PMS = 'hotel-pms',
  STAY_OWN = 'stayown',
  WEB_APP = 'web-app',
  MOBILE_APP = 'mobile-app',
  THIRD_PARTY = 'third-party',
}

// ─── Signal Schemas ───────────────────────────────────────────────────────────

// Base signal interface
export interface ISignal {
  signalId: string;
  type: SignalType;
  source: SignalSource;
  userId?: string;
  sessionId?: string;
  hotelId?: string;
  roomId?: string;
  bookingId?: string;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  processed: boolean;
  processedAt?: Date;
}

// Search signal schema
export interface ISearchSignal extends ISignal {
  type: SignalType.SEARCH;
  metadata: {
    query: string;
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    resultsCount: number;
    selectedHotelId?: string;
    filters?: Record<string, unknown>;
    sortBy?: string;
    searchDuration?: number;
  };
}

// Booking signal schema
export interface IBookingSignal extends ISignal {
  type: SignalType.BOOKING;
  metadata: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    status: 'created' | 'confirmed' | 'cancelled' | 'abandoned';
    source?: string;
    paymentMethod?: string;
    specialRequests?: string[];
  };
}

// Service signal schema
export interface IServiceSignal extends ISignal {
  type: SignalType.SERVICE;
  metadata: {
    serviceType: 'room_service' | 'housekeeping' | 'laundry' | 'concierge' | 'spa' | 'restaurant' | 'checkout';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    amount?: number;
    responseTimeMs?: number;
    staffId?: string;
    notes?: string;
  };
}

// Feedback signal schema
export interface IFeedbackSignal extends ISignal {
  type: SignalType.FEEDBACK;
  metadata: {
    rating?: number;
    feedback?: string;
    review?: string;
    category?: string;
    responded?: boolean;
    responseText?: string;
  };
}

// Behavioral signal schema
export interface IBehavioralSignal extends ISignal {
  type: SignalType.BEHAVIORAL;
  metadata: {
    action: string;
    page?: string;
    element?: string;
    duration?: number;
    deviceType?: string;
    appVersion?: string;
    referrer?: string;
  };
}

// ─── MongoDB Schemas ─────────────────────────────────────────────────────────

const SignalSchema = new Schema<ISignal & Document>({
  signalId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: Object.values(SignalType), required: true, index: true },
  source: { type: String, enum: Object.values(SignalSource), required: true, index: true },
  userId: { type: String, sparse: true, index: true },
  sessionId: { type: String, sparse: true, index: true },
  hotelId: { type: String, sparse: true, index: true },
  roomId: { type: String, sparse: true },
  bookingId: { type: String, sparse: true },
  eventType: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date },
});

// Compound indexes for efficient queries
SignalSchema.index({ hotelId: 1, type: 1, timestamp: -1 });
SignalSchema.index({ userId: 1, type: 1, timestamp: -1 });
SignalSchema.index({ hotelId: 1, eventType: 1, timestamp: -1 });
SignalSchema.index({ processed: 1, timestamp: 1 });

// TTL index to auto-delete old signals (90 days)
SignalSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Signal = mongoose.model<ISignal & Document>('Signal', SignalSchema);

// ─── Validation Schemas ────────────────────────────────────────────────────────

const baseSignalSchema = z.object({
  signalId: z.string().optional(),
  type: z.nativeEnum(SignalType),
  source: z.nativeEnum(SignalSource),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  hotelId: z.string().optional(),
  roomId: z.string().optional(),
  bookingId: z.string().optional(),
  eventType: z.string(),
  timestamp: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const searchSignalSchema = baseSignalSchema.extend({
  type: z.literal(SignalType.SEARCH),
  metadata: z.object({
    query: z.string(),
    city: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.number().optional(),
    resultsCount: z.number(),
    selectedHotelId: z.string().optional(),
    filters: z.record(z.unknown()).optional(),
    sortBy: z.string().optional(),
    searchDuration: z.number().optional(),
  }),
});

const bookingSignalSchema = baseSignalSchema.extend({
  type: z.literal(SignalType.BOOKING),
  metadata: z.object({
    roomTypeId: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    totalAmount: z.number(),
    status: z.enum(['created', 'confirmed', 'cancelled', 'abandoned']),
    source: z.string().optional(),
    paymentMethod: z.string().optional(),
    specialRequests: z.array(z.string()).optional(),
  }),
});

const serviceSignalSchema = baseSignalSchema.extend({
  type: z.literal(SignalType.SERVICE),
  metadata: z.object({
    serviceType: z.enum(['room_service', 'housekeeping', 'laundry', 'concierge', 'spa', 'restaurant', 'checkout']),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    amount: z.number().optional(),
    responseTimeMs: z.number().optional(),
    staffId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const feedbackSignalSchema = baseSignalSchema.extend({
  type: z.literal(SignalType.FEEDBACK),
  metadata: z.object({
    rating: z.number().optional(),
    feedback: z.string().optional(),
    review: z.string().optional(),
    category: z.string().optional(),
    responded: z.boolean().optional(),
    responseText: z.string().optional(),
  }),
});

const behavioralSignalSchema = baseSignalSchema.extend({
  type: z.literal(SignalType.BEHAVIORAL),
  metadata: z.object({
    action: z.string(),
    page: z.string().optional(),
    element: z.string().optional(),
    duration: z.number().optional(),
    deviceType: z.string().optional(),
    appVersion: z.string().optional(),
    referrer: z.string().optional(),
  }),
});

export type CreateSearchSignal = z.infer<typeof searchSignalSchema>;
export type CreateBookingSignal = z.infer<typeof bookingSignalSchema>;
export type CreateServiceSignal = z.infer<typeof serviceSignalSchema>;
export type CreateFeedbackSignal = z.infer<typeof feedbackSignalSchema>;
export type CreateBehavioralSignal = z.infer<typeof behavioralSignalSchema>;

// ─── Signal Store Class ───────────────────────────────────────────────────────

export class SignalStore {
  /**
   * Generate unique signal ID
   */
  private generateSignalId(): string {
    return `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store a search signal
   */
  async storeSearchSignal(data: CreateSearchSignal): Promise<ISignal> {
    const signalId = data.signalId || this.generateSignalId();

    const signal = new Signal({
      signalId,
      type: SignalType.SEARCH,
      source: data.source,
      userId: data.userId,
      sessionId: data.sessionId,
      hotelId: data.hotelId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata,
      processed: false,
    });

    await signal.save();
    return signal.toObject();
  }

  /**
   * Store a booking signal
   */
  async storeBookingSignal(data: CreateBookingSignal): Promise<ISignal> {
    const signalId = data.signalId || this.generateSignalId();

    const signal = new Signal({
      signalId,
      type: SignalType.BOOKING,
      source: data.source,
      userId: data.userId,
      sessionId: data.sessionId,
      hotelId: data.hotelId,
      bookingId: data.bookingId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata,
      processed: false,
    });

    await signal.save();
    return signal.toObject();
  }

  /**
   * Store a service signal
   */
  async storeServiceSignal(data: CreateServiceSignal): Promise<ISignal> {
    const signalId = data.signalId || this.generateSignalId();

    const signal = new Signal({
      signalId,
      type: SignalType.SERVICE,
      source: data.source,
      userId: data.userId,
      sessionId: data.sessionId,
      hotelId: data.hotelId,
      roomId: data.roomId,
      bookingId: data.bookingId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata,
      processed: false,
    });

    await signal.save();
    return signal.toObject();
  }

  /**
   * Store a feedback signal
   */
  async storeFeedbackSignal(data: CreateFeedbackSignal): Promise<ISignal> {
    const signalId = data.signalId || this.generateSignalId();

    const signal = new Signal({
      signalId,
      type: SignalType.FEEDBACK,
      source: data.source,
      userId: data.userId,
      sessionId: data.sessionId,
      hotelId: data.hotelId,
      bookingId: data.bookingId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata,
      processed: false,
    });

    await signal.save();
    return signal.toObject();
  }

  /**
   * Store a behavioral signal
   */
  async storeBehavioralSignal(data: CreateBehavioralSignal): Promise<ISignal> {
    const signalId = data.signalId || this.generateSignalId();

    const signal = new Signal({
      signalId,
      type: SignalType.BEHAVIORAL,
      source: data.source,
      userId: data.userId,
      sessionId: data.sessionId,
      hotelId: data.hotelId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata,
      processed: false,
    });

    await signal.save();
    return signal.toObject();
  }

  /**
   * Get search signals for a user or hotel
   */
  async getSearchSignals(params: {
    userId?: string;
    hotelId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ISignal[]> {
    const query: unknown = { type: SignalType.SEARCH };

    if (params.userId) query.userId = params.userId;
    if (params.hotelId) query.hotelId = params.hotelId;
    if (params.sessionId) query.sessionId = params.sessionId;
    if (params.startDate || params.endDate) {
      query.timestamp = {};
      if (params.startDate) query.timestamp.$gte = params.startDate;
      if (params.endDate) query.timestamp.$lte = params.endDate;
    }

    return Signal.find(query)
      .sort({ timestamp: -1 })
      .limit(params.limit || 100)
      .lean();
  }

  /**
   * Get booking signals for a user or hotel
   */
  async getBookingSignals(params: {
    userId?: string;
    hotelId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ISignal[]> {
    const query: unknown = { type: SignalType.BOOKING };

    if (params.userId) query.userId = params.userId;
    if (params.hotelId) query.hotelId = params.hotelId;
    if (params.status) query['metadata.status'] = params.status;
    if (params.startDate || params.endDate) {
      query.timestamp = {};
      if (params.startDate) query.timestamp.$gte = params.startDate;
      if (params.endDate) query.timestamp.$lte = params.endDate;
    }

    return Signal.find(query)
      .sort({ timestamp: -1 })
      .limit(params.limit || 100)
      .lean();
  }

  /**
   * Get service signals for a hotel
   */
  async getServiceSignals(params: {
    hotelId?: string;
    serviceType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ISignal[]> {
    const query: unknown = { type: SignalType.SERVICE };

    if (params.hotelId) query.hotelId = params.hotelId;
    if (params.serviceType) query['metadata.serviceType'] = params.serviceType;
    if (params.status) query['metadata.status'] = params.status;
    if (params.startDate || params.endDate) {
      query.timestamp = {};
      if (params.startDate) query.timestamp.$gte = params.startDate;
      if (params.endDate) query.timestamp.$lte = params.endDate;
    }

    return Signal.find(query)
      .sort({ timestamp: -1 })
      .limit(params.limit || 100)
      .lean();
  }

  /**
   * Get feedback signals for a hotel
   */
  async getFeedbackSignals(params: {
    hotelId?: string;
    userId?: string;
    minRating?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ISignal[]> {
    const query: unknown = { type: SignalType.FEEDBACK };

    if (params.hotelId) query.hotelId = params.hotelId;
    if (params.userId) query.userId = params.userId;
    if (params.minRating) query['metadata.rating'] = { $gte: params.minRating };
    if (params.startDate || params.endDate) {
      query.timestamp = {};
      if (params.startDate) query.timestamp.$gte = params.startDate;
      if (params.endDate) query.timestamp.$lte = params.endDate;
    }

    return Signal.find(query)
      .sort({ timestamp: -1 })
      .limit(params.limit || 100)
      .lean();
  }

  /**
   * Get behavioral signals for a session or user
   */
  async getBehavioralSignals(params: {
    userId?: string;
    sessionId?: string;
    hotelId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ISignal[]> {
    const query: unknown = { type: SignalType.BEHAVIORAL };

    if (params.userId) query.userId = params.userId;
    if (params.sessionId) query.sessionId = params.sessionId;
    if (params.hotelId) query.hotelId = params.hotelId;
    if (params.action) query['metadata.action'] = params.action;
    if (params.startDate || params.endDate) {
      query.timestamp = {};
      if (params.startDate) query.timestamp.$gte = params.startDate;
      if (params.endDate) query.timestamp.$lte = params.endDate;
    }

    return Signal.find(query)
      .sort({ timestamp: -1 })
      .limit(params.limit || 100)
      .lean();
  }

  /**
   * Get signals aggregated by type for analytics
   */
  async getAggregatedSignals(params: {
    hotelId?: string;
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'type' | 'source' | 'eventType';
  }): Promise<unknown[]> {
    const match: unknown = {};
    if (params.hotelId) match.hotelId = params.hotelId;
    if (params.startDate || params.endDate) {
      match.timestamp = {};
      if (params.startDate) match.timestamp.$gte = params.startDate;
      if (params.endDate) match.timestamp.$lte = params.endDate;
    }

    const groupField = params.groupBy === 'source' ? '$source' :
                       params.groupBy === 'eventType' ? '$eventType' : '$type';

    return Signal.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
          processed: { $sum: { $cond: ['$processed', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  /**
   * Mark signals as processed
   */
  async markAsProcessed(signalIds: string[]): Promise<number> {
    const result = await Signal.updateMany(
      { signalId: { $in: signalIds } },
      { $set: { processed: true, processedAt: new Date() } }
    );
    return result.modifiedCount;
  }

  /**
   * Get unprocessed signals for batch processing
   */
  async getUnprocessedSignals(limit: number = 100): Promise<ISignal[]> {
    return Signal.find({ processed: false })
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get signal statistics for a hotel
   */
  async getSignalStats(params: {
    hotelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    processed: number;
    unprocessed: number;
  }> {
    const match: unknown = {};
    if (params.hotelId) match.hotelId = params.hotelId;
    if (params.startDate || params.endDate) {
      match.timestamp = {};
      if (params.startDate) match.timestamp.$gte = params.startDate;
      if (params.endDate) match.timestamp.$lte = params.endDate;
    }

    const [stats, typeStats, sourceStats] = await Promise.all([
      Signal.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } },
            unprocessed: { $sum: { $cond: ['$processed', 0, 1] } },
          },
        },
      ]),
      Signal.aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Signal.aggregate([
        { $match: match },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
    ]);

    const byType: Record<string, number> = {};
    typeStats.forEach((t) => { byType[t._id] = t.count; });

    const bySource: Record<string, number> = {};
    sourceStats.forEach((s) => { bySource[s._id] = s.count; });

    return {
      total: stats[0]?.total || 0,
      byType,
      bySource,
      processed: stats[0]?.processed || 0,
      unprocessed: stats[0]?.unprocessed || 0,
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const signalStore = new SignalStore();
