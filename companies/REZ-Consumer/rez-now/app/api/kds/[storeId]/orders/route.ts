import { NextRequest, NextResponse } from 'next/server';
import { KDSOrder, KDSOrderStatus } from '@/lib/types';

// In-memory storage for active kitchen orders
// In production, this would be stored in a database
const orders = new Map<string, KDSOrder>();

// GET /api/kds/[storeId]/orders - Get active orders for a store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') as KDSOrderStatus | null;

  let result = Array.from(orders.values())
    .filter((order) => order.storeId === storeId)
    .filter((order) => !['served', 'cancelled'].includes(order.status));

  if (status) {
    result = result.filter((order) => order.status === status);
  }

  // Sort by createdAt (newest first) and elapsed time
  result.sort((a, b) => {
    // Urgent orders (longer elapsed time) first
    const elapsedDiff = b.elapsedSeconds - a.elapsedSeconds;
    if (elapsedDiff > 120) return -1; // b is urgent
    if (elapsedDiff < -120) return 1; // a is urgent
    // Then sort by creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ orders: result });
}
