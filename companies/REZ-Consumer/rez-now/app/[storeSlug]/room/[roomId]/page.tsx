/**
 * Hotel Room Hub Page — Server Component
 * Route: /[storeSlug]/room/[roomId]
 *
 * Guest-facing room operating system — accessed via hotel room QR scan or deep link.
 * Uses the shared fetchRoomHubData utility for SSR.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchRoomHubData } from '@/lib/api/hotel-room';
import RoomHubPageClient from './RoomHubPageClient';

export interface RoomHubServerData {
  roomContext: {
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
  } | null;
  menu: {
    beverages: Array<{ id: string; name: string; price: number; category: string; description?: string }>;
    snacks: Array<{ id: string; name: string; price: number; category: string; description?: string }>;
    meals: Array<{ id: string; name: string; price: number; category: string; description?: string }>;
    housekeeping: Array<{ id: string; name: string; price: number; category: string; description?: string }>;
    laundry: Array<{ id: string; name: string; price: number; category: string; description?: string }>;
  } | null;
  requests: Array<{
    id: string;
    serviceType: string;
    description?: string;
    status: string;
    createdAt: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    totalAmountPaise?: number;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; roomId: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  return {
    title: `${storeSlug} — Room Service | REZ Now`,
    description: `Access room services at ${storeSlug}. Order food, request housekeeping, and more.`,
    robots: { index: false, follow: false },
  };
}

export default async function RoomHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; roomId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { storeSlug, roomId } = await params;
  const { token: roomToken } = await searchParams;

  if (!roomToken) {
    notFound();
    return null;
  }

  // Fetch room data server-side
  const data = await fetchRoomHubData(roomToken);

  if (!data.roomContext) {
    notFound();
    return null;
  }

  return (
    <RoomHubPageClient
      initialData={data as RoomHubServerData}
      hotelSlug={storeSlug}
      roomId={roomId}
      roomToken={roomToken}
    />
  );
}
