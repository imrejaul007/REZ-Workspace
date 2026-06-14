import { NextRequest, NextResponse } from 'next/server';
import { GroupSession } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage (in production, use database)
const sessions = new Map<string, GroupSession>();

// POST /api/group/[code]/leave - Leave a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const upperCode = code.toUpperCase();
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const session = sessions.get(upperCode);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const memberIndex = session.members.findIndex((m) => m.id === memberId);

    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'Member not found in session' },
        { status: 404 }
      );
    }

    const member = session.members[memberIndex];

    // If host leaves, either transfer host or end session
    if (member.isHost) {
      if (session.members.length === 1) {
        // Only host, end the session
        sessions.delete(upperCode);
        return NextResponse.json({ success: true, message: 'Session ended' });
      } else {
        // Transfer host to next member
        session.members[0].isHost = true;
        session.hostId = session.members[0].id;
      }
    }

    // Remove member
    session.members.splice(memberIndex, 1);
    sessions.set(upperCode, session);

    // In production, emit Socket.IO event here
    // io.to(`group:${upperCode}`).emit('group:member:left', { memberId, name: member.name, session });

    return NextResponse.json({ success: true, message: 'Left session' });
  } catch (error) {
    logger.error('Error leaving session:', { error });
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
}
