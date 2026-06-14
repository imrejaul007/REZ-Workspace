/**
 * REZ SDK - Type Definitions
 */

// ============================================
// CLIENT OPTIONS
// ============================================

export interface SDKConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface SDKResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthOptions {
  phone?: string;
  email?: string;
  otp?: string;
  token?: string;
}

export interface User {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentInitiate {
  amount: number; // in paise
  currency?: string;
  order_id: string;
  method?: 'upi' | 'card' | 'netbanking' | 'wallet';
  email?: string;
  contact?: string;
}

export interface PaymentVerify {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  method?: string;
  email?: string;
  contact?: string;
  created_at: number;
}

// ============================================
// WALLET TYPES
// ============================================

export interface WalletBalance {
  user_id: string;
  balance: number;
  currency: string;
  bonus_balance?: number;
  locked_balance?: number;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  source: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface WalletCredit {
  user_id: string;
  amount: number;
  source: string;
  reference_id?: string;
}

export interface WalletDebit {
  user_id: string;
  amount: number;
  source: string;
  reference_id?: string;
}

// ============================================
// QR TYPES
// ============================================

export interface QRCreate {
  type: 'store' | 'table' | 'product' | 'payment';
  name?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

export interface QRData {
  id: string;
  code: string;
  type: string;
  url: string;
  merchant_id: string;
  created_at: string;
}

export interface QROrder {
  customer_phone: string;
  items: QROrderItem[];
  table_id?: string;
  notes?: string;
}

export interface QROrderItem {
  product_id: string;
  quantity: number;
  variant_id?: string;
  customizations?: Record<string, unknown>;
}

export interface QROrderResponse {
  order_id: string;
  total: number;
  status: string;
  payment_url?: string;
}

// ============================================
// CATALOG TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  images?: string[];
  category_id?: string;
  variants?: ProductVariant[];
  inventory?: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inventory?: number;
  options: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  image?: string;
  children?: Category[];
}

export interface SearchOptions {
  query: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'relevance' | 'newest';
  limit?: number;
  offset?: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface OrderCreate {
  user_id: string;
  items: OrderItem[];
  shipping_address?: Address;
  billing_address?: Address;
  payment_method?: 'wallet' | 'upi' | 'card' | 'cod';
  coupon_code?: string;
}

export interface OrderItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  customizations?: Record<string, unknown>;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address?: Address;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Address {
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface NotificationSend {
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  template_id?: string;
}

// ============================================
// MERCHANT TYPES
// ============================================

export interface MerchantProfile {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  address?: Address;
  phone?: string;
  email?: string;
  rating?: number;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
}

export interface MerchantAnalytics {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  total_customers: number;
  period: {
    start: string;
    end: string;
  };
}
