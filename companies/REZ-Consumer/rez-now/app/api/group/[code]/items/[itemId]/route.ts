import { NextRequest, NextResponse } from 'next/server';
import { GroupSession } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage (in production, use database)
const sessions = new Map<string, GroupSession>();

// DELETE /api/group/[code]/items/[itemId] - Remove shared item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; itemId: string }> }
) {
  try {
    const { code, itemId } = await params;
    const upperCode = code.toUpperCase();
    const body = await request.json().catch(() => ({}));
    const { memberId } = body;

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

    // Find the item
    const itemIndex = session.items.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = session.items[itemIndex];

    // Only host or item owner can delete
    const member = session.members.find((m) => m.id === memberId);
    const isHost = member?.isHost ?? false;
    const isOwner = item.addedBy === memberId;

    if (!isHost && !isOwner) {
      return NextResponse.json(
        { error: 'Only the host or item owner can remove this item' },
        { status: 403 }
      );
    }

    // Remove item
    session.items.splice(itemIndex, 1);

    // Update member's item count and total
    const ownerMember = session.members.find((m) => m.id === item.addedBy);
    if (ownerMember) {
      const memberItemIndex = ownerMember.items.findIndex((i) => i.itemId === item.itemId);
      if (memberItemIndex !== -1) {
        ownerMember.items.splice(memberItemIndex, 1);
      }
      ownerMember.totalAmount -= item.price * item.quantity;
    }

    // Recalculate session total
    session.totalAmount = session.members.reduce((sum, m) => sum + m.totalAmount, 0);

    sessions.set(upperCode, session);

    // In production, emit Socket.IO event here
    // io.to(`group:${upperCode}`).emit('group:item:removed', { itemId, session });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    logger.error('Error removing shared item:', { error });
    return NextResponse.json(
      { error: 'Failed to remove shared item' },
      { status: 500 }
    );
  }
}

// PUT /api/group/[code]/items/[itemId] - Update shared item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; itemId: string }> }
) {
  try {
    const { code, itemId } = await params;
    const upperCode = code.toUpperCase();
    const body = await request.json();
    const { quantity, memberId } = body;

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
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

    // Find the item
    const item = session.items.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Only host or item owner can update
    const member = session.members.find((m) => m.id === memberId);
    const isHost = member?.isHost ?? false;
    const isOwner = item.addedBy === memberId;

    if (!isHost && !isOwner) {
      return NextResponse.json(
        { error: 'Only the host or item owner can update this item' },
        { status: 403 }
      );
    }

    const oldQuantity = item.quantity;
    const quantityDiff = quantity - oldQuantity;

    // Update item quantity
    item.quantity = quantity;

    // Update member's total
    const ownerMember = session.members.find((m) => m.id === item.addedBy);
    if (ownerMember) {
      ownerMember.totalAmount += item.price * quantityDiff;
    }

    // Recalculate session total
    session.totalAmount = session.members.reduce((sum, m) => sum + m.totalAmount, 0);

    sessions.set(upperCode, session);

    return NextResponse.json({ success: true, item, session });
  } catch (error) {
    logger.error('Error updating shared item:', { error });
    return NextResponse.json(
      { error: 'Failed to update shared item' },
      { status: 500 }
    );
  }
}
