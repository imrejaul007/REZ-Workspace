import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// CRITICAL FIX: Fail fast if QR_SECRET is not configured
const QR_SECRET = process.env.QR_SECRET;
if (!QR_SECRET) {
  throw new Error('FATAL: QR_SECRET environment variable is required');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, trialId, slotTime } = body;

  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
    include: { merchant: true },
  });

  if (!trial || trial.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Trial not available' }, { status: 400 });
  }

  // Generate QR token with cryptographically secure random generation
  const bookingId = crypto.randomUUID();
  const qrToken = crypto.randomBytes(16).toString('hex');
  // CRITICAL FIX: Use secure HMAC with required secret - no fallback
  const qrSignature = crypto.createHmac('sha256', QR_SECRET)
    .update(qrToken)
    .digest('hex');
  const qrExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  const booking = await prisma.booking.create({
    data: {
      id: bookingId,
      userId,
      trialId,
      merchantId: trial.merchantId,
      qrToken,
      qrSignature,
      slotTime: new Date(slotTime),
      qrExpiresAt,
      coinAmount: trial.coinPrice,
      commitmentFee: trial.commitmentFee,
      status: 'ACTIVE',
    },
    include: {
      trial: { include: { merchant: true } },
    },
  });

  return NextResponse.json({ booking });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const bookings = await prisma.booking.findMany({
    where: { userId: userId || undefined },
    include: {
      trial: { include: { merchant: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ bookings });
}
