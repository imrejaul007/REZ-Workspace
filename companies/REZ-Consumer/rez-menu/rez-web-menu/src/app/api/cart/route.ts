/**
 * Cart API Routes
 * Handles cart operations: get, add, update, remove, clear
 * Supports dine-in orders with table context
 */

import { NextRequest, NextResponse } from 'next/server'
import type { CartItem } from '@/lib/services/types'

// In-memory cart storage (replace with Redis/DB in production)
interface CartData {
  items: CartItem[]
  storeSlug: string
  updatedAt: string
  // Dine-in context
  dineInContext?: {
    tableNumber: string
    orderType: 'dine_in'
  }
}

const carts = new Map<string, CartData>()

const CART_TTL_HOURS = 24

function cleanExpiredCarts() {
  const now = Date.now()
  Array.from(carts.entries()).forEach(([key, cart]) => {
    const hoursSinceUpdate = (now - new Date(cart.updatedAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceUpdate > CART_TTL_HOURS) {
      carts.delete(key)
    }
  })
}

// GET - Retrieve cart
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const storeSlug = request.nextUrl.searchParams.get('storeSlug') || 'default'

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  cleanExpiredCarts()

  const cartKey = `${userId}:${storeSlug}`
  const cart = carts.get(cartKey)

  if (!cart) {
    return NextResponse.json({
      success: true,
      data: {
        items: [],
        storeSlug,
        subtotal: 0,
        itemCount: 0,
        dineInContext: null,
      }
    })
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return NextResponse.json({
    success: true,
    data: {
      items: cart.items,
      storeSlug: cart.storeSlug,
      subtotal,
      itemCount,
      updatedAt: cart.updatedAt,
      dineInContext: cart.dineInContext || null,
    }
  })
}

// POST - Add item to cart
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
    const { storeSlug, item, dineInContext } = body as {
      storeSlug: string
      item: CartItem
      dineInContext?: { tableNumber: string; orderType: 'dine_in' }
    }

    if (!item || !item.productId || !item.name || typeof item.price !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid item data' },
        { status: 400 }
      )
    }

    const cartKey = `${userId}:${storeSlug}`
    const existingCart = carts.get(cartKey)

    // Preserve dine-in context if already set, or set from new request
    const cart: CartData = existingCart || {
      items: [],
      storeSlug,
      updatedAt: new Date().toISOString(),
      dineInContext: dineInContext || undefined,
    }

    // If dine-in context provided, update cart
    if (dineInContext) {
      cart.dineInContext = dineInContext
    }

    // Check if item already exists
    const existingIndex = cart.items.findIndex(i => i.productId === item.productId)

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += item.quantity || 1
      cart.items[existingIndex].price = item.price // Update price in case it changed
    } else {
      // Add new item
      cart.items.push({
        ...item,
        id: `cart_${item.productId}_${Date.now()}`,
        quantity: item.quantity || 1,
        // Set dine-in metadata on item
        metadata: item.metadata || (dineInContext ? {
          tableNumber: dineInContext.tableNumber,
          orderType: dineInContext.orderType,
        } : undefined),
      })
    }

    cart.updatedAt = new Date().toISOString()
    carts.set(cartKey, cart)

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cart.items,
        storeSlug: cart.storeSlug,
        subtotal,
        itemCount,
        updatedAt: cart.updatedAt,
        dineInContext: cart.dineInContext,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// PATCH - Update cart item
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { storeSlug, productId, quantity } = body as { storeSlug: string; productId: string; quantity: number }

    const cartKey = `${userId}:${storeSlug}`
    const cart = carts.get(cartKey)

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      )
    }

    const itemIndex = cart.items.findIndex(i => i.productId === productId)

    if (itemIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Item not in cart' },
        { status: 404 }
      )
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1)
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity
    }

    cart.updatedAt = new Date().toISOString()
    carts.set(cartKey, cart)

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cart.items,
        storeSlug: cart.storeSlug,
        subtotal,
        itemCount,
        updatedAt: cart.updatedAt
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// DELETE - Clear cart
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const storeSlug = request.nextUrl.searchParams.get('storeSlug') || 'default'

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  const cartKey = `${userId}:${storeSlug}`
  carts.delete(cartKey)

  return NextResponse.json({
    success: true,
    data: {
      items: [],
      storeSlug,
      subtotal: 0,
      itemCount: 0
    }
  })
}
