// Navigation Types for expo-router
// Comprehensive type definitions for type-safe navigation

import { Href } from 'expo-router';

// ============================================
// ROUTE DEFINITIONS
// ============================================

/** All valid app routes - used for type-safe navigation */
export type AppRoute =
  | '/'
  | '/(tabs)'
  | '/(tabs)/index'
  | '/(tabs)/finance'
  | '/(tabs)/categories'
  | '/order-history'
  | '/orders/[id]'
  | '/order-confirmation'
  | '/pickup-tracking'
  | '/drivethru-tracking'
  | '/dinein-tracking'
  | '/tracking'
  | '/tracking/[orderId]'
  | '/transactions/index'
  | '/transactions/[id]'
  | '/offers/index'
  | '/offers/[id]'
  | '/offers/zones/[slug]'
  | '/offers/zones/heroes'
  | '/product-page'
  | '/MainStorePage'
  | '/MainCategory/[slug]'
  | '/MainCategory/[slug]/[subcategory]'
  | '/MainCategory/[slug]/search'
  | '/MainCategory/[slug]/book-table'
  | '/MainCategory/[slug]/book-appointment'
  | '/MainCategory/[slug]/offers'
  | '/MainCategory/[slug]/top-rated'
  | '/MainCategory/[slug]/stories'
  | '/MainCategory/[slug]/beauty-stories'
  | '/MainCategory/[slug]/fashion-stories'
  | '/MainCategory/[slug]/loyalty'
  | '/MainCategory/[slug]/loyalty/coins'
  | '/MainCategory/[slug]/try-and-buy'
  | '/cart'
  | '/wishlist'
  | '/account/settings'
  | '/account/index'
  | '/account/notification-history'
  | '/coin-detail'
  | '/wallet-screen'
  | '/savings'
  | '/savings/goals'
  | '/savings/goals/[id]'
  | '/referral/index'
  | '/feed/index'
  | '/reviews/[storeId]'
  | '/reviews/'
  | '/subscription/index'
  | '/EventPage'
  | '/EventPage/[id]'
  | '/category/[slug]'
  | '/location/settings'
  | '/my-visits'
  | '/ugc/[id]'
  | '/share'
  | '/beauty/index'
  | '/near-u/food'
  | '/playandearn/leaderboard'
  | '/vouchers/brand/[id]'
  | string;

// ============================================
// PLATFORM & NAVIGATION TYPES (from original file)
// ============================================

/**
 * Platform types supported by the app
 */
export type Platform = 'web' | 'ios' | 'android';

/**
 * Navigation method types
 */
export type NavigationMethod = 'push' | 'replace' | 'back' | 'dismiss';

/**
 * Navigation result status
 */
export type NavigationStatus = 'success' | 'failed' | 'fallback';

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  route: string;
  timestamp: number;
  method: NavigationMethod;
  params?: Record<string, unknown>;
}

/**
 * Navigation options
 */
export interface NavigationOptions {
  fallbackRoute?: Href;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  animate?: boolean;
  replace?: boolean;
  params?: Record<string, unknown>;
}

/**
 * Safe navigation result
 */
export interface NavigationResult {
  status: NavigationStatus;
  route?: string;
  error?: Error;
  fallbackUsed?: boolean;
}

/**
 * Navigation guard function type
 */
export type NavigationGuard = (
  to: string,
  from?: string
) => boolean | Promise<boolean>;

/**
 * Navigation middleware function type
 */
export type NavigationMiddleware = (
  to: string,
  next: () => void,
  from?: string
) => void | Promise<void>;

/**
 * Navigation event types
 */
export enum NavigationEvent {
  BEFORE_NAVIGATE = 'beforeNavigate',
  AFTER_NAVIGATE = 'afterNavigate',
  NAVIGATION_ERROR = 'navigationError',
  NAVIGATION_BLOCKED = 'navigationBlocked',
}

/**
 * Navigation event listener
 */
export interface NavigationEventListener {
  event: NavigationEvent;
  handler: (data: unknown) => void;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  requiresAuth?: boolean;
  fallback?: Href;
  guards?: NavigationGuard[];
  metadata?: Record<string, unknown>;
}

/**
 * Navigation state
 */
export interface NavigationState {
  currentRoute: string;
  history: NavigationHistoryEntry[];
  canGoBack: boolean;
  isNavigating: boolean;
  platform: Platform;
}

/**
 * Back button configuration
 */
export interface BackButtonConfig {
  fallbackRoute?: Href;
  onPress?: () => void;
  showConfirmation?: boolean;
  confirmationMessage?: string;
  style?: unknown;
  iconColor?: string;
  iconSize?: number;
}

/**
 * Deep link configuration
 */
export interface DeepLinkConfig {
  scheme: string;
  host?: string;
  path: string;
  params?: Record<string, unknown>;
}

/**
 * Navigation analytics event
 */
export interface NavigationAnalyticsEvent {
  route: string;
  method: NavigationMethod;
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: string;
  platform: Platform;
}

/**
 * Navigation queue item
 */
export interface NavigationQueueItem {
  id: string;
  route: Href;
  options: NavigationOptions;
  priority: number;
  timestamp: number;
  attempts: number;
}

/**
 * Navigation error types
 */
export enum NavigationErrorType {
  INVALID_ROUTE = 'INVALID_ROUTE',
  NAVIGATION_BLOCKED = 'NAVIGATION_BLOCKED',
  NO_HISTORY = 'NO_HISTORY',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Navigation error
 */
export class NavigationError extends Error {
  type: NavigationErrorType;
  route?: string;
  originalError?: Error;

  constructor(
    type: NavigationErrorType,
    message: string,
    route?: string,
    originalError?: Error
  ) {
    super(message);
    this.type = type;
    this.route = route;
    this.originalError = originalError;
    this.name = 'NavigationError';
  }
}

/**
 * Navigation service interface
 */
export interface INavigationService {
  navigate(route: Href, options?: NavigationOptions): Promise<NavigationResult>;
  goBack(fallbackRoute?: Href): Promise<NavigationResult>;
  replace(route: Href, options?: NavigationOptions): Promise<NavigationResult>;
  canGoBack(): boolean;
  getCurrentRoute(): string;
  getHistory(): NavigationHistoryEntry[];
  clearHistory(): void;
  addGuard(guard: NavigationGuard): void;
  removeGuard(guard: NavigationGuard): void;
  addEventListener(
    event: NavigationEvent,
    handler: (data: unknown) => void
  ): void;
  removeEventListener(
    event: NavigationEvent,
    handler: (data: unknown) => void
  ): void;
}

/**
 * Stack configuration
 */
export interface StackConfig {
  maxSize?: number;
  persistToStorage?: boolean;
  storageKey?: string;
}

/**
 * Tab navigation configuration
 */
export interface TabConfig {
  resetOnTabChange?: boolean;
  preserveState?: boolean;
}

/**
 * Modal navigation configuration
 */
export interface ModalConfig {
  dismissOnBackdropPress?: boolean;
  fullScreen?: boolean;
  presentationStyle?: 'modal' | 'fullScreen' | 'formSheet';
}

// ============================================
// PAGE-SPECIFIC ROUTE PARAMETERS (from original)
// ============================================

/**
 * Product page route parameters
 * Used when navigating to /product/[id]
 *
 * @example
 * router.push(`/product/${productId}` as Href<ProductPageParams>);
 *
 * @example With params
 * router.push({
 *   pathname: '/product/[id]',
 *   params: { id: productId, source: 'homepage' }
 * });
 */
export interface ProductPageParams {
  /** Product ID (MongoDB ObjectId or frontend ID) */
  id: string;

  /** Optional: Source of navigation for analytics */
  source?: 'homepage' | 'search' | 'category' | 'store' | 'related' | 'ugc' | 'cart' | 'wishlist';

  /** Optional: Variant ID to pre-select */
  variantId?: string;

  /** Optional: Referral code */
  referral?: string;
}

/**
 * Checkout page route parameters
 * Used when navigating to /checkout
 *
 * @example
 * router.push(`/checkout?productId=${productId}&quantity=${quantity}` as Href<CheckoutParams>);
 *
 * @example Direct purchase
 * router.push({
 *   pathname: '/checkout',
 *   params: {
 *     productId: product.id,
 *     quantity: 2,
 *     variantId: selectedVariant.id,
 *     buyNow: 'true'
 *   }
 * });
 */
export interface CheckoutParams {
  /** Optional: Product ID for direct purchase (bypasses cart) */
  productId?: string;

  /** Optional: Quantity for direct purchase */
  quantity?: string | number;

  /** Optional: Variant ID for direct purchase */
  variantId?: string;

  /** Optional: Buy now mode (skips cart) */
  buyNow?: string | boolean;

  /** Optional: Applied promo code */
  promoCode?: string;

  /** Optional: Delivery address ID */
  addressId?: string;
}

/**
 * Store page route parameters
 * Used when navigating to /store/[id] or /MainStorePage
 *
 * @example
 * router.push(`/store/${storeId}` as Href<StorePageParams>);
 */
export interface StorePageParams {
  /** Store ID */
  id: string;

  /** Optional: Store name for display */
  storeName?: string;

  /** Optional: Category filter */
  category?: string;

  /** Optional: Tab to show */
  tab?: 'products' | 'about' | 'reviews';
}

/**
 * Category page route parameters
 * Used when navigating to /category/[slug]
 */
export interface CategoryPageParams {
  /** Category slug */
  slug: string;

  /** Optional: Subcategory */
  subcategory?: string;

  /** Optional: Sort order */
  sort?: 'price_low' | 'price_high' | 'rating' | 'newest' | 'popular';

  /** Optional: Price filters */
  minPrice?: string | number;
  maxPrice?: string | number;
}

/**
 * Search page route parameters
 */
export interface SearchPageParams {
  /** Search query */
  q?: string;

  /** Optional: Category filter */
  category?: string;

  /** Optional: Store filter */
  store?: string;

  /** Optional: Sort order */
  sort?: string;
}

/**
 * Helper type for route params with dynamic segments
 * Combines route name with its params
 */
export type RouteWithParams<T = Record<string, unknown>> = {
  pathname: string;
  params?: T;
};

/**
 * Type-safe navigation helper
 * Usage: navigateToProduct(router, { id: '123', source: 'homepage' })
 */
export type NavigateToProduct = (params: ProductPageParams) => void;
export type NavigateToCheckout = (params?: CheckoutParams) => void;
export type NavigateToStore = (params: StorePageParams) => void;
export type NavigateToCategory = (params: CategoryPageParams) => void;

// ============================================
// ROUTE PARAMETERS (new additions)
// ============================================

export interface TrackingParams {
  orderId?: string;
}

export interface OrderParams {
  id?: string;
}

export interface TransactionParams {
  id?: string;
}

export interface OfferParams {
  id?: string;
}

export interface ZoneParams {
  slug?: string;
}

export interface HeroParams {
  profile?: string;
}

export interface StorePageParamsAlt {
  storeId?: string;
}

export interface CategoryParams {
  slug?: string;
  subcategory?: string;
  category?: string;
  q?: string;
  type?: string;
  serviceType?: string;
  tags?: string;
}

export interface SearchParams {
  q?: string;
  category?: string;
  store?: string;
  sort?: string;
  serviceType?: string;
  type?: string;
  tags?: string;
}

export interface BookTableParams {
  storeId?: string;
}

export interface BookAppointmentParams {
  storeId?: string;
}

export interface LoyaltyParams {
  slug?: string;
}

export interface SavingsGoalParams {
  id?: string;
}

export interface ReviewsParams {
  storeId?: string;
}

export interface EventPageParams {
  id?: string;
}

export interface UGCParams {
  id?: string;
}

export interface ProductPageParamsAlt {
  cardId?: string;
  cardType?: string;
}

// ============================================
// TYPE-SAFE NAVIGATION HELPERS
// ============================================

/** Type-safe router.push wrapper */
export function navigateToRoute<T extends AppRoute>(route: T): Href<T> {
  return route as Href<T>;
}

/** Navigation helper for tracking page */
export function navigateToTracking(orderId: string): Href<string> {
  return `/tracking/${orderId}` as Href<string>;
}

/** Navigation helper for order confirmation */
export function navigateToOrderConfirmation(orderId: string): Href<string> {
  return `/orders/${orderId}` as Href<string>;
}

/** Navigation helper for pickup tracking */
export function navigateToPickupTracking(orderId: string): Href<string> {
  return `/pickup-tracking?orderId=${orderId}` as Href<string>;
}

/** Navigation helper for drive-thru tracking */
export function navigateToDrivethruTracking(orderId: string): Href<string> {
  return `/drivethru-tracking?orderId=${orderId}` as Href<string>;
}

/** Navigation helper for dine-in tracking */
export function navigateToDineinTracking(orderId: string): Href<string> {
  return `/dinein-tracking?orderId=${orderId}` as Href<string>;
}

/** Navigation helper for store page */
export function navigateToStore(storeId: string): Href<string> {
  return `/MainStorePage?storeId=${storeId}` as Href<string>;
}

/** Navigation helper for category page */
export function navigateToCategory(slug: string, subcategory?: string): Href<string> {
  if (subcategory) {
    return `/MainCategory/${slug}/${subcategory}` as Href<string>;
  }
  return `/MainCategory/${slug}` as Href<string>;
}

/** Navigation helper for product page */
export function navigateToProductPage(cardId: string, cardType: string = 'product'): Href<string> {
  return `/product-page?cardId=${cardId}&cardType=${cardType}` as Href<string>;
}

/** Navigation helper for offer page */
export function navigateToOffer(offerId: string): Href<string> {
  return `/offers/${offerId}` as Href<string>;
}

/** Navigation helper for transaction page */
export function navigateToTransaction(transactionId: string): Href<string> {
  return `/transactions/${transactionId}` as Href<string>;
}

/** Navigation helper for wallet screen */
export function navigateToWallet(): Href<string> {
  return '/wallet-screen' as Href<string>;
}

/** Navigation helper for coin detail */
export function navigateToCoinDetail(): Href<string> {
  return '/coin-detail' as Href<string>;
}

/** Navigation helper for savings */
export function navigateToSavings(): Href<string> {
  return '/savings' as Href<string>;
}

/** Navigation helper for savings goal */
export function navigateToSavingsGoal(goalId: string): Href<string> {
  return `/savings/goals/${goalId}` as Href<string>;
}

/** Navigation helper for offers index */
export function navigateToOffers(tab?: string): Href<string> {
  if (tab) {
    return `/offers?tab=${tab}` as Href<string>;
  }
  return '/offers' as Href<string>;
}

/** Navigation helper for exclusive zone */
export function navigateToZone(slug: string): Href<string> {
  return `/offers/zones/${slug}` as Href<string>;
}

/** Navigation helper for heroes zone */
export function navigateToHeroesZone(profile: string): Href<string> {
  return `/offers/zones/heroes?profile=${profile}` as Href<string>;
}

/** Navigation helper for reviews */
export function navigateToReviews(storeId: string): Href<string> {
  return `/reviews/${storeId}` as Href<string>;
}

/** Navigation helper for order history */
export function navigateToOrderHistory(): Href<string> {
  return '/order-history' as Href<string>;
}

/** Navigation helper for account index */
export function navigateToAccount(): Href<string> {
  return '/account/index' as Href<string>;
}

/** Navigation helper for account settings */
export function navigateToSettings(): Href<string> {
  return '/account/settings' as Href<string>;
}

/** Navigation helper for notification history */
export function navigateToNotificationHistory(): Href<string> {
  return '/account/notification-history' as Href<string>;
}

/** Navigation helper for referral */
export function navigateToReferral(): Href<string> {
  return '/referral/index' as Href<string>;
}

/** Navigation helper for feed */
export function navigateToFeed(): Href<string> {
  return '/feed/index' as Href<string>;
}

/** Navigation helper for subscription */
export function navigateToSubscription(): Href<string> {
  return '/subscription/index' as Href<string>;
}

/** Navigation helper for cart */
export function navigateToCart(): Href<string> {
  return '/cart' as Href<string>;
}

/** Navigation helper for wishlist */
export function navigateToWishlist(): Href<string> {
  return '/wishlist' as Href<string>;
}

/** Navigation helper for location settings */
export function navigateToLocationSettings(): Href<string> {
  return '/location/settings' as Href<string>;
}

/** Navigation helper for my visits */
export function navigateToMyVisits(): Href<string> {
  return '/my-visits' as Href<string>;
}

/** Navigation helper for UGC post */
export function navigateToUGC(id: string): Href<string> {
  return `/ugc/${id}` as Href<string>;
}

/** Navigation helper for home */
export function navigateToHome(): Href<string> {
  return '/(tabs)' as Href<string>;
}

// ============================================
// LEGACY SUPPORT (for gradual migration)
// ============================================

/**
 * @deprecated Use navigateToRoute or specific navigation helpers instead
 * Casts a string path to Href type - helps with gradual migration
 */
export function asHref<T extends AppRoute>(path: string): Href<T> {
  return path as Href<T>;
}
