import { NextRequest, NextResponse } from 'next/server';
import { KDSOrder, KDSOrderStatus, KDSItemStatus } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage for kitchen orders
const orders = new Map<string, KDSOrder>();

// PUT /api/kds/[orderId]/status - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { status, updatedBy } = body as { status: KDSOrderStatus; updatedBy?: string };

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses: KDSOrderStatus[] = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const order = orders.get(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    order.status = status;

    // If order is marked as ready or served, update all items
    if (status === 'ready' || status === 'served') {
      order.items.forEach((item) => {
        if (item.status !== 'served') {
          item.status = status === 'served' ? 'served' : 'ready';
          item.updatedAt = new Date().toISOString();
        }
      });
    }

    order.updatedAt = new Date().toISOString();
    orders.set(orderId, order);

    // In production, emit Socket.IO event
    // io.to(`kds:${order.storeId}`).emit('order.updated', {
    //   type: 'order.updated',
    //   payload: { orderId, status, updatedBy, updatedAt: order.updatedAt },
    //   timestamp: order.updatedAt,
    // });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    logger.error('Error updating order status:', { error });
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// GET /api/kds/[orderId]/status - Get order status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const order = orders.get(orderId);

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    updatedAt: order.updatedAt,
  });
}
