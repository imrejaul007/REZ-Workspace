/**
 * Menu Knowledge Base API Route
 *
 * GET /api/kb/menu - Get knowledge base stats
 * POST /api/kb/menu - Build/update knowledge base
 * DELETE /api/kb/menu - Clear knowledge base cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import {
  getKnowledgeBase,
  invalidateKBCache,
  calculateKBStats,
  searchKnowledgeBase,
  MenuKnowledgeItem,
} from '@/lib/kb/menuKnowledge';
import { MenuItem } from '@/lib/types';

// ── Menu Fetching ───────────────────────────────────────────────────────────────

/**
 * Fetch all menu items
 */
async function fetchAllMenuItems(): Promise<MenuItem[]> {
  const internalApiUrl = process.env.INTERNAL_API_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalApiUrl || !internalToken) {
    logger.warn('[KB Menu] Internal API not configured');
    return [];
  }

  try {
    // Fetch from a menu endpoint - adjust based on actual API
    const response = await fetch(`${internalApiUrl}/api/menu/items`, {
      headers: {
        'Authorization': `Bearer ${internalToken}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    logger.error('[KB Menu] Error fetching menu', { error });
    return [];
  }
}

// ── GET Handler ────────────────────────────────────────────────────────────────

/**
 * GET /api/kb/menu
 * Get knowledge base stats or search
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const dietary = searchParams.get('dietary');

  try {
    // Fetch menu items
    const menuItems = await fetchAllMenuItems();
    const kb = getKnowledgeBase(menuItems);

    // Stats request
    if (action === 'stats') {
      const stats = calculateKBStats(kb.items);
      return NextResponse.json({
        success: true,
        ...stats,
      });
    }

    // Search request
    if (query || category || dietary) {
      const filters: Parameters<typeof searchKnowledgeBase>[2] = {};

      if (category) {
        filters.category = category;
      }

      if (dietary) {
        filters.dietary = {};
        if (dietary.includes('vegan')) filters.dietary.vegan = true;
        if (dietary.includes('vegetarian')) filters.dietary.vegetarian = true;
        if (dietary.includes('gluten-free')) filters.dietary.glutenFree = true;
      }

      const results = searchKnowledgeBase(query || '', kb.items, filters);

      return NextResponse.json({
        success: true,
        count: results.length,
        items: results.slice(0, 20), // Limit results
      });
    }

    // Default: return knowledge base info
    const stats = calculateKBStats(kb.items);
    return NextResponse.json({
      success: true,
      lastUpdated: kb.lastUpdated,
      stats,
    });
  } catch (error) {
    logger.error('[KB Menu] Error getting knowledge base', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get knowledge base' },
      { status: 500 }
    );
  }
}

// ── POST Handler ──────────────────────────────────────────────────────────────

/**
 * POST /api/kb/menu
 * Build or rebuild the knowledge base
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, forceRefresh } = body;

    logger.info('[KB Menu] Building knowledge base', {
      storeSlug,
      forceRefresh: !!forceRefresh,
    });

    // Fetch menu items
    let menuItems: MenuItem[];

    if (storeSlug) {
      const internalApiUrl = process.env.INTERNAL_API_URL;
      const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

      if (internalApiUrl && internalToken) {
        const response = await fetch(`${internalApiUrl}/api/menu/${storeSlug}`, {
          headers: {
            'Authorization': `Bearer ${internalToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          menuItems = data.items || data.menu || [];
        } else {
          menuItems = [];
        }
      } else {
        menuItems = [];
      }
    } else {
      menuItems = await fetchAllMenuItems();
    }

    // Build knowledge base
    const kb = getKnowledgeBase(menuItems, !!forceRefresh);
    const stats = calculateKBStats(kb.items);

    logger.info('[KB Menu] Knowledge base built', {
      itemCount: stats.totalItems,
      categories: stats.categories.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Knowledge base built successfully',
      lastUpdated: kb.lastUpdated,
      stats,
    });
  } catch (error) {
    logger.error('[KB Menu] Error building knowledge base', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to build knowledge base' },
      { status: 500 }
    );
  }
}

// ── DELETE Handler ─────────────────────────────────────────────────────────────

/**
 * DELETE /api/kb/menu
 * Clear knowledge base cache
 */
export async function DELETE() {
  try {
    invalidateKBCache();

    logger.info('[KB Menu] Knowledge base cache cleared');

    return NextResponse.json({
      success: true,
      message: 'Knowledge base cache cleared',
    });
  } catch (error) {
    logger.error('[KB Menu] Error clearing cache', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
