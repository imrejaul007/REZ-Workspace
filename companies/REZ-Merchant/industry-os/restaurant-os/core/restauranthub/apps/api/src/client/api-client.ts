import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { EventEmitter } from 'events';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  apiKey?: string;
  version?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Restaurant {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Menu {
  id: string;
  name: string;
  restaurantId: string;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export class RestoPapaApiClient extends EventEmitter {
  private client: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    super();

    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      apiKey: '',
      version: 'v1',
      ...config,
    };

    this.client = axios.create({
      baseURL: `${this.config.baseURL}/api/${this.config.version}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const axiosError = error as AxiosError<{ status?: number }>;
        const originalRequest = axiosError.config as ExtendedAxiosRequestConfig;

        if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.tokens?.refreshToken) {
            try {
              const newTokens = await this.refreshAccessToken();
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              }
              return this.client.request(originalRequest);
            } catch (refreshError) {
              this.emit('authError', refreshError);
              this.clearTokens();
            }
          } else {
            this.emit('authError', error);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Authentication methods
  async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<ApiResponse<AuthResponse>>('/auth/signup', userData);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
    }
    return response;
  }

  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<ApiResponse<AuthResponse>>('/auth/signin', credentials);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
    }
    return response;
  }

  async signOut(): Promise<ApiResponse<null>> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
    return { data: null, statusCode: 200, timestamp: new Date().toISOString() };
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', {
      refreshToken: this.tokens.refreshToken,
    }).then((response) => {
      const newTokens = response.data.tokens;
      this.setTokens(newTokens);
      return newTokens;
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  setTokens(tokens: AuthTokens) {
    this.tokens = tokens;
    this.emit('tokensUpdated', tokens);
  }

  clearTokens() {
    this.tokens = null;
    this.emit('tokensCleared');
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  // Restaurant methods
  async getRestaurants(params?: SearchParams): Promise<PaginatedResponse<Restaurant>> {
    return this.get<PaginatedResponse<Restaurant>>('/restaurants', { params });
  }

  async getRestaurant(id: string): Promise<ApiResponse<Restaurant>> {
    return this.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
  }

  async createRestaurant(restaurantData: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    return this.post<ApiResponse<Restaurant>>('/restaurants', restaurantData);
  }

  async updateRestaurant(id: string, restaurantData: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    return this.put<ApiResponse<Restaurant>>(`/restaurants/${id}`, restaurantData);
  }

  async deleteRestaurant(id: string): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/restaurants/${id}`);
  }

  // Menu methods
  async getMenus(restaurantId: string, params?: PaginationParams): Promise<PaginatedResponse<Menu>> {
    return this.get<PaginatedResponse<Menu>>(`/restaurants/${restaurantId}/menus`, { params });
  }

  async getMenu(restaurantId: string, menuId: string): Promise<ApiResponse<Menu>> {
    return this.get<ApiResponse<Menu>>(`/restaurants/${restaurantId}/menus/${menuId}`);
  }

  async createMenu(restaurantId: string, menuData: Partial<Menu>): Promise<ApiResponse<Menu>> {
    return this.post<ApiResponse<Menu>>(`/restaurants/${restaurantId}/menus`, menuData);
  }

  async updateMenu(restaurantId: string, menuId: string, menuData: Partial<Menu>): Promise<ApiResponse<Menu>> {
    return this.put<ApiResponse<Menu>>(`/restaurants/${restaurantId}/menus/${menuId}`, menuData);
  }

  // Order methods
  async getOrders(params?: SearchParams): Promise<PaginatedResponse<Order>> {
    return this.get<PaginatedResponse<Order>>('/orders', { params });
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return this.get<ApiResponse<Order>>(`/orders/${id}`);
  }

  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    return this.post<ApiResponse<Order>>('/orders', orderData);
  }

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    return this.put<ApiResponse<Order>>(`/orders/${id}/status`, { status });
  }

  // User methods
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.get<ApiResponse<User>>('/users/profile');
  }

  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<ApiResponse<User>>('/users/profile', userData);
  }

  // Payment methods
  async createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    orderId: string;
    gateway: 'stripe' | 'razorpay';
  }): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>(`/payments/${paymentData.gateway}/create-intent`, paymentData);
  }

  async confirmPayment(paymentId: string, gateway: string): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>(`/payments/${gateway}/confirm/${paymentId}`);
  }

  // File upload methods
  async uploadFile(
    file: File | Buffer,
    options?: {
      category?: string;
      isPublic?: boolean;
      maxWidth?: number;
      maxHeight?: number;
    }
  ): Promise<ApiResponse<{ url: string; key: string }>> {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      // Convert Buffer/ArrayBuffer to Blob for FormData
      const blob = new Blob([file instanceof ArrayBuffer ? new Uint8Array(file) : new Uint8Array(Buffer.from(file))]);
      formData.append('file', blob);
    }

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.post<ApiResponse<{ url: string; key: string }>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // Search methods
  async globalSearch(query: string, type?: string): Promise<ApiResponse<unknown[]>> {
    return this.get<ApiResponse<unknown[]>>('/search/global', { params: { q: query, type } });
  }

  async getSearchSuggestions(query: string, type?: string): Promise<ApiResponse<string[]>> {
    return this.get<ApiResponse<string[]>>('/search/suggestions', { params: { q: query, type } });
  }

  // Analytics methods
  async getBusinessMetrics(period?: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/analytics/business/metrics', { params: { period } });
  }

  async getRestaurantAnalytics(restaurantId: string, period?: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/restaurants/${restaurantId}/analytics`, { params: { period } });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/health');
  }

  // HTTP methods with retry logic
  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  private async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  private async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    let attempts = 0;
    const maxAttempts = this.config.retries + 1;

    while (attempts < maxAttempts) {
      try {
        const response: AxiosResponse<T> = await this.client.request({
          method,
          url,
          data,
          ...config,
        });

        return response.data;
      } catch (error) {
        attempts++;

        if (attempts >= maxAttempts) {
          throw this.handleError(error);
        }

        if (!this.shouldRetry(error)) {
          throw this.handleError(error);
        }

        await this.delay(this.config.retryDelay * attempts);
      }
    }
    throw new Error('Max retry attempts reached');
  }

  private shouldRetry(error: unknown): boolean {
    const axiosError = error as AxiosError;
    if (!axiosError.response) return true; // Network errors
    const status = axiosError.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: unknown): Error {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data) {
      const apiError = new Error(axiosError.response.data.message || axiosError.message);
      (apiError as unknown as { statusCode: number }).statusCode = axiosError.response.status;
      (apiError as unknown as { response: unknown }).response = axiosError.response.data;
      return apiError;
    }
    return axiosError instanceof Error ? axiosError : new Error(String(error));
  }
}

// Default client instance
export let apiClient: RestoPapaApiClient;

export function createApiClient(config: ApiClientConfig): RestoPapaApiClient {
  apiClient = new RestoPapaApiClient(config);
  return apiClient;
}

export function getApiClient(): RestoPapaApiClient {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient() first.');
  }
  return apiClient;
}
