/**
 * CHECKOUT OPTIMIZATION API SERVICE
 * Integration with RABTUL Checkout Optimization Service
 *
 * Service: REZ-checkout-optimization
 * Port: 4050
 * URL: https://rez-checkout-optimization.onrender.com
 *
 * Features:
 * - 1-Click Checkout
 * - Express Checkout
 * - Cart Recovery
 * - Smart Address Selection
 * - Payment Method Recommendations
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckoutSession {
  id: string;
  userId: string;
  cartId?: string;
  status: CheckoutSessionStatus;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: PaymentMethod;
  shippingMethod?: ShippingMethod;
  appliedCoupons?: AppliedCoupon[];
  calculatedTotals?: CalculatedTotals;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CheckoutSessionStatus =
  | 'initiated'
  | 'address_selected'
  | 'shipping_selected'
  | 'payment_selected'
  | 'review'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface Address {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  label?: 'home' | 'work' | 'other';
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export type PaymentMethodType = 'card' | 'upi' | 'wallet' | 'netbanking' | 'cod';

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedDays: number;
  logoUrl?: string;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  description?: string;
}

export interface CalculatedTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponDiscount: number;
  loyaltyDiscount: number;
  total: number;
  currency: string;
}

export interface CartRecovery {
  id: string;
  userId: string;
  cartId: string;
  status: CartRecoveryStatus;
  recoveryAttempts: number;
  lastAttemptAt?: string;
  convertedAt?: string;
  expiresAt: string;
  items: CartItem[];
  total: number;
}

export type CartRecoveryStatus = 'pending' | 'reminded' | 'converted' | 'expired' | 'ignored';

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  variant?: string;
}

export interface ExpressCheckoutConfig {
  enabled: boolean;
  savedAddresses: Address[];
  savedPaymentMethods: PaymentMethod[];
  preferredAddressId?: string;
  preferredPaymentMethodId?: string;
  loyaltyPoints?: number;
  availableCoins?: number;
}

export interface OneClickCheckoutRequest {
  addressId: string;
  paymentMethodId: string;
  shippingMethodId?: string;
  couponCode?: string;
  notes?: string;
}

export interface OptimizationRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  potentialSavings?: number;
  action?: {
    label: string;
    url?: string;
    data?: Record<string, unknown>;
  };
}

export type RecommendationType =
  | 'coupon'
  | 'shipping'
  | 'payment'
  | 'loyalty'
  | 'bundle'
  | '替代';

export interface CheckoutFunnelAnalytics {
  step: string;
  views: number;
  completions: number;
  dropOffs: number;
  avgTimeSpent: number;
  conversionRate: number;
}

// ============================================================================
// CHECKOUT SESSION API
// ============================================================================

/**
 * Create a new checkout session
 */
export async function createCheckoutSession(params?: {
  cartId?: string;
  items?: CartItem[];
}): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.post('/checkout/session', params || {});
  } catch (error) {
    logger.error('checkoutApi.createSession', { error });
    throw error;
  }
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.get(`/checkout/session/${sessionId}`);
  } catch (error) {
    logger.error('checkoutApi.getSession', { sessionId, error });
    throw error;
  }
}

/**
 * Update checkout session
 */
export async function updateCheckoutSession(
  sessionId: string,
  updates: Partial<CheckoutSession>
): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.patch(`/checkout/session/${sessionId}`, updates);
  } catch (error) {
    logger.error('checkoutApi.updateSession', { sessionId, updates, error });
    throw error;
  }
}

/**
 * Set shipping address
 */
export async function setShippingAddress(
  sessionId: string,
  address: Address
): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/address`, { address, type: 'shipping' });
  } catch (error) {
    logger.error('checkoutApi.setShippingAddress', { sessionId, error });
    throw error;
  }
}

/**
 * Set billing address
 */
export async function setBillingAddress(
  sessionId: string,
  address: Address
): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/address`, { address, type: 'billing' });
  } catch (error) {
    logger.error('checkoutApi.setBillingAddress', { sessionId, error });
    throw error;
  }
}

/**
 * Set payment method
 */
export async function setPaymentMethod(
  sessionId: string,
  paymentMethod: PaymentMethod
): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/payment`, { paymentMethod });
  } catch (error) {
    logger.error('checkoutApi.setPaymentMethod', { sessionId, error });
    throw error;
  }
}

/**
 * Set shipping method
 */
export async function setShippingMethod(
  sessionId: string,
  shippingMethod: ShippingMethod
): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/shipping`, { shippingMethod });
  } catch (error) {
    logger.error('checkoutApi.setShippingMethod', { sessionId, error });
    throw error;
  }
}

/**
 * Apply coupon
 */
export async function applyCoupon(
  sessionId: string,
  couponCode: string
): Promise<ApiResponse<{ session: CheckoutSession; discount: number }>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/coupon`, { code: couponCode });
  } catch (error) {
    logger.error('checkoutApi.applyCoupon', { sessionId, couponCode, error });
    throw error;
  }
}

/**
 * Remove coupon
 */
export async function removeCoupon(
  sessionId: string,
  couponCode: string
): Promise<ApiResponse<CheckoutSession>> {
  try {
    return await apiClient.delete(`/checkout/session/${sessionId}/coupon/${couponCode}`);
  } catch (error) {
    logger.error('checkoutApi.removeCoupon', { sessionId, couponCode, error });
    throw error;
  }
}

/**
 * Calculate totals
 */
export async function calculateTotals(sessionId: string): Promise<ApiResponse<CalculatedTotals>> {
  try {
    return await apiClient.get(`/checkout/session/${sessionId}/totals`);
  } catch (error) {
    logger.error('checkoutApi.calculateTotals', { sessionId, error });
    throw error;
  }
}

/**
 * Complete checkout (1-Click)
 */
export async function completeCheckout(
  sessionId: string,
  request: OneClickCheckoutRequest
): Promise<ApiResponse<{
  orderId: string;
  paymentId?: string;
  status: string;
}>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/complete`, request);
  } catch (error) {
    logger.error('checkoutApi.completeCheckout', { sessionId, error });
    throw error;
  }
}

/**
 * Cancel checkout session
 */
export async function cancelCheckout(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/cancel`, {});
  } catch (error) {
    logger.error('checkoutApi.cancelCheckout', { sessionId, error });
    throw error;
  }
}

// ============================================================================
// EXPRESS CHECKOUT API
// ============================================================================

/**
 * Get express checkout configuration
 */
export async function getExpressCheckoutConfig(): Promise<ApiResponse<ExpressCheckoutConfig>> {
  try {
    return await apiClient.get('/checkout/express/config');
  } catch (error) {
    logger.error('checkoutApi.getExpressConfig', { error });
    throw error;
  }
}

/**
 * Quick checkout with saved preferences
 */
export async function expressCheckout(
  request: OneClickCheckoutRequest
): Promise<ApiResponse<{
  orderId: string;
  paymentId?: string;
  status: string;
}>> {
  try {
    return await apiClient.post('/checkout/express', request);
  } catch (error) {
    logger.error('checkoutApi.expressCheckout', { error });
    throw error;
  }
}

/**
 * Update preferred express checkout settings
 */
export async function updateExpressCheckoutPrefs(
  prefs: {
    preferredAddressId?: string;
    preferredPaymentMethodId?: string;
  }
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.patch('/checkout/express/preferences', prefs);
  } catch (error) {
    logger.error('checkoutApi.updateExpressPrefs', { prefs, error });
    throw error;
  }
}

// ============================================================================
// CART RECOVERY API
// ============================================================================

/**
 * Get abandoned carts for user
 */
export async function getAbandonedCarts(
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<{
  carts: CartRecovery[];
  pagination: { page: number; limit: number; total: number; pages: number };
}>> {
  try {
    const query = params ? `?page=${params.page || 1}&limit=${params.limit || 10}` : '';
    return await apiClient.get(`/checkout/recovery/carts${query}`);
  } catch (error) {
    logger.error('checkoutApi.getAbandonedCarts', { error });
    throw error;
  }
}

/**
 * Recover a cart (convert abandoned cart)
 */
export async function recoverCart(
  cartId: string,
  request: OneClickCheckoutRequest
): Promise<ApiResponse<{
  orderId: string;
  paymentId?: string;
  status: string;
}>> {
  try {
    return await apiClient.post(`/checkout/recovery/cart/${cartId}/recover`, request);
  } catch (error) {
    logger.error('checkoutApi.recoverCart', { cartId, error });
    throw error;
  }
}

/**
 * Dismiss abandoned cart reminder
 */
export async function dismissCartReminder(
  cartId: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/checkout/recovery/cart/${cartId}/dismiss`, {});
  } catch (error) {
    logger.error('checkoutApi.dismissCartReminder', { cartId, error });
    throw error;
  }
}

// ============================================================================
// RECOMMENDATIONS API
// ============================================================================

/**
 * Get checkout recommendations
 */
export async function getCheckoutRecommendations(
  sessionId: string
): Promise<ApiResponse<OptimizationRecommendation[]>> {
  try {
    return await apiClient.get(`/checkout/session/${sessionId}/recommendations`);
  } catch (error) {
    logger.error('checkoutApi.getRecommendations', { sessionId, error });
    throw error;
  }
}

/**
 * Apply recommendation
 */
export async function applyRecommendation(
  sessionId: string,
  recommendationType: RecommendationType,
  data?: Record<string, unknown>
): Promise<ApiResponse<{ session: CheckoutSession }>> {
  try {
    return await apiClient.post(`/checkout/session/${sessionId}/recommendations/apply`, {
      type: recommendationType,
      ...data,
    });
  } catch (error) {
    logger.error('checkoutApi.applyRecommendation', { sessionId, recommendationType, error });
    throw error;
  }
}

// ============================================================================
// ANALYTICS API
// ============================================================================

/**
 * Get checkout funnel analytics
 */
export async function getCheckoutFunnelAnalytics(
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<CheckoutFunnelAnalytics[]>> {
  try {
    const query = params
      ? `?startDate=${params.startDate || ''}&endDate=${params.endDate || ''}`
      : '';
    return await apiClient.get(`/checkout/analytics/funnel${query}`);
  } catch (error) {
    logger.error('checkoutApi.getFunnelAnalytics', { params, error });
    throw error;
  }
}

export default {
  // Session
  createCheckoutSession,
  getCheckoutSession,
  updateCheckoutSession,
  setShippingAddress,
  setBillingAddress,
  setPaymentMethod,
  setShippingMethod,
  applyCoupon,
  removeCoupon,
  calculateTotals,
  completeCheckout,
  cancelCheckout,
  // Express Checkout
  getExpressCheckoutConfig,
  expressCheckout,
  updateExpressCheckoutPrefs,
  // Cart Recovery
  getAbandonedCarts,
  recoverCart,
  dismissCartReminder,
  // Recommendations
  getCheckoutRecommendations,
  applyRecommendation,
  // Analytics
  getCheckoutFunnelAnalytics,
};
