/**
 * Room QR Service - Enhanced Room QR Features
 *
 * Implements:
 * - QR type detection (room vs store)
 * - Priority service requests
 * - Scheduled service requests
 * - Housekeeping special requests
 * - Late checkout / early check-in
 * - Minibar billing
 * - Express checkout
 * - Room preferences memory
 */

import { authClient, publicClient } from './client';
import { logger } from '@/lib/utils/logger';

// ─── QR Type Detection ─────────────────────────────────────────────────────────

export type QRType = 'room' | 'store' | 'table' | 'unknown';

export interface QRValidationResult {
  valid: boolean;
  qrType: QRType;
  roomContext?: RoomHubContext;
  storeContext?: StoreContext;
  error?: string;
}

export interface RoomHubContext {
  bookingId: string;
  roomId: string;
  roomNumber: string;
  hotelId: string;
  hotelName: string;
  hotelSlug: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  roomTypeName?: string;
  floor?: string;
  features?: RoomFeatures;
}

export interface StoreContext {
  storeSlug: string;
  storeName: string;
  storeType: string;
}

export interface RoomFeatures {
  hasMinibar: boolean;
  hasSafe: boolean;
  hasBalcony: boolean;
  hasBathtub: boolean;
  maxOccupancy: number;
}

/**
 * Parse and validate QR code data to determine QR type
 */
export function parseQRType(qrData: string): QRType {
  // Room QR format: room:{hotelSlug}:{roomId}:{token}
  if (qrData.startsWith('room:')) return 'room';

  // Store QR format: store:{storeSlug}
  if (qrData.startsWith('store:')) return 'store';

  // Table QR format: table:{storeSlug}:{tableId}
  if (qrData.startsWith('table:')) return 'table';

  // Legacy room QR format (hotel-ota encoded)
  if (/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_=-]+$/.test(qrData)) {
    const [type] = qrData.split(':');
    if (['room', 'store', 'table'].includes(type)) return type as QRType;
  }

  return 'unknown';
}

/**
 * Validate room QR code with enhanced type detection
 */
export async function validateRoomQREnhanced(
  qrData: string
): Promise<QRValidationResult> {
  try {
    const qrType = parseQRType(qrData);

    if (qrType === 'store' || qrType === 'table') {
      // Store/table QR - redirect to store page
      const slug = qrData.replace(/^(store|table):/, '');
      return {
        valid: true,
        qrType,
        storeContext: {
          storeSlug: slug,
          storeName: slug,
          storeType: qrType === 'table' ? 'restaurant' : 'general',
        },
      };
    }

    if (qrType === 'room') {
      // Room QR - validate with Hotel OTA
      const { data } = await publicClient.post<{
        success: boolean;
        data?: RoomHubContext;
        message?: string;
      }>(`/api/room-qr/validate`, { qrData });

      if (!data.success || !data.data) {
        return { valid: false, qrType: 'room', error: data.message ?? 'Invalid room QR code' };
      }

      return {
        valid: true,
        qrType: 'room',
        roomContext: data.data,
      };
    }

    return { valid: false, qrType: 'unknown', error: 'Unknown QR code format' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'QR validation failed';
    return { valid: false, qrType: 'unknown', error: message };
  }
}

// ─── Service Request Types ─────────────────────────────────────────────────────

export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceRequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequestItem {
  id: string;
  name: string;
  price: number; // paise
  quantity: number;
  category: string;
}

export interface ServiceRequest {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  serviceType: ServiceType;
  description?: string;
  items?: ServiceRequestItem[];
  totalAmountPaise: number;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  scheduledFor?: string; // ISO datetime for scheduled requests
  createdAt: string;
  updatedAt: string;
}

export type ServiceType =
  | 'housekeeping'
  | 'room_service'
  | 'laundry'
  | 'transport'
  | 'spa'
  | 'maintenance'
  | 'concierge'
  | 'fitness'
  | 'late_checkout'
  | 'early_checkin'
  | 'minibar'
  | 'express_checkout'
  | 'turndown'
  | 'amenity';

// ─── Housekeeping Special Requests ────────────────────────────────────────────

export interface HousekeepingRequest {
  requestType: 'general' | 'deep_clean' | 'towel_change' | 'toiletries' | 'bedding' | 'special';
  urgency: ServiceRequestPriority;
  scheduledFor?: string;
  specialInstructions?: string;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

export const HOUSEKEEPING_EXTRAS: Record<string, { name: string; price: number; icon: string }> = {
  'extra_towels': { name: 'Extra Towels', price: 0, icon: 'towel' },
  'bath_towels': { name: 'Bath Towels', price: 0, icon: 'bath' },
  'hand_towels': { name: 'Hand Towels', price: 0, icon: 'hand' },
  'toiletries_kit': { name: 'Toiletries Kit', price: 0, icon: 'toiletries' },
  'shampoo': { name: 'Shampoo', price: 0, icon: 'shampoo' },
  'conditioner': { name: 'Conditioner', price: 0, icon: 'conditioner' },
  'body_lotion': { name: 'Body Lotion', price: 0, icon: 'lotion' },
  'slippers': { name: 'Bathroom Slippers', price: 0, icon: 'slippers' },
  'robe': { name: 'Bathrobe', price: 0, icon: 'robe' },
  'dental_kit': { name: 'Dental Kit', price: 0, icon: 'dental' },
  'sewing_kit': { name: 'Sewing Kit', price: 0, icon: 'sewing' },
  'iron_board': { name: 'Iron & Board', price: 0, icon: 'iron' },
  'extra_pillows': { name: 'Extra Pillows', price: 0, icon: 'pillow' },
  'blanket': { name: 'Extra Blanket', price: 0, icon: 'blanket' },
  'bedding_set': { name: 'Fresh Bedding Set', price: 0, icon: 'bedding' },
};

// ─── Late Checkout / Early Check-in ─────────────────────────────────────────────

export interface CheckoutRequest {
  requestedTime: string; // HH:mm format
  reason?: string;
  approvalStatus?: 'pending' | 'approved' | 'denied';
  extendedCharge?: number; // paise
}

export interface CheckinRequest {
  requestedTime: string; // HH:mm format
  reason?: string;
  approvalStatus?: 'pending' | 'approved' | 'denied';
}

// ─── Minibar Billing ───────────────────────────────────────────────────────────

export interface MinibarItem {
  id: string;
  name: string;
  price: number; // paise
  category: 'beverage' | 'snack' | 'alcohol' | 'misc';
  image?: string;
  stock?: number;
}

export interface MinibarConsumption {
  itemId: string;
  quantity: number;
  timestamp: string;
  totalPrice: number;
}

export interface MinibarBill {
  id: string;
  roomId: string;
  roomNumber: string;
  items: MinibarConsumption[];
  subtotal: number;
  tax: number;
  total: number;
  checkedInAt: string;
  checkedOutAt?: string;
  status: 'active' | 'settled' | 'disputed';
}

// ─── Express Checkout ──────────────────────────────────────────────────────────

export interface CheckoutBill {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  items: CheckoutBillItem[];
  charges: CheckoutCharge[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'settled';
  checkoutTime: string;
  generatedAt: string;
}

export interface CheckoutBillItem {
  description: string;
  category: string;
  amount: number;
  quantity?: number;
}

export interface CheckoutCharge {
  type: 'room' | 'minibar' | 'laundry' | 'restaurant' | 'spa' | 'transport' | 'other' | 'tax' | 'discount';
  description: string;
  amount: number;
}

// ─── Room Preferences ─────────────────────────────────────────────────────────

export interface RoomPreference {
  preferenceType: 'pillow' | 'towel' | 'temperature' | 'lighting' | 'noise' | 'wakeup' | 'dietary' | 'general';
  value: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestPreferences {
  guestId: string;
  roomId: string;
  preferences: RoomPreference[];
  dietaryRestrictions?: string[];
  allergies?: string[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// ─── Voice Commands ────────────────────────────────────────────────────────────

export interface VoiceCommand {
  id: string;
  text: string;
  intent: string;
  entities?: Record<string, string>;
  confidence: number;
  processed: boolean;
}

export type VoiceCommandResult = {
  command: VoiceCommand;
  action?: ServiceRequest;
  message: string;
};

export const VOICE_COMMANDS: Record<string, RegExp[]> = {
  'housekeeping': [/clean|housekeeping|room clean|make bed|bed making/i],
  'towels': [/towel|extra towel|new towel/i],
  'room_service': [/food|order|meal|breakfast|lunch|dinner|room service/i],
  'checkout': [/checkout|check out|leave|checking out/i],
  'late_checkout': [/late checkout|extend checkout|checkout later/i],
  'early_checkin': [/early checkin|early check-in|checkin early/i],
  'minibar': [/minibar|mini bar|drink|beer|wine|water/i],
  'wifi': [/wifi|internet|wi-fi|password/i],
  'taxi': [/taxi|cab|uber|car|transport|ride/i],
  'spa': [/spa|massage|wellness|relax/i],
  'concierge': [/concierge|help|assistance|information/i],
  'temperature': [/temperature|ac|heat|warmer|cooler/i],
  'quiet': [/quiet|noise|loud| disturbance/i],
};

/**
 * Parse voice command text to extract intent and entities
 */
export function parseVoiceCommand(text: string): {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
} {
  const normalizedText = text.toLowerCase().trim();

  for (const [intent, patterns] of Object.entries(VOICE_COMMANDS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        const entities: Record<string, string> = {};

        // Extract quantity if present
        const quantityMatch = normalizedText.match(/(\d+)\s*(towels?|pillows?|items?|bottles?)/i);
        if (quantityMatch) {
          entities.quantity = quantityMatch[1];
          entities.unit = quantityMatch[2];
        }

        // Extract time if present
        const timeMatch = normalizedText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeMatch) {
          entities.time = timeMatch[0];
        }

        return { intent, entities, confidence: 0.9 };
      }
    }
  }

  return { intent: 'unknown', entities: {}, confidence: 0 };
}

// ─── Multilingual Support ──────────────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'hi' | 'ar' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru';

export interface LanguageContext {
  language: SupportedLanguage;
  locale: string;
  currency: string;
  currencySymbol: string;
}

export const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageContext> = {
  en: { language: 'en', locale: 'en-IN', currency: 'INR', currencySymbol: '₹' },
  hi: { language: 'hi', locale: 'hi-IN', currency: 'INR', currencySymbol: '₹' },
  ar: { language: 'ar', locale: 'ar-SA', currency: 'SAR', currencySymbol: 'ر.س' },
  zh: { language: 'zh', locale: 'zh-CN', currency: 'CNY', currencySymbol: '¥' },
  es: { language: 'es', locale: 'es-ES', currency: 'EUR', currencySymbol: '€' },
  fr: { language: 'fr', locale: 'fr-FR', currency: 'EUR', currencySymbol: '€' },
  de: { language: 'de', locale: 'de-DE', currency: 'EUR', currencySymbol: '€' },
  ja: { language: 'ja', locale: 'ja-JP', currency: 'JPY', currencySymbol: '¥' },
  ko: { language: 'ko', locale: 'ko-KR', currency: 'KRW', currencySymbol: '₩' },
  ru: { language: 'ru', locale: 'ru-RU', currency: 'RUB', currencySymbol: '₽' },
};

// ─── Guest Feedback ───────────────────────────────────────────────────────────

export type FeedbackType = 'in_stay' | 'checkout' | 'post_stay' | 'incident';

export interface GuestFeedback {
  id: string;
  bookingId: string;
  roomId: string;
  feedbackType: FeedbackType;
  ratings: {
    overall?: number; // 1-5
    cleanliness?: number;
    service?: number;
    amenities?: number;
    comfort?: number;
  };
  categories?: {
    name: string;
    rating: number;
    comment?: string;
  }[];
  comment?: string;
  improvements?: string[];
  wouldRecommend?: boolean;
  submittedAt: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

const HOTEL_OTA_BASE =
  process.env.NEXT_PUBLIC_HOTEL_OTA_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3008'
    : 'https://hotel-ota-api.onrender.com');

/**
 * Create a service request with priority and scheduling
 */
export async function createServiceRequest(params: {
  bookingId: string;
  roomId: string;
  serviceType: ServiceType;
  description?: string;
  items?: ServiceRequestItem[];
  priority?: ServiceRequestPriority;
  scheduledFor?: string;
}): Promise<ServiceRequest> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: ServiceRequest;
    message?: string;
  }>(`${HOTEL_OTA_BASE}/v1/room-service`, {
    bookingId: params.bookingId,
    roomId: params.roomId,
    serviceType: params.serviceType,
    description: params.description,
    items: params.items,
    priority: params.priority ?? 'medium',
    scheduledFor: params.scheduledFor,
  });

  if (!data.success) throw new Error(data.message ?? 'Failed to create service request');
  return data.data as ServiceRequest;
}

/**
 * Create housekeeping special request
 */
export async function createHousekeepingRequest({
  bookingId,
  roomId,
  housekeepingRequest,
}: {
  bookingId: string;
  roomId: string;
  housekeepingRequest: HousekeepingRequest;
}): Promise<ServiceRequest> {
  const items: ServiceRequestItem[] = [];

  if (housekeepingRequest.items) {
    for (const item of housekeepingRequest.items) {
      const extra = HOUSEKEEPING_EXTRAS[item.id];
      if (extra) {
        items.push({
          id: item.id,
          name: extra.name,
          price: extra.price,
          quantity: item.quantity,
          category: 'housekeeping_extra',
        });
      }
    }
  }

  const descriptions: string[] = [];
  if (housekeepingRequest.requestType !== 'general') {
    descriptions.push(`Request type: ${housekeepingRequest.requestType.replace('_', ' ')}`);
  }
  if (housekeepingRequest.specialInstructions) {
    descriptions.push(housekeepingRequest.specialInstructions);
  }

  return createServiceRequest({
    bookingId,
    roomId,
    serviceType: 'housekeeping',
    description: descriptions.join('. ') || 'Housekeeping request via Room Hub',
    items,
    priority: housekeepingRequest.urgency,
    scheduledFor: housekeepingRequest.scheduledFor,
  });
}

/**
 * Request late checkout
 */
export async function requestLateCheckout(params: {
  bookingId: string;
  roomId: string;
  requestedTime: string;
  reason?: string;
}): Promise<ServiceRequest> {
  return createServiceRequest({
    bookingId: params.bookingId,
    roomId: params.roomId,
    serviceType: 'late_checkout',
    description: `Late checkout requested until ${params.requestedTime}${params.reason ? `. Reason: ${params.reason}` : ''}`,
    priority: params.requestedTime === '14:00' ? 'medium' : 'high',
  });
}

/**
 * Request early check-in
 */
export async function requestEarlyCheckin(params: {
  bookingId: string;
  roomId: string;
  requestedTime: string;
  reason?: string;
}): Promise<ServiceRequest> {
  return createServiceRequest({
    bookingId: params.bookingId,
    roomId: params.roomId,
    serviceType: 'early_checkin',
    description: `Early check-in requested at ${params.requestedTime}${params.reason ? `. Reason: ${params.reason}` : ''}`,
    priority: 'high',
  });
}

/**
 * Get minibar items
 */
export async function getMinibarItems(hotelId: string): Promise<MinibarItem[]> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: MinibarItem[];
  }>(`${HOTEL_OTA_BASE}/v1/room-service/minibar/${hotelId}`);
  return data.data ?? [];
}

/**
 * Get minibar bill for room
 */
export async function getMinibarBill(roomId: string): Promise<MinibarBill | null> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: MinibarBill;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/minibar/${roomId}/bill`);
  return data.data ?? null;
}

/**
 * Add item to minibar consumption
 */
export async function addMinibarConsumption(params: {
  roomId: string;
  itemId: string;
  quantity: number;
}): Promise<MinibarConsumption> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: MinibarConsumption;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/minibar/${params.roomId}/consume`, {
    itemId: params.itemId,
    quantity: params.quantity,
  });
  return data.data as MinibarConsumption;
}

/**
 * Get express checkout bill
 */
export async function getExpressCheckoutBill(bookingId: string): Promise<CheckoutBill | null> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: CheckoutBill;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/checkout/${bookingId}/bill`);
  return data.data ?? null;
}

/**
 * Submit guest feedback
 */
export async function submitGuestFeedback(feedback: Omit<GuestFeedback, 'id' | 'submittedAt'>): Promise<GuestFeedback> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: GuestFeedback;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/feedback`, feedback);
  return data.data as GuestFeedback;
}

/**
 * Get guest preferences
 */
export async function getGuestPreferences(
  guestId: string,
  roomId: string
): Promise<GuestPreferences | null> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: GuestPreferences;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/preferences/${guestId}/${roomId}`);
  return data.data ?? null;
}

/**
 * Update guest preferences
 */
export async function updateGuestPreferences(
  guestId: string,
  roomId: string,
  preferences: RoomPreference[]
): Promise<GuestPreferences> {
  const { data } = await authClient.put<{
    success: boolean;
    data?: GuestPreferences;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/preferences/${guestId}/${roomId}`, {
    preferences,
  });
  return data.data as GuestPreferences;
}

/**
 * Process voice command
 */
export async function processVoiceCommand(params: {
  bookingId: string;
  roomId: string;
  text: string;
}): Promise<{
  command: VoiceCommand;
  action?: ServiceRequest;
  message: string;
}> {
  const parsed = parseVoiceCommand(params.text);

  const command: VoiceCommand = {
    id: crypto.randomUUID(),
    text: params.text,
    intent: parsed.intent,
    entities: parsed.entities,
    confidence: parsed.confidence,
    processed: false,
  };

  if (parsed.intent === 'unknown' || parsed.confidence < 0.5) {
    return {
      command,
      message: "I'm not sure I understood that. Could you please type your request?",
    };
  }

  // Map voice intent to service type
  const intentToServiceType: Record<string, ServiceType> = {
    housekeeping: 'housekeeping',
    towels: 'housekeeping',
    room_service: 'room_service',
    checkout: 'express_checkout',
    late_checkout: 'late_checkout',
    early_checkin: 'early_checkin',
    minibar: 'minibar',
    wifi: 'maintenance',
    taxi: 'transport',
    spa: 'spa',
    concierge: 'concierge',
    temperature: 'maintenance',
    quiet: 'concierge',
  };

  const serviceType = intentToServiceType[parsed.intent];
  if (!serviceType) {
    return {
      command,
      message: "I couldn't determine which service you need. Could you please type your request?",
    };
  }

  try {
    const action = await createServiceRequest({
      bookingId: params.bookingId,
      roomId: params.roomId,
      serviceType,
      description: `Voice command: ${params.text}`,
      priority: 'medium',
    });

    command.processed = true;

    const serviceMessages: Record<string, string> = {
      housekeeping: "I've requested housekeeping for your room.",
      towels: "I've requested extra towels for your room.",
      room_service: "I'll connect you with room service.",
      express_checkout: "I'm preparing your express checkout.",
      late_checkout: "I've submitted your late checkout request.",
      early_checkin: "I've submitted your early check-in request.",
      minibar: "I've noted your minibar request.",
      wifi: "I'm connecting you with our maintenance team for WiFi assistance.",
      taxi: "I'll arrange a taxi for you.",
      spa: "I'll connect you with our spa team.",
      concierge: "Our concierge team has been notified.",
      maintenance: "I've logged your maintenance request.",
    };

    return {
      command,
      action,
      message: serviceMessages[parsed.intent] ?? "Your request has been noted.",
    };
  } catch (err) {
    logger.error('[RoomQRService] Voice command processing failed', { error: err, params });
    return {
      command,
      message: "I couldn't process your request. Could you please try again or type it?",
    };
  }
}

// ─── Engagement Tracking ─────────────────────────────────────────────────────────

export type RoomEngagementEvent =
  | 'scan'
  | 'view_menu'
  | 'order_placed'
  | 'call_waiter'
  | 'request_bill'
  | 'chat_sent'
  | 'service_requested'
  | 'checkout_initiated'
  | 'feedback_submitted'
  | 'voice_command_used'
  | 'preference_updated';

export interface EngagementEvent {
  eventType: RoomEngagementEvent;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Track room engagement for analytics and REZ coin rewards
 */
export async function trackRoomEngagement(params: {
  bookingId: string;
  roomId: string;
  roomNumber: string;
  hotelId: string;
  eventType: RoomEngagementEvent;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await authClient.post(`${HOTEL_OTA_BASE}/v1/room-engagement/track`, {
      bookingId: params.bookingId,
      roomId: params.roomId,
      roomNumber: params.roomNumber,
      hotelId: params.hotelId,
      eventType: params.eventType,
      metadata: params.metadata,
    });
  } catch (err) {
    // Non-critical — don't block user flow if tracking fails
    logger.warn('[RoomQRService] Engagement tracking failed', { error: err });
  }
}

// ─── Mind Integration ─────────────────────────────────────────────────────────────

const REZ_MIND_URL = process.env.NEXT_PUBLIC_REZ_MIND_URL ?? 'https://rez-event-platform.onrender.com';
const INTENT_CAPTURE_URL = process.env.NEXT_PUBLIC_INTENT_CAPTURE_URL ?? 'https://rez-intent-graph.onrender.com';

/**
 * Send room engagement event to Mind
 */
export async function sendRoomEngagementToMind(params: {
  bookingId: string;
  roomId: string;
  hotelId: string;
  eventType: RoomEngagementEvent;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/room-engagement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: `room_${params.eventType}`,
        booking_id: params.bookingId,
        room_id: params.roomId,
        hotel_id: params.hotelId,
        event_type: params.eventType,
        metadata: params.metadata,
        source: 'room-qr',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // Fire-and-forget
    logger.warn('[RoomQRService] Mind send failed', { error: err });
  }
}

/**
 * Capture room intent to intent graph
 */
export async function captureRoomIntent(params: {
  userId?: string;
  bookingId: string;
  roomId: string;
  hotelId: string;
  eventType: RoomEngagementEvent;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        appType: 'room-hub',
        event: `room_${params.eventType}`,
        intentKey: `room_${params.hotelId}_${params.roomId}_${params.eventType}`,
        metadata: {
          bookingId: params.bookingId,
          roomId: params.roomId,
          hotelId: params.hotelId,
          ...params.metadata,
        },
      }),
    });
  } catch (err) {
    // Fire-and-forget
    logger.warn('[RoomQRService] Intent capture failed', { error: err });
  }
}
