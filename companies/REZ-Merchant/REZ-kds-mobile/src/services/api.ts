/**
 * KDS Mobile API Service
 * Handles all HTTP communication with the REZ backend
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../utils/constants';
import {
  KDSOrder,
  ApiResponse,
  ApiError,
  OrderFilterOptions,
  SortOptions,
  KDSStats,
  KitchenStation,
  OrderStatus,
  OrderPriority,
} from '../types';

// API Base URL - Use environment or default to local KDS service
const KDS_API_BASE_URL = process.env.EXPO_PUBLIC_KDS_API_URL || 'http://localhost:4014';

// API Error Class
export class KDSApiError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(error: ApiError, statusCode: number) {
    super(error.message);
    this.name = 'KDSApiError';
    this.code = error.code;
    this.statusCode = statusCode;
    this.details = error.details;
  }
}

// Request Interceptor - Add Auth Token
const authInterceptor = async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // CRITICAL FIX: X-Internal-Token is for SERVER-TO-SERVER only
    // NEVER expose internal service tokens in client-side code
    // The JWT Bearer token above provides authentication
    config.headers['Content-Type'] = 'application/json';
    // Add store ID header
    const storeId = await AsyncStorage.getItem(STORAGE_KEYS.STORE_ID);
    if (storeId && config.headers) {
      config.headers['x-store-id'] = storeId;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
};

// Response Interceptor - Handle Errors
const errorInterceptor = (error: AxiosError): Promise<never> => {
  if (error.response) {
    const apiError: ApiError = {
      code: error.response.data?.code || 'UNKNOWN_ERROR',
      message: error.response.data?.message || error.message,
      details: error.response.data?.details,
    };
    throw new KDSApiError(apiError, error.response.status);
  }
  if (error.request) {
    throw new KDSApiError(
      { code: 'NETWORK_ERROR', message: 'Network request failed' },
      0
    );
  }
  throw error;
};

// Create Axios Instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: KDS_API_BASE_URL + '/api/v1/kds', // Our KDS service endpoint
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(authInterceptor, Promise.reject);
  client.interceptors.response.use((response) => response, errorInterceptor);

  return client;
};

// API Service Class
class KDSApiService {
  private client: AxiosInstance;
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.client = createApiClient();
  }

  /**
   * Make a request with retry logic
   */
  private async requestWithRetry<T>(
    config: AxiosRequestConfig,
    maxRetries = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    const retryKey = `${config.method}-${config.url}`;

    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      this.retryCount.delete(retryKey);
      return response.data.data as T;
    } catch (error) {
      const currentRetry = this.retryCount.get(retryKey) || 0;

      if (
        error instanceof AxiosError &&
        error.response?.status === 429 &&
        currentRetry < maxRetries
      ) {
        this.retryCount.set(retryKey, currentRetry + 1);
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, currentRetry))
        );
        return this.requestWithRetry(config, maxRetries);
      }

      this.retryCount.delete(retryKey);
      throw error;
    }
  }

  // ==================== ORDERS ====================

  /**
   * Get all orders with optional filters
   */
  async getOrders(
    filters?: OrderFilterOptions,
    sort?: SortOptions,
    page = 1,
    pageSize = 50
  ): Promise<{ orders: KDSOrder[]; total: number; hasMore: boolean }> {
    const params: Record<string, unknown> = { page, pageSize };

    if (filters?.status?.length) params.status = filters.status.join(',');
    if (filters?.priority?.length) params.priority = filters.priority.join(',');
    if (filters?.station?.length) params.station = filters.station.join(',');
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.source?.length) params.source = filters.source.join(',');
    if (filters?.searchQuery) params.search = filters.searchQuery;

    if (sort) {
      params.sortBy = sort.field;
      params.sortOrder = sort.direction;
    }

    const response = await this.requestWithRetry<{
      items: KDSOrder[];
      total: number;
      hasMore: boolean;
    }>({
      method: 'GET',
      url: '/api/v1/kds/orders',
      params,
    });

    return response;
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'GET',
      url: `/api/v1/kds/orders/${orderId}`,
    });
  }

  /**
   * Get pending orders for a station
   */
  async getPendingOrders(station: KitchenStation): Promise<KDSOrder[]> {
    const response = await this.requestWithRetry<KDSOrder[]>({
      method: 'GET',
      url: `/api/v1/kds/stations/${station}/orders`,
      params: { status: [OrderStatus.PENDING, OrderStatus.ACKNOWLEDGED, OrderStatus.IN_PROGRESS].join(',') },
    });
    return response;
  }

  /**
   * Update order status (acknowledge, start, ready, complete)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: { station?: KitchenStation; notes?: string }
  ): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'PATCH',
      url: `/api/v1/kds/orders/${orderId}/status`,
      data: { status, ...metadata },
    });
  }

  /**
   * Bump order to next status
   */
  async bumpOrder(
    orderId: string,
    station?: KitchenStation
  ): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'POST',
      url: `/api/v1/kds/orders/${orderId}/bump`,
      data: { station },
    });
  }

  /**
   * Recall a bumped order
   */
  async recallOrder(orderId: string): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'POST',
      url: `/api/v1/kds/orders/${orderId}/recall`,
    });
  }

  /**
   * Update item status within an order
   */
  async updateItemStatus(
    orderId: string,
    itemId: string,
    status: OrderStatus
  ): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'PATCH',
      url: `/api/v1/kds/orders/${orderId}/items/${itemId}`,
      data: { status },
    });
  }

  /**
   * Add notes to an order
   */
  async addOrderNote(orderId: string, note: string): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'POST',
      url: `/api/v1/kds/orders/${orderId}/notes`,
      data: { note },
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason: string): Promise<KDSOrder> {
    return this.requestWithRetry<KDSOrder>({
      method: 'POST',
      url: `/api/v1/kds/orders/${orderId}/cancel`,
      data: { reason },
    });
  }

  /**
   * Reprint order ticket
   */
  async reprintTicket(orderId: string): Promise<{ ticketUrl: string }> {
    return this.requestWithRetry<{ ticketUrl: string }>({
      method: 'POST',
      url: `/api/v1/kds/orders/${orderId}/reprint`,
    });
  }

  // ==================== STATS ====================

  /**
   * Get KDS statistics
   */
  async getStats(): Promise<KDSStats> {
    return this.requestWithRetry<KDSStats>({
      method: 'GET',
      url: '/api/v1/kds/stats',
    });
  }

  /**
   * Get station statistics
   */
  async getStationStats(station: KitchenStation): Promise<KDSStats> {
    return this.requestWithRetry<KDSStats>({
      method: 'GET',
      url: `/api/v1/kds/stations/${station}/stats`,
    });
  }

  // ==================== SYNC ====================

  /**
   * Get orders updated since last sync
   */
  async getSyncOrders(since: string): Promise<KDSOrder[]> {
    return this.requestWithRetry<KDSOrder[]>({
      method: 'GET',
      url: '/api/v1/kds/sync',
      params: { since },
    });
  }

  /**
   * Batch update order statuses (for offline sync)
   */
  async batchUpdateOrders(
    updates: Array<{ orderId: string; status: OrderStatus; timestamp: string }>
  ): Promise<{ successful: string[]; failed: Array<{ orderId: string; error: string }> }> {
    return this.requestWithRetry<{
      successful: string[];
      failed: Array<{ orderId: string; error: string }>;
    }>({
      method: 'POST',
      url: '/api/v1/kds/batch-update',
      data: { updates },
    });
  }

  // ==================== AUTH ====================

  /**
   * Login and get auth token
   */
  async login(
    username: string,
    password: string
  ): Promise<{ token: string; user: { id: string; name: string; role: string } }> {
    const response = await this.client.post<ApiResponse<{ token: string; user: unknown }>>(
      '/api/v1/auth/login',
      { username, password }
    );

    const data = response.data.data as { token: string; user: unknown };
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.token);
    return data as { token: string; user: { id: string; name: string; role: string } };
  }

  /**
   * Logout and clear token
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/api/v1/auth/logout');
    } finally {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    }
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.client.get('/api/v1/auth/validate');
      return true;
    } catch {
      return false;
    }
  }

  // ==================== OFFLINE CACHE ====================

  /**
   * Cache orders for offline use
   */
  async cacheOrders(orders: KDSOrder[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CACHED_ORDERS,
      JSON.stringify(orders)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  }

  /**
   * Get cached orders
   */
  async getCachedOrders(): Promise<KDSOrder[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_ORDERS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Queue action for offline sync
   */
  async queueOfflineAction(action: {
    type: string;
    payload: unknown;
    timestamp: string;
  }): Promise<void> {
    const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    const queue = queueData ? JSON.parse(queueData) : [];
    queue.push(action);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  }

  /**
   * Get offline action queue
   */
  async getOfflineQueue(): Promise<Array<{ type: string; payload: unknown; timestamp: string }>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Clear offline action queue
   */
  async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }
}

// Export singleton instance
export const kdsApi = new KDSApiService();
export default kdsApi;
