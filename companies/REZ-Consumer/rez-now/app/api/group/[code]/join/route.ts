import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { GroupSession, GroupMember } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage (in production, use database)
const sessions = new Map<string, GroupSession>();

function generateId(): string {
  return `${Date.now()}-${randomBytes(6).toString('hex')}`;
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
    const { storeSlug, memberName, memberId } = body;

    if (!memberName) {
      return NextResponse.json(
        { error: 'Member name is required' },
        { status: 400 }
      );
    }

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

    // Verify store slug matches
    if (storeSlug && session.storeSlug !== storeSlug) {
      return NextResponse.json(
        { error: 'This code is not valid for this store' },
        { status: 403 }
      );
    }

    // Check if member already exists (using phone/memberId)
    if (memberId) {
      const existingMember = session.members.find((m) => m.id === memberId);
      if (existingMember) {
        return NextResponse.json(session);
      }
    }

    // Create new member
    const newMember: GroupMember = {
      id: generateId(),
      name: memberName,
      phone: '', // Would be extracted from auth
      isHost: false,
      joinedAt: new Date().toISOString(),
      items: [],
      totalAmount: 0,
    };

    session.members.push(newMember);
    sessions.set(upperCode, session);

    // In production, emit Socket.IO event here
    // io.to(`group:${upperCode}`).emit('group:member:joined', { member: newMember, session });

    return NextResponse.json(session);
  } catch (error) {
    logger.error('Error joining session:', { error });
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}
