/**
 * Notification Deep Link Handler
 * Handles navigation from notification taps
 */

import { router } from 'expo-router';
import { logger } from '@/utils/logger';
import { colors } from '@/constants/theme';
import {
  navigateToTracking,
  navigateToStore,
  navigateToWallet,
  navigateToCoinDetail,
  navigateToSavings,
  navigateToSavingsGoal,
  navigateToOffer,
  navigateToOffers,
  navigateToProductPage,
  navigateToTransaction,
  navigateToOrderHistory,
  navigateToAccount,
  navigateToSettings,
  navigateToReviews,
  navigateToCart,
  navigateToWishlist,
  navigateToSubscription,
  navigateToReferral,
  navigateToFeed,
  navigateToUGC,
  navigateToHeroesZone,
  navigateToZone,
} from '@/types/navigation.types';

export interface NotificationData {
  type?: string;
  eventType?: string;
  screen?: string;
  deepLink?: string;
  orderId?: string;
  storeId?: string;
  productId?: string;
  categoryId?: string;
  offerId?: string;
  eventId?: string;
  transactionId?: string;
  walletAction?: string;
  referralCode?: string;
  // Savings module fields
  goalId?: string;
  goalName?: string;
  streakDays?: number;
  milestone?: number;
  insightType?: string;
  [key: string]: unknown;
}

/**
 * Handle notification deep link navigation
 */

// SECURITY FIX: Validate deep links to prevent malicious redirects
// Only allow internal paths (starting with /) or whitelisted external domains
const ALLOWED_DEEP_LINK_DOMAINS = [
  'rez.money',
  'app.rez.money',
  'localhost',
];

function isValidDeepLink(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Block javascript:, data:, and other dangerous protocols
  const dangerousPatterns = /^(javascript|data|vbscript):/i;
  if (dangerousPatterns.test(url)) {
    return false;
  }

  // Internal path - must start with /
  if (url.startsWith('/')) {
    // Block paths that try to escape the app root
    if (url.includes('..')) {
      return false;
    }
    return true;
  }

  // External URL - validate against allowed domains
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Allow localhost in development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // Check against allowed domains (allow subdomains)
    return ALLOWED_DEEP_LINK_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export function handleNotificationDeepLink(data: NotificationData): void {

  try {
    // Direct deep link takes precedence
    if (data.deepLink) {
      // SECURITY FIX: Validate deep link before navigation
      if (!isValidDeepLink(data.deepLink)) {
        logger.warn('[DeepLinkHandler] Invalid deep link rejected:', data.deepLink);
        router.push('/');
        return;
      }
      router.push(data.deepLink);
      return;
    }

    // Handle rebooking / revisit push notifications: { screen: 'store', storeId: '...' }
    // Sent by backend when it's time for a consumer to revisit a store.
    if (data.screen === 'store' && data.storeId) {
      router.push(navigateToStore(data.storeId));
      return;
    }

    // Resolve the canonical type — backend may send either `type` or `eventType`
    const notifType = data.type || data.eventType || '';

    // Handle based on notification type and data
    switch (notifType) {
      case 'order_update':
      case 'order_confirmed':
      case 'order_preparing':
      case 'order_ready':
      case 'order_dispatched':
      case 'order_delivered':
      case 'order_cancelled':
        if (data.orderId) {
          router.push(navigateToTracking(data.orderId));
        } else {
          router.push(navigateToOrderHistory());
        }
        break;

      case 'payment_success':
      case 'payment_failed':
      case 'payment_pending':
        if (data.orderId) {
          router.push(navigateToTracking(data.orderId));
        } else if (data.transactionId) {
          router.push(navigateToTransaction(data.transactionId));
        } else {
          router.push('/transactions/index');
        }
        break;

      case 'delivery_update':
      case 'delivery_partner_assigned':
      case 'delivery_partner_arrived':
      case 'out_for_delivery':
        if (data.orderId) {
          router.push(navigateToTracking(data.orderId));
        }
        break;

      case 'promotional':
      case 'offer':
      case 'discount':
        if (data.offerId) {
          router.push(navigateToOffer(data.offerId));
        } else {
          router.push(navigateToOffers());
        }
        break;

      case 'product_recommendation':
      case 'product_price_drop':
      case 'product_back_in_stock':
        if (data.productId) {
          router.push(navigateToProductPage(data.productId, 'product'));
        }
        break;

      case 'store_update':
      case 'store_offer':
        if (data.storeId) {
          router.push(navigateToStore(data.storeId));
        }
        break;

      case 'event_reminder':
      case 'event_update':
        if (data.eventId) {
          router.push(`/EventPage?id=${data.eventId}`);
        }
        break;

      case 'wallet_update':
      case 'cashback_received':
      case 'cashback_earned':
      case 'coins_earned':
      case 'coin_earned':
        if (data.walletAction === 'view_transactions') {
          router.push('/transactions/index');
        } else if (data.walletAction === 'view_coins') {
          router.push(navigateToCoinDetail());
        } else {
          router.push(navigateToWallet());
        }
        break;

      case 'streak_milestone':
      case 'streak_at_risk':
        router.push(navigateToWallet());
        break;

      // ─── Savings Module Notifications ─────────────────────────────────────
      case 'streak_reminder':
      case 'streak_achieved':
      case 'savings_milestone':
      case 'savings_update':
        router.push(navigateToSavings());
        break;

      case 'goal_progress':
      case 'goal_completed':
        if (data.goalId) {
          router.push(navigateToSavingsGoal(data.goalId));
        } else {
          router.push('/savings/goals');
        }
        break;

      case 'insight_available':
      case 'recommendation_action':
        router.push(navigateToSavings());
        break;

      case 'new_offer':
        if (data.offerId) {
          router.push(navigateToOffer(data.offerId));
        } else {
          router.push(navigateToOffers());
        }
        break;

      case 'referral_reward':
      case 'referral_joined':
        router.push(navigateToReferral());
        break;

      case 'social_mention':
      case 'social_like':
      case 'social_comment':
        router.push(navigateToFeed());
        break;

      case 'review_request':
      case 'review_response':
        if (data.orderId) {
          router.push(navigateToTracking(data.orderId));
        } else if (data.storeId) {
          router.push(navigateToReviews(data.storeId));
        }
        break;

      case 'cart_reminder':
      case 'cart_price_drop':
        router.push(navigateToCart());
        break;

      case 'wishlist_update':
      case 'wishlist_price_drop':
        router.push(navigateToWishlist());
        break;

      case 'security_alert':
      case 'login_alert':
        router.push(navigateToSettings());
        break;

      case 'account_update':
        router.push(navigateToAccount());
        break;

      case 'subscription_reminder':
      case 'subscription_renewal':
        router.push(navigateToSubscription());
        break;

      default:
        // If we have specific IDs, navigate there
        if (data.orderId) {
          router.push(navigateToTracking(data.orderId));
        } else if (data.storeId) {
          router.push(navigateToStore(data.storeId));
        } else if (data.productId) {
          router.push(navigateToProductPage(data.productId, 'product'));
        } else if (data.categoryId) {
          router.push(`/category/${data.categoryId}`);
        } else {
          // Default to notification history
          router.push('/account/notification-history');
        }
        break;
    }
  } catch (error) {
    // Fallback to home or notification history
    router.push('/account/notification-history');
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    order_update: 'bag-handle',
    order_confirmed: 'checkmark-circle',
    order_preparing: 'restaurant',
    order_ready: 'cube',
    order_dispatched: 'rocket',
    order_delivered: 'home',
    order_cancelled: 'close-circle',
    payment_success: 'checkmark-circle',
    payment_failed: 'close-circle',
    payment_pending: 'time',
    delivery_update: 'location',
    delivery_partner_assigned: 'person',
    delivery_partner_arrived: 'location',
    out_for_delivery: 'bicycle',
    promotional: 'pricetag',
    offer: 'gift',
    discount: 'pricetag',
    product_recommendation: 'star',
    product_price_drop: 'trending-down',
    product_back_in_stock: 'notifications',
    store_update: 'storefront',
    store_offer: 'pricetag',
    event_reminder: 'calendar',
    event_update: 'calendar',
    wallet_update: 'wallet',
    cashback_received: 'cash',
    cashback_earned: 'cash',
    coins_earned: 'diamond',
    coin_earned: 'diamond',
    streak_milestone: 'trophy',
    streak_at_risk: 'flame',
    new_offer: 'gift',
    referral_reward: 'gift',
    referral_joined: 'people',
    social_mention: 'at',
    social_like: 'heart',
    social_comment: 'chatbubble',
    review_request: 'star',
    review_response: 'chatbubble',
    cart_reminder: 'cart',
    cart_price_drop: 'trending-down',
    wishlist_update: 'heart',
    wishlist_price_drop: 'trending-down',
    security_alert: 'shield-checkmark',
    login_alert: 'log-in',
    account_update: 'person',
    subscription_reminder: 'calendar',
    subscription_renewal: 'refresh',
  };

  return icons[type] || 'notifications';
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: string): string {
  const notifColors: Record<string, string> = {
    order_update: '#3B82F6',
    order_confirmed: '#10B981',
    order_preparing: '#F59E0B',
    order_ready: '#10B981',
    order_dispatched: '#3B82F6',
    order_delivered: '#10B981',
    order_cancelled: colors.error,
    payment_success: '#10B981',
    payment_failed: colors.error,
    payment_pending: '#F59E0B',
    delivery_update: '#3B82F6',
    delivery_partner_assigned: colors.brand.purpleLight,
    delivery_partner_arrived: '#10B981',
    out_for_delivery: '#3B82F6',
    promotional: '#F59E0B',
    offer: '#EC4899',
    discount: '#F59E0B',
    product_recommendation: colors.brand.purpleLight,
    product_price_drop: '#10B981',
    product_back_in_stock: '#3B82F6',
    store_update: '#3B82F6',
    store_offer: '#F59E0B',
    event_reminder: colors.brand.purpleLight,
    event_update: '#3B82F6',
    wallet_update: '#10B981',
    cashback_received: '#10B981',
    cashback_earned: '#10B981',
    coins_earned: '#F59E0B',
    coin_earned: '#F59E0B',
    streak_milestone: '#F59E0B',
    streak_at_risk: '#EF4444',
    new_offer: '#EC4899',
    referral_reward: '#EC4899',
    referral_joined: colors.brand.purpleLight,
    social_mention: colors.brand.purpleLight,
    social_like: '#EC4899',
    social_comment: '#3B82F6',
    review_request: '#F59E0B',
    review_response: colors.brand.purpleLight,
    cart_reminder: '#F59E0B',
    cart_price_drop: '#10B981',
    wishlist_update: '#EC4899',
    wishlist_price_drop: '#10B981',
    security_alert: colors.error,
    login_alert: '#F59E0B',
    account_update: '#3B82F6',
    subscription_reminder: '#F59E0B',
    subscription_renewal: '#3B82F6',
  };

  return notifColors[type] || '#6B7280';
}

export default {
  handleNotificationDeepLink,
  getNotificationIcon,
  getNotificationColor,
};
