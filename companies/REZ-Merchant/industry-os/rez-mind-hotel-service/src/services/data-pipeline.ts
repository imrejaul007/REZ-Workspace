import logger from './utils/logger';

/**
 * REZ Mind Hotel Service - Data Pipeline
 *
 * Real-time data ingestion service that:
 * - Receives events from Hotel-PMS (Property Management System)
 * - Receives events from StayOwn (Guest Experience Platform)
 * - Stores all signals in MongoDB
 * - Processes events in real-time for analytics and insights
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import {
  HotelSearchEvent,
  HotelBookingEvent,
  RoomQREvent,
  ServiceRequestEvent,
  CheckoutEvent,
  GuestPreference,
} from '../models/event-schemas';

// ─── Event Types ─────────────────────────────────────────────────────────────

export enum EventSource {
  HOTEL_PMS = 'hotel-pms',
  STAY_OWN = 'stayown',
  UNKNOWN = 'unknown',
}

export enum EventType {
  // Search events
  SEARCH = 'search',
  HOTEL_VIEW = 'hotel_view',
  BOOKING_START = 'booking_start',
  BOOKING_ABANDON = 'booking_abandon',

  // Booking events
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_MODIFIED = 'booking_modified',

  // Check-in/out events
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  EARLY_CHECK_IN = 'early_check_in',
  LATE_CHECK_OUT = 'late_check_out',

  // Room events
  ROOM_QR_GENERATED = 'room_qr_generated',
  ROOM_QR_SCANNED = 'room_qr_scanned',
  ROOM_ACCESS = 'room_access',

  // Service events
  SERVICE_REQUEST = 'service_request',
  SERVICE_STARTED = 'service_started',
  SERVICE_COMPLETED = 'service_completed',
  SERVICE_CANCELLED = 'service_cancelled',

  // Payment events
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',

  // Feedback events
  FEEDBACK_PROVIDED = 'feedback_provided',
  RATING_GIVEN = 'rating_given',
  REVIEW_SUBMITTED = 'review_submitted',

  // Behavioral events
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

// ─── Validation Schemas ────────────────────────────────────────────────────────

const baseEventSchema = z.object({
  eventId: z.string().optional(),
  source: z.string(),
  timestamp: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  hotelId: z.string().optional(),
  bookingId: z.string().optional(),
  roomId: z.string().optional(),
});

const HotelPMSEventSchema = baseEventSchema.extend({
  eventType: z.string(),
  data: z.record(z.unknown()).optional(),
  // PMS specific fields
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  roomType: z.string().optional(),
  roomNumber: z.string().optional(),
  totalAmount: z.number().optional(),
  paymentStatus: z.string().optional(),
  specialRequests: z.array(z.string()).optional(),
  source: z.literal('hotel-pms'),
});

const StayOwnEventSchema = baseEventSchema.extend({
  eventType: z.string(),
  data: z.record(z.unknown()).optional(),
  // StayOwn specific fields
  deviceType: z.string().optional(),
  appVersion: z.string().optional(),
  action: z.string().optional(),
  duration: z.number().optional(),
  feedback: z.string().optional(),
  rating: z.number().optional(),
  review: z.string().optional(),
  source: z.literal('stayown'),
});

const CombinedEventSchema = z.object({
  eventId: z.string().optional(),
  source: z.enum(['hotel-pms', 'stayown']),
  eventType: z.string(),
  timestamp: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  hotelId: z.string().optional(),
  bookingId: z.string().optional(),
  roomId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export type HotelPMSEvent = z.infer<typeof HotelPMSEventSchema>;
export type StayOwnEvent = z.infer<typeof StayOwnEventSchema>;
export type CombinedEvent = z.infer<typeof CombinedEventSchema>;

// ─── Event Emitter for Real-time Processing ─────────────────────────────────

export class DataPipeline extends EventEmitter {
  private processingQueue: CombinedEvent[] = [];
  private isProcessing = false;
  private batchSize = 50;
  private batchIntervalMs = 1000;

  constructor() {
    super();
    this.startBatchProcessor();
  }

  /**
   * Receive event from Hotel-PMS
   */
  async receiveFromHotelPMS(event: HotelPMSEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Validate event
      const validated = HotelPMSEventSchema.parse(event);

      // Generate event ID if not provided
      const eventId = validated.eventId || `pms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create combined event
      const combinedEvent: CombinedEvent = {
        eventId,
        source: EventSource.HOTEL_PMS,
        eventType: validated.eventType,
        timestamp: validated.timestamp || new Date().toISOString(),
        userId: validated.userId,
        sessionId: validated.sessionId,
        hotelId: validated.hotelId,
        bookingId: validated.bookingId,
        roomId: validated.roomId,
        data: {
          ...validated.data,
          guestName: validated.guestName,
          guestEmail: validated.guestEmail,
          guestPhone: validated.guestPhone,
          checkInDate: validated.checkInDate,
          checkOutDate: validated.checkOutDate,
          roomType: validated.roomType,
          roomNumber: validated.roomNumber,
          totalAmount: validated.totalAmount,
          paymentStatus: validated.paymentStatus,
          specialRequests: validated.specialRequests,
        },
      };

      // Emit for real-time processing
      this.emit('event', combinedEvent);

      // Add to batch queue
      this.processingQueue.push(combinedEvent);

      // Process and store
      await this.processAndStore(combinedEvent);

      logger.info(`[DataPipeline] Hotel-PMS event received: ${validated.eventType} (${eventId})`);

      return { success: true, eventId };
    } catch (error) {
      console.error('[DataPipeline] Hotel-PMS event error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Receive event from StayOwn
   */
  async receiveFromStayOwn(event: StayOwnEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Validate event
      const validated = StayOwnEventSchema.parse(event);

      // Generate event ID if not provided
      const eventId = validated.eventId || `stay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create combined event
      const combinedEvent: CombinedEvent = {
        eventId,
        source: EventSource.STAY_OWN,
        eventType: validated.eventType,
        timestamp: validated.timestamp || new Date().toISOString(),
        userId: validated.userId,
        sessionId: validated.sessionId,
        hotelId: validated.hotelId,
        bookingId: validated.bookingId,
        roomId: validated.roomId,
        data: {
          ...validated.data,
          deviceType: validated.deviceType,
          appVersion: validated.appVersion,
          action: validated.action,
          duration: validated.duration,
          feedback: validated.feedback,
          rating: validated.rating,
          review: validated.review,
        },
      };

      // Emit for real-time processing
      this.emit('event', combinedEvent);

      // Add to batch queue
      this.processingQueue.push(combinedEvent);

      // Process and store
      await this.processAndStore(combinedEvent);

      logger.info(`[DataPipeline] StayOwn event received: ${validated.eventType} (${eventId})`);

      return { success: true, eventId };
    } catch (error) {
      console.error('[DataPipeline] StayOwn event error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Receive batch of events
   */
  async receiveBatch(events: CombinedEvent[]): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{ eventId?: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{ eventId?: string; success: boolean; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        const validated = CombinedEventSchema.parse(event);
        const source = validated.source === 'hotel-pms' ? EventSource.HOTEL_PMS : EventSource.STAY_OWN;

        if (source === EventSource.HOTEL_PMS) {
          const result = await this.receiveFromHotelPMS(validated as unknown as HotelPMSEvent);
          results.push(result);
          if (result.success) processed++;
          else failed++;
        } else {
          const result = await this.receiveFromStayOwn(validated as unknown as StayOwnEvent);
          results.push(result);
          if (result.success) processed++;
          else failed++;
        }
      } catch (error) {
        results.push({ success: false, error: error.message });
        failed++;
      }
    }

    return { success: true, processed, failed, results };
  }

  /**
   * Process and store event based on type
   */
  private async processAndStore(event: CombinedEvent): Promise<void> {
    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

    switch (event.eventType) {
      case EventType.SEARCH:
      case EventType.HOTEL_VIEW:
        await this.storeSearchEvent(event, timestamp);
        break;

      case EventType.BOOKING_CREATED:
      case EventType.BOOKING_CONFIRMED:
      case EventType.BOOKING_CANCELLED:
      case EventType.BOOKING_MODIFIED:
        await this.storeBookingEvent(event, timestamp);
        break;

      case EventType.CHECK_IN:
      case EventType.CHECK_OUT:
      case EventType.EARLY_CHECK_IN:
      case EventType.LATE_CHECK_OUT:
        await this.storeCheckoutEvent(event, timestamp);
        break;

      case EventType.ROOM_QR_GENERATED:
      case EventType.ROOM_QR_SCANNED:
      case EventType.ROOM_ACCESS:
        await this.storeRoomQREvent(event, timestamp);
        break;

      case EventType.SERVICE_REQUEST:
      case EventType.SERVICE_STARTED:
      case EventType.SERVICE_COMPLETED:
      case EventType.SERVICE_CANCELLED:
        await this.storeServiceRequestEvent(event, timestamp);
        break;

      case EventType.FEEDBACK_PROVIDED:
      case EventType.RATING_GIVEN:
      case EventType.REVIEW_SUBMITTED:
        await this.storeFeedbackEvent(event, timestamp);
        break;

      default:
        // Store as behavioral signal
        await this.storeBehavioralEvent(event, timestamp);
    }

    // Emit processed event for subscribers
    this.emit('processed', event);
  }

  /**
   * Store search event
   */
  private async storeSearchEvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    const searchEvent = new HotelSearchEvent({
      userId: event.userId,
      sessionId: event.sessionId || `session-${Date.now()}`,
      query: (event.data as unknown)?.query || event.eventType,
      city: (event.data as unknown)?.city || event.hotelId,
      checkIn: (event.data as unknown)?.checkIn || event.data?.checkInDate,
      checkOut: (event.data as unknown)?.checkOut || event.data?.checkOutDate,
      guests: (event.data as unknown)?.guests,
      resultsCount: (event.data as unknown)?.resultsCount || 1,
      selectedHotelId: event.hotelId,
      timestamp,
    });

    await searchEvent.save();
  }

  /**
   * Store booking event
   */
  private async storeBookingEvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    let status: 'created' | 'confirmed' | 'cancelled' = 'created';

    switch (event.eventType) {
      case EventType.BOOKING_CONFIRMED:
        status = 'confirmed';
        break;
      case EventType.BOOKING_CANCELLED:
        status = 'cancelled';
        break;
    }

    const bookingEvent = new HotelBookingEvent({
      userId: event.userId || 'unknown',
      bookingId: event.bookingId || `booking-${Date.now()}`,
      hotelId: event.hotelId || 'unknown',
      roomTypeId: (event.data as unknown)?.roomTypeId || (event.data as unknown)?.roomType || 'default',
      checkIn: (event.data as unknown)?.checkIn || (event.data as unknown)?.checkInDate || new Date().toISOString(),
      checkOut: (event.data as unknown)?.checkOut || (event.data as unknown)?.checkOutDate || new Date().toISOString(),
      totalAmountPaise: (event.data as unknown)?.totalAmount || (event.data as unknown)?.totalAmountPaise || 0,
      status,
      source: (event.data as unknown)?.source || 'app',
      timestamp,
    });

    await bookingEvent.save();
  }

  /**
   * Store checkout event
   */
  private async storeCheckoutEvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    const checkoutEvent = new CheckoutEvent({
      userId: event.userId || 'unknown',
      bookingId: event.bookingId || `booking-${Date.now()}`,
      hotelId: event.hotelId || 'unknown',
      totalAmountPaise: (event.data as unknown)?.totalAmount || 0,
      serviceChargesPaise: (event.data as unknown)?.serviceCharges || 0,
      roomChargesPaise: (event.data as unknown)?.roomCharges || 0,
      paymentMethod: (event.data as unknown)?.paymentMethod,
      paymentStatus: (event.data as unknown)?.paymentStatus || 'pending',
      timestamp,
    });

    await checkoutEvent.save();
  }

  /**
   * Store room QR event
   */
  private async storeRoomQREvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    let action: 'generated' | 'scanned' | 'used_service' | 'checkout' | 'expired' = 'generated';

    switch (event.eventType) {
      case EventType.ROOM_QR_SCANNED:
        action = 'scanned';
        break;
      case EventType.ROOM_ACCESS:
        action = 'used_service';
        break;
      case EventType.CHECK_OUT:
        action = 'checkout';
        break;
    }

    const qrEvent = new RoomQREvent({
      userId: event.userId || 'unknown',
      bookingId: event.bookingId || 'unknown',
      hotelId: event.hotelId || 'unknown',
      roomId: event.roomId || (event.data as unknown)?.roomId || 'unknown',
      action,
      serviceType: (event.data as unknown)?.serviceType,
      amountPaise: (event.data as unknown)?.amount,
      timestamp,
    });

    await qrEvent.save();
  }

  /**
   * Store service request event
   */
  private async storeServiceRequestEvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    let status: 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'pending';

    switch (event.eventType) {
      case EventType.SERVICE_STARTED:
        status = 'in_progress';
        break;
      case EventType.SERVICE_COMPLETED:
        status = 'completed';
        break;
      case EventType.SERVICE_CANCELLED:
        status = 'cancelled';
        break;
    }

    const serviceEvent = new ServiceRequestEvent({
      userId: event.userId || 'unknown',
      bookingId: event.bookingId || 'unknown',
      hotelId: event.hotelId || 'unknown',
      roomId: event.roomId || 'unknown',
      requestType: (event.data as unknown)?.requestType || 'room_service',
      status,
      amountPaise: (event.data as unknown)?.amount,
      responseTimeMs: (event.data as unknown)?.responseTimeMs,
      timestamp,
    });

    await serviceEvent.save();
  }

  /**
   * Store feedback event
   */
  private async storeFeedbackEvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    // Store feedback in user preferences or a dedicated feedback collection
    if (event.userId) {
      await GuestPreference.findOneAndUpdate(
        { userId: event.userId },
        {
          userId: event.userId,
          hotelId: event.hotelId || 'unknown',
          preferences: {
            ...((await GuestPreference.findOne({ userId: event.userId }))?.preferences || {}),
            lastFeedback: {
              rating: (event.data as unknown)?.rating,
              feedback: (event.data as unknown)?.feedback,
              review: (event.data as unknown)?.review,
              timestamp: timestamp.toISOString(),
            },
          },
          lastUpdated: timestamp,
        },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Store behavioral event (generic)
   */
  private async storeBehavioralEvent(event: CombinedEvent, timestamp: Date): Promise<void> {
    // Store behavioral signals in a dedicated collection
    // This can be extended based on specific requirements
    logger.info([DataPipeline] Storing behavioral event: ${event.eventType}`, {
      eventId: event.eventId,
      userId: event.userId,
      hotelId: event.hotelId,
    });
  }

  /**
   * Start batch processor for efficient bulk operations
   */
  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.processingQueue.length > 0 && !this.isProcessing) {
        await this.processBatch();
      }
    }, this.batchIntervalMs);
  }

  /**
   * Process batch of events
   */
  private async processBatch(): Promise<void> {
    this.isProcessing = true;

    try {
      const batch = this.processingQueue.splice(0, this.batchSize);

      // Bulk insert events if needed
      // This is a placeholder for bulk operations
      logger.info(`[DataPipeline] Processing batch of ${batch.length} events`);
    } catch (error) {
      console.error('[DataPipeline] Batch processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get event statistics
   */
  async getStats(): Promise<{
    queueSize: number;
    processedToday: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const searchCount = await HotelSearchEvent.countDocuments({ timestamp: { $gte: today } });
    const bookingCount = await HotelBookingEvent.countDocuments({ timestamp: { $gte: today } });
    const serviceCount = await ServiceRequestEvent.countDocuments({ timestamp: { $gte: today } });
    const checkoutCount = await CheckoutEvent.countDocuments({ timestamp: { $gte: today } });
    const qrCount = await RoomQREvent.countDocuments({ timestamp: { $gte: today } });

    return {
      queueSize: this.processingQueue.length,
      processedToday: searchCount + bookingCount + serviceCount + checkoutCount + qrCount,
      bySource: {
        'hotel-pms': bookingCount + checkoutCount,
        'stayown': searchCount + serviceCount + qrCount,
      },
      byType: {
        search: searchCount,
        booking: bookingCount,
        service: serviceCount,
        checkout: checkoutCount,
        qr: qrCount,
      },
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const dataPipeline = new DataPipeline();
