import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

interface UsualItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  orderCount: number;
  lastOrderedAt: string;
  category?: string;
  isAvailable?: boolean;
}

interface TasteProfile {
  spiceTolerance: number;
  preferredCuisines: string[];
  orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  favoriteCategories: string[];
}

interface UsualResponse {
  items: UsualItem[];
  tasteProfile: TasteProfile | null;
  totalOrders: number;
}

/**
 * GET /api/recommendations/usual
 *
 * Returns user's most ordered items based on their order history.
 * Used for "Your Usual" feature in the menu.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('storeSlug');

    if (!storeSlug) {
      return NextResponse.json(
        { success: false, message: 'storeSlug is required' },
        { status: 400 }
      );
    }

    // Get user's auth token from cookie/header
    // In production, this would validate the user session
    const authToken = request.cookies.get('rez_access_token')?.value;

    if (!authToken) {
      // Return empty response for unauthenticated users
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          tasteProfile: null,
          totalOrders: 0,
        },
      });
    }

    // Fetch user's order history to calculate "usual" items
    // This would typically call an internal service or database
    const response = await fetchFromOrderHistory(authToken, storeSlug);

    if (!response) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          tasteProfile: null,
          totalOrders: 0,
        },
      });
    }

    logger.info('Fetched usual items for user', {
      storeSlug,
      itemCount: response.items.length,
      totalOrders: response.totalOrders,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Failed to fetch usual recommendations', { error });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Fetch order history and calculate usual items
 */
async function fetchFromOrderHistory(
  authToken: string,
  storeSlug: string
): Promise<UsualResponse | null> {
  try {
    // Call internal API to get user's order history for this store
    const response = await fetch(
      `${process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://rez-now.onrender.com'}/api/users/me/orders?storeSlug=${storeSlug}&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      logger.warn('Failed to fetch order history', {
        status: response.status,
        storeSlug,
      });
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.orders) {
      return null;
    }

    // Calculate most ordered items
    const itemCounts = new Map<
      string,
      {
        name: string;
        price: number;
        image?: string;
        category?: string;
        orderCount: number;
        lastOrderedAt: string;
        isAvailable?: boolean;
      }
    >();

    for (const order of data.orders) {
      const orderDate = new Date(order.createdAt);

      for (const item of order.items || []) {
        const existing = itemCounts.get(item.menuItemId || item.name);

        if (existing) {
          existing.orderCount += item.quantity || 1;
          if (orderDate > new Date(existing.lastOrderedAt)) {
            existing.lastOrderedAt = order.createdAt;
          }
        } else {
          itemCounts.set(item.menuItemId || item.name, {
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            orderCount: item.quantity || 1,
            lastOrderedAt: order.createdAt,
            isAvailable: item.isAvailable,
          });
        }
      }
    }

    // Sort by order count and take top items
    const usualItems: UsualItem[] = Array.from(itemCounts.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10)
      .map((item) => ({
        menuItemId: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        price: item.price,
        image: item.image,
        orderCount: item.orderCount,
        lastOrderedAt: item.lastOrderedAt,
        category: item.category,
        isAvailable: item.isAvailable,
      }));

    // Calculate taste profile
    const totalOrders = data.orders?.length || 0;
    let orderingFrequency: TasteProfile['orderingFrequency'] = 'occasional';

    if (totalOrders > 0) {
      const ordersPerMonth = totalOrders / 3; // Approximate
      if (ordersPerMonth >= 20) orderingFrequency = 'daily';
      else if (ordersPerMonth >= 4) orderingFrequency = 'weekly';
      else if (ordersPerMonth >= 1) orderingFrequency = 'monthly';
    }

    // Extract cuisines from order history (simplified)
    const cuisineSet = new Set<string>();
    for (const order of data.orders || []) {
      if (order.storeName) {
        // This would be enriched with actual cuisine data from menu
        cuisineSet.add('Popular');
      }
    }

    const tasteProfile: TasteProfile = {
      spiceTolerance: 1, // Would be calculated from order history
      preferredCuisines: Array.from(cuisineSet).slice(0, 3),
      orderingFrequency,
      favoriteCategories: [], // Would be extracted from order items
    };

    return {
      items: usualItems,
      tasteProfile,
      totalOrders,
    };
  } catch (error) {
    logger.error('Error fetching order history', { error });
    return null;
  }
}
