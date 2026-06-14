// Canonical reference: @rez/shared-types/src/enums/index.ts
// Base API response types — inlined directly to avoid any npm dependency resolution
// issues on Vercel (Metro bundler requires all dist/ files to be committed).
// Canonical source: packages/rez-shared/src/types/api.ts

// ── Pagination ──────────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// ── API Response ───────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
  pagination?: Pagination;
}

// ── Paginated Response ─────────────────────────────────────────────────────
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: {
    items: T[];
    pagination: Pagination;
  };
}

// ── API Error ─────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  statusCode?: number;
  timestamp?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
/** Extract items array from either response format */
export function getItems<T>(response: PaginatedResponse<T> | ApiResponse<T[]>): T[] {
  if ('data' in response && response.data) {
    if (typeof response.data === 'object' && 'items' in (response.data as unknown)) {
      return (response.data as unknown).items;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
  }
  return [];
}

/** Extract pagination from either response format */
export function getPagination(
  response: PaginatedResponse<unknown> | ApiResponse<unknown>
): Pagination | null {
  if (
    'data' in response &&
    response.data &&
    typeof response.data === 'object' &&
    'pagination' in (response.data as unknown)
  ) {
    return (response.data as unknown).pagination;
  }
  if ('pagination' in response && response.pagination) {
    return response.pagination;
  }
  return null;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  phone: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  merchant: Merchant;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  merchantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  // TF-14 fix: phone is required in DB IMerchant and rez-shared Merchant — must not be optional
  phone: string;
  // TF-15 fix: businessAddress is required in DB and rez-shared — must not be optional
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  /** @deprecated Use businessAddress.street instead. Kept for backward compatibility. */
  address?: string;
  /** @deprecated Use businessAddress.city instead. Kept for backward compatibility. */
  city?: string;
  /** @deprecated Use businessAddress.state instead. Kept for backward compatibility. */
  state?: string;
  /** @deprecated Use businessAddress.zipCode instead. Kept for backward compatibility. */
  zipCode?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  // TF-16 fix: typed to canonical enum values instead of plain string
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  settings?: {
    timezone: string;
    currency: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

// ApiError is re-exported from rez-shared above

// Common enums
// Canonical reference: @rez/shared-types/src/enums/index.ts
// Canonical order status — must match @rez/shared-types ORDER_STATUS (14 states).
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelling'
  | 'cancelled'
  | 'returned'
  | 'refunded'
  | 'failed_delivery'
  | 'return_requested'
  | 'return_rejected';

// Canonical payment status (11 states + FSM)
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refunded'
  | 'refund_failed'
  | 'partially_refunded';

export type CashbackStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'expired';
export type RiskLevel = 'low' | 'medium' | 'high';

// Canonical payment methods - must match @rez/shared-types PAYMENT_METHOD (8 types)
export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod' | 'bnpl' | 'razorpay' | 'stripe';

// Order types — matches backend transformOrderForMerchant() output
export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  merchantId?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /**
   * Backend canonical totals — field names mirror IOrderTotals in
   * rezbackend/src/models/Order.ts. This is the primary source of truth.
   * Use totals.delivery (NOT deliveryFee), totals.tax, totals.total, etc.
   */
  totals?: {
    subtotal: number;
    tax: number;
    /** Delivery fee — canonical backend field name is 'delivery' */
    delivery: number;
    discount: number;
    lockFeeDiscount?: number;
    cashback: number;
    total: number;
    paidAmount?: number;
    refundAmount?: number;
    platformFee: number;
    merchantPayout: number;
  };
  /**
   * Legacy pricing shape from backend transformOrderForMerchant().
   * @deprecated Prefer totals.* for financial fields.
   * Aliases: taxAmount = totals.tax, shippingAmount = totals.delivery,
   *          totalAmount = totals.total, discountAmount = totals.discount
   */
  pricing?: {
    subtotal: number;
    tax: number;
    /** @deprecated Use totals.tax */
    taxAmount: number;
    /** @deprecated Use totals.delivery */
    delivery: number;
    /** @deprecated Use totals.delivery */
    shippingAmount: number;
    discount: number;
    /** @deprecated Use totals.discount */
    discountAmount: number;
    /** @deprecated Use totals.total */
    totalAmount: number;
  };
  payment?: {
    method: string;
    status: string;
    transactionId?: string;
  };
  cashback?: {
    amount: number;
    status: string;
  };
  delivery?: {
    method: string;
    address?: {
      street?: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      pincode?: string;
      country?: string;
      // MER-HIGH-02 FIX: fullAddress is returned by the backend but not in the type
      fullAddress?: string;
    };
    estimatedTime?: string;
    instructions?: string;
    deliveredAt?: string;
  };
  priority?: 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  notes?: string;
  specialInstructions?: string;
  store?: {
    _id: string;
    name: string;
    location?;
    // MER-HIGH-02 FIX: logo is returned by the backend but not in the type
    logo?: string;
  };
}

export interface OrderItem {
  id?: string;
  _id?: string;
  productId?: string;
  productName: string;
  name?: string;
  sku?: string;
  quantity: number;
  price: number;
  /** Line total. Three backend aliases exist — always read as: subtotal ?? totalPrice ?? total ?? (price * quantity). */
  total?: number;
  /** @deprecated Alias for total. Use: item.subtotal ?? item.totalPrice ?? item.total ?? (item.price * item.quantity) */
  totalPrice?: number;
  /** @deprecated Alias for total. Preferred alias — use: item.subtotal ?? item.totalPrice ?? item.total ?? (item.price * item.quantity) */
  subtotal?: number;
  notes?: string;
  specialInstructions?: string;
  customizations?: string[];
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: {
    pending: number; // placed orders awaiting acceptance
    confirmed: number; // accepted by merchant
    preparing: number; // being prepared
    ready: number; // ready for pickup/delivery
    dispatched: number; // handed to delivery partner
    out_for_delivery: number;
    delivered: number; // completed orders
    cancelling: number; // cancellation in progress
    cancelled: number; // fully cancelled
    returned: number; // returned by customer
    refunded: number; // payment refunded
  };
  revenueGrowth: number;
  orderGrowth: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

// Cashback types
export interface CashbackRequest {
  id: string;
  requestNumber: string;
  merchantId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalSpent?: number;
    tier?: string;
    totalOrders?: number;
  };
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    orderDate: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
  };
  riskAssessment?: {
    factors?: Array<{
      description: string;
      factor: string;
      impact: 'negative' | 'neutral' | 'positive';
      weight: number;
    }>;
  };
  requestedAmount: number;
  approvedAmount?: number;
  status: CashbackStatus;
  riskScore: number;
  flaggedForReview: boolean;
  reason?: string;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  submittedAt: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashbackMetrics {
  totalRequests: number;
  totalPendingRequests: number;
  totalApprovedRequests: number;
  totalRejectedRequests: number;
  totalPaidRequests: number;
  totalRequestedAmount: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
  totalPaidAmount: number;
  averageProcessingTime: number;
  highRiskRequests: number;
  autoApprovedToday: number;
  manualReviewRequired: number;
}

export interface CashbackFilters {
  status?: CashbackStatus;
  riskLevel?: 'low' | 'medium' | 'high';
  customerId?: string;
  orderNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'created' | 'amount' | 'risk' | 'processed';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateStart?: string;
  dateEnd?: string;
}

// Product types
// NOTE: This is a simplified product summary for list views. For full product
// details with canonical pricing (pricing.selling, pricing.mrp), use Product
// from types/products.ts.
export interface ProductSummary {
  id: string;
  /**
   * Legacy MongoDB `_id` field returned by some backend endpoints. Prefer `id`.
   * Kept optional for backward compatibility with responses that still include it.
   */
  _id?: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  sku?: string;
  barcode?: string;
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    inStock: boolean;
  };
  /**
   * Image list. Backend may return either plain URL strings or richer objects
   * with `url`/`thumbnailUrl`/`altText`. Both shapes are accepted here; consumers
   * should normalize via `processProductImages`.
   */
  images: Array<string | { url: string; thumbnailUrl?: string; altText?: string }>;
  isActive: boolean;
  status?: 'active' | 'inactive';
  tags?: string[];
  // W01: 86'd (out-of-stock) tracking — mirrors backend IProduct.is86d / restores86At
  is86d?: boolean;
  restores86At?: string;
  /** Optional multi-store association (backend returns this on some endpoints). */
  storeId?: string;
  /**
   * Canonical pricing object (from types/products.ts shape). Optional on the
   * summary view because list endpoints may not always include it.
   */
  pricing?: {
    selling?: number;
    mrp?: number;
    cost?: number;
    currency?: string;
  };
  createdAt: string;
  updatedAt: string;
  cashback?: {
    percentage?: number;
    maxAmount?: number;
    minPurchase?: number;
    validUntil?: string;
    terms?: string;
    isActive?: boolean;
    conditions?: string[];
  };
  // NOTE: `_id`, `pricing`, and `storeId` were previously re-declared here —
  // duplicates of fields 15–20 lines above. TypeScript flagged these as
  // TS2300/TS2717 errors; removed because the earlier declarations are the
  // canonical (and more complete) versions.
}

/** @deprecated Use ProductSummary. Kept as alias for backward compatibility. */
export type Product = ProductSummary;

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  merchantId: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  search?: string;
  storeId?: string; // Store filter for multi-store support
  sortBy?: 'name' | 'price' | 'created' | 'updated' | 'quantity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateStart?: string;
  dateEnd?: string;
}

// Request options for filtering and pagination
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface OrderFilters extends QueryOptions, DateRangeFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  orderNumber?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CashbackFilters extends QueryOptions, DateRangeFilter {
  status?: CashbackStatus;
  riskLevel?: RiskLevel;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
  flaggedOnly?: boolean;
}

export interface ProductFilters extends QueryOptions {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Cashback analytics (used by cashback analytics page)
export interface CashbackAnalytics {
  totalPaid: number;
  totalPending: number;
  approvalRate: number;
  fraudDetectionRate: number;
  averageApprovalTime: number;
  customerRetentionImpact: number;
  revenueImpact: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    orderCount: number;
    cashbackPaid: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    cashbackPaid: number;
    ordersWithCashback: number;
    fraudAttempts: number;
  }>;
}

// Product search request (alias for product filters)
export type ProductSearchRequest = ProductFilters;

// Health check response
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}
