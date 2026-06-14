// @ts-nocheck
/**
 * webOrderingApi.ts
 *
 * API client for the Web QR Ordering flow.
 * Endpoints: /api/web-ordering/*
 *
 * Flow:
 *  1. fetchStore(slug, table?)  → store info + full menu
 *  2. sendOtp(phone)            → trigger SMS OTP
 *  3. verifyOtp(phone, otp)     → returns sessionToken
 *  4. createRazorpayOrder(...)  → validates cart server-side, creates Razorpay order
 *  5. verifyPayment(...)        → HMAC verify + confirm WebOrder
 *  6. getOrder(orderNumber)     → polling order status
 */

import apiClient from '@/services/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string | null;
  category: string;
  isVeg: boolean;
  isVegan: boolean;
  spicyLevel: number;
  preparationTime: string;
  tags: string[];
  is86d: boolean;
}

export interface WebMenuCategory {
  id: string;
  name: string;
  description: string;
  items: WebMenuItem[];
}

export interface WebStoreInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  address: string;
  phone: string;
  operatingHours: Record<string, unknown>;
  gstEnabled: boolean;
  gstPercent: number;
}

export interface WebStoreData {
  store: WebStoreInfo;
  menu: { categories: WebMenuCategory[] } | null;
  tableInfo: { tableNumber?: string | string[]; hasTable: boolean };
  paymentMethods: { upi: boolean; card: boolean; wallet: boolean };
}

export interface CartItem {
  item: WebMenuItem;
  quantity: number;
  customisation?: string;
}

export interface CreateOrderPayload {
  storeSlug: string;
  items: Array<{ id: string; quantity: number; customisation?: string }>;
  customerName: string;
  tableNumber?: string;
  specialInstructions?: string;
  sessionToken: string;
}

export interface RazorpayOrderData {
  orderNumber: string;
  orderId: string;
  subtotal: number;
  taxes: number;
  total: number;
  razorpay: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  } | null;
}

export interface WebOrderStatus {
  orderNumber: string;
  status: 'pending_payment' | 'paid' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxes: number;
  total: number;
  tableNumber?: string;
  storeName: string;
  createdAt: string;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function fetchWebStore(storeSlug: string, table?: string): Promise<WebStoreData> {
  const tableParam = table ? `?table=${encodeURIComponent(table)}` : '';
  const res = await apiClient.get<WebStoreData>(`/web-ordering/store/${storeSlug}${tableParam}`);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to load store menu');
}

export async function sendWebOtp(phone: string): Promise<void> {
  const res = await apiClient.post<unknown>('/web-ordering/otp/send', { phone });
  if (!res.success) throw new Error(res.message || 'Failed to send OTP');
}

export async function verifyWebOtp(phone: string, otp: string): Promise<string> {
  const res = await apiClient.post<{ sessionToken: string }>('/web-ordering/otp/verify', { phone, otp });
  if (res.success && (res.data as unknown)?.sessionToken) return (res.data as unknown).sessionToken;
  throw new Error(res.message || 'OTP verification failed');
}

export async function createWebOrder(payload: CreateOrderPayload): Promise<RazorpayOrderData> {
  const res = await apiClient.post<RazorpayOrderData>('/web-ordering/razorpay/create-order', payload as unknown);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Failed to create order');
}

export async function verifyWebPayment(params: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  sessionToken?: string;
}): Promise<WebOrderStatus> {
  const res = await apiClient.post<WebOrderStatus>('/web-ordering/payment/verify', params);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Payment verification failed');
}

export async function creditWebOrderCoins(params: {
  orderNumber: string;
  sessionToken?: string;
}): Promise<{ coinsEarned: number }> {
  const res = await apiClient.post<{ coinsEarned: number }>('/web-ordering/coins/credit', params);
  if (res.success && res.data) return res.data;
  return { coinsEarned: 0 };
}

export async function getWebOrder(orderNumber: string): Promise<WebOrderStatus> {
  const res = await apiClient.get<WebOrderStatus>(`/web-ordering/order/${orderNumber}`);
  if (res.success && res.data) return res.data;
  throw new Error(res.message || 'Order not found');
}
