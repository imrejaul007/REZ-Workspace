import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// CRITICAL FIX: Fail fast if QR_SECRET is not configured
const QR_SECRET = process.env.QR_SECRET;
if (!QR_SECRET) {
  throw new Error('FATAL: QR_SECRET environment variable is required');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { qrToken, signature } = body;

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // CRITICAL FIX: Use secure HMAC verification with required secret
  const expectedSig = crypto.createHmac('sha256', QR_SECRET)
    .update(booking.qrToken)
    .digest('hex');

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
  }

  // Check expiry
  if (new Date() > booking.qrExpiresAt) {
    return NextResponse.json({ error: 'QR code expired' }, { status: 400 });
  }

  // Redeem
  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      status: 'COMPLETED',
      redeemedAt: new Date(),
    },
  });

  // Award points to user
  await prisma.user.update({
    where: { id: booking.userId },
    data: { points: { increment: 100 } },
  });

  return NextResponse.json({ success: true, booking: updated });
}
