/**
 * Merchant Integration Client for Rez Now
 *
 * Provides integration with Rez Merchant Service for:
 * - Store profile retrieval
 * - Menu/matalog access
 * - Service requests
 * - QR code management
 * - Analytics tracking
 *
 * Uses the @rez/merchant-sdk package for API access.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/utils/logger';

const MERCHANT_API_BASE = process.env.NEXT_PUBLIC_MERCHANT_API_URL || 'https://api.rez.money/api/merchant';

// ─── Types ─────────────────────────────────────────────────────────────────────

// Generic API response type with optional message
type ApiResponse<T> = { success: boolean; data: T; message?: string };

export interface MerchantStore {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string[];
  category: string;
  subcategories?: string[];
  location: {
    address: string;
    city: string;
    state?: string;
    pincode?: string;
    coordinates?: [number, number];
    landmark?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
  };
  operationalInfo?: {
    hours?: Record<string, { open: string; close: string }>;
    dineIn?: boolean;
    delivery?: boolean;
    takeaway?: boolean;
  };
  storeType?: 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'spa' | 'retail' | 'other';
  acceptsOnlineOrders?: boolean;
  acceptsScanPay?: boolean;
  deliveryEnabled?: boolean;
  ratings?: { average: number; count: number };
  tags?: string[];
  features?: string[];
}

export interface MerchantMenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  products: MerchantMenuProduct[];
}

export interface MerchantMenuProduct {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  pricing: {
    original: number;
    selling: number;
    discount?: number;
    currency: string;
  };
  inventory: {
    stock: number;
    isAvailable: boolean;
    unlimited?: boolean;
  };
  isVeg?: boolean;
  tags?: string[];
  preparationTime?: number;
}

export interface MerchantMenu {
  store: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    category: string;
  };
  categories: MerchantMenuCategory[];
  totalProducts: number;
}

export interface QRLinks {
  checkin: string;
  menu: string;
  pay: string;
  review: string;
}

export interface StoreQRData {
  storeId: string;
  storeName: string;
  storeSlug: string;
  links: QRLinks;
  deepLinks: {
    checkin: string;
    menu: string;
    pay: string;
  };
}

export interface ServiceRequestInput {
  type: 'room_service' | 'housekeeping' | 'maintenance' | 'general' | 'order';
  storeId: string;
  roomId?: string;
  hotelId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  request: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  items?: Array<{
    productId?: string;
    name: string;
    quantity: number;
    notes?: string;
  }>;
  scheduledTime?: string;
}

// ─── API Client ────────────────────────────────────────────────────────────────

/**
 * Creates an axios client for merchant API calls
 */
function createMerchantClient(): AxiosInstance {
  return axios.create({
    baseURL: MERCHANT_API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

const client = createMerchantClient();

// ─── Store Operations ────────────────────────────────────────────────────────

/**
 * Get store by slug (public endpoint for QR codes)
 */
export async function getStoreBySlug(slug: string): Promise<MerchantStore> {
  const response = await client.get<{ success: boolean; data: MerchantStore; message?: string }>(
    `/qr/public/store/${encodeURIComponent(slug)}`
  );
  const data = response.data;
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch store');
  }
  return data.data;
}

/**
 * Get store by ID
 */
export async function getStoreById(storeId: string): Promise<MerchantStore> {
  const response = await client.get<{ success: boolean; data: MerchantStore; message?: string }>(
    `/qr/public/store/id/${storeId}`
  );
  const data = response.data;
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch store');
  }
  return data.data;
}

/**
 * Get merchant's stores (authenticated)
 */
export async function getMerchantStores(): Promise<MerchantStore[]> {
  const response = await client.get<{ success: boolean; data: MerchantStore[]; message?: string }>(
    '/qr/merchant/stores'
  );
  const data = response.data;
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch stores');
  }
  return data.data;
}

/**
 * Get QR links for all merchant stores (authenticated)
 */
export async function getQRLinks(): Promise<StoreQRData[]> {
  const { data } = await client.get<{
    success: boolean;
    message?: string;
    data: Array<{
      storeId: string;
      storeName: string;
      storeSlug: string;
      links: QRLinks;
      deepLinks: { checkin: string; menu: string; pay: string };
    }>;
  }>('/qr/merchant/qr-links');

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch QR links');
  }

  return data.data.map((item) => ({
    storeId: item.storeId,
    storeName: item.storeName,
    storeSlug: item.storeSlug,
    links: item.links,
    deepLinks: item.deepLinks,
  }));
}

// ─── Menu Operations ──────────────────────────────────────────────────────────

/**
 * Get full menu for a store (public endpoint)
 */
export async function getStoreMenu(storeId: string): Promise<MerchantMenu> {
  const { data } = await client.get<{ success: boolean; data: MerchantMenu; message?: string }>(
    `/qr/public/menu/${storeId}`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch menu');
  }
  return data.data;
}

/**
 * Search products in a store menu
 */
export async function searchMenuProducts(
  storeId: string,
  query: string
): Promise<MerchantMenuProduct[]> {
  const menu = await getStoreMenu(storeId);
  const lowerQuery = query.toLowerCase();

  const results: MerchantMenuProduct[] = [];
  for (const category of menu.categories) {
    for (const product of category.products) {
      if (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        product.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
      ) {
        results.push(product);
      }
    }
  }
  return results;
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  storeId: string,
  categoryName: string
): Promise<MerchantMenuProduct[]> {
  const menu = await getStoreMenu(storeId);
  const category = menu.categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.products || [];
}

// ─── Service Operations ───────────────────────────────────────────────────────

/**
 * Submit a service request (room service, housekeeping, etc.)
 */
export async function submitServiceRequest(
  request: ServiceRequestInput
): Promise<{ requestId: string; status: string }> {
  const { data } = await client.post<{
    success: boolean;
    data: { requestId: string; status: string };
    message?: string;
  }>('/qr/public/service-request', request);

  if (!data.success) {
    throw new Error(data.message || 'Failed to submit service request');
  }
  return data.data;
}

/**
 * Submit room service order
 */
export async function orderRoomService(
  storeId: string,
  items: ServiceRequestInput['items'],
  options?: {
    roomId?: string;
    hotelId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
  }
): Promise<{ requestId: string; status: string }> {
  return submitServiceRequest({
    type: 'room_service',
    storeId,
    request: 'Room service order',
    items: items || [],
    ...options,
  });
}

/**
 * Request housekeeping
 */
export async function requestHousekeeping(
  storeId: string,
  options?: {
    roomId?: string;
    hotelId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    scheduledTime?: string;
  }
): Promise<{ requestId: string; status: string }> {
  return submitServiceRequest({
    type: 'housekeeping',
    storeId,
    request: 'Housekeeping request',
    ...options,
  });
}

// ─── Hotel Room Operations ────────────────────────────────────────────────────

/**
 * Get hotel room info from QR
 */
export async function getHotelRoomInfo(
  hotelId: string,
  roomId: string
): Promise<{
  hotel: {
    id: string;
    name: string;
    logo?: string;
    address?: string;
    city?: string;
    contact?: { phone?: string; email?: string };
  };
  room: {
    id: string;
    availableServices: Array<{ id: string; name: string; icon: string }>;
    quickActions: Array<{ action: string; label: string; icon: string }>;
  };
  menu: { hasMenu: boolean; endpoint: string };
}> {
  const { data } = await client.get<{
    success: boolean;
    message?: string;
    data: {
      hotel: { id: string; name: string; logo?: string; address?: string; city?: string; contact?: { phone?: string; email?: string } };
      room: {
        id: string;
        availableServices: Array<{ id: string; name: string; icon: string }>;
        quickActions: Array<{ action: string; label: string; icon: string }>;
      };
      menu: { hasMenu: boolean; endpoint: string };
    };
  }>(`/qr/public/hotel/${hotelId}/room/${roomId}`);

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch hotel room info');
  }
  return data.data;
}

// ─── Analytics Operations ────────────────────────────────────────────────────

/**
 * Track QR analytics event
 */
export async function trackQRAnalytics(
  event: 'qr_scan' | 'view_menu' | 'add_to_cart' | 'place_order' | 'book_appointment',
  options?: {
    storeId?: string;
    metadata?: Record<string, unknown>;
    customerId?: string;
    sessionId?: string;
    source?: 'room_qr' | 'menu_qr' | 'rez_now' | 'ads_qr' | 'unknown';
  }
): Promise<void> {
  try {
    await client.post('/qr/public/analytics/track', {
      storeId: options?.storeId,
      event,
      metadata: options?.metadata,
      customerId: options?.customerId,
      sessionId: options?.sessionId,
      source: options?.source || 'rez_now',
    });
  } catch {
    // Non-blocking - analytics should not fail the main operation
    logger.warn('[MerchantIntegration] Analytics tracking failed:', { event });
  }
}

/**
 * Track QR scan event
 */
export function trackQRScan(
  storeId: string,
  options?: { customerId?: string; sessionId?: string }
): void {
  trackQRAnalytics('qr_scan', { storeId, ...options });
}

/**
 * Track menu view event
 */
export function trackMenuView(
  storeId: string,
  options?: { customerId?: string; sessionId?: string }
): void {
  trackQRAnalytics('view_menu', { storeId, ...options });
}

/**
 * Track order event
 */
export function trackOrder(
  storeId: string,
  orderId: string,
  total: number,
  options?: { customerId?: string; sessionId?: string }
): void {
  trackQRAnalytics('place_order', {
    storeId,
    metadata: { orderId, total },
    ...options,
  });
}

// ─── Merchant Store Analytics ─────────────────────────────────────────────────

/**
 * Get QR analytics for a specific store (merchant authenticated)
 */
export async function getStoreQRAnalytics(
  storeId: string
): Promise<{
  storeId: string;
  storeName: string;
  qrScans: number;
  ordersFromQR: number;
  conversionRate: string;
  lastUpdated?: string;
}> {
  const { data } = await client.get<{
    success: boolean;
    message?: string;
    data: {
      storeId: string;
      storeName: string;
      qrScans: number;
      ordersFromQR: number;
      conversionRate: string;
      lastUpdated?: string;
    };
  }>(`/qr/merchant/stores/${storeId}/analytics`);

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch store analytics');
  }
  return data.data;
}

/**
 * Regenerate QR codes for a store
 */
export async function regenerateStoreQR(
  storeId: string
): Promise<{
  storeId: string;
  storeSlug: string;
  qrPayload: Record<string, unknown>;
  qrString: string;
  deepLink: string;
}> {
  const { data } = await client.post<{
    success: boolean;
    message?: string;
    data: {
      storeId: string;
      storeSlug: string;
      qrPayload: Record<string, unknown>;
      qrString: string;
      deepLink: string;
    };
  }>(`/qr/merchant/stores/${storeId}/regenerate`);

  if (!data.success) {
    throw new Error(data.message || 'Failed to regenerate QR codes');
  }
  return data.data;
}
