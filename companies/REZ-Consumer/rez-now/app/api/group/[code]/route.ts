import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { GroupSession, GroupMember, SharedItem, GroupSessionStatus, CartItem } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage (shared with parent route)
// In production, this would be in a shared database/service
const sessions = new Map<string, GroupSession>();

// Import shared functions from parent route
// For now, we'll duplicate the logic here since Next.js route modules are isolated
function generateId(): string {
  return `${Date.now()}-${randomBytes(6).toString('hex')}`;
}

// GET /api/group/[code] - Get session by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const session = sessions.get(upperCode);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found or expired' },
      { status: 404 }
    );
  }

  if (session.status !== 'active') {
    return NextResponse.json(
      { error: 'Session is no longer active' },
      { status: 410 }
    );
  }

  return NextResponse.json(session);
}

// POST /api/group/[code]/join - Join an existing session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const upperCode = code.toUpperCase();
    const body = await request.json();
    const { memberName, memberId } = body;

    const session = sessions.get(upperCode);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is no longer active' },
        { status: 410 }
      );
    }

    // Check if member already exists (using memberId if provided)
    if (memberId) {
      const existingMember = session.members.find((m) => m.id === memberId);
      if (existingMember) {
        return NextResponse.json(session);
      }
    }

    // Create new member
    const newMember: GroupMember = {
      id: generateId(),
      name: memberName || 'Guest',
      phone: '', // Would be extracted from auth
      isHost: false,
      joinedAt: new Date().toISOString(),
      items: [],
      totalAmount: 0,
    };

    session.members.push(newMember);
    sessions.set(upperCode, session);

    return NextResponse.json(session);
  } catch (error) {
    logger.error('Error joining session:', { error });
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}
