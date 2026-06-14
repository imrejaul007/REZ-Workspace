import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/utils/logger';
import { loyaltyDb, usersDb } from '@/lib/mongodb';

/**
 * POST /api/loyalty/redeem
 *
 * Redeem accumulated stamps for a reward.
 * This endpoint creates a reward code valid for 24 hours.
 * Requires idempotency key to prevent duplicate redemptions.
 */

function generateRewardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// In-memory store for idempotency (use Redis/DB in production)
const processedIdempotencyKeys = new Map<string, { rewardCode: string; expiresAt: string }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isIdempotencyKeyProcessed(key: string): boolean {
  const record = processedIdempotencyKeys.get(key);
  if (!record) return false;
  if (Date.now() > (record.expiresAt ? new Date(record.expiresAt).getTime() : 0)) {
    processedIdempotencyKeys.delete(key);
    return false;
  }
  return true;
}

function markIdempotencyKeyProcessed(key: string, rewardCode: string, expiresAt: string): void {
  processedIdempotencyKeys.set(key, { rewardCode, expiresAt });
  // Cleanup old entries periodically
  if (processedIdempotencyKeys.size > 10000) {
    const now = Date.now();
    for (const [k, v] of processedIdempotencyKeys) {
      if (now > new Date(v.expiresAt).getTime()) {
        processedIdempotencyKeys.delete(k);
      }
    }
  }
}

// Get user stamps from database
async function getUserStamps(authToken: string): Promise<number> {
  try {
    const user = await usersDb.collection('user_sessions').findOne({ token: authToken });
    if (!user || !user.userId) {
      return 0;
    }
    const profile = await usersDb.collection('user_profiles').findOne({ userId: user.userId });
    return profile?.loyaltyStamps || 0;
  } catch (error) {
    logger.error('[Loyalty] Error fetching user stamps', { error });
    return 0;
  }
}

// Deduct stamps from user's account
async function deductStamps(authToken: string, amount: number): Promise<boolean> {
  try {
    const session = await usersDb.collection('user_sessions').findOne({ token: authToken });
    if (!session || !session.userId) {
      return false;
    }

    const result = await usersDb.collection('user_profiles').updateOne(
      { userId: session.userId, loyaltyStamps: { $gte: amount } },
      { $inc: { loyaltyStamps: -amount } }
    );

    // Record redemption in redemptions collection
    const rewardCode = generateRewardCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await loyaltyDb.collection('redemptions').insertOne({
      userId: session.userId,
      stampsRedeemed: amount,
      rewardCode,
      expiresAt,
      createdAt: new Date(),
    });

    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('[Loyalty] Error deducting stamps', { error });
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('rez_access_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeSlug, idempotencyKey } = body;

    if (!storeSlug) {
      return NextResponse.json(
        { success: false, message: 'Store slug is required' },
        { status: 400 }
      );
    }

    if (!idempotencyKey) {
      return NextResponse.json(
        { success: false, message: 'Idempotency key is required' },
        { status: 400 }
      );
    }

    // Check idempotency - return cached result if already processed
    if (isIdempotencyKeyProcessed(idempotencyKey)) {
      const cached = processedIdempotencyKeys.get(idempotencyKey)!;
      logger.info('Duplicate redemption request (idempotency)', { idempotencyKey });
      return NextResponse.json({
        success: true,
        data: {
          rewardCode: cached.rewardCode,
          description: 'Free item or discount',
          expiresAt: cached.expiresAt,
        },
        duplicate: true,
      });
    }

    // Validate user has enough stamps
    const userStamps = await getUserStamps(authToken);
    const requiredStamps = 10; // 10 stamps required for reward

    if (userStamps < requiredStamps) {
      return NextResponse.json(
        { success: false, message: `Insufficient stamps. You have ${userStamps}, but need ${requiredStamps}.` },
        { status: 400 }
      );
    }

    // Deduct stamps from user's account
    const deductSuccess = await deductStamps(authToken, requiredStamps);
    if (!deductSuccess) {
      logger.error('Failed to deduct stamps', { authToken, storeSlug });
      return NextResponse.json(
        { success: false, message: 'Failed to deduct stamps. Please try again.' },
        { status: 500 }
      );
    }

    const rewardCode = generateRewardCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Mark idempotency key as processed
    markIdempotencyKeyProcessed(idempotencyKey, rewardCode, expiresAt);

    logger.info('Reward redeemed', {
      storeSlug,
      rewardCode,
      expiresAt,
      stampsDeducted: requiredStamps,
    });

    return NextResponse.json({
      success: true,
      data: {
        rewardCode,
        description: 'Free item or discount',
        expiresAt,
      },
    });
  } catch (error) {
    logger.error('Failed to redeem reward', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}
