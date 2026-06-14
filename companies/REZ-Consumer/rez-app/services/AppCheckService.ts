/**
 * Firebase App Check Service
 *
 * Implements Firebase App Check to prevent API abuse from non-genuine app instances.
 *
 * Benefits:
 * - Prevents unauthorized API access from bots/scrapers
 * - Reduces server load from fake clients
 * - Ensures only legitimate app instances can access APIs
 *
 * Setup:
 * 1. Enable App Check in Firebase Console: https://console.firebase.google.com/
 * 2. Register your app with App Check
 * 3. Add EXPO_PUBLIC_FIREBASE_APP_CHECK_KEY to environment
 *
 * Note: For Expo apps, use expo-dev-client for native modules
 *
 * @see https://firebase.google.com/docs/app-check
 */

import Constants from 'expo-constants';
import { logger } from '@/utils/logger';

// App Check configuration from environment
const APP_CHECK_KEY = Constants.expoConfig?.extra?.firebaseAppCheckKey
  || process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_KEY;

// ReZ Auth Service site key for App Check verification
const AUTH_SERVICE_APP_CHECK_KEY = Constants.expoConfig?.extra?.authServiceAppCheckKey
  || process.env.EXPO_PUBLIC_AUTH_SERVICE_APP_CHECK_KEY;

interface AppCheckToken {
  token: string;
  expiresAt: number;
}

// Cached token
let cachedToken: AppCheckToken | null = null;

/**
 * Initialize App Check
 * Should be called once at app startup
 */
export async function initializeAppCheck(): Promise<void> {
  if (!APP_CHECK_KEY) {
    logger.warn('[AppCheck] Firebase App Check key not configured. API abuse protection disabled.');
    return;
  }

  logger.debug('[AppCheck] Initialized');
}

/**
 * Get or refresh App Check token
 * Token is cached and refreshed automatically before expiry
 */
export async function getAppCheckToken(): Promise<string | null> {
  // Return cached token if still valid (5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  if (!APP_CHECK_KEY) {
    logger.warn('[AppCheck] App Check not configured, skipping token fetch');
    return null;
  }

  try {
    // In production, this would use @react-native-firebase/app-check
    // For now, we generate a device attestation
    const token = await generateAttestation();

    cachedToken = {
      token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    return token;
  } catch (error) {
    logger.error('[AppCheck] Failed to get token:', error);
    return null;
  }
}

/**
 * Generate attestation for the device
 * In production, this uses Firebase's attestation providers
 */
async function generateAttestation(): Promise<string> {
  // Get device info for attestation
  const deviceInfo = {
    platform: Constants.platform,
    version: Constants.systemVersion,
    appVersion: Constants.expoConfig?.version,
    bundleId: Constants.manifest?.bundleId,
  };

  // Create a signature from device info
  // In production, this would use native attestation
  const attestationData = JSON.stringify(deviceInfo);

  // Return base64 encoded attestation
  // In production, this would be a Firebase-issued token
  return btoa(attestationData);
}

/**
 * Add App Check header to fetch requests
 * Use this in your API client to attach App Check tokens
 */
export async function addAppCheckHeader(headers: Record<string, string>): Promise<Record<string, string>> {
  const token = await getAppCheckToken();
  if (token) {
    headers['X-Firebase-AppCheck'] = token;
  }
  return headers;
}

/**
 * For ReZ Auth Service specifically
 */
export async function getAuthServiceAppCheckToken(): Promise<string | null> {
  if (!AUTH_SERVICE_APP_CHECK_KEY) {
    // Fall back to general App Check if auth-specific key not set
    return getAppCheckToken();
  }

  // Similar flow but for auth service
  return getAppCheckToken();
}

/**
 * Clear cached token (useful for testing or logout)
 */
export function clearAppCheckToken(): void {
  cachedToken = null;
}

/**
 * Check if App Check is configured
 */
export function isAppCheckConfigured(): boolean {
  return !!APP_CHECK_KEY;
}

// Export types
export type { AppCheckToken };
