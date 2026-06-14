import { useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsService } from '@/services/api/notifications';
import { logger } from '@/utils/logger';

// F3 + F7: Push notification deep-link allowlist + Linking URL handling (MERCH-SEC-001, F7).
// Notification payloads are remote-controlled; without this allowlist a malicious push
// could navigate POS/KDS staff to an arbitrary in-app screen (route hijack).
const ALLOWED_PUSH_ROUTES: RegExp[] = [
  /^\/(orders|dashboard|inventory|payouts|kds|pos|notifications)(\/.*)?$/,
  /^\/(orders)\/[a-zA-Z0-9-]+$/,
  /^\/booking\/[a-zA-Z0-9-]+$/,
];
function isAllowedPushRoute(route: string): boolean {
  if (typeof route !== 'string' || route.length === 0 || route.length > 200) return false;
  if (route.includes('://')) return false; // reject absolute URLs
  return ALLOWED_PUSH_ROUTES.some((re) => re.test(route));
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }) as unknown,
});

export function usePushNotifications() {
  const { state } = useAuth();
  const tokenRef = useRef<string | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!state.isAuthenticated || registeredRef.current) return;

    async function registerForPushNotifications() {
      try {
        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          logger.info('[Push] Permission not granted');
          return;
        }

        // Determine platform
        const platform =
          Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

        // Bypass push token registration on web if no VAPID key is provided in config, which causes an error.
        if (platform === 'web') {
          if (__DEV__)
            logger.info('[Push] Bypassing Web Push registration (no VAPID key configured)');
          return;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        const pushToken = tokenData.data;
        tokenRef.current = pushToken;

        // Register with backend
        await notificationsService.registerPushToken(pushToken, platform);
        registeredRef.current = true;
        if (__DEV__)
          logger.info('[Push] Token registered successfully:', pushToken.substring(0, 20) + '...');

        // Set up Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('merchant-alerts', {
            name: 'Merchant Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#7C3AED',
            sound: 'default',
          });
        }
      } catch (error) {
        logger.error('[Push] Registration failed:', error);
      }
    }

    registerForPushNotifications();
  }, [state.isAuthenticated]);

  // Handle notification taps → navigate to correct screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (!data) return;

      try {
        const { type, orderId, payoutId, storeId, screen } = data;

        // F3: Direct screen path takes priority — but ONLY if the route matches the
        // allowlist. Remote-controlled payloads cannot be trusted to navigate anywhere.
        if (screen && typeof screen === 'string') {
          if (isAllowedPushRoute(screen)) {
            router.push(screen);
            return;
          }
          Sentry.captureMessage('[Push] Rejected push route (not in allowlist)', {
            level: 'warning',
            extra: { screen: screen.slice(0, 200) },
          });
          // Fall through to type-based routing so the user is still taken somewhere sensible.
        }

        // Route by notification type
        switch (type) {
          case 'order':
          case 'new_order':
          case 'order_update':
            if (orderId) router.push(`/orders/${orderId}`);
            else router.push('/(dashboard)/orders');
            break;
          case 'payout':
          case 'payout_approved':
          case 'payout_rejected':
          case 'withdrawal':
            router.push('/payouts');
            break;
          case 'store_suspended':
          case 'store_update':
            if (storeId) router.push(`/stores/${storeId}/details`);
            else router.push('/(dashboard)');
            break;
          case 'cashback':
          case 'cashback_request':
            router.push('/(dashboard)/cashback');
            break;
          case 'team':
          case 'team_invite':
            router.push('/(dashboard)/team');
            break;
          case 'review':
            if (storeId) router.push(`/stores/${storeId}/reviews`);
            break;
          case 'broadcast':
            router.push('/(dashboard)/broadcast');
            break;
          default:
            router.push('/notifications');
            break;
        }
      } catch (err) {
        if (__DEV__) console.error('[Push] Navigation error:', err);
      }
    });

    return () => subscription.remove();
  }, []);

  // F7: Linking URL deep-links — handles rezmerchant:// scheme and https://merchant.rez.money/
  // URLs opened from external apps. Routes through the same F3 allowlist used for push payloads.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let mounted = true;

    function handleDeepLinkUrl(url: string): void {
      if (!url || typeof url !== 'string') return;
      try {
        // Strip scheme: rezmerchant://orders/abc → /orders/abc
        //                https://merchant.rez.money/orders/abc → /orders/abc
        let path = url;
        if (url.includes('://')) {
          const parts = url.split('://');
          path = parts[1] || '/';
        } else if (url.startsWith('/')) {
          path = url;
        }
        const normalized = '/' + path.replace(/^\/+/, '');
        if (normalized === '/') return;

        if (isAllowedPushRoute(normalized)) {
          router.push(normalized);
        } else {
          Sentry.captureMessage('[DeepLink] Rejected URL (not in allowlist)', {
            level: 'warning',
            extra: { url: url.slice(0, 200) },
          });
        }
      } catch (err) {
        if (__DEV__) console.error('[DeepLink] Navigation error:', err);
      }
    }

    // Cold-start: app was launched via URL.
    Linking.getInitialURL()
      .then((url) => {
        if (mounted && url) handleDeepLinkUrl(url);
      })
      .catch((e) => console.warn('[Push] Token register failed:', e));

    // Foreground/background: app was already open when URL was triggered.
    const linkSub = Linking.addEventListener('url', (event) => {
      if (mounted) handleDeepLinkUrl(event.url);
    });

    return () => {
      mounted = false;
      linkSub.remove();
    };
  }, []);

  // Unregister push token on logout
  useEffect(() => {
    if (!state.isAuthenticated && registeredRef.current && tokenRef.current) {
      notificationsService.unregisterPushToken(tokenRef.current).catch((e) => console.warn('[Push] Token unregister failed:', e));
      registeredRef.current = false;
      tokenRef.current = null;
    }
  }, [state.isAuthenticated]);

  return { pushToken: tokenRef.current };
}
