import { publicClient, authClient } from './client';
import { logger } from '@/lib/utils/logger';

/**
 * Room Service API
 * Handles room-specific QR code scanning and service requests
 */

// QR Type Detection
export type QRType = 'room' | 'store';

export interface QRTypeResult {
  type: QRType;
  identifier: string;
  metadata?: Record<string, string>;
}

/**
 * Detect QR code type and extract room/store identifier
 * Supports formats:
 * - Room QR: /room/ROOM_ID or room-ROOM_ID or {"type":"room","id":"ROOM_ID"}
 * - Store QR: /STORE_SLUG or store-STORE_SLUG or {"type":"store","slug":"STORE_SLUG"}
 */
export function detectQRType(url: string): QRTypeResult {
  // Handle JSON format
  try {
    const parsed = JSON.parse(url);
    if (parsed.type === 'room' && parsed.id) {
      return { type: 'room', identifier: parsed.id, metadata: { roomId: parsed.id, bookingId: parsed.bookingId } };
    }
    if (parsed.type === 'store' && parsed.slug) {
      return { type: 'store', identifier: parsed.slug };
    }
  } catch {
    // Not JSON, continue parsing
  }

  // Handle URL format: /room/ABC123 or /store/hotel-name
  const urlMatch = url.match(/\/(room|store)\/([A-Za-z0-9_-]+)/i);
  if (urlMatch) {
    return { type: urlMatch[1].toLowerCase() as QRType, identifier: urlMatch[2] };
  }

  // Handle prefix format: room-ABC123 or store-hotel-slug
  const prefixMatch = url.match(/^(room|store)[-_]([A-Za-z0-9_-]+)/i);
  if (prefixMatch) {
    return { type: prefixMatch[1].toLowerCase() as QRType, identifier: prefixMatch[2] };
  }

  // Handle plain token (assume room QR token for backward compatibility)
  if (url.length > 10 && !url.includes('/')) {
    return { type: 'room', identifier: url };
  }

  // Default to store for any other URL format
  return { type: 'store', identifier: url };
}

export interface RoomContext {
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: string;
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  bookingId?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface RoomServiceRequest {
  id: string;
  roomId: string;
  roomNumber: string;
  serviceType: string;
  description?: string;
  items?: RoomOrderItem[];
  totalAmountPaise: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface RoomOrderItem {
  id: string;
  name: string;
  price: number; // in paise
  quantity: number;
  category: string;
}

/**
 * Validate room QR code and get room context
 */
export async function validateRoomQR(qrData: string): Promise<RoomContext> {
  const { data } = await publicClient.post('/api/room-qr/validate', {
    qrData,
  });
  if (!data.success) throw new Error(data.message || 'Invalid QR code');
  return data.data as RoomContext;
}

/**
 * Get room service request status
 */
export async function getRoomServiceRequest(requestId: string) {
  const { data } = await authClient.get(`/api/room-service/${requestId}`);
  return data;
}

/**
 * Get guest's room service requests
 */
export async function getMyRoomServiceRequests(status?: string) {
  const { data } = await authClient.get('/api/room-service/guest/my-requests', {
    params: status ? { status } : undefined,
  });
  return data;
}

/**
 * Create a room service request
 */
export async function createRoomServiceRequest(params: {
  bookingId: string;
  roomId: string;
  serviceType: string;
  description?: string;
  items?: RoomOrderItem[];
  priority?: 'low' | 'medium' | 'high' | 'now';
}) {
  const { data } = await authClient.post('/api/room-service', params);
  return data;
}

/**
 * Call waiter to room
 */
export async function callWaiterToRoom(params: {
  hotelSlug: string;
  roomId: string;
  roomNumber: string;
  message?: string;
}) {
  const { data } = await publicClient.post('/api/room-service/waiter/call', params);
  return data;
}

/**
 * Request bill for room
 */
export async function requestRoomBill(params: {
  hotelSlug: string;
  roomId: string;
  roomNumber: string;
}) {
  const { data } = await publicClient.post('/api/room-service/bill/request', params);
  return data;
}

/**
 * Get room's order history
 */
export async function getRoomOrderHistory(params: {
  hotelSlug: string;
  roomId: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await authClient.get('/api/room-service/orders', {
    params,
  });
  return data;
}

/**
 * Room engagement tracking - sends event to REZ for coin rewards
 */
export async function trackRoomEngagement(params: {
  roomId: string;
  roomNumber: string;
  hotelId: string;
  eventType: 'scan' | 'view_menu' | 'order' | 'call_waiter' | 'request_bill';
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data } = await authClient.post('/api/room-service/track-engagement', params);
    return data;
  } catch (error) {
    // Don't fail the request if tracking fails
    logger.error('Failed to track engagement', { error });
    return null;
  }
}
