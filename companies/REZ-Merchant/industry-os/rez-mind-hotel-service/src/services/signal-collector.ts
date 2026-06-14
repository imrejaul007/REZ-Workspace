import logger from './utils/logger';

/**
 * REZ Mind Hotel Service - Signal Collector
 *
 * Real-time signal collection service that captures all user actions:
 * - SEARCH_SIGNALS: search behavior, filters, results viewed
 * - BOOKING_SIGNALS: booking lifecycle, payment methods, discounts
 * - STAY_SIGNALS: room QR usage, services, checkout
 * - FEEDBACK_SIGNALS: ratings, reviews, complaints
 *
 * Provides unified signal collection with aggregation capabilities.
 */

import mongoose, { Schema, Document } from 'mongoose';

// ─── Signal Types ─────────────────────────────────────────────────────────────

export enum SignalCategory {
  SEARCH = 'SEARCH',
  BOOKING = 'BOOKING',
  STAY = 'STAY',
  FEEDBACK = 'FEEDBACK',
}

export enum SearchSignalType {
  SEARCH_QUERY = 'search_query',
  FILTERS_APPLIED = 'filters_applied',
  RESULTS_VIEWED = 'results_viewed',
  HOTELS_COMPARED = 'hotels_compared',
}

export enum BookingSignalType {
  BOOKING_STARTED = 'booking_started',
  BOOKING_ABANDONED = 'booking_abandoned',
  BOOKING_COMPLETED = 'booking_completed',
  PAYMENT_METHOD = 'payment_method',
  DISCOUNT_USED = 'discount_used',
}

export enum StaySignalType {
  ROOM_QR_SCANNED = 'room_qr_scanned',
  SERVICE_ORDERED = 'service_ordered',
  CHECKOUT_INITIATED = 'checkout_initiated',
  FEEDBACK_SUBMITTED = 'feedback_submitted',
}

export enum FeedbackSignalType {
  RATING_GIVEN = 'rating_given',
  REVIEW_WRITTEN = 'review_written',
  COMPLAINT_LOGGED = 'complaint_logged',
}

export type SignalType =
  | SearchSignalType
  | BookingSignalType
  | StaySignalType
  | FeedbackSignalType;

// ─── Signal Data Types ────────────────────────────────────────────────────────

export interface BaseSignalData {
  timestamp?: Date;
  sessionId?: string;
  source?: 'app' | 'web' | 'ota' | 'pms' | 'stayown';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  metadata?: Record<string, unknown>;
}

export interface SearchSignalData extends BaseSignalData {
  query?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  filters?: {
    priceMin?: number;
    priceMax?: number;
    starRating?: number[];
    amenities?: string[];
    distance?: number;
    rating?: number;
  };
  resultsCount?: number;
  viewedHotelIds?: string[];
  comparedHotelIds?: string[];
  searchDurationMs?: number;
}

export interface BookingSignalData extends BaseSignalData {
  bookingId?: string;
  hotelId?: string;
  roomTypeId?: string;
  totalAmountPaise?: number;
  discountAmountPaise?: number;
  discountCode?: string;
  discountPercent?: number;
  paymentMethod?: 'card' | 'upi' | 'wallet' | 'netbanking' | 'cod';
  bookingStatus?: 'created' | 'confirmed' | 'cancelled';
  failureReason?: string;
  checkoutStep?: 'personal_info' | 'payment' | 'review' | 'confirmation';
  cartValuePaise?: number;
}

export interface StaySignalData extends BaseSignalData {
  bookingId?: string;
  hotelId?: string;
  roomId?: string;
  serviceType?: 'room_service' | 'housekeeping' | 'laundry' | 'concierge' | 'minibar' | 'spa';
  serviceName?: string;
  amountPaise?: number;
  responseTimeMs?: number;
  satisfactionLevel?: 1 | 2 | 3 | 4 | 5;
}

export interface FeedbackSignalData extends BaseSignalData {
  bookingId?: string;
  hotelId?: string;
  rating?: number;
  categories?: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
  };
  reviewText?: string;
  reviewSentiment?: 'positive' | 'neutral' | 'negative';
  complaintType?: string;
  complaintSeverity?: 'low' | 'medium' | 'high' | 'critical';
  responseRequired?: boolean;
}

export type SignalData =
  | SearchSignalData
  | BookingSignalData
  | StaySignalData
  | FeedbackSignalData;

// ─── Signal Document Interface ─────────────────────────────────────────────────

export interface ISignal extends Document {
  userId: string;
  hotelId?: string;
  signalType: SignalType;
  signalCategory: SignalCategory;
  data: SignalData;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
}

// ─── Signal Schema ────────────────────────────────────────────────────────────

const SignalSchema = new Schema<ISignal>(
  {
    userId: { type: String, required: true, index: true },
    hotelId: { type: String, sparse: true, index: true },
    signalType: {
      type: String,
      required: true,
      index: true,
    },
    signalCategory: {
      type: String,
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'signals',
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────

SignalSchema.index({ userId: 1, signalCategory: 1, timestamp: -1 });
SignalSchema.index({ hotelId: 1, signalType: 1, timestamp: -1 });
SignalSchema.index({ signalCategory: 1, signalType: 1, timestamp: -1 });
SignalSchema.index({ timestamp: -1, processed: 1 });

// ─── Signal Model ─────────────────────────────────────────────────────────────

export const Signal = mongoose.model<ISignal>('Signal', SignalSchema);

// ─── Signal Collector Service ─────────────────────────────────────────────────

export interface CollectSignalOptions {
  userId: string;
  signalType: SignalType;
  signalCategory: SignalCategory;
  hotelId?: string;
  data: SignalData;
  timestamp?: Date;
}

export interface GetUserSignalsOptions {
  signalCategory?: SignalCategory;
  signalType?: SignalType;
  hotelId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface GetHotelSignalsOptions {
  signalCategory?: SignalCategory;
  signalType?: SignalType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export interface GetAggregateSignalsOptions {
  hotelId?: string;
  signalCategory?: SignalCategory;
  signalType?: SignalType;
  startDate?: Date;
  endDate?: Date;
}

export interface SignalAggregation {
  period: Date | string;
  signalType: SignalType;
  count: number;
  uniqueUsers: number;
  hotels: string[];
}

export interface AggregateSignalsResult {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalSignals: number;
  uniqueUsers: number;
  aggregations: SignalAggregation[];
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}

// ─── Signal Collector ────────────────────────────────────────────────────────

class SignalCollectorService {
  private static instance: SignalCollectorService;
  private signalBuffer: ISignal[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000;
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.startFlushTimer();
  }

  public static getInstance(): SignalCollectorService {
    if (!SignalCollectorService.instance) {
      SignalCollectorService.instance = new SignalCollectorService();
    }
    return SignalCollectorService.instance;
  }

  /**
   * Start the periodic flush timer for buffered signals
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flushBuffer().catch((err) => {
        console.error('[SignalCollector] Flush error:', err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Flush buffered signals to MongoDB
   */
  private async flushBuffer(): Promise<void> {
    if (this.signalBuffer.length === 0) return;

    const signalsToFlush = [...this.signalBuffer];
    this.signalBuffer = [];

    try {
      await Signal.insertMany(signalsToFlush, { ordered: false });
      logger.info(`[SignalCollector] Flushed ${signalsToFlush.length} signals`);
    } catch (error) {
      console.error('[SignalCollector] Failed to flush signals:', error);
      // Re-add failed signals to buffer for retry
      this.signalBuffer = [...signalsToFlush, ...this.signalBuffer];
    }
  }

  /**
   * Map signal type to category
   */
  private getCategoryForType(signalType: SignalType): SignalCategory {
    if (Object.values(SearchSignalType).includes(signalType as SearchSignalType)) {
      return SignalCategory.SEARCH;
    }
    if (Object.values(BookingSignalType).includes(signalType as BookingSignalType)) {
      return SignalCategory.BOOKING;
    }
    if (Object.values(StaySignalType).includes(signalType as StaySignalType)) {
      return SignalCategory.STAY;
    }
    if (Object.values(FeedbackSignalType).includes(signalType as FeedbackSignalType)) {
      return SignalCategory.FEEDBACK;
    }
    throw new Error(`Unknown signal type: ${signalType}`);
  }

  /**
   * Collect a user signal in real-time
   *
   * @param userId - User identifier
   * @param signalType - Type of signal being collected
   * @param data - Signal payload data
   * @param options - Additional options
   * @returns Signal document ID
   */
  public async collectSignal(
    userId: string,
    signalType: SignalType,
    data: SignalData,
    options: {
      hotelId?: string;
      timestamp?: Date;
    } = {}
  ): Promise<string> {
    const signalCategory = this.getCategoryForType(signalType);

    const signal: ISignal = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      hotelId: options.hotelId,
      signalType,
      signalCategory,
      data: {
        ...data,
        timestamp: data.timestamp || options.timestamp || new Date(),
      },
      timestamp: options.timestamp || new Date(),
      processed: false,
    } as ISignal;

    // Add to buffer for batch insert
    this.signalBuffer.push(signal);

    // Flush immediately if buffer is full
    if (this.signalBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }

    return signal._id.toString();
  }

  /**
   * Collect signal with full options object
   */
  public async collect(options: CollectSignalOptions): Promise<string> {
    return this.collectSignal(options.userId, options.signalType, options.data, {
      hotelId: options.hotelId,
      timestamp: options.timestamp,
    });
  }

  /**
   * Get signals for a specific user
   *
   * @param userId - User identifier
   * @param options - Query options
   * @returns Array of user signals
   */
  public async getUserSignals(
    userId: string,
    options: GetUserSignalsOptions = {}
  ): Promise<ISignal[]> {
    const query: Record<string, unknown> = { userId };

    if (options.signalCategory) {
      query.signalCategory = options.signalCategory;
    }
    if (options.signalType) {
      query.signalType = options.signalType;
    }
    if (options.hotelId) {
      query.hotelId = options.hotelId;
    }
    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    const signals = await Signal.find(query)
      .sort({ timestamp: options.sortOrder === 'asc' ? 1 : -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 100);

    return signals;
  }

  /**
   * Get all signals for a specific hotel
   *
   * @param hotelId - Hotel identifier
   * @param options - Query options
   * @returns Array of hotel signals
   */
  public async getHotelSignals(
    hotelId: string,
    options: GetHotelSignalsOptions = {}
  ): Promise<ISignal[]> {
    const query: Record<string, unknown> = { hotelId };

    if (options.signalCategory) {
      query.signalCategory = options.signalCategory;
    }
    if (options.signalType) {
      query.signalType = options.signalType;
    }
    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    const signals = await Signal.find(query)
      .sort({ timestamp: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 100);

    return signals;
  }

  /**
   * Get aggregated signals over a time period
   *
   * @param period - Aggregation period (hour, day, week, month)
   * @param options - Additional options
   * @returns Aggregated signal data
   */
  public async getAggregateSignals(
    period: 'hour' | 'day' | 'week' | 'month',
    options: GetAggregateSignalsOptions = {}
  ): Promise<AggregateSignalsResult> {
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build date grouping based on period
    let dateGrouping: Record<string, unknown>;
    switch (period) {
      case 'hour':
        dateGrouping = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
        };
        break;
      case 'week':
        dateGrouping = {
          year: { $year: '$timestamp' },
          week: { $week: '$timestamp' },
        };
        break;
      case 'month':
        dateGrouping = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
        };
        break;
      default:
        dateGrouping = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
        };
    }

    const matchStage: Record<string, unknown> = {
      timestamp: { $gte: startDate, $lte: endDate },
    };

    if (options.hotelId) {
      matchStage.hotelId = options.hotelId;
    }
    if (options.signalCategory) {
      matchStage.signalCategory = options.signalCategory;
    }
    if (options.signalType) {
      matchStage.signalType = options.signalType;
    }

    const aggregation = await Signal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: dateGrouping,
            signalType: '$signalType',
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          hotels: { $addToSet: '$hotelId' },
        },
      },
      {
        $project: {
          period: '$_id.period',
          signalType: '$_id.signalType',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          hotels: { $setUnion: ['$hotels', []] },
        },
      },
      { $sort: { 'period.year': 1, 'period.month': 1, 'period.day': 1, 'period.hour': 1 } },
    ]);

    // Calculate totals
    const totalSignals = aggregation.reduce((sum, a) => sum + a.count, 0);
    const allUsers = new Set<string>();
    aggregation.forEach((a) => {
      // We need to re-query for unique users count since we lost individual userIds
    });

    // Get category counts
    const categoryAggregation = await Signal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$signalCategory',
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory: Record<string, number> = {};
    categoryAggregation.forEach((c) => {
      byCategory[c._id] = c.count;
    });

    // Get type counts
    const typeAggregation = await Signal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$signalType',
          count: { $sum: 1 },
        },
      },
    ]);

    const byType: Record<string, number> = {};
    typeAggregation.forEach((t) => {
      byType[t._id] = t.count;
    });

    // Get unique users count
    const uniqueUsersResult = await Signal.aggregate([
      { $match: matchStage },
      { $group: { _id: null, uniqueUsers: { $addToSet: '$userId' } } },
    ]);
    const uniqueUsers = uniqueUsersResult[0]?.uniqueUsers?.length || 0;

    return {
      period,
      startDate,
      endDate,
      totalSignals,
      uniqueUsers,
      aggregations: aggregation.map((a) => ({
        period: a.period,
        signalType: a.signalType as SignalType,
        count: a.count,
        uniqueUsers: a.uniqueUsers,
        hotels: a.hotels.filter(Boolean),
      })),
      byCategory,
      byType,
    };
  }

  /**
   * Get signal statistics summary
   */
  public async getStats(): Promise<{
    totalSignals: number;
    todaySignals: number;
    uniqueUsers: number;
    byCategory: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, todayResult, uniqueUsersResult, categoryResult] = await Promise.all([
      Signal.countDocuments(),
      Signal.countDocuments({ timestamp: { $gte: today } }),
      Signal.distinct('userId'),
      Signal.aggregate([{ $group: { _id: '$signalCategory', count: { $sum: 1 } } }]),
    ]);

    const byCategory: Record<string, number> = {};
    categoryResult.forEach((c) => {
      byCategory[c._id] = c.count;
    });

    return {
      totalSignals: totalResult,
      todaySignals: todayResult,
      uniqueUsers: uniqueUsersResult.length,
      byCategory,
    };
  }

  /**
   * Mark signals as processed
   */
  public async markProcessed(signalIds: string[]): Promise<number> {
    const result = await Signal.updateMany(
      { _id: { $in: signalIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { $set: { processed: true, processedAt: new Date() } }
    );
    return result.modifiedCount;
  }

  /**
   * Clean up old signals
   */
  public async cleanupOldSignals(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await Signal.deleteMany({
      timestamp: { $lt: cutoffDate },
      processed: true,
    });
    return result.deletedCount || 0;
  }

  /**
   * Shutdown the service gracefully
   */
  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushBuffer();
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const signalCollector = SignalCollectorService.getInstance();

// ─── Convenience Methods for Event Routes ─────────────────────────────────────

/**
 * Create a signal from a search event
 */
export async function collectSearchSignal(
  userId: string,
  sessionId: string,
  data: {
    query?: string;
    city?: string;
    filters?: SearchSignalData['filters'];
    resultsCount?: number;
    viewedHotelIds?: string[];
    comparedHotelIds?: string[];
    searchDurationMs?: number;
  }
): Promise<string> {
  const signalType = data.viewedHotelIds?.length
    ? SearchSignalType.RESULTS_VIEWED
    : data.comparedHotelIds?.length
      ? SearchSignalType.HOTELS_COMPARED
      : data.filters
        ? SearchSignalType.FILTERS_APPLIED
        : SearchSignalType.SEARCH_QUERY;

  return signalCollector.collectSignal(userId, signalType, {
    sessionId,
    query: data.query,
    city: data.city,
    filters: data.filters,
    resultsCount: data.resultsCount,
    viewedHotelIds: data.viewedHotelIds,
    comparedHotelIds: data.comparedHotelIds,
    searchDurationMs: data.searchDurationMs,
  } as SearchSignalData);
}

/**
 * Create a signal from a booking event
 */
export async function collectBookingSignal(
  userId: string,
  data: {
    bookingId?: string;
    hotelId?: string;
    totalAmountPaise?: number;
    discountAmountPaise?: number;
    discountCode?: string;
    paymentMethod?: BookingSignalData['paymentMethod'];
    bookingStatus?: BookingSignalData['bookingStatus'];
    failureReason?: string;
    source?: 'app' | 'web' | 'ota' | 'pms' | 'stayown';
  },
  signalType?: BookingSignalType
): Promise<string> {
  const type =
    signalType ||
    (data.bookingStatus === 'confirmed'
      ? BookingSignalType.BOOKING_COMPLETED
      : data.bookingStatus === 'cancelled'
        ? BookingSignalType.BOOKING_ABANDONED
        : BookingSignalType.BOOKING_STARTED);

  return signalCollector.collectSignal(userId, type, {
    bookingId: data.bookingId,
    hotelId: data.hotelId,
    totalAmountPaise: data.totalAmountPaise,
    discountAmountPaise: data.discountAmountPaise,
    discountCode: data.discountCode,
    paymentMethod: data.paymentMethod,
    bookingStatus: data.bookingStatus,
    failureReason: data.failureReason,
    source: data.source,
  } as BookingSignalData, { hotelId: data.hotelId });
}

/**
 * Create a signal from a stay event
 */
export async function collectStaySignal(
  userId: string,
  data: {
    bookingId?: string;
    hotelId?: string;
    roomId?: string;
    serviceType?: StaySignalData['serviceType'];
    serviceName?: string;
    amountPaise?: number;
    responseTimeMs?: number;
    action?: 'scanned' | 'used_service' | 'checkout';
  },
  signalType?: StaySignalType
): Promise<string> {
  const type =
    signalType ||
    (data.action === 'scanned'
      ? StaySignalType.ROOM_QR_SCANNED
      : data.action === 'checkout'
        ? StaySignalType.CHECKOUT_INITIATED
        : StaySignalType.SERVICE_ORDERED);

  return signalCollector.collectSignal(userId, type, {
    bookingId: data.bookingId,
    hotelId: data.hotelId,
    roomId: data.roomId,
    serviceType: data.serviceType,
    serviceName: data.serviceName,
    amountPaise: data.amountPaise,
    responseTimeMs: data.responseTimeMs,
  } as StaySignalData, { hotelId: data.hotelId });
}

/**
 * Create a signal from a feedback event
 */
export async function collectFeedbackSignal(
  userId: string,
  data: {
    bookingId?: string;
    hotelId?: string;
    rating?: number;
    categories?: FeedbackSignalData['categories'];
    reviewText?: string;
    complaintType?: string;
    complaintSeverity?: FeedbackSignalData['complaintSeverity'];
  },
  signalType?: FeedbackSignalType
): Promise<string> {
  const type =
    signalType ||
    (data.complaintType
      ? FeedbackSignalType.COMPLAINT_LOGGED
      : data.reviewText
        ? FeedbackSignalType.REVIEW_WRITTEN
        : FeedbackSignalType.RATING_GIVEN);

  return signalCollector.collectSignal(userId, type, {
    bookingId: data.bookingId,
    hotelId: data.hotelId,
    rating: data.rating,
    categories: data.categories,
    reviewText: data.reviewText,
    complaintType: data.complaintType,
    complaintSeverity: data.complaintSeverity,
  } as FeedbackSignalData, { hotelId: data.hotelId });
}

export default signalCollector;
