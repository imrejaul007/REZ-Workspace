import { NextRequest, NextResponse } from 'next/server';
import { MILESTONES, BADGES } from '@/lib/config/milestones';
import { TIERS, getTierFromVisits } from '@/lib/config/tiers';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/loyalty
 *
 * Get the loyalty profile for the authenticated user.
 * This is a server-side route that would connect to a database in production.
 */

export async function GET(request: NextRequest) {
  try {
    // Get user from session (in production, this would validate the JWT/session)
    const authToken = request.cookies.get('rez_access_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // In production, fetch from database
    // For now, return mock data structure
    const mockProfile = {
      userId: 'user_123',
      totalVisits: 12,
      currentStreak: 3,
      longestStreak: 7,
      lastVisit: new Date().toISOString(),
      points: 450,
      coins: 1200,
      badges: [
        {
          id: 'first_order',
          name: 'First Order',
          icon: '🎉',
          description: 'Completed your first order',
          unlockedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'regular',
          name: 'Regular',
          icon: '⭐',
          description: 'Visited 5 times',
          unlockedAt: '2024-02-01T14:20:00Z',
        },
      ],
      milestones: MILESTONES.slice(0, 5).map((m) => ({
        ...m,
        current: m.id === 'first_order' ? 1 : m.id === 'five_visits' ? 5 : 0,
        unlockedAt:
          m.id === 'first_order'
            ? '2024-01-15T10:30:00Z'
            : m.id === 'five_visits'
            ? '2024-02-01T14:20:00Z'
            : undefined,
      })),
      tier: getTierFromVisits(12) as keyof typeof TIERS,
      tierProgress: 48,
      nextTier: 'gold' as const,
      perks: TIERS.silver.perks,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockProfile,
    });
  } catch (error) {
    logger.error('Failed to get loyalty profile', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loyalty profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty
 *
 * Record a visit or perform other loyalty actions.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'record_visit': {
        // Validate required fields
        const { orderId, storeSlug, storeName, orderTotal } = body;
        if (!orderId || !storeSlug || !storeName || !orderTotal) {
          return NextResponse.json(
            { success: false, message: 'Missing required fields' },
            { status: 400 }
          );
        }

        // In production, this would:
        // 1. Record the visit in the database
        // 2. Update the user's streak
        // 3. Check for milestone unlocks
        // 4. Award coins and points
        // 5. Check for tier upgrades
        // 6. Trigger notifications

        const earnedCoins = Math.floor(orderTotal / 50);
        const earnedPoints = Math.floor(orderTotal / 10);

        const response = {
          success: true,
          data: {
            visit: {
              id: `visit_${Date.now()}`,
              userId: 'user_123',
              storeSlug,
              storeName,
              orderId,
              orderTotal,
              pointsEarned: earnedPoints,
              coinsEarned: earnedCoins,
              visitedAt: new Date().toISOString(),
            },
            events: [],
            earnedCoins,
            earnedPoints,
            unlockedMilestones: [] as unknown[],
            newTier: undefined,
          },
        };

        logger.info('Visit recorded', {
          orderId,
          storeSlug,
          earnedCoins,
          earnedPoints,
        });

        return NextResponse.json(response);
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Failed to process loyalty action', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to process action' },
      { status: 500 }
    );
  }
}
