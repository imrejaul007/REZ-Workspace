import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { GroupSession, SharedItem } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage (in production, use database)
const sessions = new Map<string, GroupSession>();

function generateId(): string {
  return `${Date.now()}-${randomBytes(6).toString('hex')}`;
}

// POST /api/group/[code]/items - Add shared item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const upperCode = code.toUpperCase();
    const body = await request.json();
    const { itemId, name, price, quantity, memberId, memberName } = body;

    if (!itemId || !name || !price || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, name, price, memberId' },
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

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is no longer active' },
        { status: 410 }
      );
    }

    // Verify member exists
    const member = session.members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found in session' },
        { status: 404 }
      );
    }

    // Create shared item
    const sharedItem: SharedItem = {
      id: generateId(),
      itemId,
      name,
      price,
      addedBy: memberId,
      addedByName: memberName || member.name,
      addedAt: new Date().toISOString(),
      quantity: quantity || 1,
    };

    session.items.push(sharedItem);

    // Update member's item count and total
    member.items.push({
      itemId,
      name,
      price,
      basePrice: price,
      quantity: quantity || 1,
      customizations: {},
      customizationTotal: 0,
      isVeg: true, // Would be fetched from menu item
    });
    member.totalAmount += price * (quantity || 1);

    // Recalculate session total
    session.totalAmount = session.members.reduce((sum, m) => sum + m.totalAmount, 0);

    sessions.set(upperCode, session);

    // In production, emit Socket.IO event here
    // io.to(`group:${upperCode}`).emit('group:item:added', { item: sharedItem, session });

    return NextResponse.json({ item: sharedItem, session });
  } catch (error) {
    logger.error('Error adding shared item:', { error });
    return NextResponse.json(
      { error: 'Failed to add shared item' },
      { status: 500 }
    );
  }
}

// GET /api/group/[code]/items - Get all shared items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const session = sessions.get(upperCode);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ items: session.items });
}
