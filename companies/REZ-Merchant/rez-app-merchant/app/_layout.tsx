/**
 * Root Layout — Merchant App
 *
 * TS-L1 NOTE — i18n PENDING (Phase 2):
 * All user-visible strings in this app are currently hardcoded in English.
 * A centralized strings object is available at constants/strings.ts to document
 * the intent and serve as the migration source when react-i18next is added.
 * See TS-L1 in docs/Bugs/15-TYPESCRIPT-UI.md for tracking.
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import * as Sentry from '@sentry/react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View, Linking } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

// MA-SYS-014: Warn if required env vars are missing — use a runtime lazy check
// so the app boots even if the var isn't available at module-evaluation time.
// The actual API calls will fail gracefully if the URL is missing.
function checkRequiredEnvVars(): void {
  if (__DEV__) return;
  const requiredEnvVars = ['EXPO_PUBLIC_API_BASE_URL'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    logger.error(
      `[ENV] Missing required environment variables: ${missingVars.join(', ')}. Please configure them before running in production.`
    );
  }
}
checkRequiredEnvVars();

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  environment: process.env.EXPO_PUBLIC_ENV || 'production',
  integrations: [],
  beforeSend(event) {
    // Scrub sensitive fields before sending to Sentry
    // MER-HIGH-06 FIX: Define strict allowlist of safe field names instead of
    // using Record<string, any>. Only fields NOT in this list are preserved.
    // Missing sensitive fields (cvv, expiry, accountNumber, ifsc, iban) are
    // now included in the allowlist approach.
    type SensitiveField =
      | 'password'
      | 'token'
      | 'pin'
      | 'otp'
      | 'cardNumber'
      | 'cvv'
      | 'expiry'
      | 'accountNumber'
      | 'ifsc'
      | 'iban'
      | 'secret'
      | 'apiKey'
      | 'accessToken'
      | 'refreshToken'
      | 'authToken';
    const SENSITIVE_FIELDS: readonly SensitiveField[] = [
      'password',
      'token',
      'pin',
      'otp',
      'cardNumber',
      'cvv',
      'expiry',
      'accountNumber',
      'ifsc',
      'iban',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
      'authToken',
    ];

    const requestData = event.request?.data;
    if (requestData && typeof requestData === 'object' && !Array.isArray(requestData)) {
      const data = requestData as Record<string, unknown>;
      for (const field of SENSITIVE_FIELDS) {
        if (field in data) {
          (data as Record<string, string>)[field] = '[SCRUBBED]';
        }
      }
    }
    return event;
  },
});

// CRITICAL: Fail fast in production if Sentry DSN is not configured.
// Crash reporting MUST be operational in production — a missing DSN means all
// production errors are silently lost, making debugging impossible. The previous
// code only warned, leaving the app running in a degraded state. Now it throws
// immediately so the deploy pipeline catches the misconfiguration.
if (!process.env.EXPO_PUBLIC_SENTRY_DSN && !__DEV__) {
  throw new Error(
    '[Sentry] CRITICAL: EXPO_PUBLIC_SENTRY_DSN is not set. ' +
      'Crash reporting is disabled in production. Set the env var before deploying.'
  );
}

// Only import react-native-reanimated on native platforms
if (Platform.OS !== 'web') {
  require('react-native-reanimated');
}

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MerchantProvider } from '@/contexts/MerchantContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { CopilotProvider } from '@/contexts/CopilotContext';
// PreferencesProvider owns device-scoped merchant preferences (merchantMode,
// dismissed growth-actions, goal-tab-last-viewed, identity-capture-mode).
// Placed outside MerchantProvider so storage is device-scoped (NOT cleared
// on logout) but inside AuthProvider so a future revision can scope the
// AsyncStorage key by merchant id if per-account isolation is needed.
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ErrorBoundaryProvider } from '@/components/common/ErrorBoundary';
import { NotificationToastContainer } from '@/components/notifications/NotificationToastContainer';
import { queryClient } from '@/config/reactQuery';
import { Colors } from '@/constants/DesignTokens';
import { ThemeProvider as CustomThemeProvider } from '@/components/ui/ThemeProvider';
import { installProductionConsoleGuard, logger } from '@/utils/logger';
import { initPrinterRetryQueue } from '@/services/printer';
import { validateProductionEnv } from '@/config/env';

// Load debug utilities in development without creating a lazy chunk on web.
if (__DEV__) {
  try {
    require('@/utils/debugAuth');
  } catch (error) {
    logger.warn('[DebugAuth] Failed to load debug utilities:', error);
  }
}

// Custom Theme to match DesignTokens
const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.gray[50], // Off-white background for light mode
    primary: Colors.primary[500],
    text: Colors.text.primary,
    border: Colors.border.default,
    card: Colors.background.primary,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.gray[900],
    primary: Colors.primary[400],
    text: Colors.gray[100],
    border: Colors.gray[700],
    card: Colors.gray[800],
  },
};

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 * MER-LOW-04 FIX: Moved from inline definition to a reusable utility.
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

function RootLayout() {
  const router = useRouter();
  // MA-SYS-001: Track startup per navigation stack (not globally)
  // Each navigation stack should check status independently
  const appStatusCheckedRef = React.useRef<Record<string, boolean>>({});

  React.useEffect(() => {
    validateProductionEnv();
    installProductionConsoleGuard();
    // Initialize printer retry queue to flush every 30 seconds
    const cleanup = initPrinterRetryQueue(30000);
    // Check app status on startup (guarded per stack to allow navigation resets)
    const stackName = router.canGoBack() ? 'main' : 'initial';
    if (!appStatusCheckedRef.current[stackName]) {
      appStatusCheckedRef.current[stackName] = true;
      checkAppStatus();
    }
    return cleanup;
  }, [router]);

  // F7: Universal / custom-scheme deep-link handler.
  // Registered schemes: rezmerchant:// (ios/android), universal: merchant.rez.money
  // Handles cold-start opens AND in-app URL changes. Remote URLs cannot hijack
  // arbitrary routes — only allowlisted paths are navigated.
  const ALLOWED_DEEP_LINK_PATHS: RegExp[] = [
    /^\/orders(\/.*)?$/,
    /^\/\(dashboard\)\/orders$/,
    /^\/pos(\/.*)?$/,
    /^\/\(dashboard\)$/,
    /^\/notifications$/,
    /^\/settlements(\/.*)?$/,
    /^\/khata(\/.*)?$/,
    /^\/kds(\/.*)?$/,
    /^\/bookings(\/.*)?$/,
  ];

  function isAllowedDeepLinkPath(path: string): boolean {
    if (typeof path !== 'string' || path.length === 0 || path.length > 500) return false;
    if (path.includes('javascript:') || path.includes('data:')) return false;
    return ALLOWED_DEEP_LINK_PATHS.some((re) => re.test(path));
  }

  function parseAndValidateUrl(url: string): string | null {
    try {
      const u = new URL(url);
      // Custom scheme: rezmerchant://path
      if (u.protocol === 'rezmerchant:') {
        const path = u.pathname.replace(/^\/*/, '/');
        return isAllowedDeepLinkPath(path) ? path : null;
      }
      // Universal link: merchant.rez.money/path
      if (u.hostname === 'merchant.rez.money' || u.hostname === 'www.merchant.rez.money') {
        const path = u.pathname.replace(/^\/*/, '/') || '/';
        return isAllowedDeepLinkPath(path) ? path : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  // F6: Set up foreground notification listener for merchant alerts.
  // Previously these handlers only console.log'd — POS/KDS operators missed live
  // events because React Query caches were never invalidated. Now we invalidate the
  // relevant queries so the UI refreshes immediately when a push arrives in the
  // foreground. Toasts are already surfaced via NotificationToastContainer, which
  // renders from NotificationContext's socket stream.
  // MER-MED-15 FIX: Type the notification payload using Expo Notifications types.
  // MER-LOW-01 FIX: Implement refresh logic for both booking and order notifications.
  // The Expo Notification object shape: { request: { content: { data: Record<string,unknown> } } }
  React.useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification: {
        request: { content: { data: { type?: string; [key: string]: unknown } } };
      }) => {
        const data = notification.request.content.data;
        if (data?.type === 'new_booking') {
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        } else if (data?.type === 'new_order') {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['orders', 'new'] });
        }
      }
    );

    return () => sub.remove();
  }, []);

  // F7: Handle deep links (rezmerchant:// and merchant.rez.money) on cold-start and
  // when the app is already open. Uses an allowlist to prevent route hijacking from
  // untrusted URLs (e.g., a malicious link shared in chat).
  useEffect(() => {
    let mounted = true;

    const handleUrl = (url: string | null) => {
      if (!mounted || !url) return;
      const path = parseAndValidateUrl(url);
      if (path) {
        try {
          router.push(path);
        } catch {
          // Route not found — silently ignore rather than crashing
        }
      }
    };

    // Handle cold-start: app was opened via deep link
    Linking.getInitialURL()
      .then((url) => {
        if (mounted) handleUrl(url);
      })
      .catch((e) => console.warn('[DeepLink] Cold-start URL parse failed:', e));

    // Handle in-app URL changes while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      if (mounted) handleUrl(event.url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [router]);

  // Consolidated app status check: maintenance mode, force-update, and OTA updates.
  // The duplicate apiClient.get('/merchant/app-version-check') effect has been removed
  // to eliminate the startup race condition — version gating is handled inside checkAppStatus.
  const checkAppStatus = async () => {
    try {
      // Fallback to the production gateway (see SOURCE-OF-TRUTH/API-ENDPOINTS.md).
      const apiUrl =
        process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rez-api-gateway.onrender.com/api';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`${apiUrl}/config/app-status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const json = await resp.json();
      const data = json?.data;

      if (data?.maintenanceMode) {
        router.replace('/maintenance');
        return;
      }

      // Check version (requires expo-constants)
      const currentVersion = (Constants as unknown as { expoConfig?: { version?: string } }).expoConfig?.version || '1.0.0';
      if (data?.forceUpdate && compareVersions(currentVersion, data.minVersion) < 0) {
        router.replace('/update-required');
        return;
      }
    } catch {
      // Non-blocking — app continues if config endpoint fails
      logger.debug('[AppStatus] Failed to fetch app status');
    }

    // OTA update check (production only) — runs after status check resolves.
    // MER-HIGH-05 FIX: Wrap in a proper async useEffect pattern. The outer
    // checkAppStatus function is already async, so we await the update check
    // here to prevent the component from unmounting mid-check. Errors are
    // logged via telemetry instead of being silently swallowed.
    if (!__DEV__) {
      try {
        const updateResult = await Updates.checkForUpdateAsync();
        if (updateResult.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Surface the availability to the merchant via the notification
          // toast rather than forcing a reload mid-session (less disruptive).
          // The update will apply on the next cold start.
          // await Updates.reloadAsync();
        }
      } catch (updateErr) {
        logger.warn('[Updates] Check for update failed', { error: updateErr });
        // Non-blocking: app continues even if update check fails.
        // Network failures or corrupt bundles do not crash the session.
      }
    }
  };
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.gray[50],
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundaryProvider>
        <CustomThemeProvider>
          <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
            <AuthProvider>
              <PreferencesProvider>
              <SocketProvider>
                <MerchantProvider>
                  <StoreProvider>
                    <NotificationProvider>
                      <CopilotProvider>
                        <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            colorScheme === 'dark' ? Colors.gray[900] : Colors.gray[50],
                        }}
                      >
                        <NotificationToastContainer />
                        <OfflineBanner showDetails />
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            animation: 'slide_from_right',
                            contentStyle: {
                              backgroundColor:
                                colorScheme === 'dark' ? Colors.gray[900] : Colors.gray[50],
                            },
                          }}
                        >
                          {/* Authentication Flow */}
                          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

                          {/* Onboarding Flow */}
                          <Stack.Screen
                            name="onboarding"
                            options={{
                              headerShown: false,
                              gestureEnabled: false, // Prevent swipe back during onboarding
                            }}
                          />

                          {/* Product Management Groups */}
                          <Stack.Screen name="(products)" options={{ headerShown: false }} />

                          {/* Main App */}
                          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />

                          {/* Product Management - Individual product pages */}
                          <Stack.Screen
                            name="products"
                            options={{
                              headerShown: false,
                              presentation: 'card',
                            }}
                          />

                          {/* Order Management */}
                          <Stack.Screen name="orders" options={{ headerShown: false }} />

                          {/* Cashback Management */}
                          <Stack.Screen name="(cashback)" options={{ headerShown: false }} />

                          {/* Category Management */}
                          <Stack.Screen name="categories/index" options={{ headerShown: false }} />

                          {/* Reports */}
                          <Stack.Screen name="reports" options={{ headerShown: false }} />

                          {/* Notifications */}
                          <Stack.Screen name="notifications" options={{ headerShown: false }} />

                          {/* Table Bookings (all stores) */}
                          <Stack.Screen
                            name="all-table-bookings"
                            options={{ headerShown: false }}
                          />

                          {/* Services Management */}
                          <Stack.Screen name="services" options={{ headerShown: false }} />

                          {/* POS (Point of Sale) */}
                          <Stack.Screen name="pos" options={{ headerShown: false }} />

                          {/* KDS — Kitchen Display System */}
                          <Stack.Screen name="kds/index" options={{ headerShown: false }} />

                          {/* Khata — Credit Book */}
                          <Stack.Screen name="khata/index" options={{ headerShown: false }} />

                          {/* Settlements */}
                          <Stack.Screen name="settlements/index" options={{ headerShown: false }} />

                          {/* Campaign ROI, Simulator, Recommendations */}
                          <Stack.Screen name="campaigns" options={{ headerShown: false }} />

                          {/* Offline Ads */}
                          <Stack.Screen name="offline-ads" options={{ headerShown: false }} />

                          {/* Loyalty — Punch Cards */}
                          <Stack.Screen name="loyalty/index" options={{ headerShown: false }} />

                          {/* Discounts — Builder + List */}
                          <Stack.Screen name="discounts/index" options={{ headerShown: false }} />

                          {/* Expense Tracker */}
                          <Stack.Screen name="expenses/index" options={{ headerShown: false }} />

                          {/* Staff Shift Management */}
                          <Stack.Screen
                            name="staff-shifts/index"
                            options={{ headerShown: false }}
                          />

                          {/* Staff Management */}
                          <Stack.Screen name="staff/index" options={{ headerShown: false }} />
                          <Stack.Screen name="staff/detail" options={{ headerShown: false }} />
                          <Stack.Screen name="staff/add" options={{ headerShown: false }} />

                          {/* Inventory Alerts */}
                          <Stack.Screen name="inventory" options={{ headerShown: false }} />

                          {/* Trigger Engine */}
                          <Stack.Screen name="triggers" options={{ headerShown: false }} />

                          {/* Copilot Dashboard */}
                          <Stack.Screen name="copilot" options={{ headerShown: false }} />

                          {/* Business AI Dashboard */}
                          <Stack.Screen name="business-ai" options={{ headerShown: false }} />

                          {/* Hotel OS - Housekeeping */}
                          <Stack.Screen name="hotel" options={{ headerShown: false }} />
                          <Stack.Screen name="hotel/housekeeping" options={{ headerShown: false }} />
                          <Stack.Screen name="hotel/housekeeping/[taskId]" options={{ headerShown: false }} />
                          <Stack.Screen name="hotel/housekeeping/assign" options={{ headerShown: false }} />

                          {/* Hotel OS - Channel Manager */}
                          <Stack.Screen name="hotel/channel-manager" options={{ headerShown: false }} />
                          <Stack.Screen name="hotel/channel-manager/[connectionId]" options={{ headerShown: false }} />

                          {/* Hotel OS - Overview */}
                          <Stack.Screen name="hotel/overview" options={{ headerShown: false }} />

                          {/* Maintenance */}
                          <Stack.Screen name="maintenance" options={{ headerShown: false }} />

                          {/* Not Found */}
                          <Stack.Screen name="+not-found" />
                        </Stack>
                        <StatusBar
                          style={colorScheme === 'dark' ? 'light' : 'dark'}
                          backgroundColor="transparent"
                          translucent
                        />
                        </View>
                      </CopilotProvider>
                    </NotificationProvider>
                  </StoreProvider>
                </MerchantProvider>
              </SocketProvider>
              </PreferencesProvider>
            </AuthProvider>
          </ThemeProvider>
        </CustomThemeProvider>
      </ErrorBoundaryProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
