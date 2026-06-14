/**
 * useCartAbandonmentTracking
 *
 * Tracks cart abandonment events with:
 * - Time spent on checkout page
 * - Drop-off stage detection (address/fulfillment/promo/payment/confirm)
 * - Anonymized cart contents
 * - Price at abandonment
 * - Optional abandonment reason
 *
 * Usage:
 * ```tsx
 * const { trackAbandonment, setAbandonmentReason } = useCartAbandonmentTracking({
 *   storeId: state.store?.id,
 *   storeName: state.store?.name,
 *   getCartItems: () => state.items,
 *   getCartValue: () => state.billSummary?.totalPayable || 0,
 * });
 *
 * // In checkout UI, call when user leaves or closes:
 * useEffect(() => {
 *   return () => {
 *     if (!orderCompleted) {
 *       trackAbandonment('address'); // or whatever stage they're on
 *     }
 *   };
 * }, []);
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigationContainerRef } from 'expo-router';
import { analytics } from '@/services/analytics/AnalyticsService';
import { ANALYTICS_EVENTS } from '@/services/analytics/events';
import type {
  CartAbandonmentStage,
  CartAbandonmentItem,
  CartAbandonmentReason,
} from '@/services/analytics/types';
import { useUserId } from '@/stores/selectors';

export interface CartAbandonmentTrackingOptions {
  /** Store ID for the current checkout */
  storeId?: string;
  /** Store name for the current checkout */
  storeName?: string;
  /** Function to get current cart items */
  getCartItems: () => Array<{
    id?: string;
    productId?: string;
    name?: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
  /** Function to get current cart value */
  getCartValue: () => number;
  /** Function to get item count */
  getItemCount: () => number;
  /** Function to get fulfillment type */
  getFulfillmentType?: () => string | null;
  /** Function to get applied promo code */
  getAppliedPromoCode?: () => string | null;
  /** Function to get applied redemption */
  getAppliedRedemption?: () => string | null;
  /** Milliseconds of inactivity before considering checkout abandoned (default: 30000) */
  inactivityThresholdMs?: number;
}

export interface UseCartAbandonmentTrackingReturn {
  /** Track abandonment at a specific stage */
  trackAbandonment: (stage: CartAbandonmentStage, reason?: CartAbandonmentReason) => void;
  /** Set a reason for abandonment (if selectable) */
  setAbandonmentReason: (reason: CartAbandonmentReason) => void;
  /** Call when checkout successfully completes to prevent abandonment tracking */
  markCheckoutComplete: () => void;
  /** Get the session duration in seconds */
  getTimeSpentSeconds: () => number;
  /** Current detected stage based on user activity */
  currentStage: CartAbandonmentStage;
  /** Update tracking data (call when checkout state changes) */
  refreshTrackingData: () => void;
}

/**
 * Creates a hash for anonymizing product identifiers
 */
function anonymizeProduct(item: { id?: string; productId?: string; name?: string; category?: string }): string {
  const identifier = item.productId || item.id || item.name || '';
  if (!identifier) return 'unknown';

  // Simple hash function for anonymization
  let hash = 0;
  const str = `${identifier}:${item.category || 'uncategorized'}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `cat_${Math.abs(hash).toString(36)}`;
}

/**
 * Anonymize cart items for analytics
 */
function anonymizeCartItems(items: Array<{
  id?: string;
  productId?: string;
  name?: string;
  category?: string;
  quantity: number;
  price: number;
}>): CartAbandonmentItem[] {
  return items.map(item => ({
    categoryHash: anonymizeProduct(item),
    quantity: item.quantity,
    price: Math.round(item.price * 100) / 100,
  }));
}

/**
 * Detect the abandonment stage based on checkout UI state
 */
export function detectAbandonmentStage(
  uiState: {
    showAddressModal?: boolean;
    showPromoModal?: boolean;
    paymentExpanded?: boolean;
    showConfirmModal?: boolean;
    processingPayment?: boolean;
    selectedPaymentMethod?: string | null;
    selectedAddress?: unknown;
  }
): CartAbandonmentStage {
  // Order matters - check most specific states first
  if (uiState.showConfirmModal || uiState.processingPayment) {
    return 'confirm';
  }
  if (uiState.paymentExpanded || uiState.selectedPaymentMethod) {
    return 'payment';
  }
  if (uiState.showPromoModal) {
    return 'promo';
  }
  if (uiState.selectedAddress) {
    return 'fulfillment';
  }
  if (uiState.showAddressModal) {
    return 'address';
  }
  return 'unknown';
}

export function useCartAbandonmentTracking(
  options: CartAbandonmentTrackingOptions
): UseCartAbandonmentTrackingReturn {
  const {
    storeId,
    storeName,
    getCartItems,
    getCartValue,
    getItemCount,
    getFulfillmentType,
    getAppliedPromoCode,
    getAppliedRedemption,
    inactivityThresholdMs = 30000,
  } = options;

  const userId = useUserId();

  // Session tracking
  const checkoutStartTimeRef = useRef<number>(Date.now());
  const lastActivityTimeRef = useRef<number>(Date.now());
  const isCheckoutCompleteRef = useRef<boolean>(false);
  const abandonmentTrackedRef = useRef<boolean>(false);
  const navigationCheckTriggerRef = useRef<number>(0);

  // Abandonment data
  const [currentStage, setCurrentStage] = useState<CartAbandonmentStage>('unknown');
  const [abandonmentReason, setAbandonmentReasonState] = useState<CartAbandonmentReason | null>(null);

  // Get session ID from analytics service
  const sessionIdRef = useRef<string>(analytics.getSessionStats().sessionId);

  // Reset tracking when options change (new checkout session)
  useEffect(() => {
    checkoutStartTimeRef.current = Date.now();
    lastActivityTimeRef.current = Date.now();
    isCheckoutCompleteRef.current = false;
    abandonmentTrackedRef.current = false;
    setCurrentStage('unknown');
    setAbandonmentReasonState(null);
    sessionIdRef.current = analytics.getSessionStats().sessionId;
  }, [storeId]);

  // Update session ID periodically (in case analytics service updates it)
  useEffect(() => {
    const interval = setInterval(() => {
      sessionIdRef.current = analytics.getSessionStats().sessionId;
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Activity tracking - update last activity time
  const updateActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
  }, []);

  // Refresh tracking data (call when checkout state changes)
  const refreshTrackingData = useCallback(() => {
    navigationCheckTriggerRef.current += 1;
  }, []);

  /**
   * Track cart abandonment event
   */
  const trackAbandonment = useCallback(
    (stage: CartAbandonmentStage, reason?: CartAbandonmentReason) => {
      // Prevent double tracking
      if (abandonmentTrackedRef.current || isCheckoutCompleteRef.current) {
        return;
      }
      abandonmentTrackedRef.current = true;

      const timeSpentSeconds = Math.round((Date.now() - checkoutStartTimeRef.current) / 1000);
      const cartItems = getCartItems();
      const cartValue = getCartValue();
      const itemCount = getItemCount();

      // Only track if there's actually something in the cart
      if (itemCount === 0) {
        return;
      }

      const eventData = {
        cartValue: Math.round(cartValue * 100) / 100,
        itemCount,
        dropOffStage: stage,
        timeSpentSeconds,
        cartContents: anonymizeCartItems(cartItems),
        storeId,
        storeName,
        fulfillmentType: getFulfillmentType?.() ?? undefined,
        appliedPromoCode: getAppliedPromoCode?.() ?? undefined,
        appliedRedemption: getAppliedRedemption?.() ?? undefined,
        abandonmentReason: reason || abandonmentReason || undefined,
        userId: userId ?? undefined,
        sessionId: sessionIdRef.current,
      };

      analytics.trackEvent(ANALYTICS_EVENTS.CART_ABANDONED, eventData);
    },
    [
      getCartItems,
      getCartValue,
      getItemCount,
      getFulfillmentType,
      getAppliedPromoCode,
      getAppliedRedemption,
      storeId,
      storeName,
      abandonmentReason,
      userId,
    ]
  );

  /**
   * Set abandonment reason (for optional abandonment reason selection)
   */
  const setAbandonmentReason = useCallback((reason: CartAbandonmentReason) => {
    setAbandonmentReasonState(reason);
  }, []);

  /**
   * Mark checkout as complete to prevent abandonment tracking
   */
  const markCheckoutComplete = useCallback(() => {
    isCheckoutCompleteRef.current = true;
    abandonmentTrackedRef.current = true;
  }, []);

  /**
   * Get current time spent in seconds
   */
  const getTimeSpentSeconds = useCallback(() => {
    return Math.round((Date.now() - checkoutStartTimeRef.current) / 1000);
  }, []);

  // AppState tracking - track abandonment when app goes to background
  useEffect(() => {
    let backgroundTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Track abandonment after a delay (give user time to come back)
        backgroundTimeout = setTimeout(() => {
          if (!isCheckoutCompleteRef.current && !abandonmentTrackedRef.current) {
            const currentItems = getCartItems();
            const itemCount = getItemCount();

            if (itemCount > 0) {
              // Track with unknown stage if we can't determine it
              trackAbandonment('unknown');
            }
          }
        }, inactivityThresholdMs);
      } else if (nextAppState === 'active') {
        // Cancel abandonment tracking if user comes back
        if (backgroundTimeout) {
          clearTimeout(backgroundTimeout);
          backgroundTimeout = null;
        }
        // Reset activity timer when app comes back
        updateActivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (backgroundTimeout) {
        clearTimeout(backgroundTimeout);
      }
    };
  }, [getCartItems, getItemCount, trackAbandonment, updateActivity, inactivityThresholdMs]);

  // Navigation tracking - detect when user navigates away from checkout
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Check navigation state periodically
    const checkNavigation = () => {
      const routes = navigationRef.getCurrentRoute();
      if (routes && routes.name !== 'checkout' && routes.name !== '/checkout') {
        if (!isCheckoutCompleteRef.current && !abandonmentTrackedRef.current) {
          const itemCount = getItemCount();
          if (itemCount > 0) {
            trackAbandonment(currentStage);
          }
        }
      }
    };

    const interval = setInterval(checkNavigation, 1000);
    return () => clearInterval(interval);
  }, [navigationRef, getItemCount, trackAbandonment, currentStage]);

  return {
    trackAbandonment,
    setAbandonmentReason,
    markCheckoutComplete,
    getTimeSpentSeconds,
    currentStage,
    refreshTrackingData,
  };
}

/**
 * Simplified hook for checkout page integration
 * Detects stage automatically based on UI state
 */
export function useCheckoutAbandonmentTracking(
  checkoutUIState: {
    showAddressModal: boolean;
    showPromoModal: boolean;
    paymentExpanded: boolean;
    showConfirmModal: boolean;
    processingPayment: boolean;
    selectedPaymentMethod: string | null;
    selectedAddress: unknown;
  },
  checkoutData: {
    items: Array<{
      id?: string;
      productId?: string;
      name?: string;
      category?: string;
      quantity: number;
      price: number;
    }>;
    billSummary?: { totalPayable?: number };
    store?: { id?: string; name?: string };
    fulfillment?: { selectedType?: string };
    appliedPromoCode?: { code?: string } | null;
    appliedRedemption?: { code?: string } | null;
  }
) {
  const {
    showAddressModal,
    showPromoModal,
    paymentExpanded,
    showConfirmModal,
    processingPayment,
    selectedPaymentMethod,
    selectedAddress,
  } = checkoutUIState;

  const tracking = useCartAbandonmentTracking({
    storeId: checkoutData.store?.id,
    storeName: checkoutData.store?.name,
    getCartItems: () => checkoutData.items || [],
    getCartValue: () => checkoutData.billSummary?.totalPayable || 0,
    getItemCount: () => checkoutData.items?.length || 0,
    getFulfillmentType: () => checkoutData.fulfillment?.selectedType || null,
    getAppliedPromoCode: () => checkoutData.appliedPromoCode?.code || null,
    getAppliedRedemption: () => checkoutData.appliedRedemption?.code || null,
  });

  // Auto-detect stage from UI state
  const detectedStage = detectAbandonmentStage({
    showAddressModal,
    showPromoModal,
    paymentExpanded,
    showConfirmModal,
    processingPayment,
    selectedPaymentMethod,
    selectedAddress,
  });

  // Update current stage when UI state changes
  useEffect(() => {
    tracking.refreshTrackingData();
  }, [
    showAddressModal,
    showPromoModal,
    paymentExpanded,
    showConfirmModal,
    processingPayment,
    selectedPaymentMethod,
    selectedAddress,
  ]);

  return {
    ...tracking,
    currentStage: detectedStage,
  };
}
