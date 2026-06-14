/**
 * Bill Split API
 * Client-side API for split bill functionality
 */

import { authClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BillSplit {
  _id: string;
  orderId: string;
  storeId: string;
  totalAmount: number;
  splits: Array<{
    personId: string;
    personName?: string;
    itemIds: string[];
    itemTotal: number;
    sharePercent: number;
    amount: number;
    settled: boolean;
    settledAt?: string;
  }>;
  status: 'pending' | 'partial' | 'settled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSplitRequest {
  splits: Array<{
    personId: string;
    personName?: string;
    itemIds: string[];
  }>;
}

export interface SplitSummary {
  orderId: string;
  totalAmount: number;
  splitCount: number;
  status: 'pending' | 'partial' | 'settled';
  perPerson: Array<{
    personId: string;
    personName?: string;
    amount: number;
    sharePercent: number;
    settled: boolean;
    settledAt?: string;
  }>;
  remaining: number;
  settledAmount: number;
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Create a bill split for an order
 * @param orderId - The order ID
 * @param splits - The split configuration
 */
export async function createBillSplit(
  orderId: string,
  splits: CreateSplitRequest['splits']
): Promise<BillSplit> {
  const { data } = await authClient.post(`/api/orders/${orderId}/split`, { splits });
  if (!data.success) throw new Error(data.message || 'Failed to create bill split');
  return data.data;
}

/**
 * Get bill split details for an order
 * @param orderId - The order ID
 */
export async function getBillSplit(orderId: string): Promise<BillSplit> {
  const { data } = await authClient.get(`/api/orders/${orderId}/splits`);
  if (!data.success) throw new Error(data.message || 'Failed to get bill split');
  return data.data;
}

/**
 * Get per-person summary for a bill split
 * @param orderId - The order ID
 */
export async function getBillSplitSummary(orderId: string): Promise<SplitSummary> {
  const { data } = await authClient.get(`/api/orders/${orderId}/splits/summary`);
  if (!data.success) throw new Error(data.message || 'Failed to get bill split summary');
  return data.data;
}

/**
 * Mark a person's share as settled
 * @param orderId - The order ID
 * @param personId - The person ID to settle
 */
export async function settleBillSplit(
  orderId: string,
  personId: string
): Promise<BillSplit> {
  const { data } = await authClient.patch(`/api/orders/${orderId}/splits/${personId}/settle`);
  if (!data.success) throw new Error(data.message || 'Failed to settle bill split');
  return data.data;
}

// ── Utility Functions ──────────────────────────────────────────────────────────

/**
 * Format amount in paise to display currency
 */
export function formatSplitAmount(amount: number, currency = 'INR'): string {
  const rupees = amount / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Calculate equal split amounts
 */
export function calculateEqualSplit(
  totalAmount: number,
  numberOfPeople: number
): { amount: number; remainder: number } {
  if (numberOfPeople <= 0) {
    return { amount: 0, remainder: totalAmount };
  }

  const baseAmount = Math.floor(totalAmount / numberOfPeople);
  const remainder = totalAmount - baseAmount * numberOfPeople;

  return { amount: baseAmount, remainder };
}

/**
 * Format split status for display
 */
export function formatSplitStatus(status: BillSplit['status']): string {
  const statusLabels: Record<BillSplit['status'], string> = {
    pending: 'Awaiting payment',
    partial: 'Partially paid',
    settled: 'Fully paid',
  };
  return statusLabels[status];
}

/**
 * Get remaining amount to be settled
 */
export function getRemainingAmount(split: BillSplit | SplitSummary): number {
  if ('splits' in split) {
    return split.splits
      .filter((s) => !s.settled)
      .reduce((sum, s) => sum + s.amount, 0);
  }
  return split.perPerson
    .filter((p) => !p.settled)
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Check if all splits are settled
 */
export function isFullySettled(split: BillSplit | SplitSummary): boolean {
  if ('splits' in split) {
    return split.splits.every((s) => s.settled);
  }
  return split.perPerson.every((p) => p.settled);
}

/**
 * Generate share percentage text
 */
export function formatSharePercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * Create a simple equal split request
 */
export function createEqualSplitRequest(
  numberOfPeople: number,
  orderItems: string[]
): CreateSplitRequest['splits'] {
  return Array.from({ length: numberOfPeople }, (_, i) => ({
    personId: `person_${i + 1}`,
    personName: `Person ${i + 1}`,
    itemIds: [], // Empty itemIds means equal split
  }));
}
