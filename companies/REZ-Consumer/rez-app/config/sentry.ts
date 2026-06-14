// @ts-nocheck
/**
 * Sentry Initialization for React Native / Expo
 *
 * Call `initSentry()` once at module level in _layout.tsx (before unknown rendering).
 * Wrap the root component with `Sentry.wrap()`.
 *
 * Requires EXPO_PUBLIC_SENTRY_DSN in .env to activate.
 */
import * as Sentry from '@sentry/react-native';
import { EXTERNAL_SERVICES, APP_CONFIG, isProduction } from './env';

const PLACEHOLDER_DSNS = ['your-sentry-dsn', 'YOUR_SENTRY_DSN', 'YOUR_SENTRY_DSN_HERE', ''];

let initialized = false;

export function initSentry() {
  if (initialized) return;

  const dsn = EXTERNAL_SERVICES.analytics.sentry;
  if (!dsn || PLACEHOLDER_DSNS.includes(dsn)) {
    if (isProduction()) {
      logger.error('[Sentry] WARNING: EXPO_PUBLIC_SENTRY_DSN is not set. Crash reporting is disabled in production.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: APP_CONFIG.environment,
    release: `rez@${APP_CONFIG.version}`,
    enabled: !__DEV__,

    // Performance — 20% of transactions in production, none in dev
    tracesSampleRate: __DEV__ ? 0 : 0.2,

    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Error enrichment
    attachStacktrace: true,
    maxBreadcrumbs: 50,

    // Strip sensitive data before sending
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },

    // Drop noisy and potentially PII-containing breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') {
        return null;
      }
      // Filter HTTP breadcrumbs to avoid exposing auth headers
      if (breadcrumb.category === 'http' && breadcrumb.data?.request?.headers) {
        breadcrumb.data.request.headers = '[REDACTED]';
      }
      // Filter user interaction breadcrumbs that might contain sensitive info
      if (breadcrumb.category === 'ui' && breadcrumb.data?.label?.includes('password')) {
        return null;
      }
      return breadcrumb;
    },
  });

  initialized = true;
}

export function isSentryInitialized() {
  return initialized;
}

export { Sentry };
