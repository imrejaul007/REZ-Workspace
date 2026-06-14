/**
 * Dine-In API Service
 *
 * Handles table management, order creation, and session lifecycle for
 * dine-in functionality including table status, ordering, and billing.
 */

import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableStatus {
  id: string;
  tableId: string; // alias for id — some code references tableId
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentAmount: number;
  guestCount: number;
  seatedDuration: number; // minutes
  sessionId: string | null;
  items: TableOrderItem[];
  customerName: string | null;
}

export interface TableOrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  course?: 'starter' | 'main' | 'dessert';
}

export interface TableOrder {
  _id: string;
  tableId: string;
  tableNumber: number;
  items: TableOrderItem[];
  totalAmount: number;
  status: 'open' | 'billed' | 'closed';
  guestCount: number;
  customerPhone?: string;
  customerName?: string;
  openedAt: string;
}

export interface TableStatusResponse {
  tables: TableStatus[];
  occupiedTables: number;
  availableTables: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const dineInService = {
  /** Fetch all tables for a store with live occupancy status */
  async getTableStatus(storeId: string): Promise<TableStatusResponse> {
    const response = await apiClient.get<TableStatusResponse>(
      `merchant/table-management/table-status?storeId=${storeId}`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch table status');
    }
    return response.data as TableStatusResponse;
  },

  /** Start a new dine-in session for a table */
  async startOrder(params: {
    storeId: string;
    tableId: string;
    tableNumber: number;
    guestCount?: number;
    customerPhone?: string;
    customerName?: string;
  }): Promise<TableOrder> {
    const response = await apiClient.post<TableOrder>(
      'merchant/table-management/dine-in/start-order',
      params
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to start order');
    }
    return response.data as TableOrder;
  },

  /** Get the active order for a table */
  async getTableOrder(tableId: string, storeId: string): Promise<TableOrder> {
    const response = await apiClient.get<TableOrder>(
      `merchant/table-management/table-orders/${tableId}?storeId=${storeId}`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch table order');
    }
    return response.data as TableOrder;
  },

  /** Update items in a table session */
  async updateOrderItems(sessionId: string, items: TableOrderItem[]): Promise<TableOrder> {
    const response = await apiClient.put<TableOrder>(
      `merchant/table-management/table-orders/${sessionId}/items`,
      { items }
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to update order items');
    }
    return response.data as TableOrder;
  },

  /** Update table status (e.g., mark as available) */
  async updateTableStatus(tableId: string, storeId: string, status: string): Promise<void> {
    const response = await apiClient.patch(`merchant/table-management/${tableId}/status`, {
      storeId,
      status,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update table status');
    }
  },
};

export default dineInService;
