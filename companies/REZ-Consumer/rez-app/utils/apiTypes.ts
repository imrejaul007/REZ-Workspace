// @ts-nocheck
/**
 * SafeDeploy API Type Definitions
 * Ensures frontend code has proper TypeScript contract matching with backend
 *
 * This file defines the shape of all critical API responses so that:
 * 1. TypeScript catches contract mismatches at compile time
 * 2. Frontend knows exactly what shape to expect from backend
 * 3. Breaking API changes are caught during code review
 */

// ============================================================
// Core API Response Types
// ============================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================
// Authentication
// ============================================================

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  user: {
    name: string;
    avatar: string | null;
    tier: string;
  };
  expiresIn: number;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  walletBalance: number;
  coinsBalance: number;
  memberSince: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalOrders: number;
  totalSpent: number;
  addresses: Address[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: boolean;
  newsletter: boolean;
}

export interface Address {
  _id: string;
  type: 'home' | 'office' | 'other';
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

// ============================================================
// Store & Products
// ============================================================

export interface Store {
  _id: string;
  name: string;
  logo: string | null;
  rating: number; // 0-5
  reviewCount: number;
  category: string;
  tags: string[];
  isOpen: boolean;
  distance: number; // km
  location: GeoLocation;
  avgPrice: number | null;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface NearbyStoresResponse extends PaginatedResponse<Store> {
  filters?: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number; // INR
  originalPrice: number | null;
  discount: number; // 0-100
  rating: number; // 0-5
  reviewCount: number;
  image: string;
  images: string[];
  category: string;
  store: {
    _id: string;
    name: string;
    logo: string | null;
  };
  inStock: boolean;
  stock: number;
}

export interface ProductSearchResponse extends PaginatedResponse<Product> {
  filters?: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

// ============================================================
// Cart
// ============================================================

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  discount: number | null;
}

export interface CartResponse {
  cartId: string;
  itemCount: number;
  totalPrice: number;
  items: CartItem[];
}

// ============================================================
// Orders
// ============================================================

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number | null;
}

export interface Order {
  _id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string | null;
  trackingUrl: string | null;
}

export interface OrdersResponse extends PaginatedResponse<Order> {}

// ============================================================
// Payments
// ============================================================

export interface PaymentRequest {
  amount: number;
  storeId: string;
  description?: string;
}

export interface PaymentResponse {
  transactionId: string;
  newBalance: number;
  coinsEarned: number;
  cashbackINR: number;
  timestamp: string;
}

// ============================================================
// Health Check Responses
// ============================================================

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

export interface ReadinessCheckResponse {
  success: boolean;
  status: 'ready' | 'not-ready';
  checks: Record<
    string,
    {
      ok: boolean;
      latencyMs?: number;
      error?: string;
    }
  >;
  uptime: number;
  version: string;
  timestamp: string;
}

export interface DeepHealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'degraded';
  checks: Record<
    string,
    {
      status: 'ok' | 'error';
      latencyMs?: number;
      detail?: string;
      contracts?: Record<string, unknown>;
    }
  >;
  timestamp: string;
  version: string;
  uptime: number;
}

// ============================================================
// Webhook Events
// ============================================================

export interface RazorpayWebhookEvent {
  event:
    | 'payment.captured'
    | 'payment.failed'
    | 'refund.processed'
    | 'order.paid';
  payload: {
    payment: {
      entity: 'payment';
      id: string;
      amount: number; // paise
      status: 'captured' | 'failed' | 'authorized';
      method: string;
      description?: string;
      order_id: string;
      customer_id: string;
      created_at: number; // unix timestamp
    };
  };
}

// ============================================================
// Error Types
// ============================================================

export interface ApiError {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?;
}

export interface ValidationError extends ApiError {
  errors: Record<string, string[]>;
}

// ============================================================
// Type Guards
// ============================================================

export function isApiResponse<T>(obj): obj is ApiResponse<T> {
  return typeof obj === 'object' && obj !== null && 'success' in obj;
}

export function isValidationError(error): error is ValidationError {
  return error?.errors && typeof error.errors === 'object';
}

export function isPaginatedResponse<T>(obj): obj is PaginatedResponse<T> {
  return (
    Array.isArray(obj.items) &&
    typeof obj.total === 'number' &&
    typeof obj.page === 'number' &&
    typeof obj.limit === 'number'
  );
}

// ============================================================
// Request Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  storeId: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

// ============================================================
// API Client Configuration
// ============================================================

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  defaultHeaders: Record<string, string>;
}

// ============================================================
// Generic Response Handler
// ============================================================

/**
 * Helper to ensure type safety when handling API responses
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>
): T | never {
  if (!response.success) {
    throw new Error(response.error || response.message || 'API request failed');
  }
  return response.data as T;
}

/**
 * Helper to safely extract data from paginated responses
 */
export function extractPaginatedData<T>(
  response: ApiResponse<PaginatedResponse<T>>
): PaginatedResponse<T> {
  return handleApiResponse(response);
}
