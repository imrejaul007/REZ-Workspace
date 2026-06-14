import { authClient, getAccessToken } from './client';
import type { ReconciliationResult } from '@/lib/types';

// ─── Multi-Store Types ──────────────────────────────────────────────────────────

export interface OutletSummary {
  storeId: string;
  slug: string;
  name: string;
  outletCode: string;
  city?: string;
  isPrimaryOutlet: boolean;
  todayOrders: number;
  todayRevenue: number; // in paise
  pendingOrders: number;
}

export interface AggregateStats {
  totalRevenue: number;
  totalOrders: number;
  outletBreakdown: Array<{
    slug: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
}

export interface MerchantStoresResponse {
  stores: OutletSummary[];
  aggregate: AggregateStats;
}

// NW-MED-059: ReconciliationResult is now imported from '@/lib/types'.
// The local definition has been removed — use the canonical type from lib/types/index.ts.

// ─── Multi-Store API ──────────────────────────────────────────────────────────

/** Fetches all stores for the authenticated merchant with today's stats. */
export async function getMerchantStores(): Promise<MerchantStoresResponse> {
  const { data } = await authClient.get('/api/merchant/stores');
  if (!data.success) throw new Error(data.message || 'Failed to load stores');
  return data as MerchantStoresResponse;
}

/** Fetches aggregate stats across all merchant stores. */
export async function getAggregateStats(): Promise<AggregateStats> {
  const { data } = await authClient.get('/api/merchant/stores/aggregate');
  if (!data.success) throw new Error(data.message || 'Failed to load aggregate stats');
  return data.data as AggregateStats;
}

// ─── Reconciliation API ────────────────────────────────────────────────────────

/** Gets or creates reconciliation for a store on a given date (YYYY-MM-DD). */
export async function getReconciliation(
  storeSlug: string,
  date: string,
): Promise<ReconciliationResult> {
  const { data } = await authClient.get(`/api/reconcile/${storeSlug}/${date}`);
  if (!data.success) throw new Error(data.message || 'Failed to load reconciliation');
  return data.data as ReconciliationResult;
}

/** Submits cash entry. cashAmount is in paise. */
export async function submitCashEntry(
  storeSlug: string,
  date: string,
  cashAmount: number,
): Promise<ReconciliationResult> {
  const { data } = await authClient.post(`/api/reconcile/${storeSlug}/${date}`, {
    cashAmount,
  });
  if (!data.success) throw new Error(data.message || 'Failed to submit cash entry');
  return data.data as ReconciliationResult;
}

/** Locks and marks the reconciliation as reconciled. */
export async function lockReconciliation(
  storeSlug: string,
  date: string,
): Promise<ReconciliationResult> {
  const { data } = await authClient.post(`/api/reconcile/${storeSlug}/${date}/lock`);
  if (!data.success) throw new Error(data.message || 'Failed to lock reconciliation');
  return data.data as ReconciliationResult;
}

/** Downloads CSV export of reconciliation data. */
// C2 FIX: Use getAccessToken() instead of raw localStorage.getItem().
// Tokens are now AES-GCM encrypted (NW-CRIT-014 fix) — raw read returns null for encrypted sessions.
// getAccessToken() handles decryption automatically.
export async function exportReconciliationCSV(
  storeSlug: string,
  date: string,
): Promise<void> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.rezapp.com';
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in again.');
  }

  const response = await fetch(`${BASE_URL}/api/reconcile/${storeSlug}/${date}/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export CSV');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reconciliation-${storeSlug}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
