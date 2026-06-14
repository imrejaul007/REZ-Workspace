import { NextRequest, NextResponse } from 'next/server';
import { GroupSession, GroupOrderSummary } from '@/lib/types';

// In-memory storage (in production, use database)
const sessions = new Map<string, GroupSession>();

// GET /api/group/[code]/summary - Get split summary
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

  // Calculate GST/tax (assuming 18% GST)
  const GST_PERCENT = 18;
  const subtotal = session.totalAmount;
  const tax = Math.round(subtotal * (GST_PERCENT / 100));
  const grandTotal = subtotal + tax;

  // Build per-person breakdown
  const perPerson = session.members.map((member) => {
    // Get items this member added (personal items)
    const personalItems = session.items
      .filter((item) => item.addedBy === member.id)
      .map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        shared: session.items.filter((i) => i.addedBy !== member.id).length > 0,
      }));

    // Get shared items
    const sharedItems = session.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      shared: true,
    }));

    // Calculate subtotal for this person
    const personalTotal = personalItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // For shared items, split equally
    const sharedTotal = sharedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const sharedPerPerson = sharedTotal / session.members.length;

    const memberSubtotal = personalTotal + sharedPerPerson;
    const memberTax = Math.round(memberSubtotal * (GST_PERCENT / 100));
    const memberTotal = memberSubtotal + memberTax;

    return {
      memberId: member.id,
      name: member.name,
      items: [...personalItems, ...sharedItems],
      subtotal: memberSubtotal,
      tax: memberTax,
      total: memberTotal,
    };
  });

  const summary: GroupOrderSummary = {
    sessionId: session.id,
    code: session.code,
    storeName: session.storeName,
    totalAmount: session.totalAmount,
    perPerson,
    sharedItems: session.items,
    tax,
    grandTotal,
  };

  return NextResponse.json(summary);
}
