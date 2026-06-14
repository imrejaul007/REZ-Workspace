/**
 * Web Order API Service
 *
 * Handles REZ Now web ordering history and pending order counts.
 * Endpoint: GET /web-ordering/orders/history
 * Note: apiClient.baseURL already includes /api — do NOT prefix paths with /api here.
 */

import apiClient from './apiClient';

export interface WebOrderHistoryItem {
  orderNumber: string;
  storeSlug: string;
  storeName: string;
  storeLogo?: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  orderType?: string;
}

interface WebOrderHistoryApiResponse {
  orders: WebOrderHistoryItem[];
  hasNext: boolean;
  page?: number;
}

/**
 * Fetch the authenticated user's REZ Now web order history.
 * Returns an empty list on error so callers don't need to guard.
 */
export async function getWebOrderHistory(
  page?: number,
): Promise<{ orders: WebOrderHistoryItem[]; hasNext: boolean }> {
  try {
    const params: Record<string, string | number> = {};
    if (page !== undefined) {
      params.page = page;
    }
    const response = await apiClient.get<WebOrderHistoryApiResponse>(
      '/web-ordering/orders/history',
      params as unknown,
    );
    if (response.success && response.data) {
      return {
        orders: response.data.orders ?? [],
        hasNext: response.data.hasNext ?? false,
      };
    }
    return { orders: [], hasNext: false };
  } catch {
    return { orders: [], hasNext: false };
  }
}

/**
 * Returns the count of active (pending or preparing) REZ Now orders.
 * Used for the bottom-nav badge.
 */
export async function getActiveWebOrderCount(): Promise<number> {
  try {
    const { orders } = await getWebOrderHistory(1);
    const activeStatuses = new Set(['pending', 'confirmed', 'preparing', 'ready']);
    return orders.filter((o) => activeStatuses.has(o.status.toLowerCase())).length;
  } catch {
    return 0;
  }
}
