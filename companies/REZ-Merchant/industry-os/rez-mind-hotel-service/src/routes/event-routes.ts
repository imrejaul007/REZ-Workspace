/**
 * REZ Mind Hotel Service - Event Routes
 *
 * Endpoints for receiving events from StayOwn and Hotel PMS:
 * - Hotel search events
 * - Booking events
 * - Room QR events
 * - Service request events
 * - Checkout events
 * - Webhook endpoints for external services
 *
 * All events are automatically forwarded to:
 * 1. Signal Collector - local tracking
 * 2. REZ-Intelligence - cross-platform intelligence
 */

import { Router, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { z } from 'zod';
import crypto from 'crypto';
import {
  HotelSearchEvent,
  HotelBookingEvent,
  RoomQREvent,
  ServiceRequestEvent,
  CheckoutEvent,
  GuestPreference,
} from '../models/event-schemas';
import {
  signalCollector,
  collectSearchSignal,
  collectBookingSignal,
  collectStaySignal,
  collectFeedbackSignal,
  SearchSignalType,
  BookingSignalType,
  StaySignalType,
} from '../services/signal-collector';
import { hotelIntelligence, HOTEL_EVENTS } from '../integrations/rezIntelligence';

const router = Router();

// ─── Webhook Configuration ──────────────────────────────────────────────────────

// CRITICAL FIX: Fail if webhook secrets are not set in production
const isProduction = process.env.NODE_ENV === 'production';

function getWebhookSecret(name: string, envVar: string): string {
  const secret = process.env[envVar];
  if (!secret) {
    if (isProduction) {
      throw new Error(`[FATAL] ${envVar} environment variable is required in production`);
    }
    logger.warn(`[Webhook] ${envVar} not set, using insecure default (development only)`);
    return `dev-only-secret-${name}`;
  }
  return secret;
}

const WEBHOOK_SECRETS: Record<string, string> = {
  'hotel-pms': getWebhookSecret('hotel-pms', 'HOTEL_PMS_WEBHOOK_SECRET'),
  'stayown': getWebhookSecret('stayown', 'STAY_OWN_WEBHOOK_SECRET'),
};

/**
 * Verify webhook HMAC signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * Webhook authentication middleware for Hotel-PMS
 */
function hotelPMSWebhookAuth(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-webhook-signature'] as string;
  const secret = WEBHOOK_SECRETS['hotel-pms'];

  if (process.env.NODE_ENV !== 'production' && !signature) {
    logger.info('[Webhook] Hotel-PMS: Skipping signature verification in development');
    next();
    return;
  }

  if (!signature) {
    res.status(401).json({ success: false, message: 'Missing webhook signature' });
    return;
  }

  const rawBody = JSON.stringify(req.body);
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    logger.warn('[Webhook] Hotel-PMS: Invalid signature received');
    res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }
  next();
}

/**
 * Webhook authentication middleware for StayOwn
 */
function stayOwnWebhookAuth(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-webhook-signature'] as string;
  const secret = WEBHOOK_SECRETS['stayown'];

  if (process.env.NODE_ENV !== 'production' && !signature) {
    logger.info('[Webhook] StayOwn: Skipping signature verification in development');
    next();
    return;
  }

  if (!signature) {
    res.status(401).json({ success: false, message: 'Missing webhook signature' });
    return;
  }

  const rawBody = JSON.stringify(req.body);
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    logger.warn('[Webhook] StayOwn: Invalid signature received');
    res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }
  next();
}

// ─── Validation Schemas ────────────────────────────────────────────────────────

const searchEventSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string(),
  query: z.string(),
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
  resultsCount: z.number(),
  selectedHotelId: z.string().optional(),
  timestamp: z.string().optional(),
});

const bookingEventSchema = z.object({
  userId: z.string(),
  bookingId: z.string(),
  hotelId: z.string(),
  roomTypeId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  totalAmountPaise: z.number(),
  status: z.enum(['created', 'confirmed', 'cancelled']),
  source: z.enum(['app', 'web', 'ota']).optional(),
  timestamp: z.string().optional(),
});

const qrEventSchema = z.object({
  userId: z.string(),
  bookingId: z.string(),
  hotelId: z.string(),
  roomId: z.string(),
  action: z.enum(['generated', 'scanned', 'used_service', 'checkout', 'expired']),
  serviceType: z.string().optional(),
  amountPaise: z.number().optional(),
  timestamp: z.string().optional(),
});

const serviceRequestSchema = z.object({
  userId: z.string(),
  bookingId: z.string(),
  hotelId: z.string(),
  roomId: z.string(),
  requestType: z.enum(['room_service', 'housekeeping', 'laundry', 'concierge', 'checkout']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  amountPaise: z.number().optional(),
  responseTimeMs: z.number().optional(),
  timestamp: z.string().optional(),
});

const checkoutEventSchema = z.object({
  userId: z.string(),
  bookingId: z.string(),
  hotelId: z.string(),
  totalAmountPaise: z.number(),
  serviceChargesPaise: z.number(),
  roomChargesPaise: z.number(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed']),
  timestamp: z.string().optional(),
});

// ─── Search Event ──────────────────────────────────────────────────────────────

router.post('/search', async (req: Request, res: Response) => {
  try {
    const data = searchEventSchema.parse(req.body);
    const event = new HotelSearchEvent({ ...data, timestamp: data.timestamp ? new Date(data.timestamp) : new Date() });
    await event.save();

    const userId = data.userId || 'anonymous';
    await collectSearchSignal(userId, data.sessionId, {
      query: data.query, city: data.city, resultsCount: data.resultsCount,
      viewedHotelIds: data.selectedHotelId ? [data.selectedHotelId] : undefined,
    });

    if (req.body.filters && Object.keys(req.body.filters).length > 0) {
      await signalCollector.collectSignal(userId, SearchSignalType.FILTERS_APPLIED, {
        sessionId: data.sessionId, query: data.query, filters: req.body.filters as unknown, resultsCount: data.resultsCount,
      });
    }

    if (data.selectedHotelId) {
      await signalCollector.collectSignal(userId, SearchSignalType.RESULTS_VIEWED, {
        sessionId: data.sessionId, viewedHotelIds: [data.selectedHotelId], resultsCount: data.resultsCount,
      });
    }

    // Send to REZ-Intelligence
    await hotelIntelligence.sendSearch({
      sessionId: data.sessionId,
      userId: data.userId || undefined,
      hotelId: data.selectedHotelId || undefined,
      city: data.city || '',
      checkIn: data.checkIn || '',
      checkOut: data.checkOut || '',
      guests: data.guests || 1,
      filters: {},
      resultsCount: data.resultsCount,
    });

    res.json({ success: true, correlationId: event._id.toString(), signalCollected: true, sentToIntelligence: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Event] Search event error:', error);
    res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

// ─── Booking Event ────────────────────────────────────────────────────────────

router.post('/booking', async (req: Request, res: Response) => {
  try {
    const data = bookingEventSchema.parse(req.body);
    const event = new HotelBookingEvent({
      ...data, source: data.source || 'app',
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });
    await event.save();
    await updateUserPreferences(data.userId, data.hotelId, data.totalAmountPaise);

    const signalType = data.status === 'confirmed' ? BookingSignalType.BOOKING_COMPLETED :
                       data.status === 'cancelled' ? BookingSignalType.BOOKING_ABANDONED :
                       BookingSignalType.BOOKING_STARTED;
    await collectBookingSignal(data.userId, {
      bookingId: data.bookingId, hotelId: data.hotelId, totalAmountPaise: data.totalAmountPaise,
      bookingStatus: data.status, source: data.source,
    }, signalType);

    if (req.body.paymentMethod) {
      await signalCollector.collectSignal(data.userId, BookingSignalType.PAYMENT_METHOD, {
        bookingId: data.bookingId, hotelId: data.hotelId, paymentMethod: req.body.paymentMethod, source: data.source,
      } as unknown, { hotelId: data.hotelId });
    }

    if (req.body.discountCode || req.body.discountAmountPaise) {
      await signalCollector.collectSignal(data.userId, BookingSignalType.DISCOUNT_USED, {
        bookingId: data.bookingId, hotelId: data.hotelId, discountCode: req.body.discountCode,
        discountAmountPaise: req.body.discountAmountPaise, discountPercent: req.body.discountPercent,
        totalAmountPaise: data.totalAmountPaise,
      } as unknown, { hotelId: data.hotelId });
    }

    // Send to REZ-Intelligence
    await hotelIntelligence.sendBooking({
      userId: data.userId,
      sessionId: data.bookingId,
      hotelId: data.hotelId,
      roomTypeId: data.roomTypeId,
      bookingId: data.bookingId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: 1,
      totalAmount: data.totalAmountPaise,
      source: (data.source || 'app') as unknown,
    });

    // Update unified profile
    await hotelIntelligence.updateProfile(data.userId, {
      lastBooking: { hotelId: data.hotelId, amount: data.totalAmountPaise, date: new Date().toISOString() },
    });

    res.json({ success: true, correlationId: event._id.toString(), signalCollected: true, sentToIntelligence: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Event] Booking event error:', error);
    res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

// ─── Room QR Event ────────────────────────────────────────────────────────────

router.post('/room-qr', async (req: Request, res: Response) => {
  try {
    const data = qrEventSchema.parse(req.body);
    const event = new RoomQREvent({
      ...data, timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });
    await event.save();

    const signalType = data.action === 'scanned' ? StaySignalType.ROOM_QR_SCANNED :
                       data.action === 'checkout' ? StaySignalType.CHECKOUT_INITIATED :
                       data.action === 'used_service' ? StaySignalType.SERVICE_ORDERED :
                       StaySignalType.ROOM_QR_SCANNED;
    await collectStaySignal(data.userId, {
      bookingId: data.bookingId, hotelId: data.hotelId, roomId: data.roomId,
      serviceType: data.serviceType as unknown, amountPaise: data.amountPaise, action: data.action as unknown,
    }, signalType);

    res.json({ success: true, correlationId: event._id.toString(), signalCollected: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Event] Room QR event error:', error);
    res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

// ─── Service Request Event ────────────────────────────────────────────────────

router.post('/service-request', async (req: Request, res: Response) => {
  try {
    const data = serviceRequestSchema.parse(req.body);
    const event = new ServiceRequestEvent({
      ...data, timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });
    await event.save();

    await collectStaySignal(data.userId, {
      bookingId: data.bookingId, hotelId: data.hotelId, roomId: data.roomId,
      serviceType: data.requestType === 'checkout' ? 'concierge' : data.requestType,
      amountPaise: data.amountPaise, responseTimeMs: data.responseTimeMs,
    }, StaySignalType.SERVICE_ORDERED);

    res.json({ success: true, correlationId: event._id.toString(), signalCollected: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Event] Service request event error:', error);
    res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

// ─── Checkout Event ────────────────────────────────────────────────────────────

router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const data = checkoutEventSchema.parse(req.body);
    const event = new CheckoutEvent({
      ...data, timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });
    await event.save();

    await collectStaySignal(data.userId, {
      bookingId: data.bookingId, hotelId: data.hotelId, amountPaise: data.totalAmountPaise,
      serviceType: 'concierge',
    }, StaySignalType.CHECKOUT_INITIATED);

    res.json({ success: true, correlationId: event._id.toString(), signalCollected: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Event] Checkout event error:', error);
    res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

// ─── Guest Preferences ────────────────────────────────────────────────────────

router.post('/preference', async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;
    if (!userId || !preferences) {
      res.status(400).json({ success: false, message: 'userId and preferences required' });
      return;
    }

    const pref = await GuestPreference.findOneAndUpdate(
      { userId },
      { userId, hotelId: preferences.hotelId || 'default', preferences, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { preferences: pref.preferences } });
  } catch (error) {
    console.error('[Event] Preference error:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

// ─── Batch Events ─────────────────────────────────────────────────────────────

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, message: 'events array required' });
      return;
    }

    const results: Array<{ success: boolean; type?: string; id?: string; error?: string; signalId?: string }> = [];

    for (const event of events) {
      try {
        const { type, ...data } = event;
        let signalId: string | undefined;

        switch (type) {
          case 'search': {
            const searchEvent = new HotelSearchEvent({ ...data, timestamp: new Date() });
            await searchEvent.save();
            signalId = await collectSearchSignal(data.userId || 'anonymous', data.sessionId, {
              query: data.query, city: data.city, filters: data.filters, resultsCount: data.resultsCount,
              viewedHotelIds: data.selectedHotelId ? [data.selectedHotelId] : undefined,
            });
            results.push({ success: true, type, id: searchEvent._id.toString(), signalId });
            break;
          }
          case 'booking': {
            const bookingEvent = new HotelBookingEvent({ ...data, timestamp: new Date() });
            await bookingEvent.save();
            const signalType = data.status === 'confirmed' ? BookingSignalType.BOOKING_COMPLETED :
                               data.status === 'cancelled' ? BookingSignalType.BOOKING_ABANDONED :
                               BookingSignalType.BOOKING_STARTED;
            signalId = await collectBookingSignal(data.userId, {
              bookingId: data.bookingId, hotelId: data.hotelId, totalAmountPaise: data.totalAmountPaise,
              bookingStatus: data.status,
            }, signalType);
            results.push({ success: true, type, id: bookingEvent._id.toString(), signalId });
            break;
          }
          case 'room-qr': {
            const qrEvent = new RoomQREvent({ ...data, timestamp: new Date() });
            await qrEvent.save();
            signalId = await collectStaySignal(data.userId, {
              bookingId: data.bookingId, hotelId: data.hotelId, roomId: data.roomId,
              serviceType: data.serviceType, amountPaise: data.amountPaise, action: data.action,
            });
            results.push({ success: true, type, id: qrEvent._id.toString(), signalId });
            break;
          }
          case 'service-request': {
            const serviceEvent = new ServiceRequestEvent({ ...data, timestamp: new Date() });
            await serviceEvent.save();
            signalId = await collectStaySignal(data.userId, {
              bookingId: data.bookingId, hotelId: data.hotelId, roomId: data.roomId,
              serviceType: data.requestType, amountPaise: data.amountPaise, responseTimeMs: data.responseTimeMs,
            }, StaySignalType.SERVICE_ORDERED);
            results.push({ success: true, type, id: serviceEvent._id.toString(), signalId });
            break;
          }
          case 'checkout': {
            const checkoutEvent = new CheckoutEvent({ ...data, timestamp: new Date() });
            await checkoutEvent.save();
            signalId = await collectStaySignal(data.userId, {
              bookingId: data.bookingId, hotelId: data.hotelId, amountPaise: data.totalAmountPaise,
              serviceType: 'concierge',
            }, StaySignalType.CHECKOUT_INITIATED);
            results.push({ success: true, type, id: checkoutEvent._id.toString(), signalId });
            break;
          }
          default:
            results.push({ success: false, type, error: 'Unknown event type' });
        }
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      signalsCollected: results.filter(r => r.signalId).length,
      results,
    });
  } catch (error) {
    console.error('[Event] Batch event error:', error);
    res.status(500).json({ success: false, message: 'Failed to process batch events' });
  }
});

// ─── Direct Signal Endpoints ───────────────────────────────────────────────────

router.post('/signal', async (req: Request, res: Response) => {
  try {
    const { userId, signalType, hotelId, data } = req.body;
    if (!userId || !signalType || !data) {
      res.status(400).json({ success: false, message: 'userId, signalType, and data are required' });
      return;
    }

    const { SignalCategory } = await import('../services/signal-collector');
    let signalCategory: string;
    if (signalType.startsWith('search_')) signalCategory = SignalCategory.SEARCH;
    else if (signalType.startsWith('booking_')) signalCategory = SignalCategory.BOOKING;
    else if (signalType.startsWith('room_qr_') || signalType.startsWith('service_') || signalType.startsWith('checkout_')) signalCategory = SignalCategory.STAY;
    else if (signalType.startsWith('rating_') || signalType.startsWith('review_') || signalType.startsWith('complaint_')) signalCategory = SignalCategory.FEEDBACK;
    else signalCategory = SignalCategory.SEARCH;

    const signalId = await signalCollector.collect({ userId, signalType, signalCategory: signalCategory as unknown, hotelId, data });
    res.json({ success: true, signalId });
  } catch (error) {
    console.error('[Event] Signal collection error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to collect signal' });
  }
});

router.get('/signals/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await signalCollector.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Event] Signal stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get signal stats' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINTS FOR HOTEL-PMS AND STAYOWN
// ═══════════════════════════════════════════════════════════════════════════════════

const HotelPMSWebhookEventSchema = z.object({
  eventId: z.string().optional(), eventType: z.string(), timestamp: z.string().optional(),
  userId: z.string().optional(), sessionId: z.string().optional(), hotelId: z.string().optional(),
  bookingId: z.string().optional(), roomId: z.string().optional(),
  guestName: z.string().optional(), guestEmail: z.string().optional(), guestPhone: z.string().optional(),
  checkInDate: z.string().optional(), checkOutDate: z.string().optional(),
  roomType: z.string().optional(), roomNumber: z.string().optional(),
  totalAmount: z.number().optional(), paymentStatus: z.string().optional(),
  specialRequests: z.array(z.string()).optional(), data: z.record(z.unknown()).optional(),
});

const StayOwnWebhookEventSchema = z.object({
  eventId: z.string().optional(), eventType: z.string(), timestamp: z.string().optional(),
  userId: z.string().optional(), sessionId: z.string().optional(), hotelId: z.string().optional(),
  bookingId: z.string().optional(), roomId: z.string().optional(),
  deviceType: z.string().optional(), appVersion: z.string().optional(), action: z.string().optional(),
  duration: z.number().optional(), feedback: z.string().optional(), rating: z.number().optional(),
  review: z.string().optional(), data: z.record(z.unknown()).optional(),
});

router.post('/webhook/hotel-pms', hotelPMSWebhookAuth, async (req: Request, res: Response) => {
  try {
    const validated = HotelPMSWebhookEventSchema.parse(req.body);
    const eventId = validated.eventId || `pms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = validated.timestamp ? new Date(validated.timestamp) : new Date();
    logger.info(`[Webhook] Hotel-PMS event: ${validated.eventType} (${eventId})`);

    switch (validated.eventType) {
      case 'booking_created': case 'booking_confirmed': case 'booking_cancelled':
        await processPMSBookingEvent(validated, timestamp); break;
      case 'check_in': case 'check_out': case 'early_check_in': case 'late_check_out':
        await processPMSCheckoutEvent(validated, timestamp); break;
      default:
        await storeGenericEvent(validated, timestamp, 'hotel-pms');
    }

    res.json({ success: true, eventId, received: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Webhook] Hotel-PMS error:', error);
    res.status(500).json({ success: false, message: 'Failed to process webhook event' });
  }
});

router.post('/webhook/hotel-pms/batch', hotelPMSWebhookAuth, async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, message: 'events array required' });
      return;
    }
    const results: Array<{ eventId?: string; success: boolean; error?: string }> = [];
    let processed = 0, failed = 0;
    for (const event of events) {
      try {
        const validated = HotelPMSWebhookEventSchema.parse(event);
        const timestamp = validated.timestamp ? new Date(validated.timestamp) : new Date();
        await storeGenericEvent(validated, timestamp, 'hotel-pms');
        results.push({ eventId: validated.eventId, success: true });
        processed++;
      } catch (err) { results.push({ success: false, error: err.message }); failed++; }
    }
    res.json({ success: true, processed, failed, results });
  } catch (error) {
    console.error('[Webhook] Hotel-PMS batch error:', error);
    res.status(500).json({ success: false, message: 'Failed to process batch webhook events' });
  }
});

router.post('/webhook/stayown', stayOwnWebhookAuth, async (req: Request, res: Response) => {
  try {
    const validated = StayOwnWebhookEventSchema.parse(req.body);
    const eventId = validated.eventId || `stay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = validated.timestamp ? new Date(validated.timestamp) : new Date();
    logger.info(`[Webhook] StayOwn event: ${validated.eventType} (${eventId})`);

    switch (validated.eventType) {
      case 'search_performed': case 'hotel_viewed':
        await processStayOwnSearchEvent(validated, timestamp); break;
      case 'booking_started': case 'booking_abandoned':
        await processStayOwnBookingEvent(validated, timestamp); break;
      case 'service_requested': case 'service_completed':
        await processStayOwnServiceEvent(validated, timestamp); break;
      case 'feedback_provided': case 'rating_given': case 'review_submitted':
        await processStayOwnFeedbackEvent(validated, timestamp); break;
      default:
        await storeGenericEvent(validated, timestamp, 'stayown');
    }

    res.json({ success: true, eventId, received: true });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, errors: error.errors }); return; }
    console.error('[Webhook] StayOwn error:', error);
    res.status(500).json({ success: false, message: 'Failed to process webhook event' });
  }
});

router.post('/webhook/stayown/batch', stayOwnWebhookAuth, async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, message: 'events array required' });
      return;
    }
    const results: Array<{ eventId?: string; success: boolean; error?: string }> = [];
    let processed = 0, failed = 0;
    for (const event of events) {
      try {
        const validated = StayOwnWebhookEventSchema.parse(event);
        const timestamp = validated.timestamp ? new Date(validated.timestamp) : new Date();
        await storeGenericEvent(validated, timestamp, 'stayown');
        results.push({ eventId: validated.eventId, success: true });
        processed++;
      } catch (err) { results.push({ success: false, error: err.message }); failed++; }
    }
    res.json({ success: true, processed, failed, results });
  } catch (error) {
    console.error('[Webhook] StayOwn batch error:', error);
    res.status(500).json({ success: false, message: 'Failed to process batch webhook events' });
  }
});

router.get('/webhook/status', async (_req: Request, res: Response) => {
  try {
    const signalStats = await signalCollector.getStats();
    res.json({ success: true, data: {
      endpoints: {
        'hotel-pms': { path: '/api/events/webhook/hotel-pms', authenticated: true, secretConfigured: !!process.env.HOTEL_PMS_WEBHOOK_SECRET },
        'stayown': { path: '/api/events/webhook/stayown', authenticated: true, secretConfigured: !!process.env.STAY_OWN_WEBHOOK_SECRET },
      },
      signalStats,
      environment: process.env.NODE_ENV || 'development',
    }});
  } catch (error) {
    console.error('[Webhook] Status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get webhook status' });
  }
});

// ─── Webhook Processing Functions ───────────────────────────────────────────────

async function processPMSBookingEvent(event: z.infer<typeof HotelPMSWebhookEventSchema>, timestamp: Date): Promise<void> {
  const bookingEvent = new HotelBookingEvent({
    userId: event.userId || 'unknown',
    bookingId: event.bookingId || `pms-booking-${Date.now()}`,
    hotelId: event.hotelId || 'unknown',
    roomTypeId: event.roomType || 'default',
    checkIn: event.checkInDate || new Date().toISOString(),
    checkOut: event.checkOutDate || new Date().toISOString(),
    totalAmountPaise: (event.totalAmount || 0) * 100,
    status: event.eventType === 'booking_cancelled' ? 'cancelled' :
            event.eventType === 'booking_confirmed' ? 'confirmed' : 'created',
    source: 'pms',
    timestamp,
  });
  await bookingEvent.save();
  if (event.userId) {
    await collectBookingSignal(event.userId, {
      bookingId: event.bookingId, hotelId: event.hotelId,
      totalAmountPaise: (event.totalAmount || 0) * 100,
      bookingStatus: bookingEvent.status, source: 'pms',
    });
  }
}

async function processPMSCheckoutEvent(event: z.infer<typeof HotelPMSWebhookEventSchema>, timestamp: Date): Promise<void> {
  const checkoutEvent = new CheckoutEvent({
    userId: event.userId || 'unknown',
    bookingId: event.bookingId || 'unknown',
    hotelId: event.hotelId || 'unknown',
    totalAmountPaise: (event.totalAmount || 0) * 100,
    serviceChargesPaise: ((event.data as unknown)?.serviceCharges || 0) * 100,
    roomChargesPaise: ((event.data as unknown)?.roomCharges || 0) * 100,
    paymentMethod: (event.data as unknown)?.paymentMethod,
    paymentStatus: event.paymentStatus === 'completed' ? 'completed' :
                  event.paymentStatus === 'failed' ? 'failed' : 'pending',
    timestamp,
  });
  await checkoutEvent.save();
  if (event.userId) {
    await collectStaySignal(event.userId, {
      bookingId: event.bookingId, hotelId: event.hotelId,
      amountPaise: (event.totalAmount || 0) * 100, action: 'checkout',
    }, StaySignalType.CHECKOUT_INITIATED);
  }
}

async function processStayOwnSearchEvent(event: z.infer<typeof StayOwnWebhookEventSchema>, timestamp: Date): Promise<void> {
  const searchEvent = new HotelSearchEvent({
    userId: event.userId,
    sessionId: event.sessionId || `stay-session-${Date.now()}`,
    query: (event.data as unknown)?.query || event.eventType,
    city: (event.data as unknown)?.city || event.hotelId,
    checkIn: (event.data as unknown)?.checkIn,
    checkOut: (event.data as unknown)?.checkOut,
    guests: (event.data as unknown)?.guests,
    resultsCount: (event.data as unknown)?.resultsCount || 1,
    selectedHotelId: event.hotelId,
    timestamp,
  });
  await searchEvent.save();
  if (event.userId && event.sessionId) {
    await collectSearchSignal(event.userId, event.sessionId, {
      query: (event.data as unknown)?.query, city: (event.data as unknown)?.city,
      filters: (event.data as unknown)?.filters, resultsCount: (event.data as unknown)?.resultsCount,
      viewedHotelIds: event.hotelId ? [event.hotelId] : undefined,
    });
  }
}

async function processStayOwnBookingEvent(event: z.infer<typeof StayOwnWebhookEventSchema>, timestamp: Date): Promise<void> {
  const bookingEvent = new HotelBookingEvent({
    userId: event.userId || 'unknown',
    bookingId: event.bookingId || `stay-booking-${Date.now()}`,
    hotelId: event.hotelId || 'unknown',
    roomTypeId: (event.data as unknown)?.roomTypeId || 'default',
    checkIn: (event.data as unknown)?.checkIn || new Date().toISOString(),
    checkOut: (event.data as unknown)?.checkOut || new Date().toISOString(),
    totalAmountPaise: ((event.data as unknown)?.totalAmount || 0) * 100,
    status: event.eventType === 'booking_abandoned' ? 'cancelled' : 'created',
    source: 'stayown',
    timestamp,
  });
  await bookingEvent.save();
  if (event.userId) {
    await collectBookingSignal(event.userId, {
      bookingId: event.bookingId, hotelId: event.hotelId,
      totalAmountPaise: ((event.data as unknown)?.totalAmount || 0) * 100,
      bookingStatus: bookingEvent.status, source: 'stayown',
    });
  }
}

async function processStayOwnServiceEvent(event: z.infer<typeof StayOwnWebhookEventSchema>, timestamp: Date): Promise<void> {
  const serviceEvent = new ServiceRequestEvent({
    userId: event.userId || 'unknown',
    bookingId: event.bookingId || 'unknown',
    hotelId: event.hotelId || 'unknown',
    roomId: event.roomId || 'unknown',
    requestType: (event.data as unknown)?.serviceType || 'room_service',
    status: event.eventType === 'service_completed' ? 'completed' : 'pending',
    amountPaise: ((event.data as unknown)?.amount || 0) * 100,
    responseTimeMs: (event.data as unknown)?.responseTimeMs,
    timestamp,
  });
  await serviceEvent.save();
  if (event.userId) {
    await collectStaySignal(event.userId, {
      bookingId: event.bookingId, hotelId: event.hotelId, roomId: event.roomId,
      serviceType: (event.data as unknown)?.serviceType,
      amountPaise: ((event.data as unknown)?.amount || 0) * 100,
      responseTimeMs: (event.data as unknown)?.responseTimeMs,
    }, StaySignalType.SERVICE_ORDERED);
  }
}

async function processStayOwnFeedbackEvent(event: z.infer<typeof StayOwnWebhookEventSchema>, timestamp: Date): Promise<void> {
  if (event.userId) {
    const updateData: Record<string, unknown> = { lastUpdated: timestamp };
    if (event.rating) updateData['preferences.lastRating'] = event.rating;
    if (event.feedback || event.review) updateData['preferences.lastFeedback'] = event.feedback || event.review;
    await GuestPreference.findOneAndUpdate(
      { userId: event.userId },
      { userId: event.userId, hotelId: event.hotelId || 'unknown', $set: updateData },
      { upsert: true, new: true }
    );
    await collectFeedbackSignal(event.userId, {
      bookingId: event.bookingId, hotelId: event.hotelId,
      rating: event.rating, reviewText: event.review || event.feedback,
    });
  }
}

async function storeGenericEvent(event: Record<string, unknown>, timestamp: Date, source: 'hotel-pms' | 'stayown'): Promise<void> {
  logger.info([Webhook] Generic event from ${source}:`, {
    eventType: event.eventType, eventId: event.eventId, userId: event.userId, hotelId: event.hotelId,
  });
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function updateUserPreferences(userId: string, hotelId: string, amount: number): Promise<void> {
  try {
    await GuestPreference.findOneAndUpdate(
      { userId },
      { userId, hotelId, $set: { lastUpdated: new Date() } },
      { upsert: true }
    );
  } catch (error) {
    console.error('[Event] Failed to update user preferences:', error);
  }
}

export default router;
