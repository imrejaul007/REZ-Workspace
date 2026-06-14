/**
 * Hotel Room Hub API Route
 * Route: /api/hotel-room/[hotelSlug]/[roomId]
 *
 * Handles two roles:
 * - GET: Server component fetches room context + menu (returns data from Hotel OTA)
 * - POST: Client-side actions (chat, service requests) proxy to Hotel OTA
 *
 * All requests proxy to Hotel OTA API with the appropriate auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { fetchRoomHubData, fetchRoomServiceMenu, fetchRoomServiceRequests } from '@/lib/api/hotel-room';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ hotelSlug: string; roomId: string }>;
}

const HOTEL_OTA_BASE =
  process.env.NEXT_PUBLIC_HOTEL_OTA_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3008'
    : 'https://hotel-ota-api.onrender.com');

async function getOtaToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('ota_access_token')?.value ?? null;
}

async function getRoomTokenFromRequest(): Promise<string | null> {
  const headersList = await headers();
  const cookieStore = await cookies();
  return (
    headersList.get('x-room-token') ??
    cookieStore.get('ota_room_token')?.value ??
    null
  );
}

async function proxyToHotelOta(
  path: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: Record<string, unknown>
) {
  const otaToken = await getOtaToken();
  const roomToken = await getRoomTokenFromRequest();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(roomToken ? { 'x-room-token': roomToken } : {}),
    ...(otaToken ? { Authorization: `Bearer ${otaToken}` } : {}),
  };

  const res = await fetch(`${HOTEL_OTA_BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

// GET: fetch room context + menu (used by client for data refresh)
export async function GET(request: NextRequest, context: RouteContext) {
  const { hotelSlug, roomId } = await context.params;
  const { searchParams } = request.nextUrl;
  const roomToken = searchParams.get('token');

  if (!roomToken) {
    return NextResponse.json(
      { success: false, message: 'Room access token is required' },
      { status: 401 }
    );
  }

  const otaToken = await getOtaToken();

  if (!roomToken) {
    return NextResponse.json(
      { success: false, message: 'Invalid room token' },
      { status: 401 }
    );
  }

  try {
    const data = await fetchRoomHubData(roomToken, otaToken || undefined);
    if (!data.roomContext) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired QR code' },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    logger.error('[HotelRoom] GET error:', { error: err });
    return NextResponse.json(
      { success: false, message: 'Failed to load room data' },
      { status: 500 }
    );
  }
}

// POST: client-side actions (create request, send message, etc.)
export async function POST(request: NextRequest, context: RouteContext) {
  const { hotelSlug, roomId } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { action, roomToken, ...actionBody } = body;
  const resolvedRoomToken = roomToken ?? (await getRoomTokenFromRequest());

  // Proxy actions to Hotel OTA
  switch (action) {
    case 'create-request':
      return proxyToHotelOta('/v1/room-service', 'POST', {
        bookingId: actionBody.bookingId,
        roomId: actionBody.roomId ?? roomId,
        serviceType: actionBody.serviceType,
        description: actionBody.description,
        items: actionBody.items,
        priority: actionBody.priority ?? 'medium',
      });

    case 'send-message':
      return proxyToHotelOta(
        `/v1/room-chat/threads/${actionBody.threadId}/messages`,
        'POST',
        { content: actionBody.content, messageType: 'text' }
      );

    case 'create-thread':
      return proxyToHotelOta('/v1/room-chat/threads', 'POST', {
        bookingId: actionBody.bookingId,
        roomId: actionBody.roomId ?? roomId,
        message: actionBody.message,
      });

    case 'get-thread':
      return proxyToHotelOta(
        `/v1/room-chat/threads/${actionBody.threadId}`,
        'GET'
      );

    case 'mark-read':
      return proxyToHotelOta(
        `/v1/room-chat/threads/${actionBody.threadId}/read`,
        'PATCH'
      );

    default:
      return NextResponse.json(
        { success: false, message: `Unknown action: ${action}` },
        { status: 400 }
      );
  }
}
