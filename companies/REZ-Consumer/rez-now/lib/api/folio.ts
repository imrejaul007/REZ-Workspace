/**
 * Folio Service - Hotel Room Billing & Folio Management
 * Handles room charges, bill itemization, and folio operations for Room QR system
 */

import { authClient, publicClient } from './client';
import { logger } from '@/lib/utils/logger';
import type {
  CheckoutBill,
  CheckoutBillItem,
  CheckoutCharge,
  CheckoutCharge as ChargeType,
} from '@/lib/types';

// ── Folio Types ────────────────────────────────────────────────────────────────

export interface FolioSummary {
  folioId: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  items: FolioItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'settled';
  lastUpdated: string;
}

export interface FolioItem {
  id: string;
  description: string;
  category: ChargeType['type'];
  amount: number;
  quantity?: number;
  timestamp: string;
  postedBy?: string;
  reference?: string;
}

export interface PostChargePayload {
  bookingId: string;
  roomId: string;
  category: ChargeType['type'];
  description: string;
  amount: number;
  quantity?: number;
  reference?: string;
}

export interface SettleFolioPayload {
  folioId: string;
  paymentMethod: 'wallet' | 'razorpay' | 'cash' | 'card';
  amount?: number; // optional partial payment
}

export interface FolioResponse {
  success: boolean;
  folio?: FolioSummary;
  message?: string;
}

// ── Folio API Functions ────────────────────────────────────────────────────────

/**
 * Get folio for a booking
 */
export async function getFolio(bookingId: string): Promise<FolioSummary> {
  try {
    const { data } = await authClient.get(`/api/room/folio/${bookingId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch folio');
    }
    return data.folio as FolioSummary;
  } catch (error) {
    logger.error('Failed to fetch folio', { bookingId, error });
    throw error;
  }
}

/**
 * Get current folio for a room (active folio)
 */
export async function getRoomFolio(roomId: string): Promise<FolioSummary> {
  try {
    const { data } = await authClient.get(`/api/room/folio/room/${roomId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch room folio');
    }
    return data.folio as FolioSummary;
  } catch (error) {
    logger.error('Failed to fetch room folio', { roomId, error });
    throw error;
  }
}

/**
 * Post a charge to a folio (room service, minibar, etc.)
 */
export async function postCharge(payload: PostChargePayload): Promise<FolioItem> {
  try {
    const { data } = await authClient.post('/api/room/folio/charge', payload);
    if (!data.success) {
      throw new Error(data.message || 'Failed to post charge');
    }
    logger.info('Charge posted to folio', {
      bookingId: payload.bookingId,
      category: payload.category,
      amount: payload.amount,
    });
    return data.item as FolioItem;
  } catch (error) {
    logger.error('Failed to post charge to folio', { payload, error });
    throw error;
  }
}

/**
 * Post room rate charge (called at check-in or daily)
 */
export async function postRoomCharge(
  bookingId: string,
  roomId: string,
  amount: number,
  description: string = 'Room Charge',
  reference?: string
): Promise<FolioItem> {
  return postCharge({
    bookingId,
    roomId,
    category: 'room',
    description,
    amount,
    reference,
  });
}

/**
 * Post minibar charges
 */
export async function postMinibarCharges(
  bookingId: string,
  roomId: string,
  items: Array<{ itemId: string; name: string; quantity: number; price: number }>
): Promise<FolioItem[]> {
  const charges = items.map((item) =>
    postCharge({
      bookingId,
      roomId,
      category: 'minibar',
      description: `${item.name} x${item.quantity}`,
      amount: item.price * item.quantity,
      quantity: item.quantity,
      reference: item.itemId,
    })
  );
  return Promise.all(charges);
}

/**
 * Post laundry charges
 */
export async function postLaundryCharge(
  bookingId: string,
  roomId: string,
  description: string,
  amount: number,
  reference?: string
): Promise<FolioItem> {
  return postCharge({
    bookingId,
    roomId,
    category: 'laundry',
    description,
    amount,
    reference,
  });
}

/**
 * Post restaurant charges
 */
export async function postRestaurantCharge(
  bookingId: string,
  roomId: string,
  description: string,
  amount: number,
  reference?: string
): Promise<FolioItem> {
  return postCharge({
    bookingId,
    roomId,
    category: 'restaurant',
    description,
    amount,
    reference,
  });
}

/**
 * Post spa charges
 */
export async function postSpaCharge(
  bookingId: string,
  roomId: string,
  description: string,
  amount: number,
  reference?: string
): Promise<FolioItem> {
  return postCharge({
    bookingId,
    roomId,
    category: 'spa',
    description,
    amount,
    reference,
  });
}

/**
 * Post transport charges
 */
export async function postTransportCharge(
  bookingId: string,
  roomId: string,
  description: string,
  amount: number,
  reference?: string
): Promise<FolioItem> {
  return postCharge({
    bookingId,
    roomId,
    category: 'transport',
    description,
    amount,
    reference,
  });
}

/**
 * Post discount to folio
 */
export async function postDiscount(
  bookingId: string,
  roomId: string,
  description: string,
  amount: number,
  reference?: string
): Promise<FolioItem> {
  return postCharge({
    bookingId,
    roomId,
    category: 'discount',
    description,
    amount: -Math.abs(amount), // discounts are negative
    reference,
  });
}

/**
 * Settle folio (full or partial payment)
 */
export async function settleFolio(payload: SettleFolioPayload): Promise<FolioSummary> {
  try {
    const { data } = await authClient.post('/api/room/folio/settle', payload);
    if (!data.success) {
      throw new Error(data.message || 'Failed to settle folio');
    }
    logger.info('Folio settled', {
      folioId: payload.folioId,
      paymentMethod: payload.paymentMethod,
      amount: payload.amount,
    });
    return data.folio as FolioSummary;
  } catch (error) {
    logger.error('Failed to settle folio', { payload, error });
    throw error;
  }
}

/**
 * Get checkout bill for a booking
 */
export async function getCheckoutBill(bookingId: string): Promise<CheckoutBill> {
  try {
    const { data } = await authClient.get(`/api/room/checkout/${bookingId}/bill`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch checkout bill');
    }
    return data.bill as CheckoutBill;
  } catch (error) {
    logger.error('Failed to fetch checkout bill', { bookingId, error });
    throw error;
  }
}

/**
 * Generate checkout bill (recalculate all charges)
 */
export async function generateCheckoutBill(bookingId: string): Promise<CheckoutBill> {
  try {
    const { data } = await authClient.post(`/api/room/checkout/${bookingId}/generate-bill`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to generate checkout bill');
    }
    return data.bill as CheckoutBill;
  } catch (error) {
    logger.error('Failed to generate checkout bill', { bookingId, error });
    throw error;
  }
}

/**
 * Get bill breakdown by category
 */
export function getBillBreakdownByCategory(
  items: CheckoutBillItem[]
): Record<string, { items: CheckoutBillItem[]; subtotal: number }> {
  const breakdown: Record<string, { items: CheckoutBillItem[]; subtotal: number }> = {};

  for (const item of items) {
    if (!breakdown[item.category]) {
      breakdown[item.category] = { items: [], subtotal: 0 };
    }
    breakdown[item.category].items.push(item);
    breakdown[item.category].subtotal += item.amount * (item.quantity || 1);
  }

  return breakdown;
}

/**
 * Get formatted category label
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    room: 'Room Charge',
    minibar: 'Minibar',
    laundry: 'Laundry',
    restaurant: 'Restaurant',
    spa: 'Spa & Wellness',
    transport: 'Transportation',
    other: 'Other Charges',
    tax: 'Taxes & Fees',
    discount: 'Discounts',
  };
  return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    room: 'bed',
    minibar: 'wine',
    laundry: 'shirt',
    restaurant: 'utensils',
    spa: 'sparkles',
    transport: 'car',
    other: 'receipt',
    tax: 'percent',
    discount: 'tag',
  };
  return icons[category] || 'receipt';
}
