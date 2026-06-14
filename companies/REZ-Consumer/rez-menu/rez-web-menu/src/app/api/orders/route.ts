/**
 * Orders API Routes
 * Handles order operations: create, get, update, cancel
 * Supports dine-in orders with table context
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Order, OrderItem } from '@/lib/services/types'

// Extended Order type with dine-in support
interface DineInOrder extends Order {
  tableNumber?: string
  orderType?: 'dine_in' | 'delivery' | 'pickup'
}

// In-memory order storage (replace with MongoDB in production)
const orders = new Map<string, DineInOrder>()
let orderCounter = 1000

function generateOrderId(): string {
  orderCounter++
  return `ORD${orderCounter.toString().padStart(6, '0')}`
}

function generateOrderNumber(): string {
  return `REZ${Date.now().toString(36).toUpperCase()}`
}

// GET - Retrieve orders
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const orderId = request.nextUrl.searchParams.get('orderId')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  // Get single order
  if (orderId) {
    const order = orders.get(orderId)

    if (!order || order.customerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  }

  // Get all user orders
  const userOrders: Order[] = []
  Array.from(orders.values()).forEach((order) => {
    if (order.customerId === userId) {
      userOrders.push(order)
    }
  })

  // Sort by date descending
  userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({
    success: true,
    data: {
      orders: userOrders,
      total: userOrders.length
    }
  })
}

// POST - Create order
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      storeSlug,
      items,
      deliveryAddress,
      scheduledTime,
      notes,
      paymentMethod = 'upi',
      tableNumber,
      orderType = deliveryAddress ? 'delivery' : 'dine_in'
    } = body as {
      storeSlug: string
      items: OrderItem[]
      deliveryAddress?: {
        address: string
        city: string
        pincode: string
        coordinates?: { lat: number; lng: number }
      }
      scheduledTime?: string
      notes?: string
      paymentMethod?: 'upi' | 'card' | 'wallet' | 'cod'
      tableNumber?: string
      orderType?: 'dine_in' | 'delivery' | 'pickup'
    }

    if (!storeSlug || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Store slug and items required' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = Math.round(subtotal * 0.05 * 100) / 100 // 5% GST
    // No delivery fee for dine-in
    const deliveryFee = orderType === 'delivery' ? 40 : 0
    const total = subtotal + tax + deliveryFee

    const orderId = generateOrderId()
    const now = new Date().toISOString()

    const order: DineInOrder = {
      id: orderId,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      customerId: userId,
      storeSlug,
      items,
      subtotal,
      tax,
      deliveryFee,
      total,
      currency: 'INR',
      paymentMethod: paymentMethod as Order['paymentMethod'],
      paymentStatus: 'pending',
      deliveryAddress,
      scheduledTime,
      notes,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'pending',
          timestamp: now,
          message: orderType === 'dine_in'
            ? `Order placed for Table ${tableNumber || ''}`.trim()
            : 'Order placed successfully',
          actor: 'system'
        }
      ],
      // Dine-in specific fields
      tableNumber,
      orderType,
    }

    orders.set(orderId, order)

    // In production: call RABTUL Payment Service to create Razorpay order
    // In production: call RABTUL Notification Service to send confirmation
    // In production: call KDS service for dine-in orders to notify kitchen

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        order,
        orderType,
        tableNumber,
        message: orderType === 'dine_in'
          ? `Order placed for Table ${tableNumber || ''}`
          : 'Order placed successfully'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// PATCH - Update order (status)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const orderId = request.nextUrl.searchParams.get('orderId')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID required' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const { status, paymentStatus } = body as { status?: Order['status']; paymentStatus?: Order['paymentStatus'] }

    const order = orders.get(orderId)

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (order.customerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    if (status) {
      order.status = status
      order.timeline.push({
        status,
        timestamp: now,
        message: getStatusMessage(status),
        actor: 'system'
      })
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus
    }

    order.updatedAt = now
    orders.set(orderId, order)

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: Order['status']): string {
  const messages: Record<Order['status'], string> = {
    pending: 'Order placed',
    confirmed: 'Order confirmed by restaurant',
    preparing: 'Kitchen is preparing your order',
    ready: 'Order is ready',
    out_for_delivery: 'Driver picked up your order',
    delivered: 'Order delivered',
    cancelled: 'Order cancelled',
    refunded: 'Order refunded'
  }
  return messages[status] || 'Status updated'
}
