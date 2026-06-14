/**
 * RAG Chat API Route
 *
 * POST /api/chat/rag
 * Process user query with RAG-powered menu chatbot
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { processQuery, RagQuery } from '@/lib/chat/ragBot';
import { MenuItem } from '@/lib/types';

// ── Menu Fetching ───────────────────────────────────────────────────────────────

/**
 * Fetch menu items for a store
 * In production, this would call the internal API
 */
async function fetchStoreMenu(storeSlug: string): Promise<MenuItem[]> {
  const internalApiUrl = process.env.INTERNAL_API_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalApiUrl || !internalToken) {
    logger.warn('[RAG Chat] Internal API not configured');
    return [];
  }

  try {
    const response = await fetch(`${internalApiUrl}/api/menu/${storeSlug}`, {
      headers: {
        'Authorization': `Bearer ${internalToken}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      logger.error('[RAG Chat] Failed to fetch menu', { status: response.status });
      return [];
    }

    const data = await response.json();
    return data.items || data.menu || [];
  } catch (error) {
    logger.error('[RAG Chat] Error fetching menu', { error });
    return [];
  }
}

// ── API Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const { userId, storeId, storeSlug, query, context } = body as RagQuery;

    if (!userId || !storeSlug || !query) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, storeSlug, query' },
        { status: 400 }
      );
    }

    logger.info('[RAG Chat] Processing query', {
      userId,
      storeSlug,
      query: query.slice(0, 50),
      intent: body.context?.detectedIntent,
    });

    // Fetch menu items for the store
    const menuItems = await fetchStoreMenu(storeSlug);

    // Process the query with RAG
    const ragQuery: RagQuery = {
      userId,
      storeId: storeId || '',
      storeSlug,
      query,
      context: context || {},
    };

    const response = await processQuery(ragQuery, menuItems);

    logger.info('[RAG Chat] Query processed', {
      userId,
      intent: response.intent,
      confidence: response.confidence,
      sourcesCount: response.sources.length,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    logger.error('[RAG Chat] Error processing request', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

// ── Health Check ────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'rag-chat',
    timestamp: new Date().toISOString(),
  });
}
