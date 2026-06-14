/**
 * Data Mappers
 * Transform data between backend API responses and frontend component types
 */

import { Cart as BackendCart, CartItem as BackendCartItem } from '@/services/cartApi';
import { Order as BackendOrder, CreateOrderRequest } from '@/services/ordersApi';

// ============================================
// INTERFACE DEFINITIONS
// ============================================

/** Frontend cart item — normalized from BackendCartItem */
interface FrontendCartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  lockedQuantity: number;
  quantity: number;
  store: { id: string; name: string; location?: string } | null;
  variant?: unknown;
  addedAt?: string;
  notes?: string;
  itemType: 'product' | 'service' | 'event';
  serviceBookingDetails?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  subtotal: number;
  savings: number;
}

/** Frontend cart — normalized from BackendCart */
interface FrontendCart {
  id: string;
  userId: string;
  items: FrontendCartItem[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    cashback: number;
    total: number;
    savings: number;
  };
  coupon: {
    code: string;
    discountType: string;
    discountValue: number;
    appliedAmount: number;
    appliedAt: string;
  } | null;
  itemCount: number;
  storeCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Frontend order item — normalized from backend order item */
interface FrontendOrderItem {
  id: string;
  productId: string;
  name?: string;
  image?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  subtotal?: number;
  variant?: unknown;
  store: { id: string; name: string } | null;
}

/** Frontend order — normalized from BackendOrder */
interface FrontendOrder {
  _id?: string;
  id: string;
  orderNumber?: string;
  userId?: string;
  user?: unknown;
  customer?: unknown;
  status: string;
  items: FrontendOrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    delivery: number;
    tax: number;
    discount: number;
    lockFeeDiscount: number;
    cashback: number;
    total: number;
    paidAmount: number;
    refundAmount: number;
  };
  redemption?: Record<string, unknown>;
  deliveryFee: number;
  delivery_fee: number;
  shippingCost: number;
  deliveryAddress: FrontendAddress | null;
  billingAddress?: FrontendAddress | null;
  summary: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
    coinsUsed?: {
      rezCoins?: number;
      promoCoins?: number;
      storePromoCoins?: number;
      totalCoinsValue?: number;
    } | null;
  };
  delivery: {
    status: string;
    method: string;
    estimatedTime?: string;
    deliveredAt?: string;
    deliveryFee: number;
    address: FrontendAddress | null;
  };
  timeline: Array<{ status: string; message: string; timestamp: string }>;
  couponCode?: string;
  specialInstructions?: string;
  cancellation?: Record<string, unknown>;
  rating?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Frontend address — normalized from backend address */
interface FrontendAddress {
  name?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneNumber?: string;
  addressLine1?: string;
  address1?: string;
  addressLine2?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zipCode?: string;
  country: string;
  landmark?: string;
  addressType?: string;
}

/** Frontend checkout delivery address */
interface FrontendCheckoutAddress {
  addressLine1?: string;
  address1?: string;
  street?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zipCode?: string;
  postalCode?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  addressLine2?: string;
  address2?: string;
  landmark?: string;
  addressType?: string;
  country?: string;
}

/** Frontend order list response */
interface FrontendOrdersList {
  orders: FrontendOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: unknown;
}

// ============================================
// CART MAPPERS
// ============================================

/**
 * Map backend cart item to frontend cart item format
 */
export function mapBackendCartItemToFrontend(backendItem: BackendCartItem): FrontendCartItem | null {
  // Skip items with null product (data integrity issue)
  if (!backendItem.product) {
    return null;
  }

  // Handle both string array and object array for images
  const firstImage = backendItem.product.images?.[0];
  const imageUrl = firstImage
    ? (typeof firstImage === 'string' ? firstImage : (firstImage as { url?: string })?.url || '')
    : '';

  return {
    id: backendItem._id,
    productId: backendItem.product._id,
    name: backendItem.product.name,
    image: imageUrl,
    price: backendItem.price,
    originalPrice: backendItem.originalPrice || backendItem.price,
    discount: backendItem.discount || 0, // Lock fee discount (only applies to lockedQuantity items)
    lockedQuantity: (backendItem as unknown as { lockedQuantity?: number }).lockedQuantity || 0,
    quantity: backendItem.quantity,
    store: backendItem.store ? {
      id: backendItem.store._id,
      name: backendItem.store.name,
      location: (backendItem.store.location as { address?: string })?.address,
    } : null,
    variant: backendItem.variant,
    addedAt: backendItem.addedAt,
    notes: (backendItem as unknown as { notes?: string }).notes,
    itemType: ((backendItem as unknown as { itemType?: string }).itemType || 'product') as FrontendCartItem['itemType'],
    serviceBookingDetails: (backendItem as unknown as { serviceBookingDetails?: Record<string, unknown> | null }).serviceBookingDetails || null,
    metadata: (backendItem as unknown as { metadata?: Record<string, unknown> | null }).metadata || null,
    subtotal: (backendItem.price * backendItem.quantity) - (backendItem.discount || 0),
    savings: backendItem.originalPrice
      ? (backendItem.originalPrice - backendItem.price) * backendItem.quantity
      : 0,
  };
}

/**
 * Map backend cart to frontend cart format
 */
export function mapBackendCartToFrontend(backendCart: BackendCart): FrontendCart {
  // Map and filter out null items (corrupted data)
  const mappedItems = backendCart.items
    .map(mapBackendCartItemToFrontend)
    .filter((item): item is FrontendCartItem => item !== null);

  return {
    id: backendCart._id,
    userId: backendCart.user,
    items: mappedItems,
    totals: {
      subtotal: backendCart.totals.subtotal,
      tax: backendCart.totals.tax,
      shipping: backendCart.totals.delivery, // Map delivery -> shipping
      discount: backendCart.totals.discount,
      cashback: backendCart.totals.cashback,
      total: backendCart.totals.total,
      savings: backendCart.totals.savings,
    },
    coupon: backendCart.coupon ? {
      code: backendCart.coupon.code,
      discountType: backendCart.coupon.discountType,
      discountValue: backendCart.coupon.discountValue,
      appliedAmount: backendCart.coupon.appliedAmount,
      appliedAt: backendCart.coupon.appliedAt,
    } : null,
    itemCount: backendCart.itemCount,
    storeCount: backendCart.storeCount,
    isActive: backendCart.isActive,
    expiresAt: backendCart.expiresAt,
    createdAt: backendCart.createdAt,
    updatedAt: backendCart.updatedAt,
  };
}

// ============================================
// ORDER MAPPERS
// ============================================

/**
 * Map frontend checkout data to backend order request
 */
export function mapFrontendCheckoutToBackendOrder(checkoutData: {
  deliveryAddress: FrontendCheckoutAddress;
  paymentMethod: string;
  specialInstructions?: string;
  couponCode?: string;
  storeId?: string;
  items?: Array<{ product: string; quantity: number; price: number; name?: string }>;
  coinsUsed?: { rezCoins: number; promoCoins: number; storePromoCoins: number; totalCoinsValue?: number; wasilCoins?: number };
  fulfillmentType?: 'delivery' | 'pickup' | 'drive_thru' | 'dine_in';
  fulfillmentDetails?: { tableNumber?: string; vehicleInfo?: string; pickupInstructions?: string };
}): CreateOrderRequest {
  const fulfillmentType = checkoutData.fulfillmentType || 'delivery';
  const isDelivery = fulfillmentType === 'delivery';

  // Handle missing or incomplete delivery address
  const address = checkoutData.deliveryAddress || {};
  
  const addressLine1 = address.addressLine1 || 
                       address.address1 || 
                       address.street || 
                       address.address ||
                       (isDelivery ? 'Address not provided' : '');
  
  const city = address.city || (isDelivery ? 'City not provided' : '');
  const state = address.state || (isDelivery ? 'State not provided' : '');
  const pincode = address.pincode || address.zipCode || address.postalCode || (isDelivery ? '000000' : '');
  
  const name = address.name ||
               `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
               'Customer';
  
  const phone = address.phone || address.phoneNumber || '0000000000';
  
  const result: CreateOrderRequest = {
    fulfillmentType,
    paymentMethod: mapPaymentMethod(checkoutData.paymentMethod),
    specialInstructions: checkoutData.specialInstructions,
    couponCode: checkoutData.couponCode,
  };

  // Include delivery address for delivery orders (always), or minimal for others
  if (isDelivery) {
    result.deliveryAddress = {
      name,
      phone,
      addressLine1,
      addressLine2: address.addressLine2 || address.address2 || '',
      city,
      state,
      pincode,
      landmark: address.landmark || '',
      addressType: (address.addressType || 'home') as 'home' | 'work' | 'other',
    };
  } else {
    result.deliveryAddress = { name, phone, addressLine1, city, state, pincode };
  }

  // Include fulfillment details for non-delivery types
  if (checkoutData.fulfillmentDetails) {
    result.fulfillmentDetails = checkoutData.fulfillmentDetails;
  }

  if (checkoutData.storeId) {
    result.storeId = checkoutData.storeId;
  }
  if (checkoutData.items) {
    result.items = checkoutData.items;
  }
  if (checkoutData.coinsUsed) {
    result.coinsUsed = checkoutData.coinsUsed;
  }

  // Creator pick attribution
  try {
    if (typeof localStorage !== 'undefined') {
      const pickId = localStorage.getItem('attribution_pick_id');
      if (pickId) {
        result.pickId = pickId;
        localStorage.removeItem('attribution_pick_id');
      }
    }
  } catch {}

  return result;
}

/**
 * Map payment method names
 */
function mapPaymentMethod(method: string): 'cod' | 'card' | 'upi' | 'wallet' | 'netbanking' | 'razorpay' {
  const methodMap: { [key: string]: 'cod' | 'card' | 'upi' | 'wallet' | 'netbanking' | 'razorpay' } = {
    'cash': 'cod',
    'cash_on_delivery': 'cod',
    'cod': 'cod',
    'credit_card': 'card',
    'debit_card': 'card',
    'card': 'card',
    'upi': 'upi',
    'wallet': 'wallet',
    'net_banking': 'netbanking',
    'netbanking': 'netbanking',
    'razorpay': 'razorpay',
    'online': 'razorpay',
    'online_payment': 'razorpay',
  };

  const normalized = method.toLowerCase().replace(/\s+/g, '_');
  return methodMap[normalized] || 'razorpay';
}

/**
 * Map backend order to frontend order format
 */
export function mapBackendOrderToFrontend(backendOrder: BackendOrder): FrontendOrder {
  // Extract delivery address from backend - it can be in delivery.address or shippingAddress
  const deliveryAddressData = (backendOrder as unknown as { delivery?: { address?: unknown }; shippingAddress?: unknown }).delivery?.address || backendOrder.shippingAddress;
  const mappedDeliveryAddress = mapBackendAddressToFrontend(deliveryAddressData);

  // Get delivery fee from multiple possible sources
  const backendTotals = backendOrder as unknown as {
    totals?: { delivery?: number; tax?: number; discount?: number; cashback?: number; total?: number; paidAmount?: number; refundAmount?: number; lockFeeDiscount?: number; subtotal?: number };
    delivery?: { deliveryFee?: number; status?: string; method?: string; estimatedTime?: string; deliveredAt?: string };
    user?: { _id?: string };
    userId?: string;
    payment?: { method?: string; status?: string; coinsUsed?: unknown };
    redemption?: Record<string, unknown>;
    couponCode?: string;
    specialInstructions?: string;
    cancellation?: Record<string, unknown>;
    rating?: Record<string, unknown>;
    summary?: { subtotal?: number; tax?: number; discount?: number; total?: number; shipping?: number };
  };
  const deliveryFee =
    backendTotals.totals?.delivery ||
    backendTotals.delivery?.deliveryFee ||
    backendOrder.summary?.shipping || 0;

  return {
    id: backendOrder.id || (backendOrder as unknown as { _id?: string })._id || '',
    orderNumber: backendOrder.orderNumber,
    userId: backendOrder.userId || backendTotals.user?._id || '',
    user: backendTotals.user || null,
    customer: backendTotals.user || null,
    status: mapOrderStatus(backendOrder.status),
    items: (backendOrder.items || []).map((item) => {
      const backendItem = item as unknown as {
        _id?: string;
        id?: string;
        product: string | { _id?: string };
        name?: string;
        image?: string;
        quantity: number;
        price: number;
        originalPrice?: number;
        discount?: number;
        subtotal?: number;
        variant?: unknown;
        store?: string | { _id?: string; name?: string };
      };
      return {
        id: backendItem._id || backendItem.id || '',
        productId: typeof backendItem.product === 'object' && backendItem.product !== null ? (backendItem.product as { _id?: string })._id || '' : String(backendItem.product || ''),
        name: backendItem.name || '',
        image: backendItem.image || '',
        quantity: backendItem.quantity,
        price: backendItem.price,
        originalPrice: backendItem.originalPrice ?? backendItem.price,
        discount: backendItem.discount ?? 0,
        subtotal: backendItem.subtotal ?? (backendItem.price * backendItem.quantity),
        variant: backendItem.variant,
        store: backendItem.store ? {
          id: typeof backendItem.store === 'object' ? (backendItem.store as { _id?: string })._id || '' : String(backendItem.store),
          name: typeof backendItem.store === 'object' ? (backendItem.store as { name?: string }).name || '' : '',
        } : null,
      };
    }),
    totals: {
      subtotal: backendOrder.summary?.subtotal || backendTotals.totals?.subtotal || 0,
      shipping: deliveryFee,
      delivery: deliveryFee,
      tax: backendOrder.summary?.tax || backendTotals.totals?.tax || 0,
      discount: backendOrder.summary?.discount || backendTotals.totals?.discount || 0,
      lockFeeDiscount: backendTotals.totals?.lockFeeDiscount || 0,
      cashback: backendTotals.totals?.cashback || 0,
      total: backendOrder.summary?.total || backendTotals.totals?.total || 0,
      paidAmount: backendTotals.totals?.paidAmount || 0,
      refundAmount: backendTotals.totals?.refundAmount || 0,
    },
    redemption: backendTotals.redemption,
    deliveryFee,
    delivery_fee: deliveryFee,
    shippingCost: deliveryFee,
    deliveryAddress: mappedDeliveryAddress,
    summary: {
      subtotal: backendOrder.summary?.subtotal || backendTotals.totals?.subtotal || 0,
      shipping: deliveryFee,
      tax: backendOrder.summary?.tax || backendTotals.totals?.tax || 0,
      discount: backendOrder.summary?.discount || backendTotals.totals?.discount || 0,
      total: backendOrder.summary?.total || backendTotals.totals?.total || 0,
    },
    payment: {
      method: backendTotals.payment?.method || 'cod',
      status: backendOrder.paymentStatus || backendTotals.payment?.status || 'pending',
      coinsUsed: backendTotals.payment?.coinsUsed as FrontendOrder['payment']['coinsUsed'],
    },
    delivery: {
      status: backendTotals.delivery?.status || 'pending',
      method: backendTotals.delivery?.method || 'standard',
      estimatedTime: backendTotals.delivery?.estimatedTime,
      deliveredAt: backendTotals.delivery?.deliveredAt,
      deliveryFee,
      address: mappedDeliveryAddress,
    },
    timeline: (backendOrder.timeline || []).map((entry) => ({
      status: entry.status,
      message: entry.message,
      timestamp: entry.timestamp,
    })),
    couponCode: backendTotals.couponCode || backendOrder.coupon?.code,
    specialInstructions: backendTotals.specialInstructions || backendOrder.notes,
    cancellation: backendTotals.cancellation,
    rating: backendTotals.rating,
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt,
  };
}

/**
 * Map order status from backend to frontend
 */
function mapOrderStatus(backendStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'placed': 'pending',
    'confirmed': 'confirmed',
    'preparing': 'processing',
    'ready': 'processing',
    'dispatched': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'refunded',
    'refunded': 'refunded',
  };

  return statusMap[backendStatus] || backendStatus;
}

/**
 * FM-19 FIX: Normalize booking type discriminants from backend suffixed form to short form.
 * Backend sends 'table_booking' | 'service_booking' | 'event_booking' etc.
 * Frontend type tabs and components expect 'table' | 'service' | 'event'.
 * Strips '_booking' and '_reservation' suffixes; passes through already-short values unchanged.
 *
 * @example normalizeBookingType('table_booking') === 'table'
 * @example normalizeBookingType('service')       === 'service'
 */
export function normalizeBookingType(rawType: string | undefined | null): string {
  if (!rawType) return 'table';
  return rawType.replace(/_booking$/, '').replace(/_reservation$/, '');
}

/**
 * Map backend address to frontend address format
 */
function mapBackendAddressToFrontend(backendAddress: unknown): FrontendAddress | null {
  if (!backendAddress || typeof backendAddress !== 'object') return null;

  const addr = backendAddress as Record<string, unknown>;
  return {
    name: addr.name as string || '',
    firstName: String(addr.name || '').split(' ')[0] || '',
    lastName: String(addr.name || '').split(' ').slice(1).join(' ') || '',
    phone: addr.phone as string || '',
    phoneNumber: addr.phone as string || '',
    addressLine1: (addr.addressLine1 || addr.address1) as string || '',
    address1: (addr.addressLine1 || addr.address1) as string || '',
    addressLine2: (addr.addressLine2 || addr.address2) as string || '',
    address2: (addr.addressLine2 || addr.address2) as string || '',
    city: addr.city as string || '',
    state: addr.state as string || '',
    pincode: (addr.pincode || addr.postalCode || addr.zipCode) as string || '',
    zipCode: (addr.pincode || addr.postalCode || addr.zipCode) as string || '',
    country: (addr.country as string) || 'India',
    landmark: addr.landmark as string || '',
    addressType: (addr.addressType as string) || 'home',
  };
}

/**
 * Map orders list response
 */
export function mapBackendOrdersListToFrontend(backendResponse: {
  orders?: BackendOrder[];
  pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
  summary?: unknown;
  stats?: unknown;
}): FrontendOrdersList {
  return {
    orders: (backendResponse.orders || []).map(mapBackendOrderToFrontend),
    pagination: {
      page: backendResponse.pagination?.page ?? 1,
      limit: backendResponse.pagination?.limit ?? 20,
      total: backendResponse.pagination?.total ?? backendResponse.orders?.length ?? 0,
      totalPages: backendResponse.pagination?.totalPages ?? 1,
    },
    stats: backendResponse.summary || backendResponse.stats,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = '₹'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * DEPRECATED: cashback calculation must happen server-side. This returns 0 until removed.
 *
 * Previously computed a savings percentage on the frontend from original and current prices.
 * Savings percentages must now come from the backend API response rather than being
 * computed client-side.
 */
export function calculateSavingsPercentage(original: number, current: number): number {
  return 0;
}

/**
 * FL-16 fix: Get the canonical deal value from unknown deal-like object.
 *
 * Handles inconsistent field names used across the codebase:
 *   - `value`             → canonical (preferred)
 *   - `discountValue`    → legacy Deal type field
 *   - `cashbackAmount`   → bill/review types
 *   - `cashbackPercentage` → backend offer field
 *
 * Use this function instead of accessing deal.value or deal.discountValue directly.
 * Eventually all deal objects should be migrated to use `value`.
 */
export function getDealValue(deal: Record<string, unknown> | null | undefined): number {
  if (!deal) return 0;
  const value =
    (deal.value as number) ??
    (deal.discountValue as number) ??
    (deal.cashbackAmount as number) ??
    (deal.cashbackPercentage as number) ??
    0;
  return typeof value === 'number' && !isNaN(value) ? value : 0;
}

