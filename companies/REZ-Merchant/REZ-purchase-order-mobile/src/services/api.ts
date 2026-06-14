import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PurchaseOrder,
  POListFilters,
  POListResponse,
  CreatePORequest,
  ApprovalAction,
  Supplier,
  SupplierSearchResult,
  ProductSearchResult,
  PriceComparison,
  DashboardStats,
  DeliveryPhoto,
} from '../types';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.rezapp.com';
const SERVICE_NAME = 'purchase-order-service';
const TOKEN_KEY = `${SERVICE_NAME}_token`;
const SYNC_QUEUE_KEY = 'po_sync_queue';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Create axios instance with interceptors
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for authentication
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          config.headers['X-Internal-Token'] = token;
        }
        config.headers['X-Service-Name'] = SERVICE_NAME;
        config.headers['X-Request-Id'] = generateRequestId();
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

      // Handle network errors
      if (!error.response) {
        throw new APIError(
          'Network error. Please check your connection.',
          0,
          'NETWORK_ERROR'
        );
      }

      // Retry logic for 5xx errors
      if (error.response.status >= 500 && originalRequest && !originalRequest._retryCount) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        if (originalRequest._retryCount <= MAX_RETRIES) {
          await delay(RETRY_DELAY * originalRequest._retryCount);
          return client(originalRequest);
        }
      }

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        await handleUnauthorized();
      }

      const apiError = new APIError(
        error.response.data?.message || error.message || 'An error occurred',
        error.response.status,
        error.response.data?.code,
        error.response.data?.details
      );

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Generate unique request ID
// FIX (security): Replaced Math.random() with crypto
const generateRequestId = (): string => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(8);
    globalThis.crypto.getRandomValues(array);
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return `${Date.now()}-${hex}`;
  }
  // Node.js fallback
  try {
    const { randomBytes } = require('crypto');
    const hex = randomBytes(8).toString('hex');
    return `${Date.now()}-${hex}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
};

// Delay utility
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Handle unauthorized access
const handleUnauthorized = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  // In a real app, you would navigate to login screen
};

// API Client instance
const apiClient = createApiClient();

// Sync Queue Management
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'photo';
  entity: 'purchaseOrder' | 'deliveryPhoto';
  data;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private isProcessing = false;

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  async add(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const newItem: SyncQueueItem = {
      ...item,
      id: generateRequestId(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    this.queue.push(newItem);
    await this.saveToStorage();
    return newItem.id;
  }

  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter(item => item.id !== id);
    await this.saveToStorage();
  }

  async update(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...updates };
      await this.saveToStorage();
    }
  }

  getAll(): SyncQueueItem[] {
    return [...this.queue];
  }

  getPending(): SyncQueueItem[] {
    return this.queue.filter(item => item.retryCount < MAX_RETRIES);
  }

  getPendingCount(): number {
    return this.getPending().length;
  }

  async process(apiCall: (item: SyncQueueItem) => Promise<unknown>): Promise<{ success: string[]; failed: string[] }> {
    if (this.isProcessing) {
      return { success: [], failed: [] };
    }

    this.isProcessing = true;
    const results = { success: [] as string[], failed: [] as string[] };

    try {
      for (const item of this.getPending()) {
        try {
          await apiCall(item);
          await this.remove(item.id);
          results.success.push(item.id);
        } catch (error) {
          await this.update(item.id, {
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
          results.failed.push(item.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.saveToStorage();
  }
}

export const syncQueue = new SyncQueue();

// Network status check
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

const handleResponse = <T>(response): ApiResponse<T> => {
  return {
    success: true,
    data: response.data,
  };
};

const handleError = (error): ApiResponse<never> => {
  if (error instanceof APIError) {
    return {
      success: false,
      error,
    };
  }
  return {
    success: false,
    error: new APIError('An unexpected error occurred', 0, 'UNKNOWN'),
  };
};

// Purchase Order API Service
export const purchaseOrderApi = {
  // Get all purchase orders with filters and pagination
  async getPurchaseOrders(
    filters?: POListFilters,
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<POListResponse>> {
    try {
      const params = {
        ...filters,
        page,
        pageSize,
        status: filters?.status?.join(','),
        paymentStatus: filters?.paymentStatus?.join(','),
        priority: filters?.priority?.join(','),
      };
      const response = await apiClient.get('/purchase-orders', { params });
      return handleResponse<POListResponse>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get single purchase order by ID
  async getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.get(`/purchase-orders/${id}`);
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Create new purchase order
  async createPurchaseOrder(data: CreatePORequest): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.post('/purchase-orders', data);
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Update purchase order
  async updatePurchaseOrder(
    id: string,
    data: Partial<CreatePORequest>
  ): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.patch(`/purchase-orders/${id}`, data);
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Delete purchase order (soft delete)
  async deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/purchase-orders/${id}`);
      return { success: true };
    } catch (error) {
      return handleError(error);
    }
  },

  // Approve or reject purchase order
  async approvePurchaseOrder(action: ApprovalAction): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.post(`/purchase-orders/${action.poId}/approval`, {
        action: action.action,
        reason: action.reason,
      });
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Send purchase order to supplier
  async sendPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.post(`/purchase-orders/${id}/send`);
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Cancel purchase order
  async cancelPurchaseOrder(id: string, reason: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.post(`/purchase-orders/${id}/cancel`, { reason });
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Upload delivery photo
  async uploadDeliveryPhoto(
    poId: string,
    photo: { uri: string; type: string; notes?: string }
  ): Promise<ApiResponse<DeliveryPhoto>> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: `delivery_${Date.now()}.jpg`,
      } as unknown);
      formData.append('type', photo.type || 'delivery');
      formData.append('notes', photo.notes || '');

      const response = await apiClient.post(`/purchase-orders/${poId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleResponse<DeliveryPhoto>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Mark as delivered
  async markAsDelivered(
    poId: string,
    deliveryData: {
      receivedBy: string;
      signature?: string;
      notes?: string;
      photos?: DeliveryPhoto[];
    }
  ): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response = await apiClient.post(`/purchase-orders/${poId}/deliver`, deliveryData);
      return handleResponse<PurchaseOrder>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get dashboard stats
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await apiClient.get('/purchase-orders/stats/dashboard');
      return handleResponse<DashboardStats>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get PO history
  async getPOHistory(id: string): Promise<ApiResponse<unknown[]>> {
    try {
      const response = await apiClient.get(`/purchase-orders/${id}/history`);
      return handleResponse<unknown[]>(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Supplier API Service
export const supplierApi = {
  async searchSuppliers(
    query: string,
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<SupplierSearchResult>> {
    try {
      const response = await apiClient.get('/suppliers/search', {
        params: { q: query, page, pageSize },
      });
      return handleResponse<SupplierSearchResult>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async getSupplier(id: string): Promise<ApiResponse<Supplier>> {
    try {
      const response = await apiClient.get(`/suppliers/${id}`);
      return handleResponse<Supplier>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async getSupplierProducts(
    supplierId: string,
    category?: string
  ): Promise<ApiResponse<ProductSearchResult[]>> {
    try {
      const response = await apiClient.get(`/suppliers/${supplierId}/products`, {
        params: { category },
      });
      return handleResponse<ProductSearchResult[]>(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Product API Service
export const productApi = {
  async searchProducts(
    query: string,
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<{ products: ProductSearchResult[]; total: number }>> {
    try {
      const response = await apiClient.get('/products/search', {
        params: { q: query, page, pageSize },
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async getProduct(id: string): Promise<ApiResponse<ProductSearchResult>> {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return handleResponse<ProductSearchResult>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async comparePrices(
    productId: string,
    quantity: number
  ): Promise<ApiResponse<PriceComparison[]>> {
    try {
      const response = await apiClient.get(`/products/${productId}/prices`, {
        params: { quantity },
      });
      return handleResponse<PriceComparison[]>(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Export API client for custom requests
export { apiClient };

// Default export
export default {
  purchaseOrder: purchaseOrderApi,
  supplier: supplierApi,
  product: productApi,
  syncQueue,
  checkNetworkStatus,
  APIError,
};
