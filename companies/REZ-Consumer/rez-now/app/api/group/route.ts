import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { GroupSession, GroupMember, SharedItem, GroupSessionStatus, CartItem } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage for demo purposes
// In production, this would be stored in a database (Redis, PostgreSQL, etc.)
const sessions = new Map<string, GroupSession>();

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${randomBytes(6).toString('hex')}`;
}

// Generate unique group code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// POST /api/group - Create a new group session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, storeSlug, hostName, tableNumber } = body;

    if (!storeId || !storeSlug || !hostName) {
      return NextResponse.json(
        { error: 'Missing required fields: storeId, storeSlug, hostName' },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateCode();
    while (sessions.has(code)) {
      code = generateCode();
    }

    // Create host member
    const hostId = generateId();
    const host: GroupMember = {
      id: hostId,
      name: hostName,
      phone: '', // Would be extracted from auth
      isHost: true,
      joinedAt: new Date().toISOString(),
      items: [],
      totalAmount: 0,
    };

    // Create session
    const session: GroupSession = {
      id: generateId(),
      code,
      storeId,
      storeSlug,
      storeName: '', // Would be fetched from store API
      hostId,
      members: [host],
      items: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      totalAmount: 0,
      tableNumber,
    };

    // Store session (expires in 4 hours)
    sessions.set(code, session);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    logger.error('Error creating group session:', { error });
    return NextResponse.json(
      { error: 'Failed to create group session' },
      { status: 500 }
    );
  }
}

// GET /api/group - List all active sessions (for debugging/admin)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const storeId = searchParams.get('storeId');
  const status = searchParams.get('status') as GroupSessionStatus | null;

  let result = Array.from(sessions.values());

  if (storeId) {
    result = result.filter((s) => s.storeId === storeId);
  }

  if (status) {
    result = result.filter((s) => s.status === status);
  }

  return NextResponse.json({ sessions: result });
}
