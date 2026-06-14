/**
 * Chat Analytics API Route
 *
 * Tracks chat interactions and provides analytics.
 * GET /api/chat/analytics - Get analytics data
 * POST /api/chat/analytics - Record a chat event
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatEvent {
  id: string;
  type: 'message_sent' | 'message_received' | 'session_start' | 'session_end' | 'action_clicked' | 'order_placed';
  sessionId: string;
  userId: string;
  storeSlug: string;
  timestamp: string;
  metadata?: {
    messageLength?: number;
    intent?: string;
    actionType?: string;
    orderId?: string;
    responseTime?: number;
  };
}

interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  commonIntents: Record<string, number>;
  ordersFromChat: number;
  topQuestions: Array<{ question: string; count: number }>;
  satisfactionRatings: Array<{ rating: number; count: number }>;
  period: {
    start: string;
    end: string;
  };
}

// ── In-Memory Storage (for demo - use a real DB in production) ──────────────────

const analyticsStore: ChatEvent[] = [];
const MAX_EVENTS = 10000;

// ── GET Handler ────────────────────────────────────────────────────────────────

/**
 * GET /api/chat/analytics
 * Get chat analytics data
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const storeSlug = searchParams.get('storeSlug');
  const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d

  try {
    // Calculate period dates
    const now = new Date();
    const periodMs: Record<string, number> = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const startDate = new Date(now.getTime() - (periodMs[period] || periodMs['7d']));

    // Filter events by period and store
    let events = analyticsStore.filter(e => new Date(e.timestamp) >= startDate);
    if (storeSlug) {
      events = events.filter(e => e.storeSlug === storeSlug);
    }

    // Calculate analytics
    const sessions = new Set(events.map(e => e.sessionId));
    const messages = events.filter(e => e.type === 'message_sent' || e.type === 'message_received');
    const ordersFromChat = events.filter(e => e.type === 'order_placed');
    const actionClicks = events.filter(e => e.type === 'action_clicked');

    // Calculate common intents
    const intentCounts: Record<string, number> = {};
    events.forEach(e => {
      if (e.metadata?.intent) {
        intentCounts[e.metadata.intent] = (intentCounts[e.metadata.intent] || 0) + 1;
      }
    });

    // Get top questions (simplified - in production, store actual questions)
    const topQuestions = Object.entries(intentCounts)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const analytics: ChatAnalytics = {
      totalSessions: sessions.size,
      totalMessages: messages.length,
      avgMessagesPerSession: sessions.size > 0 ? Math.round(messages.length / sessions.size * 10) / 10 : 0,
      commonIntents: intentCounts,
      ordersFromChat: ordersFromChat.length,
      topQuestions,
      satisfactionRatings: [],
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    logger.error('[Chat Analytics] Error getting analytics', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}

// ── POST Handler ───────────────────────────────────────────────────────────────

/**
 * POST /api/chat/analytics
 * Record a chat event
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { type, sessionId, userId, storeSlug, metadata } = body as {
      type: ChatEvent['type'];
      sessionId: string;
      userId: string;
      storeSlug: string;
      metadata?: ChatEvent['metadata'];
    };

    // Validate required fields
    if (!type || !sessionId || !userId || !storeSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create event with secure random ID
    const event: ChatEvent = {
      id: `evt_${Date.now()}_${randomBytes(6).toString('hex')}`,
      type,
      sessionId,
      userId,
      storeSlug,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Store event (with size limit)
    if (analyticsStore.length >= MAX_EVENTS) {
      analyticsStore.shift(); // Remove oldest
    }
    analyticsStore.push(event);

    logger.debug('[Chat Analytics] Event recorded', {
      eventId: event.id,
      type,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    logger.error('[Chat Analytics] Error recording event', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

// ── Export for internal use ────────────────────────────────────────────────────

export function recordChatEvent(event: Omit<ChatEvent, 'id' | 'timestamp'>): void {
  const fullEvent: ChatEvent = {
    ...event,
    id: `evt_${Date.now()}_${randomBytes(6).toString('hex')}`,
    timestamp: new Date().toISOString(),
  };

  if (analyticsStore.length >= MAX_EVENTS) {
    analyticsStore.shift();
  }
  analyticsStore.push(fullEvent);
}
