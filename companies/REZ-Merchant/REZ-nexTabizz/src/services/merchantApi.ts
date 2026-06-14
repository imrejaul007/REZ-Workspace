/**
 * REZ Merchant App - Merchant API Service
 * NexTaBizz - QR Merchant OS
 */

import { API_ENDPOINTS } from './api';

// =============================================================================
// Environment Configuration
// =============================================================================

const MERCHANT_API = process.env.EXPO_PUBLIC_MERCHANT_API || 'https://rez-merchant-service.onrender.com';
const AUTH_SERVICE = process.env.EXPO_PUBLIC_AUTH_SERVICE || 'https://rez-auth-service.onrender.com';
const ORDER_SERVICE = process.env.EXPO_PUBLIC_ORDER_SERVICE || 'https://rez-order-service.onrender.com';
const PAYMENT_SERVICE = process.env.EXPO_PUBLIC_PAYMENT_SERVICE || 'https://rez-payment-service.onrender.com';
const ANALYTICS_SERVICE = process.env.EXPO_PUBLIC_ANALYTICS_SERVICE || 'https://rez-analytics-service.onrender.com';

// =============================================================================
// Service Endpoints
// =============================================================================

export const MERCHANT_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${AUTH_SERVICE}/api/auth/merchant/login`,
    register: `${AUTH_SERVICE}/api/auth/merchant/register`,
    verifyOtp: `${AUTH_SERVICE}/api/auth/merchant/verify-otp`,
    refreshToken: `${AUTH_SERVICE}/api/auth/merchant/refresh`,
    logout: `${AUTH_SERVICE}/api/auth/merchant/logout`,
  },

  // Merchant Profile
  merchant: {
    base: `${MERCHANT_API}/api/v1/merchants`,
    profile: (id: string) => `${MERCHANT_API}/api/v1/merchants/${id}`,
    update: (id: string) => `${MERCHANT_API}/api/v1/merchants/${id}`,
    logo: (id: string) => `${MERCHANT_API}/api/v1/merchants/${id}/logo`,
    banner: (id: string) => `${MERCHANT_API}/api/v1/merchants/${id}/banner`,
    settings: (id: string) => `${MERCHANT_API}/api/v1/merchants/${id}/settings`,
    verify: (id: string) => `${MERCHANT_API}/api/v1/merchants/${id}/verify`,
  },

  // Products & Catalog
  products: {
    base: `${MERCHANT_API}/api/v1/products`,
    list: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/products`,
    create: `${MERCHANT_API}/api/v1/products`,
    update: (id: string) => `${MERCHANT_API}/api/v1/products/${id}`,
    delete: (id: string) => `${MERCHANT_API}/api/v1/products/${id}`,
    variants: (productId: string) => `${MERCHANT_API}/api/v1/products/${productId}/variants`,
    images: (productId: string) => `${MERCHANT_API}/api/v1/products/${productId}/images`,
    bulkUpdate: `${MERCHANT_API}/api/v1/products/bulk`,
    import: `${MERCHANT_API}/api/v1/products/import`,
    export: `${MERCHANT_API}/api/v1/products/export`,
  },

  // Categories
  categories: {
    base: `${MERCHANT_API}/api/v1/categories`,
    list: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/categories`,
    create: `${MERCHANT_API}/api/v1/categories`,
    update: (id: string) => `${MERCHANT_API}/api/v1/categories/${id}`,
    delete: (id: string) => `${MERCHANT_API}/api/v1/categories/${id}`,
  },

  // Orders
  orders: {
    base: `${ORDER_SERVICE}/api/v1/orders`,
    list: (merchantId: string) => `${ORDER_SERVICE}/api/v1/merchants/${merchantId}/orders`,
    get: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}`,
    updateStatus: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/status`,
    cancel: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/cancel`,
    refund: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/refund`,
    track: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/track`,
    assignDriver: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/assign-driver`,
    export: (merchantId: string) => `${ORDER_SERVICE}/api/v1/merchants/${merchantId}/orders/export`,
  },

  // Payments
  payments: {
    base: `${PAYMENT_SERVICE}/api/v1/payments`,
    list: (merchantId: string) => `${PAYMENT_SERVICE}/api/v1/merchants/${merchantId}/payments`,
    get: (id: string) => `${PAYMENT_SERVICE}/api/v1/payments/${id}`,
    settle: (id: string) => `${PAYMENT_SERVICE}/api/v1/payments/${id}/settle`,
    refund: (id: string) => `${PAYMENT_SERVICE}/api/v1/payments/${id}/refund`,
    transactions: (merchantId: string) => `${PAYMENT_SERVICE}/api/v1/merchants/${merchantId}/transactions`,
    payout: (merchantId: string) => `${PAYMENT_SERVICE}/api/v1/merchants/${merchantId}/payout`,
   razorpayLink: (merchantId: string) => `${PAYMENT_SERVICE}/api/v1/merchants/${merchantId}/razorpay/link`,
  },

  // QR Code
  qr: {
    base: `${MERCHANT_API}/api/v1/qr`,
    generate: `${MERCHANT_API}/api/v1/qr/generate`,
    list: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/qrcodes`,
    get: (id: string) => `${MERCHANT_API}/api/v1/qr/${id}`,
    update: (id: string) => `${MERCHANT_API}/api/v1/qr/${id}`,
    delete: (id: string) => `${MERCHANT_API}/api/v1/qr/${id}`,
    scan: `${MERCHANT_API}/api/v1/qr/scan`,
    analytics: (qrId: string) => `${MERCHANT_API}/api/v1/qr/${qrId}/analytics`,
  },

  // Store Locations
  stores: {
    base: `${MERCHANT_API}/api/v1/stores`,
    list: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/stores`,
    create: `${MERCHANT_API}/api/v1/stores`,
    update: (id: string) => `${MERCHANT_API}/api/v1/stores/${id}`,
    delete: (id: string) => `${MERCHANT_API}/api/v1/stores/${id}`,
    hours: (storeId: string) => `${MERCHANT_API}/api/v1/stores/${storeId}/hours`,
  },

  // Staff Management
  staff: {
    base: `${MERCHANT_API}/api/v1/staff`,
    list: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/staff`,
    invite: `${MERCHANT_API}/api/v1/staff/invite`,
    update: (id: string) => `${MERCHANT_API}/api/v1/staff/${id}`,
    remove: (id: string) => `${MERCHANT_API}/api/v1/staff/${id}`,
    roles: `${MERCHANT_API}/api/v1/staff/roles`,
    permissions: `${MERCHANT_API}/api/v1/staff/permissions`,
  },

  // Analytics & Reports
  analytics: {
    dashboard: (merchantId: string) => `${ANALYTICS_SERVICE}/api/v1/merchants/${merchantId}/dashboard`,
    sales: (merchantId: string) => `${ANALYTICS_SERVICE}/api/v1/merchants/${merchantId}/sales`,
    customers: (merchantId: string) => `${ANALYTICS_SERVICE}/api/v1/merchants/${merchantId}/customers`,
    products: (merchantId: string) => `${ANALYTICS_SERVICE}/api/v1/merchants/${merchantId}/products-analytics`,
    realtime: (merchantId: string) => `${ANALYTICS_SERVICE}/api/v1/merchants/${merchantId}/realtime`,
    reports: `${ANALYTICS_SERVICE}/api/v1/reports`,
    export: `${ANALYTICS_SERVICE}/api/v1/reports/export`,
  },

  // Loyalty Program
  loyalty: {
    base: `${MERCHANT_API}/api/v1/loyalty`,
    program: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/loyalty`,
    members: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/loyalty/members`,
    issuePoints: `${MERCHANT_API}/api/v1/loyalty/issue`,
    redeemPoints: `${MERCHANT_API}/api/v1/loyalty/redeem`,
    tiers: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/loyalty/tiers`,
    createTier: `${MERCHANT_API}/api/v1/loyalty/tiers`,
    updateTier: (tierId: string) => `${MERCHANT_API}/api/v1/loyalty/tiers/${tierId}`,
  },

  // Marketing
  marketing: {
    campaigns: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/campaigns`,
    createCampaign: `${MERCHANT_API}/api/v1/campaigns`,
    updateCampaign: (id: string) => `${MERCHANT_API}/api/v1/campaigns/${id}`,
    deleteCampaign: (id: string) => `${MERCHANT_API}/api/v1/campaigns/${id}`,
    offers: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/offers`,
    createOffer: `${MERCHANT_API}/api/v1/offers`,
    updateOffer: (id: string) => `${MERCHANT_API}/api/v1/offers/${id}`,
  },

  // KDS (Kitchen Display System)
  kds: {
    base: `${MERCHANT_API}/api/v1/kds`,
    orders: (storeId: string) => `${MERCHANT_API}/api/v1/stores/${storeId}/kds/orders`,
    updateOrder: (orderId: string) => `${MERCHANT_API}/api/v1/kds/orders/${orderId}`,
    acknowledge: (orderId: string) => `${MERCHANT_API}/api/v1/kds/orders/${orderId}/acknowledge`,
    complete: (orderId: string) => `${MERCHANT_API}/api/v1/kds/orders/${orderId}/complete`,
  },

  // Subscriptions
  subscriptions: {
    base: `${MERCHANT_API}/api/v1/subscriptions`,
    current: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/subscription`,
    plans: `${MERCHANT_API}/api/v1/subscriptions/plans`,
    upgrade: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/subscription/upgrade`,
    downgrade: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/subscription/downgrade`,
    cancel: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/subscription/cancel`,
  },

  // NEW: Express Checkout
  checkout: {
    express: `${PAYMENT_SERVICE}/api/v1/checkout/express`,
    session: (id: string) => `${PAYMENT_SERVICE}/api/v1/checkout/session/${id}`,
    stats: (merchantId: string) => `${PAYMENT_SERVICE}/api/v1/merchants/${merchantId}/checkout/stats`,
  },

  // NEW: Fraud Prevention
  fraud: {
    check: `${PAYMENT_SERVICE}/api/v1/fraud/check`,
    reports: (merchantId: string) => `${MERCHANT_SERVICE}/api/v1/merchants/${merchantId}/fraud/reports`,
    flagOrder: (orderId: string) => `${MERCHANT_SERVICE}/api/v1/orders/${orderId}/flag-fraud`,
  },

  // NEW: Multi-Currency
  currency: {
    rates: `${MERCHANT_API}/api/v1/currency/rates`,
    supported: `${MERCHANT_API}/api/v1/currency/supported`,
    convert: `${MERCHANT_API}/api/v1/currency/convert`,
    merchantCurrencies: (merchantId: string) => `${MERCHANT_API}/api/v1/merchants/${merchantId}/currencies`,
  },
};

// =============================================================================
// Type Definitions
// =============================================================================

// Common Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Merchant Types
export interface Merchant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  logo?: string;
  banner?: string;
  description?: string;
  category: string;
  address: Address;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isVerified: boolean;
  isActive: boolean;
  subscription: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SubscriptionTier {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  features: string[];
  expiresAt: string;
}

// Product Types
export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  images: string[];
  variants?: ProductVariant[];
  inventory: number;
  trackInventory: boolean;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  taxRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  options: Record<string, string>;
}

// Order Types
export interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryType: 'pickup' | 'delivery' | 'dine-in';
  deliveryAddress?: Address;
  customerName: string;
  customerPhone: string;
  notes?: string;
  estimatedPrepTime?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cod' | 'qr';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, string>;
  notes?: string;
  subtotal: number;
}

// QR Code Types
export interface QRCode {
  id: string;
  merchantId: string;
  storeId?: string;
  type: QRCodeType;
  name: string;
  url: string;
  shortCode?: string;
  imageUrl?: string;
  scanCount: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
}

export type QRCodeType = 'payment' | 'menu' | 'profile' | 'order' | 'feedback' | 'custom';

// Store Types
export interface Store {
  id: string;
  merchantId: string;
  name: string;
  address: Address;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email?: string;
  isActive: boolean;
  operatingHours: OperatingHours[];
  timezone: string;
  createdAt: string;
}

export interface OperatingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string;
  close: string;
  isClosed: boolean;
}

// Staff Types
export interface StaffMember {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  permissions: string[];
  isActive: boolean;
  storeIds: string[];
  avatar?: string;
  createdAt: string;
}

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'delivery' | 'staff';

// Analytics Types
export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  avgOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  imageUrl?: string;
  unitsSold: number;
  revenue: number;
}

// Loyalty Types
export interface LoyaltyProgram {
  id: string;
  merchantId: string;
  isEnabled: boolean;
  pointsPerRupee: number;
  redemptionRate: number;
  minimumRedemption: number;
  expiryDays: number;
  tiers: LoyaltyTier[];
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  pointsMultiplier: number;
  benefits: string[];
}

export interface LoyaltyMember {
  id: string;
  customerId: string;
  merchantId: string;
  points: number;
  tier: string;
  lifetimePoints: number;
  joinedAt: string;
}

// NEW: Express Checkout Types
export interface ExpressCheckoutStats {
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  averageCompletionTime: number;
  conversionRate: number;
  revenue: number;
}

// NEW: Fraud Types
export interface FraudReport {
  id: string;
  merchantId: string;
  orderId: string;
  type: 'fake_order' | 'abuse' | 'chargeback' | 'refund_fraud';
  status: 'pending' | 'investigating' | 'resolved';
  details: string;
  createdAt: string;
  resolvedAt?: string;
}

// NEW: Currency Types
export interface MerchantCurrency {
  code: string;
  symbol: string;
  name: string;
  isEnabled: boolean;
  exchangeRate: number;
  lastUpdated: string;
}

// =============================================================================
// API Client Class
// =============================================================================

class MerchantApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = MERCHANT_API) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Version': '3.0.0',
      'X-Platform': 'react-native',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// =============================================================================
// Service Instances
// =============================================================================

export const merchantApiClient = new MerchantApiClient();

// =============================================================================
// Merchant Service
// =============================================================================

export const merchantService = {
  // Profile
  async getProfile(merchantId: string): Promise<Merchant> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.merchant.profile(merchantId));
  },

  async updateProfile(merchantId: string, data: Partial<Merchant>): Promise<Merchant> {
    return merchantApiClient.patch(MERCHANT_ENDPOINTS.merchant.update(merchantId), data);
  },

  async uploadLogo(merchantId: string, imageUri: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('logo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'logo.jpg',
    } as unknown as Blob);

    return fetch(MERCHANT_ENDPOINTS.merchant.logo(merchantId), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${merchantApiClient['authToken']}`,
      },
      body: formData,
    }).then((res) => res.json());
  },

  // Products
  async getProducts(
    merchantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Product>> {
    return merchantApiClient.get(
      `${MERCHANT_ENDPOINTS.products.list(merchantId)}?page=${page}&limit=${limit}`
    );
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.products.create, data);
  },

  async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    return merchantApiClient.patch(MERCHANT_ENDPOINTS.products.update(productId), data);
  },

  async deleteProduct(productId: string): Promise<void> {
    return merchantApiClient.delete(MERCHANT_ENDPOINTS.products.delete(productId));
  },

  async bulkUpdateProducts(updates: { id: string; data: Partial<Product> }[]): Promise<Product[]> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.products.bulkUpdate, { updates });
  },

  // Orders
  async getOrders(
    merchantId: string,
    filters?: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return merchantApiClient.get(
      `${MERCHANT_ENDPOINTS.orders.list(merchantId)}?${params.toString()}`
    );
  },

  async getOrder(orderId: string): Promise<Order> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.orders.get(orderId));
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    return merchantApiClient.patch(MERCHANT_ENDPOINTS.orders.updateStatus(orderId), { status });
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.orders.assignDriver(orderId), {
      driverId,
    });
  },

  // QR Codes
  async generateQRCode(data: {
    merchantId: string;
    storeId?: string;
    type: QRCodeType;
    name: string;
    metadata?: Record<string, unknown>;
  }): Promise<QRCode> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.qr.generate, data);
  },

  async getQRCodes(merchantId: string): Promise<QRCode[]> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.qr.list(merchantId));
  },

  async getQRAnalytics(qrId: string): Promise<{
    totalScans: number;
    uniqueScans: number;
    scansByDay: { date: string; count: number }[];
    topReferrers: { source: string; count: number }[];
  }> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.qr.analytics(qrId));
  },

  // Stores
  async getStores(merchantId: string): Promise<Store[]> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.stores.list(merchantId));
  },

  async createStore(data: Omit<Store, 'id' | 'createdAt'>): Promise<Store> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.stores.create, data);
  },

  async updateStore(storeId: string, data: Partial<Store>): Promise<Store> {
    return merchantApiClient.patch(MERCHANT_ENDPOINTS.stores.update(storeId), data);
  },

  // Staff
  async getStaff(merchantId: string): Promise<StaffMember[]> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.staff.list(merchantId));
  },

  async inviteStaff(data: {
    email: string;
    name: string;
    role: StaffRole;
    storeIds: string[];
  }): Promise<{ success: boolean; message: string }> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.staff.invite, data);
  },

  // Analytics
  async getDashboardStats(merchantId: string): Promise<DashboardStats> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.analytics.dashboard(merchantId));
  },

  async getSalesData(
    merchantId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<SalesData[]> {
    return merchantApiClient.get(
      `${MERCHANT_ENDPOINTS.analytics.sales(merchantId)}?period=${period}`
    );
  },

  async getTopProducts(
    merchantId: string,
    limit: number = 10
  ): Promise<TopProduct[]> {
    return merchantApiClient.get(
      `${MERCHANT_ENDPOINTS.analytics.products(merchantId)}?limit=${limit}`
    );
  },

  // Loyalty
  async getLoyaltyProgram(merchantId: string): Promise<LoyaltyProgram> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.loyalty.program(merchantId));
  },

  async getLoyaltyMembers(
    merchantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<LoyaltyMember>> {
    return merchantApiClient.get(
      `${MERCHANT_ENDPOINTS.loyalty.members(merchantId)}?page=${page}&limit=${limit}`
    );
  },

  async issueLoyaltyPoints(data: {
    customerId: string;
    merchantId: string;
    points: number;
    orderId?: string;
    description: string;
  }): Promise<{ success: boolean; newBalance: number }> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.loyalty.issuePoints, data);
  },

  async redeemLoyaltyPoints(data: {
    customerId: string;
    merchantId: string;
    points: number;
    orderId?: string;
  }): Promise<{ success: boolean; newBalance: number; voucherCode?: string }> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.loyalty.redeemPoints, data);
  },

  // KDS
  async getKdsOrders(storeId: string): Promise<Order[]> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.kds.orders(storeId));
  },

  async acknowledgeKdsOrder(orderId: string): Promise<Order> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.kds.acknowledge(orderId), {});
  },

  async completeKdsOrder(orderId: string): Promise<Order> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.kds.complete(orderId), {});
  },

  // NEW: Express Checkout Stats
  async getExpressCheckoutStats(merchantId: string): Promise<ExpressCheckoutStats> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.checkout.stats(merchantId));
  },

  // NEW: Fraud Prevention
  async flagFraudulentOrder(orderId: string, details: string): Promise<void> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.fraud.flagOrder(orderId), { details });
  },

  async getFraudReports(merchantId: string): Promise<FraudReport[]> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.fraud.reports(merchantId));
  },

  // NEW: Multi-Currency
  async getMerchantCurrencies(merchantId: string): Promise<MerchantCurrency[]> {
    return merchantApiClient.get(MERCHANT_ENDPOINTS.currency.merchantCurrencies(merchantId));
  },

  async setMerchantCurrency(
    merchantId: string,
    currencyCode: string,
    enabled: boolean
  ): Promise<void> {
    return merchantApiClient.post(MERCHANT_ENDPOINTS.currency.merchantCurrencies(merchantId), {
      currencyCode,
      enabled,
    });
  },

  async convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<{ convertedAmount: number; exchangeRate: number }> {
    return merchantApiClient.get(
      `${MERCHANT_ENDPOINTS.currency.convert}?amount=${amount}&from=${from}&to=${to}`
    );
  },
};

export default merchantService;
