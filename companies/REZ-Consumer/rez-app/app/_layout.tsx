// @ts-nocheck
// Side-effect imports — must come first
import '@/utils/setup/warningSuppression';
import 'react-native-reanimated';

// Sentry must initialize before any rendering
import { initSentry, Sentry } from '@/config/sentry';

// REZ INTELLIGENCE: Initialize observability for metrics/tracing
import { observability } from '@/utils/observability';
if (process.env.EXPO_PUBLIC_ENABLE_OBSERVABILITY === 'true') {
  observability.initObservability();
}

import { useFonts } from 'expo-font';
import * as Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import { otaManager } from '@/utils/otaManager';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking, Platform, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { platformAlertConfirm } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useAppServices } from '@/hooks/useAppServices';
import AppProviders from '@/utils/setup/AppProviders';
import logger, { installProductionConsoleGuard } from '@/utils/logger';
import { colors } from '@/constants/theme';
import { getActiveDraft } from '@/stores/checkoutDraftStore';
import apiClient from '@/services/apiClient';
import * as authStorage from '@/utils/authStorage';
import { lookupStoreBySlug } from '@/services/storePaymentApi';
initSentry();

// CONS-010: Validate required environment variables at startup
// Fail loudly in production; warn in development so missing configs are caught early
(() => {
  const REQUIRED_CONFIGS: Record<string, string> = {
    EXPO_PUBLIC_API_BASE_URL: 'Backend API URL',
    EXPO_PUBLIC_RAZORPAY_KEY_ID: 'Razorpay payment key',
  };
  const RECOMMENDED_CONFIGS: Record<string, string> = {
    EXPO_PUBLIC_SENTRY_DSN: 'Sentry crash reporting',
    EXPO_PUBLIC_ENVIRONMENT: 'Environment name (production/staging/development)',
  };
  // Use static access — Metro only inlines EXPO_PUBLIC_* vars via static string references,
  // not via dynamic bracket notation (process.env[key] is always undefined in the bundle).
  const runtimeValues: Record<string, string | undefined> = {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_RAZORPAY_KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
  };
  const recommendedValues: Record<string, string | undefined> = {
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
  };
  const missing = Object.entries(REQUIRED_CONFIGS).filter(([key]) => !runtimeValues[key]);
  const missingRecommended = Object.entries(RECOMMENDED_CONFIGS).filter(([key]) => !recommendedValues[key]);
  if (missing.length > 0) {
    const msg = `Missing required env vars: ${missing.map(([k, v]) => `${k} (${v})`).join(', ')}`;
    // Never throw on missing env — crashes the app before anything renders
    logger.error('[Config] Missing required env vars', undefined, msg);
  }
  if (missingRecommended.length > 0 && __DEV__) {
    logger.warn(
      `[Config] Recommended env vars not set: ${missingRecommended.map(([k, v]) => `${k} (${v})`).join(', ')}`,
    );
  }
})();

const FONT_TIMEOUT_MS = 5000;

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

// Module-level guards — survive React remounts so startup checks run only once per page load.
// Using refs inside the component would reset on remount and cause an infinite loop on web
// where router.replace('/onboarding') triggers layout remounting.
let _startupChecksRun = false;
let _fontTimedOut = false;

function RootLayout() {
  const router = useRouter();
  const [loaded, fontError] = useFonts({
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  const [fontTimedOut, setFontTimedOut] = useState(_fontTimedOut);

  useEffect(() => {
    // Guard against repeated calls on remount (web router navigation remounts the layout).
    if (_startupChecksRun) return;
    _startupChecksRun = true;
    checkAppStatus();
    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sprint 12: Deep Link Handling ──────────────────────────────────────────

  /**
   * Extracts query params from a deep link URL.
   * Supports both rezapp://path?key=val and https://rez.money/path?key=val
   */
  const parseDeepLink = (url: string): { path: string; params: Record<string, string> } => {
    try {
      // Normalise rezapp:// scheme to https:// for URL parsing
      const normalised = url.replace(/^rezapp:\/\//, 'https://rezapp.internal/');
      const parsed = new URL(normalised);
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      // Reconstruct path without leading slash for scheme URLs
      const path = parsed.pathname.replace(/^\//, '');
      return { path, params };
    } catch {
      return { path: '', params: {} };
    }
  };

  const handleDeepLink = async (url: string) => {
    if (!url) return;

    // 0. Universal links from menu.rez.money/<slug>[?table=N]
    //    Pattern: https://menu.rez.money/<storeSlug>
    const menuMatch = url.match(/https?:\/\/menu\.rez\.money\/([a-z0-9][a-z0-9-]*[a-z0-9]?)(?:\?(.*))?$/i);
    if (menuMatch) {
      const slug = menuMatch[1].toLowerCase();
      const queryStr = menuMatch[2] || '';
      const tableNumber = new URLSearchParams(queryStr).get('table') || undefined;
      const store = await lookupStoreBySlug(slug);
      if (store) {
        const storeData = store as { _id?: string; id?: string; name?: string; logo?: string };
        const storeId = storeData._id || storeData.id || String(store);
        const storeName = storeData.name || '';
        const storeLogo = storeData.logo || '';
        router.push({
          pathname: '/pay-in-store/enter-amount',
          params: {
            storeId,
            storeName,
            storeLogo,
            ...(tableNumber ? { tableNumber } : {}),
          },
        });
      } else {
        router.push('/pay-in-store' as unknown as string);
      }
      return;
    }

    // 0b. Universal links from now.rez.money
    //
    //   Pattern A — order status deep link (from push notifications):
    //     https://now.rez.money/<storeSlug>/order/<orderNumber>
    //     → Open in in-app browser so the user can see their live order status.
    //
    //   Pattern B — store landing page:
    //     https://now.rez.money/<slug>[?table=N&scan=1]
    //     Without ?table= → Scan & Pay in-app
    //     With ?table=N   → Order & Pay dine-in, let browser handle it
    const nowOrderMatch = url.match(/https?:\/\/now\.rez\.money\/([a-z0-9][a-z0-9-]*[a-z0-9]?)\/order\/([^/?#]+)/i);
    if (nowOrderMatch) {
      // Open the order detail page in an in-app browser
      import('expo-web-browser').then(({ openBrowserAsync }) => openBrowserAsync(url)).catch(() => {});
      return;
    }

    const nowMatch = url.match(/https?:\/\/now\.rez\.money\/([a-z0-9][a-z0-9-]*[a-z0-9]?)(?:\?(.*))?$/i);
    if (nowMatch) {
      const slug = nowMatch[1].toLowerCase();
      const queryStr = nowMatch[2] || '';
      const urlParams = new URLSearchParams(queryStr);
      const tableNumber = urlParams.get('table') || undefined;
      const scanMode = urlParams.get('scan');

      // If table= is set (Order & Pay dine-in), don't intercept — open in browser
      if (tableNumber && !scanMode) {
        return;
      }

      // Scan & Pay — route to pay-in-store screen
      const store = await lookupStoreBySlug(slug);
      if (store) {
        const storeData = store as { _id?: string; id?: string; name?: string; logo?: string };
        const storeId = storeData._id || storeData.id || String(store);
        const storeName = storeData.name || '';
        const storeLogo = storeData.logo || '';
        router.push({
          pathname: '/pay-in-store/enter-amount',
          params: {
            storeId,
            storeName,
            storeLogo,
          },
        });
      } else {
        router.push('/pay-in-store' as unknown as string);
      }
      return;
    }

    const { path, params } = parseDeepLink(url);

    // 1. Referral code links: rezapp://invite?code=ABC123 or https://rez.money/invite?code=ABC123
    if (path === 'invite' && params.code) {
      try {
        await AsyncStorage.setItem('rez_pending_referral', params.code);
        logger.debug('[DeepLink] Stored pending referral code', { code: params.code }, 'DeepLink');
        // Attempt to auto-apply if user is already authenticated
        const token = await authStorage.getAuthToken();
        if (token) {
          try {
            await apiClient.post('/referral/apply', { code: params.code });
            await AsyncStorage.removeItem('rez_pending_referral');
            // Show success toast — lazy import the toast utility to avoid circular deps
            import('@/contexts/ToastContext')
              .then(({ showGlobalToast }) => {
                if (typeof showGlobalToast === 'function') {
                  showGlobalToast('Referral code applied! You earned 100 bonus coins');
                }
              })
              .catch(() => {});
          } catch {
            // Will be retried on next login
          }
        }
      } catch {
        // Non-blocking
      }
      return;
    }

    // 2. Store check-in deep links: rezapp://checkin?storeId=XYZ
    if (path === 'checkin' && params.storeId) {
      try {
        router.push(`/qr-checkin?storeId=${encodeURIComponent(params.storeId)}` as unknown);
      } catch {
        // If router isn't ready, navigate to tab root
      }
      return;
    }

    // 3. Generic route deep links (notification-tapped links, etc.)
    if (path && path !== '') {
      try {
        router.push(`/${path}` as unknown as string);
      } catch {
        // Ignore navigation errors if route doesn't exist
      }
    }
  };

  // Handle deep links that open the app from cold start
  useEffect(() => {
    let mounted = true;

    // Get the initial URL that launched the app
    Linking.getInitialURL()
      .then((url) => {
        if (mounted && url) {
          handleDeepLink(url);
        }
      })
      .catch(() => {});

    // Subscribe to new deep links while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      if (mounted) {
        handleDeepLink(event.url);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle notification-response deep links from expo-notifications
  useEffect(() => {
    let mounted = true;

    // Lazy import expo-notifications to avoid issues on web/environments without it
    import('expo-notifications')
      .then((Notifications) => {
        if (!mounted) return;

        const subscription = Notifications.addNotificationResponseReceivedListener(
          (response: Notifications.NotificationResponse) => {
            const data = response.notification.request.content.data as Record<string, unknown>;

            // REZ Now order status notifications carry type='order_status' and a url
            // pointing to https://now.rez.money/<storeSlug>/order/<orderNumber>.
            // Route through handleDeepLink which opens the order in an in-app browser.
            if (data?.type === 'order_status' && typeof data.url === 'string') {
              handleDeepLink(data.url);
              return;
            }

            if (data?.route && typeof data.route === 'string') {
              try {
                router.push(data.route as unknown as string);
              } catch {
                // Ignore if route is invalid
              }
            } else if (data?.url && typeof data.url === 'string') {
              handleDeepLink(data.url);
            }
          },
        );

        return () => subscription.remove();
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboarding = async () => {
    try {
      const done = await AsyncStorage.getItem('rez_onboarding_done');
      if (!done) {
        // On web, skip the replace if we're already at /onboarding — navigating to the
        // same route remounts the layout and causes an infinite request loop.
        const alreadyAtOnboarding = typeof window !== 'undefined' && window.location.pathname.startsWith('/onboarding');
        if (!alreadyAtOnboarding) {
          router.replace('/onboarding');
        }
      }
    } catch {
      // If AsyncStorage fails, do not block the app — proceed normally.
    }

    // Non-blocking: establish Hotel OTA SSO session if REZ token exists and OTA token is absent.
    // This ensures users who navigate directly to hotel screens (deep links, notifications) are pre-logged in.
    try {
      const rezTokenVal = await authStorage.getAuthToken();
      // CD-CRIT-02 FIX: Use SecureStore for OTA token — never AsyncStorage.
      // Hotel booking auth tokens must not be stored in plain AsyncStorage
      // (extractable on Android/rooted devices). If SecureStore unavailable,
      // skip auto-login rather than storing in plaintext.
      const { rezSsoLogin, getOtaToken } = await import('@/services/hotelOtaApi');
      const otaTokenRaw = await getOtaToken();
      const hasRez = !!rezTokenVal;
      const hasOta = !!otaTokenRaw;
      if (hasRez && !hasOta) {
        await rezSsoLogin(rezTokenVal!).catch(() => {
          /* Non-fatal */
        });
      }
    } catch {
      /* Non-blocking */
    }
  };

  const checkAppStatus = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.rezapp.com';
      const resp = await fetch(`${apiUrl}/config/app-status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      let json: { data?: { maintenanceMode?: boolean; forceUpdate?: boolean; minVersion?: string } };
      try {
        json = await resp.json();
      } catch {
        logger.debug('[AppStatus] Response was not valid JSON', undefined, 'AppStatus');
        return;
      }
      const data = json?.data;

      if (data?.maintenanceMode) {
        router.replace('/maintenance');
        return;
      }

      // Check version (requires expo-constants)
      const currentVersion = (Constants as unknown).expoConfig?.version || '1.0.0';
      if (data?.forceUpdate && compareVersions(currentVersion, data.minVersion) < 0) {
        router.replace('/update-required');
      }
    } catch {
      clearTimeout(timeoutId);
      // Non-blocking — app continues if config endpoint fails
      logger.debug('[AppStatus] Failed to fetch app status', undefined, 'AppStatus');
    }
  };

  useEffect(() => {
    if (fontError) {
      logger.warn('Font loading failed, proceeding with system fonts', { message: fontError.message }, 'Fonts');
    }
  }, [fontError]);

  useEffect(() => {
    if (loaded || fontError) return;
    const timer = setTimeout(() => {
      logger.warn('Font loading timed out after 5s, proceeding with system fonts', undefined, 'Fonts');
      _fontTimedOut = true;
      setFontTimedOut(true);
    }, FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, fontError]);

  // Track whether an OTA update has been downloaded and is ready to apply
  const updateReadyRef = useRef(false);

  useEffect(() => {
    if (__DEV__) return;

    // Initialize OTA manager with rollback support
    otaManager.init().then(() => {
      // Check and download updates
      otaManager.checkAndDownload().then(({ hasUpdate }) => {
        if (hasUpdate) {
          updateReadyRef.current = true;
          // Notify the user non-intrusively; they can dismiss and the app
          // will reload automatically the next time it resumes from background.
          platformAlertConfirm(
            'Update Available',
            'A new version has been downloaded and will be applied the next time you open the app.',
            () => otaManager.applyUpdate(),
            'Restart Now',
            'Later',
          );
        }
      });
    });

    // Mark successful start on mount
    otaManager.markSuccessfulStart();

    // Reload when the app returns to the foreground after going to background,
    // but only if an update was already downloaded. Skip if a payment is in
    // progress to avoid interrupting the Razorpay / wallet flow mid-transaction.
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && updateReadyRef.current) {
        const activeDraft = getActiveDraft();
        const paymentInProgress = activeDraft?.paymentMethod != null;
        if (paymentInProgress) {
          // Leave updateReadyRef.current = true so we retry on the next foreground
          logger.debug('[OTA] Skipping reload — payment in progress', undefined, 'OTA');
          return;
        }
        updateReadyRef.current = false;
        otaManager.applyUpdate();
      }
    });

    return () => {
      subscription.remove();
      otaManager.stopHealthMonitoring();
    };
  }, []);

  // Dark mode is disabled — always use light background colour for the loading screen.
  useColorScheme(); // keep hook call to avoid Rules-of-Hooks violations
  const fontsReady = loaded || fontError != null || fontTimedOut;

  const { handleQueueSyncError, handleQueueSyncComplete, handleErrorBoundaryError } = useAppServices(fontsReady);

  if (!fontsReady) {
    // Use cream/off-white background to match the home screen and avoid a dark navy flash
    return <View style={{ flex: 1, backgroundColor: '#F5F5F0' }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ErrorBoundary>
        <SafeAreaView style={styles.rootContainer} edges={['top', 'left', 'right']}>
          <AppProviders
            onErrorBoundaryError={handleErrorBoundaryError}
            onQueueSyncComplete={handleQueueSyncComplete}
            onQueueSyncError={handleQueueSyncError}
          />
          {/* Animated offline/reconnect banner — uses OfflineBanner (absolute-positioned overlay) */}
          <OfflineBanner />
        </SafeAreaView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});

export default Sentry.wrap(RootLayout);
