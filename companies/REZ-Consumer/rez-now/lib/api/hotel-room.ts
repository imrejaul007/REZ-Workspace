/**
 * Hotel Room Hub — shared data-fetching utilities
 *
 * Used by:
 * - app/[storeSlug]/room/[roomId]/page.tsx (server component, SSR)
 * - app/api/hotel-room/[hotelSlug]/[roomId]/route.ts (API route, client actions)
 */

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

export interface RoomServiceItemFlat {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

export interface RoomServiceMenu {
  beverages: RoomServiceItemFlat[];
  snacks: RoomServiceItemFlat[];
  meals: RoomServiceItemFlat[];
  housekeeping: RoomServiceItemFlat[];
  laundry: RoomServiceItemFlat[];
}

export interface RoomServiceRequest {
  id: string;
  serviceType: string;
  description?: string;
  status: string;
  createdAt: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  totalAmountPaise?: number;
}

export interface RoomHubData {
  roomContext: RoomHubContext | null;
  menu: RoomServiceMenu | null;
  requests: RoomServiceRequest[];
}

const HOTEL_OTA_BASE =
  process.env.NEXT_PUBLIC_HOTEL_OTA_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3008'
    : 'https://hotel-ota-api.onrender.com');

function otaHeaders(roomToken?: string, otaToken?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (roomToken) h['x-room-token'] = roomToken;
  if (otaToken) h['Authorization'] = `Bearer ${otaToken}`;
  return h;
}

/**
 * Validate a room QR payload and get room context.
 */
export async function validateRoomQR(roomToken: string): Promise<{
  roomContext: RoomHubContext | null;
  error?: string;
}> {
  try {
    const res = await fetch(`${HOTEL_OTA_BASE}/v1/room-qr/validate`, {
      method: 'POST',
      headers: otaHeaders(roomToken),
      body: JSON.stringify({ qrData: roomToken }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { roomContext: null, error: data.message ?? 'Invalid QR code' };
    }
    return { roomContext: data.data as RoomHubContext };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    return { roomContext: null, error: message };
  }
}

/**
 * Fetch room service menu from Hotel OTA.
 */
export async function fetchRoomServiceMenu(
  hotelId: string,
  otaToken?: string
): Promise<RoomServiceMenu | null> {
  try {
    const res = await fetch(`${HOTEL_OTA_BASE}/v1/room-service/menu/${hotelId}`, {
      headers: otaToken ? { Authorization: `Bearer ${otaToken}` } : {},
    });
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch guest's room service requests.
 */
export async function fetchRoomServiceRequests(
  otaToken?: string
): Promise<RoomServiceRequest[]> {
  try {
    const res = await fetch(`${HOTEL_OTA_BASE}/v1/room-service/guest/my-requests`, {
      headers: otaToken ? { Authorization: `Bearer ${otaToken}` } : {},
    });
    const data = await res.json();
    return data.data?.requests ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch complete Room Hub data for SSR or API route.
 */
export async function fetchRoomHubData(
  roomToken: string,
  otaToken?: string
): Promise<RoomHubData> {
  const { roomContext, error } = await validateRoomQR(roomToken);
  if (error || !roomContext) {
    return { roomContext: null, menu: null, requests: [] };
  }

  const hotelId = roomContext.hotelId;

  const [menu, requests] = await Promise.all([
    fetchRoomServiceMenu(hotelId, otaToken),
    fetchRoomServiceRequests(otaToken),
  ]);

  return { roomContext, menu, requests };
}
