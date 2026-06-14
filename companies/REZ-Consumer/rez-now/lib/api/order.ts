/**
 * Order API with Loyalty Integration
 *
 * Extends the order API to include loyalty tracking after successful orders.
 */

import { authClient, makeIdempotencyKey } from './client';
import { logger } from '@/lib/utils/logger';
import { recordVisit, type LoyaltyEvent } from './loyalty';

// ── Types ────────────────────────────────────────────────────────────────────────

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: Record<string, string[]>;
}

export interface CreateOrderPayload {
  storeSlug: string;
  items: OrderItem[];
  tableNumber?: string;
  customerPhone?: string;
  deliveryAddress?: {
    line1: string;
    city: string;
    pincode: string;
  };
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tip?: number;
  promoCode?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: 'pending' | 'paid';
  paymentUrl?: string;
  loyaltyResult?: {
    coinsEarned: number;
    pointsEarned: number;
    newTier?: string;
    unlockedMilestones: string[];
    events: LoyaltyEvent[];
  };
}

export interface OrderStatusUpdate {
  orderId: string;
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  updatedAt: string;
}

// ── Order Creation ──────────────────────────────────────────────────────────────

/**
 * Create a new order
 * Automatically triggers loyalty visit recording on successful payment
 */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  try {
    const idempotencyKey = makeIdempotencyKey('order', payload.storeSlug);

    const response = await authClient.post<{ data: CreateOrderResponse }>('/api/orders', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });

    const data = response.data;
    if (!data) {
      throw new Error('Failed to create order');
    }

    logger.info('Order created', {
      orderId: data.data.orderId,
      orderNumber: data.data.orderNumber,
      storeSlug: payload.storeSlug,
      total: data.data.total,
    });

    return data.data;
  } catch (error) {
    logger.error('Failed to create order', { payload, error });
    throw error;
  }
}

/**
 * Record loyalty visit after successful order
 * Should be called after payment confirmation
 */
export async function recordOrderVisit(
  orderId: string,
  storeSlug: string,
  storeName: string,
  orderTotal: number
): Promise<{
  visit: {
    id: string;
    pointsEarned: number;
    coinsEarned: number;
  };
  loyaltyEvents: LoyaltyEvent[];
  unlockedMilestones: string[];
  newTier?: string;
}> {
  try {
    const result = await recordVisit({
      orderId,
      storeSlug,
      storeName,
      orderTotal,
    });

    logger.info('Loyalty visit recorded', {
      orderId,
      storeSlug,
      earnedCoins: result.earnedCoins,
      earnedPoints: result.earnedPoints,
      milestonesUnlocked: result.unlockedMilestones.length,
    });

    return {
      visit: {
        id: result.visit.id,
        pointsEarned: result.earnedPoints,
        coinsEarned: result.earnedCoins,
      },
      loyaltyEvents: result.events,
      unlockedMilestones: result.unlockedMilestones.map((m) => m.name),
      newTier: result.newTier,
    };
  } catch (error) {
    // Log but don't throw - loyalty recording is not critical
    logger.error('Failed to record loyalty visit', {
      orderId,
      storeSlug,
      error,
    });
    return {
      visit: {
        id: '',
        pointsEarned: 0,
        coinsEarned: 0,
      },
      loyaltyEvents: [],
      unlockedMilestones: [],
    };
  }
}

// ── Order Status ────────────────────────────────────────────────────────────────

/**
 * Get order status
 */
export async function getOrderStatus(
  orderId: string
): Promise<{
  orderId: string;
  status: string;
  estimatedReadyTime?: string;
  updatedAt: string;
}> {
  try {
    const { data } = await authClient.get(`/api/orders/${orderId}/status`);

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch order status');
    }

    return data.data;
  } catch (error) {
    logger.error('Failed to fetch order status', { orderId, error });
    throw error;
  }
}

/**
 * Subscribe to order status updates (via WebSocket in production)
 */
export function subscribeToOrderUpdates(
  orderId: string,
  onUpdate: (update: OrderStatusUpdate) => void
): () => void {
  // In production, this would connect to a WebSocket
  // For now, return a no-op cleanup function
  logger.info('Subscribed to order updates', { orderId });

  return () => {
    logger.info('Unsubscribed from order updates', { orderId });
  };
}

// ── Order History ────────────────────────────────────────────────────────────────

/**
 * Get order history
 */
export async function getOrderHistory(
  page = 1,
  limit = 20
): Promise<{
  orders: Array<{
    orderId: string;
    orderNumber: string;
    storeName: string;
    storeSlug: string;
    total: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}> {
  try {
    const { data } = await authClient.get('/api/orders/history', {
      params: { page, limit },
    });

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch order history');
    }

    return data.data;
  } catch (error) {
    logger.error('Failed to fetch order history', { error });
    throw error;
  }
}

/**
 * Reorder from previous order
 */
export async function reorderItems(
  orderId: string
): Promise<{
  items: OrderItem[];
  storeSlug: string;
  estimatedTotal: number;
}> {
  try {
    const { data } = await authClient.post(`/api/orders/${orderId}/reorder`);

    if (!data.success) {
      throw new Error(data.message || 'Failed to reorder');
    }

    logger.info('Reorder initiated', { orderId });

    return data.data;
  } catch (error) {
    logger.error('Failed to reorder', { orderId, error });
    throw error;
  }
}

// ── Payment ─────────────────────────────────────────────────────────────────────

/**
 * Get payment URL for pending order
 */
export async function getPaymentUrl(orderId: string): Promise<string> {
  try {
    const { data } = await authClient.get(`/api/orders/${orderId}/payment-url`);

    if (!data.success) {
      throw new Error(data.message || 'Failed to get payment URL');
    }

    return data.data.url;
  } catch (error) {
    logger.error('Failed to get payment URL', { orderId, error });
    throw error;
  }
}

// ── Complete Order Flow with Loyalty ───────────────────────────────────────────

/**
 * Complete order flow including loyalty recording
 * This is a convenience function that orchestrates the full flow
 */
export async function completeOrderWithLoyalty(
  orderId: string,
  storeSlug: string,
  storeName: string,
  orderTotal: number,
  paymentConfirmed = true
): Promise<{
  success: boolean;
  orderId: string;
  loyalty?: {
    coinsEarned: number;
    pointsEarned: number;
    milestonesUnlocked: string[];
    newTier?: string;
    message: string;
  };
}> {
  if (!paymentConfirmed) {
    return { success: false, orderId };
  }

  // Record the loyalty visit
  const loyaltyResult = await recordOrderVisit(
    orderId,
    storeSlug,
    storeName,
    orderTotal
  );

  // Build message
  const messages: string[] = [];
  if (loyaltyResult.visit.coinsEarned > 0) {
    messages.push(`+${loyaltyResult.visit.coinsEarned} coins`);
  }
  if (loyaltyResult.visit.pointsEarned > 0) {
    messages.push(`+${loyaltyResult.visit.pointsEarned} points`);
  }
  if (loyaltyResult.unlockedMilestones.length > 0) {
    messages.push(`${loyaltyResult.unlockedMilestones.length} milestone(s) unlocked`);
  }
  if (loyaltyResult.newTier) {
    messages.push(`Upgraded to ${loyaltyResult.newTier} tier!`);
  }

  return {
    success: true,
    orderId,
    loyalty: {
      coinsEarned: loyaltyResult.visit.coinsEarned,
      pointsEarned: loyaltyResult.visit.pointsEarned,
      milestonesUnlocked: loyaltyResult.unlockedMilestones,
      newTier: loyaltyResult.newTier,
      message:
        messages.length > 0
          ? `Thanks for ordering! You earned ${messages.join(', ')}.`
          : 'Thanks for ordering!',
    },
  };
}
