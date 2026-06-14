import { NextRequest, NextResponse } from 'next/server';
import { KDSOrder, KDSItemStatus } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// In-memory storage for kitchen orders
const orders = new Map<string, KDSOrder>();

// PUT /api/kds/[orderId]/items/[itemId]/status - Update item status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const { orderId, itemId } = await params;
    const body = await request.json();
    const { status, preparedBy, notes } = body as {
      status: KDSItemStatus;
      preparedBy?: string;
      notes?: string;
    };

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses: KDSItemStatus[] = ['received', 'preparing', 'ready', 'served'];
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

    const item = order.items.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Update item status
    item.status = status;
    item.updatedAt = new Date().toISOString();

    if (preparedBy) {
      item.preparedBy = preparedBy;
    }

    if (notes) {
      item.notes = notes;
    }

    // Check if all items are ready/served
    const allReady = order.items.every(
      (i) => i.status === 'ready' || i.status === 'served'
    );
    const allServed = order.items.every((i) => i.status === 'served');

    // Auto-update order status if needed
    if (allServed && order.status !== 'served') {
      order.status = 'served';
    } else if (allReady && order.status === 'preparing') {
      order.status = 'ready';
    }

    order.updatedAt = new Date().toISOString();
    orders.set(orderId, order);

    // In production, emit Socket.IO events
    // io.to(`kds:${order.storeId}`).emit('item.updated', {
    //   type: 'item.updated',
    //   payload: { orderId, itemId, status, preparedBy, notes, updatedAt: item.updatedAt },
    //   timestamp: item.updatedAt,
    // });

    // If order is now ready, emit order.ready event
    // if (allReady && order.status === 'ready') {
    //   io.to(`kds:${order.storeId}`).emit('order.ready', {
    //     type: 'order.ready',
    //     payload: order,
    //     timestamp: new Date().toISOString(),
    //   });
    // }

    return NextResponse.json({ success: true, item, order });
  } catch (error) {
    logger.error('Error updating item status:', { error });
    return NextResponse.json(
      { error: 'Failed to update item status' },
      { status: 500 }
    );
  }
}

// GET /api/kds/[orderId]/items/[itemId]/status - Get item status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  const { orderId, itemId } = await params;

  const order = orders.get(orderId);

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const item = order.items.find((i) => i.id === itemId);

  if (!item) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    orderId,
    itemId: item.id,
    status: item.status,
    updatedAt: item.updatedAt,
    preparedBy: item.preparedBy,
    notes: item.notes,
  });
}
