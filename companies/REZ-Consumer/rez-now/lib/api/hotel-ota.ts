/**
 * Hotel OTA API Client for REZ Now
 *
 * Connects the REZ Now frontend to the Hotel OTA (Stayeon) backend.
 * Used for Hotel QR Room Hub access — guests scan QR codes in their room
 * to access room services via the hotel's REZ Now store page.
 *
 * Base URL: NEXT_PUBLIC_HOTEL_OTA_API_URL
 * Auth: Hotel OTA JWT (obtained via REZ SSO → /v1/auth/rez-sso exchange)
 *
 * NOTE: For client-side calls, use the internal API route
 * (/api/hotel-room/[hotelSlug]/[roomId]) which proxies to Hotel OTA.
 * This file is for server-side usage where direct HTTP calls are needed.
 */

import { authClient, publicClient } from './client';
import { getAccessToken } from './client';

const HOTEL_OTA_BASE =
  process.env.NEXT_PUBLIC_HOTEL_OTA_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3008'
    : 'https://hotel-ota-api.onrender.com');

// ─── Types ───────────────────────────────────────────────────────────────────

export type RoomServiceType =
  | 'housekeeping'
  | 'room_service'
  | 'laundry'
  | 'transport'
  | 'spa'
  | 'maintenance'
  | 'concierge'
  | 'fitness';

export interface RoomServiceItem {
  id: string;
  name: string;
  price: number; // paise (0 = free)
  category: string;
  description?: string;
  image?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
}

export interface RoomServiceRequest {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  serviceType: RoomServiceType;
  description?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  totalAmountPaise: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'now';
  createdAt: string;
  updatedAt: string;
}

export interface RoomServiceMenu {
  beverages: RoomServiceItem[];
  snacks: RoomServiceItem[];
  meals: RoomServiceItem[];
  housekeeping: RoomServiceItem[];
  laundry: RoomServiceItem[];
}

export interface ChatThread {
  id: string;
  bookingId: string;
  roomId: string;
  hotelId: string;
  guestUserId: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderType: 'guest' | 'staff' | 'system';
  senderName: string;
  messageType: 'text' | 'image' | 'system';
  content: string;
  readAt: string | null;
  createdAt: string;
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
}

// ─── Room QR Validation ────────────────────────────────────────────────────────

export interface QRValidationResult {
  valid: boolean;
  roomContext?: RoomHubContext;
  error?: string;
}

/**
 * Validate a room QR payload and return room context.
 * Called when guest scans a hotel room QR code.
 */
export async function validateRoomQR(
  qrPayload: string
): Promise<QRValidationResult> {
  try {
    const { data } = await publicClient.post<{
      success: boolean;
      data?: RoomHubContext;
      message?: string;
    }>(`${HOTEL_OTA_BASE}/v1/room-qr/validate`, {
      qrData: qrPayload,
    });
    if (!data.success || !data.data) {
      return { valid: false, error: data.message ?? 'Invalid QR code' };
    }
    return { valid: true, roomContext: data.data };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'QR validation failed';
    return { valid: false, error: message };
  }
}

// ─── Room Service Menu ─────────────────────────────────────────────────────────

/**
 * Get room service menu for a hotel.
 */
export async function getHotelRoomServiceMenu(
  hotelId: string
): Promise<RoomServiceMenu> {
  const { data } = await authClient.get<{ success: boolean; data?: RoomServiceMenu }>(
    `${HOTEL_OTA_BASE}/v1/room-service/menu/${hotelId}`
  );
  return data.data ?? {
    beverages: [],
    snacks: [],
    meals: [],
    housekeeping: [],
    laundry: [],
  };
}

// ─── Room Service Requests ─────────────────────────────────────────────────────

/**
 * Get guest's room service requests.
 */
export async function getMyRoomServiceRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ requests: RoomServiceRequest[]; total: number }> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: { requests: RoomServiceRequest[]; total: number };
  }>(`${HOTEL_OTA_BASE}/v1/room-service/guest/my-requests`, {
    params,
  });
  return data.data ?? { requests: [], total: 0 };
}

/**
 * Get a specific room service request.
 */
export async function getRoomServiceRequest(
  requestId: string
): Promise<RoomServiceRequest | null> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: RoomServiceRequest;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/${requestId}`);
  return data.data ?? null;
}

/**
 * Create a room service request.
 */
export async function createRoomServiceRequest(params: {
  bookingId: string;
  roomId: string;
  serviceType: RoomServiceType;
  description?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  priority?: 'low' | 'medium' | 'high' | 'now';
}): Promise<RoomServiceRequest> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: RoomServiceRequest;
    message?: string;
  }>(`${HOTEL_OTA_BASE}/v1/room-service`, {
    bookingId: params.bookingId,
    roomId: params.roomId,
    serviceType: params.serviceType,
    description: params.description,
    items: params.items,
    priority: params.priority ?? 'medium',
  });
  if (!data.success) throw new Error(data.message ?? 'Failed to create request');
  return data.data as RoomServiceRequest;
}

// ─── Room Chat ────────────────────────────────────────────────────────────────

/**
 * Get or create a chat thread for a booking.
 */
export async function getOrCreateChatThread(params: {
  bookingId: string;
  roomId: string;
  initialMessage?: string;
}): Promise<{ threadId: string }> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: { threadId: string };
  }>(`${HOTEL_OTA_BASE}/v1/room-chat/threads`, {
    bookingId: params.bookingId,
    roomId: params.roomId,
    message: params.initialMessage,
  });
  return { threadId: data.data?.threadId ?? '' };
}

/**
 * Get chat thread with messages.
 */
export async function getChatThread(
  threadId: string,
  page = 1,
  limit = 50
): Promise<{ thread: ChatThread; messages: ChatMessage[]; total: number }> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: {
      thread: ChatThread;
      messages: ChatMessage[];
      totalCount: number;
    };
  }>(`${HOTEL_OTA_BASE}/v1/room-chat/threads/${threadId}`, {
    params: { page, limit },
  });
  const d = data.data;
  return {
    thread: d?.thread as ChatThread,
    messages: d?.messages ?? [],
    total: d?.totalCount ?? 0,
  };
}

/**
 * Get user's chat threads.
 */
export async function getMyChatThreads(): Promise<ChatThread[]> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: { threads: ChatThread[] };
  }>(`${HOTEL_OTA_BASE}/v1/room-chat/threads`);
  return data.data?.threads ?? [];
}

/**
 * Send a chat message.
 */
export async function sendChatMessage(params: {
  threadId: string;
  content: string;
  messageType?: string;
}): Promise<ChatMessage> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: ChatMessage;
  }>(`${HOTEL_OTA_BASE}/v1/room-chat/threads/${params.threadId}/messages`, {
    content: params.content,
    messageType: params.messageType ?? 'text',
  });
  return data.data as ChatMessage;
}

/**
 * Mark messages as read.
 */
export async function markChatRead(threadId: string): Promise<void> {
  await authClient.patch(`${HOTEL_OTA_BASE}/v1/room-chat/threads/${threadId}/read`);
}

/**
 * Close a chat thread.
 */
export async function closeChatThread(threadId: string): Promise<void> {
  await authClient.patch(`${HOTEL_OTA_BASE}/v1/room-chat/threads/${threadId}/close`);
}

// ─── Minibar Service ───────────────────────────────────────────────────────────

export interface MinibarMenu {
  beverages: RoomServiceItem[];
  snacks: RoomServiceItem[];
  instant: RoomServiceItem[];
}

export interface MinibarBill {
  roomId: string;
  bookingId: string;
  items: Array<{
    id: string;
    name: string;
    pricePaise: number;
    quantity: number;
    consumedAt: string;
  }>;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
}

/**
 * Get minibar menu for a hotel.
 */
export async function getMinibarMenu(
  hotelId: string
): Promise<MinibarMenu> {
  const { data } = await publicClient.get<{ success: boolean; data?: MinibarMenu }>(
    `${HOTEL_OTA_BASE}/v1/room-service/minibar/${hotelId}/menu`
  );
  return data.data ?? { beverages: [], snacks: [], instant: [] };
}

/**
 * Get minibar bill for a room.
 */
export async function getMinibarBill(
  roomId: string
): Promise<MinibarBill | null> {
  const { data } = await authClient.get<{ success: boolean; data?: MinibarBill }>(
    `${HOTEL_OTA_BASE}/v1/room-service/minibar/${roomId}/bill`
  );
  return data.data ?? null;
}

/**
 * Record minibar consumption.
 */
export async function recordMinibarConsumption(params: {
  roomId: string;
  itemId: string;
  quantity?: number;
}): Promise<{ id: string; itemId: string; quantity: number; consumedAt: string }> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: { id: string; itemId: string; quantity: number; consumedAt: string };
    message?: string;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/minibar/${params.roomId}/consume`, {
    itemId: params.itemId,
    quantity: params.quantity ?? 1,
  });
  if (!data.success) throw new Error(data.message ?? 'Failed to record consumption');
  return data.data as { id: string; itemId: string; quantity: number; consumedAt: string };
}

// ─── Guest Feedback ────────────────────────────────────────────────────────────

export interface GuestFeedbackInput {
  bookingId: string;
  roomId: string;
  overallRating: number;
  categories: {
    cleanliness: number;
    service: number;
    amenities: number;
    comfort: number;
  };
  comment?: string;
  issues?: string[];
  wouldRecommend: boolean;
}

export interface GuestFeedbackResponse {
  id: string;
  bookingId: string;
  overallRating: number;
  wouldRecommend: boolean;
  submittedAt: string;
}

/**
 * Submit guest feedback for a booking.
 */
export async function submitGuestFeedback(
  feedback: GuestFeedbackInput
): Promise<GuestFeedbackResponse> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: GuestFeedbackResponse;
    message?: string;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/feedback`, feedback);
  if (!data.success) throw new Error(data.message ?? 'Failed to submit feedback');
  return data.data as GuestFeedbackResponse;
}

/**
 * Get feedback for a booking.
 */
export async function getGuestFeedback(
  bookingId: string
): Promise<GuestFeedbackResponse | null> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: GuestFeedbackResponse;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/feedback/${bookingId}`);
  return data.data ?? null;
}

// ─── Room Preferences ─────────────────────────────────────────────────────────

export type LightingPreference = 'bright' | 'dim' | 'dark';
export type PillowPreference = 'soft' | 'firm' | 'extra_pillows';
export type LanguagePreference = 'en' | 'hi';

export interface RoomPreferences {
  temperature: number;
  lighting: LightingPreference;
  pillowType: PillowPreference;
  dietaryRestrictions: string[];
  allergies: string[];
  language: LanguagePreference;
  isDefault?: boolean;
  updatedAt?: string;
}

/**
 * Get room preferences for a guest.
 */
export async function getRoomPreferences(
  guestId: string,
  roomId: string
): Promise<RoomPreferences> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: RoomPreferences;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/preferences/${guestId}/${roomId}`);
  return data.data ?? {
    temperature: 22,
    lighting: 'dim',
    pillowType: 'soft',
    dietaryRestrictions: [],
    allergies: [],
    language: 'en',
    isDefault: true
  };
}

/**
 * Update room preferences for a guest.
 */
export async function updateRoomPreferences(
  guestId: string,
  roomId: string,
  preferences: Partial<RoomPreferences>
): Promise<RoomPreferences> {
  const { data } = await authClient.put<{
    success: boolean;
    data?: RoomPreferences;
    message?: string;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/preferences/${guestId}/${roomId}`, preferences);
  if (!data.success) throw new Error(data.message ?? 'Failed to update preferences');
  return data.data as RoomPreferences;
}

// ─── Checkout Bill (Folio) ───────────────────────────────────────────────────

export interface ChargeItem {
  id: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  date: string;
  category: string;
}

export interface FolioBill {
  bookingId: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  roomCharges: ChargeItem[];
  minibar: ChargeItem[];
  laundry: ChargeItem[];
  restaurant: ChargeItem[];
  spa: ChargeItem[];
  transport: ChargeItem[];
  other: ChargeItem[];
  subtotalPaise: number;
  taxesPaise: number;
  totalPaise: number;
}

/**
 * Get checkout bill (folio) for a booking.
 */
export async function getCheckoutBill(
  bookingId: string
): Promise<FolioBill | null> {
  const { data } = await authClient.get<{
    success: boolean;
    data?: FolioBill;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/checkout/${bookingId}/bill`);
  return data.data ?? null;
}

// ─── Enhanced Room Service ─────────────────────────────────────────────────────

export type RoomServiceCategory =
  | 'housekeeping'
  | 'room_service'
  | 'laundry'
  | 'maintenance'
  | 'spa'
  | 'transport'
  | 'concierge';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface EnhancedRoomServiceRequest {
  hotelId: string;
  roomId: string;
  guestId: string;
  category: RoomServiceCategory;
  itemId?: string;
  priority?: Priority;
  scheduledFor?: string;
  notes?: string;
  quantity?: number;
}

export interface EnhancedRoomServiceResponse {
  id: string;
  bookingId: string;
  category: RoomServiceCategory;
  priority: Priority;
  scheduledFor?: string;
  notes?: string;
  totalAmountPaise: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

/**
 * Create an enhanced room service request with priority and scheduling.
 */
export async function createEnhancedRoomServiceRequest(
  request: EnhancedRoomServiceRequest
): Promise<EnhancedRoomServiceResponse> {
  const { data } = await authClient.post<{
    success: boolean;
    data?: EnhancedRoomServiceResponse;
    message?: string;
  }>(`${HOTEL_OTA_BASE}/v1/room-service/enhanced`, request);
  if (!data.success) throw new Error(data.message ?? 'Failed to create service request');
  return data.data as EnhancedRoomServiceResponse;
}

// ─── Room Engagement Tracking (REZ Coin Rewards) ───────────────────────────────

export type EngagementEvent =
  | 'scan'
  | 'view_menu'
  | 'order'
  | 'call_waiter'
  | 'request_bill'
  | 'chat_sent'
  | 'service_requested';

/**
 * Track room engagement events for REZ coin rewards.
 */
export async function trackRoomEngagement(params: {
  bookingId: string;
  roomId: string;
  roomNumber: string;
  hotelId: string;
  eventType: EngagementEvent;
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
  } catch {
    // Non-critical — don't block user flow if tracking fails
  }
}
