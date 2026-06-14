import { NextRequest, NextResponse } from 'next/server';
import { MILESTONES } from '@/lib/config/milestones';
import { TIERS, getTierFromVisits } from '@/lib/config/tiers';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/loyalty/[userId]
 *
 * Get the loyalty profile for a specific user.
 * Used by merchants to view customer loyalty status.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // In production, this would validate the merchant's session
    // and check if they have permission to view this user's data
    const authToken = request.cookies.get('rez_access_token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // In production, fetch from database based on userId
    // For now, return mock data
    const mockProfile = {
      userId,
      totalVisits: Math.floor(Math.random() * 50),
      currentStreak: Math.floor(Math.random() * 14),
      longestStreak: Math.floor(Math.random() * 30),
      lastVisit: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      points: Math.floor(Math.random() * 2000),
      coins: Math.floor(Math.random() * 5000),
      badges: [
        {
          id: 'first_order',
          name: 'First Order',
          icon: '🎉',
          description: 'Completed your first order',
          unlockedAt: '2024-01-15T10:30:00Z',
        },
      ],
      milestones: MILESTONES.slice(0, 8).map((m) => ({
        ...m,
        current: Math.floor(Math.random() * (m.target + 5)),
        unlockedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      })),
      tier: 'silver' as keyof typeof TIERS,
      tierProgress: Math.floor(Math.random() * 100),
      nextTier: 'gold' as keyof typeof TIERS | null,
      perks: TIERS.silver.perks,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    logger.info('Fetched user loyalty profile', { userId });

    return NextResponse.json({
      success: true,
      data: mockProfile,
    });
  } catch (error) {
    logger.error('Failed to get user loyalty profile', {
      userId: params.userId,
      error,
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user loyalty profile' },
      { status: 500 }
    );
  }
}
