import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const category = searchParams.get('category');

  const trials = await prisma.trial.findMany({
    where: {
      status: 'ACTIVE',
      ...(category && { category }),
    },
    include: {
      merchant: true,
    },
    take: 50,
  });

  // Sort by distance
  const sorted = trials.map(t => ({
    ...t,
    distance: calculateDistance(lat, lng, t.merchant.lat, t.merchant.lng),
  })).sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ trials: sorted });
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
