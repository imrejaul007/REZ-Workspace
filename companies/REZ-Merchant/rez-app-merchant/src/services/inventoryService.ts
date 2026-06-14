import logger from './utils/logger';

import { API_BASE_URL } from '@/config/api';
import {
  cacheData,
  getCachedData,
  queueOfflineAction,
  isOnline,
  getCachedOrFetch,
} from './offlineService';

export interface InventoryItem {
  id: string;
  merchantId: string;
  name: string;
  sku: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  category?: string;
  price: number;
  cost: number;
  supplier?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  merchantId: string;
  itemName: string;
  sku: string;
  currentQuantity: number;
  minStockLevel: number;
  shortage: number;
  createdAt: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  merchantId: string;
  orderNumber: string;
  supplier: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  orderDate: string;
  expectedDelivery?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderData {
  supplier: string;
  items: Omit<PurchaseOrderItem, 'totalPrice'>[];
  expectedDelivery?: string;
  notes?: string;
}

export interface UpdateStockData {
  quantity: number;
  reason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.status} ${response.statusText}`,
      status: response.status,
    };
    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
      error.code = errorData.code;
    } catch {
      // Response might not be JSON
    }
    throw error;
  }
  return response.json();
};

/**
 * Get all inventory items for a merchant
 */
export const getInventory = async (
  merchantId: string,
  options?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    lowStockOnly?: boolean;
    forceRefresh?: boolean;
  }
): Promise<PaginatedResponse<InventoryItem>> => {
  const cacheKey = `inventory_${merchantId}_${JSON.stringify(options || {})}`;

  // Create the fetch function
  const fetchFn = async (): Promise<PaginatedResponse<InventoryItem>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.search) params.append('search', options.search);
    if (options?.lowStockOnly) params.append('lowStockOnly', 'true');

    const url = `${API_BASE_URL}/inventory/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<PaginatedResponse<InventoryItem>>(response);
  };

  // Use cached or fetch with offline fallback
  if (options?.forceRefresh) {
    // Force refresh - fetch from API
    if (await isOnline()) {
      const result = await fetchFn();
      await cacheData(cacheKey, result, 5 * 60 * 1000);
      return result;
    }
    // Fall back to cache if offline
    const cached = await getCachedData<PaginatedResponse<InventoryItem>>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }

  // Normal mode - use cache with offline fallback
  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 5 * 60 * 1000);
  } catch {
    const cached = await getCachedData<PaginatedResponse<InventoryItem>>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Get a single inventory item by ID
 */
export const getInventoryById = async (id: string, options?: { forceRefresh?: boolean }): Promise<InventoryItem> => {
  const cacheKey = `inventory_item_${id}`;

  const fetchFn = async (): Promise<InventoryItem> => {
    const response = await fetch(`${API_BASE_URL}/inventory/detail/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<InventoryItem>(response);
  };

  if (options?.forceRefresh) {
    if (await isOnline()) {
      const result = await fetchFn();
      await cacheData(cacheKey, result, 10 * 60 * 1000);
      return result;
    }
    const cached = await getCachedData<InventoryItem>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }

  // Try cache first
  const cached = await getCachedData<InventoryItem>(cacheKey);
  if (cached) {
    // Refresh in background if online
    if (await isOnline()) {
      fetchFn().then((fresh) => cacheData(cacheKey, fresh, 10 * 60 * 1000)).catch(() => {});
    }
    return cached;
  }

  // Not in cache - fetch from API
  if (await isOnline()) {
    const result = await fetchFn();
    await cacheData(cacheKey, result, 10 * 60 * 1000);
    return result;
  }

  throw new Error('No cached data available and offline');
};

/**
 * Update stock quantity for an inventory item
 */
export const updateStock = async (
  id: string,
  data: UpdateStockData,
  options?: { queueIfOffline?: boolean }
): Promise<InventoryItem> => {
  const online = await isOnline();

  if (!online && options?.queueIfOffline !== false) {
    const actionId = await queueOfflineAction('inventory', 'updateStock', {
      id,
      data,
    });
    console.log('[InventoryService] Stock update queued:', actionId);

    // Return optimistic response
    return {
      id,
      merchantId: '',
      name: '',
      sku: '',
      quantity: data.quantity,
      minStockLevel: 0,
      maxStockLevel: 0,
      unit: '',
      price: 0,
      cost: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleResponse<InventoryItem>(response);

    // Update cache
    await cacheData(`inventory_item_${id}`, result, 10 * 60 * 1000);

    return result;
  } catch (error) {
    console.error('[InventoryService] Error updating stock:', error);

    // Queue if request failed
    if (options?.queueIfOffline !== false) {
      await queueOfflineAction('inventory', 'updateStock', {
        id,
        data,
      });
      logger.info('[InventoryService] Stock update queued after failed request');

      // Return optimistic response
      return {
        id,
        merchantId: '',
        name: '',
        sku: '',
        quantity: data.quantity,
        minStockLevel: 0,
        maxStockLevel: 0,
        unit: '',
        price: 0,
        cost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    throw error;
  }
};

/**
 * Get low stock alerts for a merchant
 */
export const getLowStockAlerts = async (
  merchantId: string,
  options?: { forceRefresh?: boolean }
): Promise<LowStockAlert[]> => {
  const cacheKey = `low_stock_alerts_${merchantId}`;

  const fetchFn = async (): Promise<LowStockAlert[]> => {
    const response = await fetch(`${API_BASE_URL}/inventory/${merchantId}/alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<LowStockAlert[]>(response);
  };

  if (options?.forceRefresh) {
    if (await isOnline()) {
      const result = await fetchFn();
      await cacheData(cacheKey, result, 2 * 60 * 1000); // 2 min TTL for alerts
      return result;
    }
    const cached = await getCachedData<LowStockAlert[]>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }

  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 2 * 60 * 1000);
  } catch {
    const cached = await getCachedData<LowStockAlert[]>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = async (
  data: CreatePurchaseOrderData,
  options?: { queueIfOffline?: boolean }
): Promise<PurchaseOrder> => {
  const online = await isOnline();

  if (!online && options?.queueIfOffline !== false) {
    const actionId = await queueOfflineAction('inventory', 'createPurchaseOrder', {
      data,
    });
    console.log('[InventoryService] Purchase order queued:', actionId);

    // Return optimistic response
    return {
      id: `pending_${actionId}`,
      merchantId: '',
      orderNumber: `PO-PENDING-${Date.now()}`,
      supplier: data.supplier,
      items: data.items.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
      totalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      status: 'pending',
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inventory/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<PurchaseOrder>(response);
  } catch (error) {
    console.error('[InventoryService] Error creating purchase order:', error);

    if (options?.queueIfOffline !== false) {
      await queueOfflineAction('inventory', 'createPurchaseOrder', {
        data,
      });
      logger.info('[InventoryService] Purchase order queued after failed request');

      // Return optimistic response
      return {
        id: `pending_${Date.now()}`,
        merchantId: '',
        orderNumber: `PO-PENDING-${Date.now()}`,
        supplier: data.supplier,
        items: data.items.map((item) => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        })),
        totalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        status: 'pending',
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    throw error;
  }
};

/**
 * Get all purchase orders for a merchant
 */
export const getPurchaseOrders = async (
  merchantId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: PurchaseOrder['status'];
  }
): Promise<PaginatedResponse<PurchaseOrder>> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);

  const url = `${API_BASE_URL}/inventory/purchase-orders/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<PaginatedResponse<PurchaseOrder>>(response);
};

/**
 * Get a single purchase order by ID
 */
export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder> => {
  const response = await fetch(`${API_BASE_URL}/inventory/purchase-orders/detail/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<PurchaseOrder>(response);
};

/**
 * Update purchase order status (e.g., mark as received)
 */
export const updatePurchaseOrderStatus = async (
  id: string,
  status: PurchaseOrder['status'],
  receivedDate?: string
): Promise<PurchaseOrder> => {
  const response = await fetch(`${API_BASE_URL}/inventory/purchase-orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, receivedDate }),
  });

  return handleResponse<PurchaseOrder>(response);
};

/**
 * Delete a purchase order
 */
export const deletePurchaseOrder = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/inventory/purchase-orders/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.status} ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }
};

/**
 * Bulk update stock for multiple items
 */
export const bulkUpdateStock = async (
  updates: Array<{ id: string; quantity: number; reason?: string }>,
  options?: { queueIfOffline?: boolean }
): Promise<InventoryItem[]> => {
  const online = await isOnline();

  if (!online && options?.queueIfOffline !== false) {
    const actionId = await queueOfflineAction('inventory', 'bulkUpdateStock', {
      updates,
    });
    console.log('[InventoryService] Bulk stock update queued:', actionId);

    // Return optimistic response with updated items
    return updates.map((update) => ({
      id: update.id,
      merchantId: '',
      name: '',
      sku: '',
      quantity: update.quantity,
      minStockLevel: 0,
      maxStockLevel: 0,
      unit: '',
      price: 0,
      cost: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as InventoryItem[];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inventory/bulk/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    const result = await handleResponse<InventoryItem[]>(response);

    // Update cache for each item
    for (const item of result) {
      await cacheData(`inventory_item_${item.id}`, item, 10 * 60 * 1000);
    }

    return result;
  } catch (error) {
    console.error('[InventoryService] Error bulk updating stock:', error);

    if (options?.queueIfOffline !== false) {
      await queueOfflineAction('inventory', 'bulkUpdateStock', {
        updates,
      });
      logger.info('[InventoryService] Bulk stock update queued after failed request');

      // Return optimistic response
      return updates.map((update) => ({
        id: update.id,
        merchantId: '',
        name: '',
        sku: '',
        quantity: update.quantity,
        minStockLevel: 0,
        maxStockLevel: 0,
        unit: '',
        price: 0,
        cost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as InventoryItem[];
    }

    throw error;
  }
};
