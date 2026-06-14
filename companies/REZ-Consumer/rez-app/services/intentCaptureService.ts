// @ts-nocheck
/**
 * RTMN Commerce Memory: Intent Capture Service
 * Captures user intents from rez-app-consumer for cross-app intelligence
 *
 * Also sends to REZ Mind Event Platform for unified intelligence
 */


// SECURITY: Enforce HTTPS in production
const _intentCaptureUrl = process.env.EXPO_PUBLIC_INTENT_CAPTURE_URL || 'https://rez-intent-graph.onrender.com';
const _rezMindUrl = process.env.EXPO_PUBLIC_REZ_MIND_URL || 'https://rez-event-platform.onrender.com';
const INTENT_CAPTURE_URL = __DEV__ ? _intentCaptureUrl : _intentCaptureUrl.replace('http://', 'https://');
const REZ_MIND_URL = __DEV__ ? _rezMindUrl : _rezMindUrl.replace('http://', 'https://');

// ── App Type Derivation ───────────────────────────────────────────────────────
// Derive appType from the intentKey prefix so flights, trains, cabs, and hotels
// are tracked under their correct product type, not under a hardcoded 'hotel_ota'.

function deriveAppType(intentKey: string): string {
  const prefix = intentKey.split('_')[0];
  switch (prefix) {
    case 'flight': return 'flight';
    case 'hotel': return 'hotel';
    case 'train': return 'train';
    case 'cab': return 'cab';
    case 'bill': return 'bill_payment';
    default: return 'consumer';
  }
}

// ── Event Mapping ────────────────────────────────────────────────────────────

const EVENT_TO_INTENT: Record<string, { eventType: string; category: string; confidence: number }> = {
  // Flight events
  FLIGHT_SEARCH: { eventType: 'search', category: 'TRAVEL', confidence: 0.15 },
  FLIGHT_VIEW: { eventType: 'view', category: 'TRAVEL', confidence: 0.25 },
  FLIGHT_BOOKING_START: { eventType: 'hold', category: 'TRAVEL', confidence: 0.45 },
  FLIGHT_BOOKING_COMPLETE: { eventType: 'fulfilled', category: 'TRAVEL', confidence: 1.0 },

  // Hotel events
  HOTEL_SEARCH: { eventType: 'search', category: 'TRAVEL', confidence: 0.15 },
  HOTEL_VIEW: { eventType: 'view', category: 'TRAVEL', confidence: 0.25 },
  HOTEL_BOOKING_START: { eventType: 'hold', category: 'TRAVEL', confidence: 0.45 },
  HOTEL_BOOKING_COMPLETE: { eventType: 'fulfilled', category: 'TRAVEL', confidence: 1.0 },

  // Train events
  TRAIN_SEARCH: { eventType: 'search', category: 'TRAVEL', confidence: 0.15 },
  TRAIN_VIEW: { eventType: 'view', category: 'TRAVEL', confidence: 0.25 },
  TRAIN_BOOKING_START: { eventType: 'hold', category: 'TRAVEL', confidence: 0.45 },
  TRAIN_BOOKING_COMPLETE: { eventType: 'fulfilled', category: 'TRAVEL', confidence: 1.0 },

  // Cab events
  CAB_SEARCH: { eventType: 'search', category: 'TRAVEL', confidence: 0.15 },
  CAB_BOOKING_START: { eventType: 'hold', category: 'TRAVEL', confidence: 0.45 },
  CAB_BOOKING_COMPLETE: { eventType: 'fulfilled', category: 'TRAVEL', confidence: 1.0 },

  // Bill payment events
  BILL_UPLOAD: { eventType: 'view', category: 'GENERAL', confidence: 0.20 },
  BILL_PAYMENT_START: { eventType: 'checkout_start', category: 'GENERAL', confidence: 0.60 },
  BILL_PAYMENT_COMPLETE: { eventType: 'fulfilled', category: 'GENERAL', confidence: 1.0 },
};

// ── Intent Key Generators ────────────────────────────────────────────────────

function generateFlightIntentKey(eventType: string, fromCity: string, toCity: string): string {
  return `flight_${eventType}_${fromCity.toLowerCase()}_${toCity.toLowerCase()}`;
}

function generateHotelIntentKey(eventType: string, city: string): string {
  return `hotel_${eventType}_${city.toLowerCase().replace(/\s+/g, '_')}`;
}

function generateTrainIntentKey(eventType: string, fromStation: string, toStation: string): string {
  return `train_${eventType}_${fromStation.toLowerCase()}_${toStation.toLowerCase()}`;
}

// ── Intent Capture Functions ─────────────────────────────────────────────────

export interface FlightIntentParams {
  userId: string;
  eventType: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  returnDate?: string;
}

export interface HotelIntentParams {
  userId: string;
  eventType: string;
  hotelId?: string;
  city: string;
  checkinDate?: string;
  checkoutDate?: string;
}

export interface TrainIntentParams {
  userId: string;
  eventType: string;
  fromStation: string;
  toStation: string;
  travelDate: string;
}

export interface CabIntentParams {
  userId: string;
  eventType: string;
  pickupLocation: string;
  dropLocation: string;
  pickupTime: string;
}

export interface BillIntentParams {
  userId: string;
  eventType: string;
  billId?: string;
  amount?: number;
}

/**
 * Capture flight intent
 */
export async function captureFlightIntent(params: FlightIntentParams): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;

  const intentKey = generateFlightIntentKey(params.eventType, params.fromCity, params.toCity);

  await captureIntent({
    userId: params.userId,
    intentKey,
    eventType: params.eventType,
    category: 'TRAVEL',
    metadata: {
      type: 'flight',
      fromCity: params.fromCity,
      toCity: params.toCity,
      travelDate: params.travelDate,
      returnDate: params.returnDate,
    },
  });
}

/**
 * Capture hotel intent
 */
export async function captureHotelIntent(params: HotelIntentParams): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;

  const intentKey = params.hotelId
    ? `hotel_${params.eventType}_${params.hotelId}`
    : generateHotelIntentKey(params.eventType, params.city);

  await captureIntent({
    userId: params.userId,
    intentKey,
    eventType: params.eventType,
    category: 'TRAVEL',
    metadata: {
      type: 'hotel',
      hotelId: params.hotelId,
      city: params.city,
      checkinDate: params.checkinDate,
      checkoutDate: params.checkoutDate,
    },
  });
}

/**
 * Capture train intent
 */
export async function captureTrainIntent(params: TrainIntentParams): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;

  const intentKey = generateTrainIntentKey(params.eventType, params.fromStation, params.toStation);

  await captureIntent({
    userId: params.userId,
    intentKey,
    eventType: params.eventType,
    category: 'TRAVEL',
    metadata: {
      type: 'train',
      fromStation: params.fromStation,
      toStation: params.toStation,
      travelDate: params.travelDate,
    },
  });
}

/**
 * Capture cab intent
 */
export async function captureCabIntent(params: CabIntentParams): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;

  const intentKey = `cab_${params.eventType}_${params.pickupLocation.toLowerCase()}_${params.dropLocation.toLowerCase()}`;

  await captureIntent({
    userId: params.userId,
    intentKey,
    eventType: params.eventType,
    category: 'TRAVEL',
    metadata: {
      type: 'cab',
      pickupLocation: params.pickupLocation,
      dropLocation: params.dropLocation,
      pickupTime: params.pickupTime,
    },
  });
}

/**
 * Capture bill payment intent
 */
export async function captureBillIntent(params: BillIntentParams): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;

  const intentKey = `bill_${params.eventType}_${params.billId || 'unknown'}`;

  await captureIntent({
    userId: params.userId,
    intentKey,
    eventType: params.eventType,
    category: 'GENERAL',
    metadata: {
      type: 'bill',
      billId: params.billId,
      amount: params.amount,
    },
  });
}

// ── Core Capture Function ────────────────────────────────────────────────────

interface CaptureIntentParams {
  userId: string;
  intentKey: string;
  eventType: string;
  category: 'TRAVEL' | 'DINING' | 'RETAIL' | 'HOTEL_SERVICE' | 'GENERAL';
  metadata?: Record<string, unknown>;
}

async function captureIntent(params: CaptureIntentParams): Promise<void> {
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        appType: deriveAppType(params.intentKey),
        intentKey: params.intentKey,
        eventType: params.eventType,
        category: params.category,
        metadata: params.metadata,
      }),
    });
  } catch (error) {
    // Non-blocking - intent capture should not affect UX
    logger.debug('[IntentCapture] Failed to capture intent', error);
  }
}

// ── Export for analytics integration ───────────────────────────────────────

export const intentCaptureService = {
  captureFlightIntent,
  captureHotelIntent,
  captureTrainIntent,
  captureCabIntent,
  captureBillIntent,
};

// ── REZ Mind Integration ──────────────────────────────────────────────────────

/**
 * Send event to REZ Mind Event Platform (fire-and-forget)
 */
async function sendToRezMind(endpoint: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'rez-app-consumer',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.debug('[REZ Mind] Event failed', error);
  }
}

/**
 * Capture consumer order event
 */
export async function captureOrderEvent(params: {
  userId: string;
  orderId: string;
  merchantId?: string;
  items?: Array<{ itemId: string; quantity: number; price: number }>;
  totalAmount: number;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/order', {
    user_id: params.userId,
    order_id: params.orderId,
    merchant_id: params.merchantId || '',
    items: params.items || [],
    total_amount: params.totalAmount,
  });
}

/**
 * Capture consumer search event
 */
export async function captureSearchEvent(params: {
  userId: string;
  query: string;
  resultsCount?: number;
  clickedItem?: string;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/search', {
    user_id: params.userId,
    query: params.query,
    results_count: params.resultsCount || 0,
    clicked_item: params.clickedItem,
  });
}

/**
 * Capture consumer view event
 */
export async function captureViewEvent(params: {
  userId: string;
  itemId: string;
  itemName?: string;
  durationSeconds?: number;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/view', {
    user_id: params.userId,
    item_id: params.itemId,
    item_name: params.itemName,
    duration_seconds: params.durationSeconds,
  });
}

/**
 * Capture consumer booking event
 */
export async function captureBookingEvent(params: {
  userId: string;
  bookingId: string;
  serviceType: string;
  merchantId?: string;
  amount?: number;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/booking', {
    user_id: params.userId,
    booking_id: params.bookingId,
    service_type: params.serviceType,
    merchant_id: params.merchantId,
    amount: params.amount,
  });
}
