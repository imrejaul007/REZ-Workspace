/**
 * Push Notifications Hook
 * Initializes and manages push notifications
 */

import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import pushNotificationService from '@/services/pushNotificationService';
import { handleNotificationDeepLink } from '@/utils/notificationDeepLinkHandler';
import { useAuthUser, useIsAuthenticated, useRefreshWallet } from '@/stores/selectors';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function usePushNotifications() {
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const appState = useRef(AppState.currentState);
  const initialized = useRef(false);
  const disableWebDevPush = Platform.OS === 'web' && __DEV__;
  // SS-003 FIX: Used to refresh data when a notification is received/tapped
  const refreshWallet = useRefreshWallet();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (disableWebDevPush || !isAuthenticated || !user || initialized.current) {
      return;
    }

    // Initialize push notifications
    initializePushNotifications();

    // SS-004 FIX: Register a foreground notification data-refresh listener.
    // When a push arrives while the app is open, refresh the relevant data
    // (wallet for coins/cashback, orders cache for order updates).
    const removeDataRefreshListener = pushNotificationService.addDataRefreshListener((data) => {
      const type: string = data?.type || '';
      if (
        type === 'wallet_update' ||
        type === 'cashback_received' ||
        type === 'coins_earned'
      ) {
        refreshWallet().catch(() => {});
      }
      if (
        type.startsWith('order_') ||
        type.startsWith('delivery_') ||
        type === 'out_for_delivery' ||
        type === 'payment_success'
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }).catch(() => {});
      }
    });

    // Setup app state listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        // You can refresh notification badge here if needed
      }
      appState.current = nextAppState;
    });

    initialized.current = true;

    return () => {
      removeDataRefreshListener();
      subscription.remove();
      pushNotificationService.cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableWebDevPush, isAuthenticated, user]);

  const initializePushNotifications = async () => {
    try {
      // Handle cold-start: app was opened by tapping a notification while closed.
      // getLastNotificationResponseAsync resolves with the tapped notification (if any)
      // so we can deep-link to the right screen immediately after launch.
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data;
        handleNotificationDeepLink(data || {});
      }

      // SS-003 FIX: On notification tap, refresh relevant data before navigating
      pushNotificationService.setNavigationHandler((data) => {
        const type: string = data?.type || '';

        // Refresh wallet for any wallet/cashback/coins notification
        if (
          type === 'wallet_update' ||
          type === 'cashback_received' ||
          type === 'coins_earned'
        ) {
          refreshWallet().catch(() => {});
        }

        // Invalidate orders cache for order-related notifications
        if (
          type.startsWith('order_') ||
          type.startsWith('delivery_') ||
          type === 'out_for_delivery' ||
          type === 'payment_success'
        ) {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }).catch(() => {});
        }

        // Invalidate profile/bookings for booking notifications
        if (type.startsWith('booking_') || type.startsWith('service_')) {
          queryClient.invalidateQueries({ queryKey: ['bookings'] }).catch(() => {});
        }

        handleNotificationDeepLink(data);
      });

      // Initialize with user ID
      await pushNotificationService.initialize(user?.id);
    } catch (_error) {
      // silently handle
    }
  };

  // Update token when user changes
  useEffect(() => {
    if (!disableWebDevPush && isAuthenticated && user && initialized.current) {
      pushNotificationService.updateToken(user.id);
    }
  }, [disableWebDevPush, user, isAuthenticated]);

  // Cleanup on logout
  useEffect(() => {
    if (!isAuthenticated && initialized.current) {
      pushNotificationService.unregisterToken();
      initialized.current = false;
    }
  }, [isAuthenticated]);

  return {
    initialized: initialized.current,
  };
}

export default usePushNotifications;
