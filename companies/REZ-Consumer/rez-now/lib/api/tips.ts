/**
 * Tip Service - Room Service Tip Allocation & Distribution
 * Handles tip percentages, staff distribution, and tip management for Room QR
 */

import { authClient, makeIdempotencyKey } from './client';
import { logger } from '@/lib/utils/logger';

// ── Tip Types ──────────────────────────────────────────────────────────────────

export type TipPercentage = 0 | 5 | 10 | 15 | 20 | 25;

export interface TipOption {
  percentage: TipPercentage;
  label: string;
  amount: number; // calculated amount in paise
}

export interface TipAllocation {
  staffId: string;
  staffName: string;
  role: string;
  amount: number;
  percentage: number;
}

export interface TipDistribution {
  tipId: string;
  bookingId: string;
  roomId: string;
  totalAmount: number;
  tipPercentage: TipPercentage;
  allocations: TipAllocation[];
  createdAt: string;
  settledAt?: string;
  status: 'pending' | 'distributed' | 'cancelled';
}

export interface AddTipPayload {
  bookingId: string;
  roomId: string;
  amount: number;
  tipPercentage: TipPercentage;
  notes?: string;
}

export interface TipSummary {
  totalTips: number;
  tipCount: number;
  averageTip: number;
  topStaff: Array<{
    staffId: string;
    staffName: string;
    totalTips: number;
    tipCount: number;
  }>;
}

// ── Tip Configuration ──────────────────────────────────────────────────────────

export const TIP_PERCENTAGES: TipPercentage[] = [0, 5, 10, 15, 20, 25];

/**
 * Get tip amount options based on subtotal
 */
export function getTipOptions(subtotal: number): TipOption[] {
  return TIP_PERCENTAGES.map((percentage) => ({
    percentage,
    label: percentage === 0 ? 'No tip' : `${percentage}%`,
    amount: Math.round((subtotal * percentage) / 100),
  }));
}

/**
 * Calculate tip amount from percentage
 */
export function calculateTipAmount(subtotal: number, percentage: TipPercentage): number {
  return Math.round((subtotal * percentage) / 100);
}

// ── Tip API Functions ──────────────────────────────────────────────────────────

/**
 * Add tip to room folio
 */
export async function addTip(payload: AddTipPayload): Promise<TipDistribution> {
  try {
    const idempotencyKey = makeIdempotencyKey('tip', payload.bookingId);
    const { data } = await authClient.post(
      '/api/room/tips',
      {
        bookingId: payload.bookingId,
        roomId: payload.roomId,
        amount: payload.amount,
        tipPercentage: payload.tipPercentage,
        notes: payload.notes,
      },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );

    if (!data.success) {
      throw new Error(data.message || 'Failed to add tip');
    }

    logger.info('Tip added', {
      bookingId: payload.bookingId,
      amount: payload.amount,
      percentage: payload.tipPercentage,
    });

    return data.tip as TipDistribution;
  } catch (error) {
    logger.error('Failed to add tip', { payload, error });
    throw error;
  }
}

/**
 * Add tip for checkout (wrapper for checkout flow)
 */
export async function addCheckoutTip(
  bookingId: string,
  roomId: string,
  subtotal: number,
  percentage: TipPercentage
): Promise<TipDistribution | null> {
  if (percentage === 0) {
    return null;
  }

  const amount = calculateTipAmount(subtotal, percentage);
  return addTip({
    bookingId,
    roomId,
    amount,
    tipPercentage: percentage,
    notes: `Checkout tip at ${percentage}%`,
  });
}

/**
 * Get tip distributions for a booking
 */
export async function getBookingTips(bookingId: string): Promise<TipDistribution[]> {
  try {
    const { data } = await authClient.get(`/api/room/tips/booking/${bookingId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch booking tips');
    }
    return data.tips as TipDistribution[];
  } catch (error) {
    logger.error('Failed to fetch booking tips', { bookingId, error });
    throw error;
  }
}

/**
 * Get tip distributions for a room
 */
export async function getRoomTips(roomId: string): Promise<TipDistribution[]> {
  try {
    const { data } = await authClient.get(`/api/room/tips/room/${roomId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch room tips');
    }
    return data.tips as TipDistribution[];
  } catch (error) {
    logger.error('Failed to fetch room tips', { roomId, error });
    throw error;
  }
}

/**
 * Get tips for a specific staff member
 */
export async function getStaffTips(staffId: string, startDate?: string, endDate?: string): Promise<TipSummary> {
  try {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await authClient.get(`/api/room/tips/staff/${staffId}`, { params });
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch staff tips');
    }
    return data.summary as TipSummary;
  } catch (error) {
    logger.error('Failed to fetch staff tips', { staffId, error });
    throw error;
  }
}

/**
 * Cancel a tip distribution
 */
export async function cancelTip(tipId: string): Promise<void> {
  try {
    const { data } = await authClient.delete(`/api/room/tips/${tipId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to cancel tip');
    }
    logger.info('Tip cancelled', { tipId });
  } catch (error) {
    logger.error('Failed to cancel tip', { tipId, error });
    throw error;
  }
}

/**
 * Distribute tip to staff (admin function)
 */
export async function distributeTip(tipId: string, allocations: TipAllocation[]): Promise<TipDistribution> {
  try {
    const { data } = await authClient.post(`/api/room/tips/${tipId}/distribute`, { allocations });
    if (!data.success) {
      throw new Error(data.message || 'Failed to distribute tip');
    }
    logger.info('Tip distributed', { tipId, allocationCount: allocations.length });
    return data.tip as TipDistribution;
  } catch (error) {
    logger.error('Failed to distribute tip', { tipId, error });
    throw error;
  }
}

/**
 * Get staff roster for tip allocation
 */
export async function getRoomStaff(roomId: string): Promise<Array<{ id: string; name: string; role: string }>> {
  try {
    const { data } = await authClient.get(`/api/room/staff/${roomId}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch room staff');
    }
    return data.staff as Array<{ id: string; name: string; role: string }>;
  } catch (error) {
    logger.error('Failed to fetch room staff', { roomId, error });
    // Return empty array on error - staff roster is optional
    return [];
  }
}

/**
 * Get suggested tip percentage based on service quality
 */
export function getSuggestedTipPercentage(
  serviceCount: number,
  averageRating?: number
): TipPercentage {
  // Base suggestion on number of services used
  if (serviceCount >= 5) {
    return 15;
  }
  if (serviceCount >= 3) {
    return 10;
  }
  if (serviceCount >= 1) {
    return 5;
  }
  return 0;
}

// ── Tip Display Helpers ────────────────────────────────────────────────────────

/**
 * Format tip amount for display
 */
export function formatTipAmount(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return `Rs. ${rupees.toFixed(0)}`;
}

/**
 * Get tip label for a percentage
 */
export function getTipLabel(percentage: TipPercentage): string {
  if (percentage === 0) return 'Skip tip';
  if (percentage === 5) return 'Small tip';
  if (percentage === 10) return 'Good service';
  if (percentage === 15) return 'Great service';
  if (percentage === 20) return 'Excellent service';
  if (percentage === 25) return 'Outstanding service';
  return `${percentage}%`;
}

/**
 * Get tip emoji for a percentage
 */
export function getTipEmoji(percentage: TipPercentage): string {
  if (percentage === 0) return '—';
  if (percentage <= 5) return '👋';
  if (percentage <= 10) return '☕';
  if (percentage <= 15) return '🍀';
  if (percentage <= 20) return '⭐';
  return '🌟';
}
