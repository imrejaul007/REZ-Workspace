// @ts-nocheck
/**
 * Lazy Routes Configuration for REZ App
 *
 * Defines screens and routes that should be lazy loaded to reduce
 * initial bundle size. Screens are organized by priority and feature area.
 *
 * Priority Levels:
 * - high: Load eagerly or preload on idle (e.g., main user flow)
 * - medium: Load on demand with preload hint
 * - low: Load only when user navigates (defer until needed)
 *
 * @module config/lazyRoutes
 */

import { ComponentType } from 'react';
import { LazyRoute, PreloadGroup } from '../utils/lazyLoad';

// ============================================================================
// STANDALONE APP MODULES (REZ Go, Rendez)
// ============================================================================

/**
 * REZ Go - Scan & Go Commerce
 * Estimated size: ~400KB total (barcode scanner, offline storage, cart logic)
 * Strategy: Preload when user taps "REZ Go" tab, idle preload otherwise
 */
export const goRoutes: LazyRoute[] = [
  {
    path: '/go',
    importFn: () => import('../app/go/index'),
    priority: 'high',
    isStandaloneApp: true,
    estimatedSizeKb: 80,
  },
  {
    path: '/go/scan',
    importFn: () => import('../app/go/scan'),
    priority: 'high',
    isStandaloneApp: true,
    estimatedSizeKb: 120,
  },
  {
    path: '/go/cart',
    importFn: () => import('../app/go/cart'),
    priority: 'high',
    isStandaloneApp: true,
    estimatedSizeKb: 60,
  },
  {
    path: '/go/checkout',
    importFn: () => import('../app/go/checkout'),
    priority: 'high',
    isStandaloneApp: true,
    estimatedSizeKb: 90,
  },
  {
    path: '/go/receipts',
    importFn: () => import('../app/go/receipts'),
    priority: 'medium',
    isStandaloneApp: true,
    estimatedSizeKb: 70,
  },
  {
    path: '/go/shopping-lists',
    importFn: () => import('../app/go/shopping-lists'),
    priority: 'medium',
    isStandaloneApp: true,
    estimatedSizeKb: 85,
  },
  {
    path: '/go/product-timeline',
    importFn: () => import('../app/go/product-timeline'),
    priority: 'low',
    isStandaloneApp: true,
    estimatedSizeKb: 95,
  },
  {
    path: '/go/universal-scan',
    importFn: () => import('../app/go/universal-scan'),
    priority: 'low',
    isStandaloneApp: true,
    estimatedSizeKb: 110,
  },
  {
    path: '/go/success',
    importFn: () => import('../app/go/success'),
    priority: 'medium',
    isStandaloneApp: true,
    estimatedSizeKb: 45,
  },
];

/**
 * Rendez - Social/Dating App
 * Estimated size: ~300KB total
 * Strategy: Load on tab focus, idle preload on mount
 */
export const rendezRoutes: LazyRoute[] = [
  {
    path: '/rendez',
    importFn: () => import('../app/rendez/index'),
    priority: 'medium',
    isStandaloneApp: true,
    estimatedSizeKb: 100,
  },
  {
    path: '/rendez/[id]',
    importFn: () => import('../app/rendez/[id]'),
    priority: 'medium',
    isStandaloneApp: true,
    estimatedSizeKb: 130,
  },
];

// ============================================================================
// HEAVY SCREENS (>40KB)
// ============================================================================

/**
 * Wallet & Financial Screens
 * These screens have heavy dependencies (charts, graphs, transaction history)
 */
export const walletRoutes: LazyRoute[] = [
  {
    path: '/wallet-screen',
    importFn: () => import('../app/wallet-screen'),
    priority: 'high',
    estimatedSizeKb: 450,
  },
  {
    path: '/bill-payment',
    importFn: () => import('../app/bill-payment'),
    priority: 'medium',
    estimatedSizeKb: 280,
  },
  {
    path: '/recharge',
    importFn: () => import('../app/recharge'),
    priority: 'medium',
    estimatedSizeKb: 200,
  },
  {
    path: '/payment',
    importFn: () => import('../app/payment'),
    priority: 'medium',
    estimatedSizeKb: 260,
  },
  {
    path: '/payment-methods',
    importFn: () => import('../app/payment-methods'),
    priority: 'medium',
    estimatedSizeKb: 130,
  },
  {
    path: '/payment-razorpay',
    importFn: () => import('../app/payment-razorpay'),
    priority: 'medium',
    estimatedSizeKb: 90,
  },
];

/**
 * Booking & Reservations
 * Heavy screens with calendar components and availability logic
 */
export const bookingRoutes: LazyRoute[] = [
  {
    path: '/booking',
    importFn: () => import('../app/booking'),
    priority: 'high',
    estimatedSizeKb: 380,
  },
  {
    path: '/booking/appointment',
    importFn: () => import('../app/booking/appointment'),
    priority: 'high',
    estimatedSizeKb: 340,
  },
  {
    path: '/BookingsPage',
    importFn: () => import('../app/BookingsPage'),
    priority: 'high',
    estimatedSizeKb: 320,
  },
  {
    path: '/my-bookings',
    importFn: () => import('../app/my-bookings'),
    priority: 'high',
    estimatedSizeKb: 290,
  },
  {
    path: '/tracking',
    importFn: () => import('../app/tracking'),
    priority: 'medium',
    estimatedSizeKb: 220,
  },
];

/**
 * Events & Entertainment
 * Heavy screens with media galleries and complex layouts
 */
export const eventsRoutes: LazyRoute[] = [
  {
    path: '/EventPage',
    importFn: () => import('../app/EventPage'),
    priority: 'medium',
    estimatedSizeKb: 400,
  },
  {
    path: '/my-events',
    importFn: () => import('../app/my-events'),
    priority: 'medium',
    estimatedSizeKb: 120,
  },
];

/**
 * Product & Shopping Screens
 */
export const productRoutes: LazyRoute[] = [
  {
    path: '/product-page',
    importFn: () => import('../app/product-page'),
    priority: 'high',
    estimatedSizeKb: 330,
  },
  {
    path: '/wishlist',
    importFn: () => import('../app/wishlist'),
    priority: 'medium',
    estimatedSizeKb: 310,
  },
  {
    path: '/compare',
    importFn: () => import('../app/compare'),
    priority: 'low',
    estimatedSizeKb: 140,
  },
  {
    path: '/shop',
    importFn: () => import('../app/shop'),
    priority: 'high',
    estimatedSizeKb: 200,
  },
];

/**
 * Explore & Discovery
 */
export const exploreRoutes: LazyRoute[] = [
  {
    path: '/explore',
    importFn: () => import('../app/explore'),
    priority: 'high',
    estimatedSizeKb: 300,
  },
  {
    path: '/search',
    importFn: () => import('../app/search'),
    priority: 'high',
    estimatedSizeKb: 120,
  },
];

/**
 * Store & Merchant Screens
 */
export const storeRoutes: LazyRoute[] = [
  {
    path: '/Store',
    importFn: () => import('../app/Store'),
    priority: 'high',
    estimatedSizeKb: 200,
  },
  {
    path: '/StoreListPage',
    importFn: () => import('../app/StoreListPage'),
    priority: 'high',
    estimatedSizeKb: 270,
  },
  {
    path: '/store-visit',
    importFn: () => import('../app/store-visit'),
    priority: 'medium',
    estimatedSizeKb: 360,
  },
  {
    path: '/MainStorePage',
    importFn: () => import('../app/MainStorePage'),
    priority: 'medium',
    estimatedSizeKb: 190,
  },
];

// ============================================================================
// EARN & CREATOR FEATURES
// ============================================================================

/**
 * Earn & Social Media
 */
export const earnRoutes: LazyRoute[] = [
  {
    path: '/earn-from-social-media',
    importFn: () => import('../app/earn-from-social-media'),
    priority: 'medium',
    estimatedSizeKb: 370,
  },
  {
    path: '/missions',
    importFn: () => import('../app/missions'),
    priority: 'medium',
    estimatedSizeKb: 230,
  },
  {
    path: '/mission-detail',
    importFn: () => import('../app/mission-detail'),
    priority: 'medium',
    estimatedSizeKb: 190,
  },
  {
    path: '/leaderboard',
    importFn: () => import('../app/leaderboard'),
    priority: 'low',
    estimatedSizeKb: 150,
  },
];

/**
 * Creator Features
 */
export const creatorRoutes: LazyRoute[] = [
  {
    path: '/creator-dashboard',
    importFn: () => import('../app/creator-dashboard'),
    priority: 'medium',
    estimatedSizeKb: 220,
  },
  {
    path: '/creator-apply',
    importFn: () => import('../app/creator-apply'),
    priority: 'medium',
    estimatedSizeKb: 200,
  },
  {
    path: '/creator-qr',
    importFn: () => import('../app/creator-qr'),
    priority: 'low',
    estimatedSizeKb: 120,
  },
  {
    path: '/creators',
    importFn: () => import('../app/creators'),
    priority: 'medium',
    estimatedSizeKb: 140,
  },
  {
    path: '/my-earnings',
    importFn: () => import('../app/my-earnings'),
    priority: 'medium',
    estimatedSizeKb: 190,
  },
  {
    path: '/earnings-history',
    importFn: () => import('../app/earnings-history'),
    priority: 'low',
    estimatedSizeKb: 210,
  },
];

/**
 * Referrals & Social
 */
export const referralRoutes: LazyRoute[] = [
  {
    path: '/referral',
    importFn: () => import('../app/referral'),
    priority: 'medium',
    estimatedSizeKb: 180,
  },
  {
    path: '/invite-friends',
    importFn: () => import('../app/invite-friends'),
    priority: 'medium',
    estimatedSizeKb: 100,
  },
];

// ============================================================================
// TRAVEL & BOOKING FEATURES
// ============================================================================

/**
 * Flight Booking
 */
export const flightRoutes: LazyRoute[] = [
  {
    path: '/flight/[id]',
    importFn: () => import('../app/flight/[id]'),
    priority: 'medium',
    estimatedSizeKb: 290,
  },
];

/**
 * Hotel Booking
 */
export const hotelRoutes: LazyRoute[] = [];

/**
 * Healthcare Features
 */
export const healthcareRoutes: LazyRoute[] = [];

// ============================================================================
// GAMIFICATION & LOYALTY
// ============================================================================

/**
 * Loyalty & Prive
 */
export const loyaltyRoutes: LazyRoute[] = [
  {
    path: '/loyalty-hub',
    importFn: () => import('../app/loyalty-hub'),
    priority: 'medium',
    estimatedSizeKb: 230,
  },
  {
    path: '/loyalty',
    importFn: () => import('../app/loyalty'),
    priority: 'medium',
    estimatedSizeKb: 160,
  },
  {
    path: '/prive',
    importFn: () => import('../app/prive'),
    priority: 'low',
    estimatedSizeKb: 150,
  },
  {
    path: '/prive-offers',
    importFn: () => import('../app/prive-offers'),
    priority: 'low',
    estimatedSizeKb: 100,
  },
];

/**
 * Gamification
 */
export const gamificationRoutes: LazyRoute[] = [
  {
    path: '/coin-system',
    importFn: () => import('../app/coin-system'),
    priority: 'medium',
    estimatedSizeKb: 190,
  },
  {
    path: '/coins',
    importFn: () => import('../app/coins'),
    priority: 'medium',
    estimatedSizeKb: 100,
  },
  {
    path: '/vouchers',
    importFn: () => import('../app/vouchers'),
    priority: 'medium',
    estimatedSizeKb: 120,
  },
  {
    path: '/my-vouchers',
    importFn: () => import('../app/my-vouchers'),
    priority: 'medium',
    estimatedSizeKb: 240,
  },
  {
    path: '/scratch-card',
    importFn: () => import('../app/scratch-card'),
    priority: 'low',
    estimatedSizeKb: 160,
  },
];

/**
 * Cash Store
 */
export const cashStoreRoutes: LazyRoute[] = [
  {
    path: '/cash-store/buy-coupons',
    importFn: () => import('../app/cash-store/buy-coupons'),
    priority: 'low',
    estimatedSizeKb: 300,
  },
  {
    path: '/cash-store/offers',
    importFn: () => import('../app/cash-store/offers'),
    priority: 'low',
    estimatedSizeKb: 290,
  },
  {
    path: '/cash-store/trending',
    importFn: () => import('../app/cash-store/trending'),
    priority: 'low',
    estimatedSizeKb: 290,
  },
  {
    path: '/cash-store/extra-coins',
    importFn: () => import('../app/cash-store/extra-coins'),
    priority: 'low',
    estimatedSizeKb: 280,
  },
];

// ============================================================================
// SOCIAL & IMPACT
// ============================================================================

/**
 * Social Impact
 */
export const socialImpactRoutes: LazyRoute[] = [
  {
    path: '/social-impact',
    importFn: () => import('../app/social-impact'),
    priority: 'low',
    estimatedSizeKb: 220,
  },
  {
    path: '/karma',
    importFn: () => import('../app/karma'),
    priority: 'low',
    estimatedSizeKb: 200,
  },
];

// ============================================================================
// MISCELLANEOUS
// ============================================================================

/**
 * Insurance & Financial Products
 */
export const insuranceRoutes: LazyRoute[] = [
  {
    path: '/insurance',
    importFn: () => import('../app/insurance'),
    priority: 'low',
    estimatedSizeKb: 170,
  },
];

/**
 * Settings & Profile
 */
export const settingsRoutes: LazyRoute[] = [
  {
    path: '/settings',
    importFn: () => import('../app/settings'),
    priority: 'high',
    estimatedSizeKb: 120,
  },
  {
    path: '/profile',
    importFn: () => import('../app/profile/index'),
    priority: 'high',
    estimatedSizeKb: 340,
  },
  {
    path: '/rez-profile',
    importFn: () => import('../app/rez-profile'),
    priority: 'medium',
    estimatedSizeKb: 130,
  },
];

/**
 * Cart & Checkout
 */
export const cartRoutes: LazyRoute[] = [
  {
    path: '/cart',
    importFn: () => import('../app/cart'),
    priority: 'high',
    estimatedSizeKb: 230,
  },
  {
    path: '/checkout',
    importFn: () => import('../app/checkout'),
    priority: 'high',
    estimatedSizeKb: 180,
  },
  {
    path: '/order-confirmation',
    importFn: () => import('../app/order-confirmation'),
    priority: 'medium',
    estimatedSizeKb: 200,
  },
];

/**
 * Articles & Content
 */
export const contentRoutes: LazyRoute[] = [
  {
    path: '/articles',
    importFn: () => import('../app/articles'),
    priority: 'medium',
    estimatedSizeKb: 100,
  },
  {
    path: '/ArticleDetailScreen',
    importFn: () => import('../app/ArticleDetailScreen'),
    priority: 'medium',
    estimatedSizeKb: 160,
  },
];

/**
 * Reviews
 */
export const reviewRoutes: LazyRoute[] = [
  {
    path: '/my-reviews',
    importFn: () => import('../app/my-reviews'),
    priority: 'medium',
    estimatedSizeKb: 150,
  },
  {
    path: '/store-reviews',
    importFn: () => import('../app/store-reviews'),
    priority: 'low',
    estimatedSizeKb: 80,
  },
];

// ============================================================================
// COMBINED ROUTES
// ============================================================================

/**
 * All lazy routes combined
 */
export const lazyRoutes: LazyRoute[] = [
  ...goRoutes,
  ...rendezRoutes,
  ...walletRoutes,
  ...bookingRoutes,
  ...eventsRoutes,
  ...productRoutes,
  ...exploreRoutes,
  ...storeRoutes,
  ...earnRoutes,
  ...creatorRoutes,
  ...referralRoutes,
  ...flightRoutes,
  ...loyaltyRoutes,
  ...gamificationRoutes,
  ...cashStoreRoutes,
  ...socialImpactRoutes,
  ...insuranceRoutes,
  ...settingsRoutes,
  ...cartRoutes,
  ...contentRoutes,
  ...reviewRoutes,
];

// ============================================================================
// PRELOAD GROUPS
// ============================================================================

/**
 * Preload groups for batch preloading
 * Routes are loaded together based on user interaction patterns
 */
export const preloadGroups: PreloadGroup[] = [
  {
    name: 'go',
    routes: goRoutes,
    strategy: 'idle',
  },
  {
    name: 'rendez',
    routes: rendezRoutes,
    strategy: 'idle',
  },
  {
    name: 'wallet',
    routes: walletRoutes,
    strategy: 'idle',
  },
  {
    name: 'booking',
    routes: bookingRoutes,
    strategy: 'idle',
  },
  {
    name: 'explore',
    routes: [...exploreRoutes, ...productRoutes],
    strategy: 'idle',
  },
  {
    name: 'creator',
    routes: [...creatorRoutes, ...earnRoutes],
    strategy: 'idle',
  },
  {
    name: 'loyalty',
    routes: [...loyaltyRoutes, ...gamificationRoutes],
    strategy: 'idle',
  },
  {
    name: 'cart',
    routes: cartRoutes,
    strategy: 'immediate',
  },
  {
    name: 'settings',
    routes: settingsRoutes,
    strategy: 'idle',
  },
];

// ============================================================================
// METADATA
// ============================================================================

/**
 * Estimated total bundle sizes by category
 */
export const bundleSizeEstimates = {
  /** REZ Go standalone app */
  go: { routes: goRoutes.length, estimatedKb: 670 },
  /** Rendez dating app */
  rendez: { routes: rendezRoutes.length, estimatedKb: 230 },
  /** Wallet & payments */
  wallet: { routes: walletRoutes.length, estimatedKb: 1410 },
  /** Bookings & appointments */
  booking: { routes: bookingRoutes.length, estimatedKb: 1550 },
  /** Events & entertainment */
  events: { routes: eventsRoutes.length, estimatedKb: 520 },
  /** Products & shopping */
  products: { routes: productRoutes.length, estimatedKb: 1000 },
  /** Creator & earn features */
  creator: { routes: [...creatorRoutes, ...earnRoutes].length, estimatedKb: 2000 },
  /** Loyalty & gamification */
  loyalty: { routes: [...loyaltyRoutes, ...gamificationRoutes].length, estimatedKb: 1370 },
};

/**
 * Priority-based route stats
 */
export const priorityStats = {
  high: {
    routes: lazyRoutes.filter((r) => r.priority === 'high').length,
    estimatedKb: lazyRoutes
      .filter((r) => r.priority === 'high')
      .reduce((sum, r) => sum + (r.estimatedSizeKb || 0), 0),
  },
  medium: {
    routes: lazyRoutes.filter((r) => r.priority === 'medium').length,
    estimatedKb: lazyRoutes
      .filter((r) => r.priority === 'medium')
      .reduce((sum, r) => sum + (r.estimatedSizeKb || 0), 0),
  },
  low: {
    routes: lazyRoutes.filter((r) => r.priority === 'low').length,
    estimatedKb: lazyRoutes
      .filter((r) => r.priority === 'low')
      .reduce((sum, r) => sum + (r.estimatedSizeKb || 0), 0),
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get routes by priority
 */
export function getRoutesByPriority(priority: 'high' | 'medium' | 'low'): LazyRoute[] {
  return lazyRoutes.filter((r) => r.priority === priority);
}

/**
 * Get routes by path prefix
 */
export function getRoutesByPrefix(prefix: string): LazyRoute[] {
  return lazyRoutes.filter((r) => r.path.startsWith(prefix));
}

/**
 * Find route by path
 */
export function findRoute(path: string): LazyRoute | undefined {
  return lazyRoutes.find((r) => r.path === path);
}

/**
 * Get total estimated lazy-loaded size
 */
export function getTotalLazySizeKb(): number {
  return lazyRoutes.reduce((sum, r) => sum + (r.estimatedSizeKb || 0), 0);
}
