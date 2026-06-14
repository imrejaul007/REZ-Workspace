// @ts-nocheck
/**
 * Auth Storage Utilities
 * Handles auth token storage for both web and native platforms
 * - Web: httpOnly cookies (Phase 6) - localStorage only for non-sensitive user data
 * - Native: expo-secure-store (encrypted keychain/keystore)
 *
 * Migration: Users upgrading from AsyncStorage-only will have tokens migrated
 * on first read, then removed from AsyncStorage.
 *
 * Phase 6: Web-mode sessions use httpOnly cookies set by the backend (rez_access_token).
 * On web (Platform.OS === 'web'), tokens come from cookies via apiClient with
 * credentials:'include'. localStorage only stores non-sensitive user data (name, avatar).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * STORAGE DECISION MATRIX
 * ═══════════════════════════════════════════════════════════════════════════════
 * | Data Type          | Web (Platform.OS=web) | Native (iOS/Android)          |
 * |--------------------|------------------------|--------------------------------|
 * | Access Token       | httpOnly Cookie (API)   | SecureStore (Keychain/Keystore)|
 * | Refresh Token      | httpOnly Cookie (API)   | SecureStore (Keychain/Keystore)|
 * | User Profile       | localStorage (opt-in)  | SecureStore (Keychain/Keystore)|
 * | User Avatar/Name   | localStorage (opt-in)  | SecureStore (Keychain/Keystore)|
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SECURITY: Auth tokens NEVER go to AsyncStorage. If SecureStore is unavailable
 * on native, token operations will FAIL rather than expose tokens insecurely.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import logger for security event logging
import { logger } from '@/utils/logger';

// Import SecureStore with fallback for environments where it's not available
let SecureStore: typeof import('expo-secure-store') | null = null;
let _secureStoreUnavailableWarned = false;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (_error) {
    // SecureStore not available — will fall back to AsyncStorage
    if (!_secureStoreUnavailableWarned) {
      _secureStoreUnavailableWarned = true;
      logger.warn(
        '[authStorage] WARNING: expo-secure-store is not available. ' +
        'Auth tokens will use encrypted fallback (less secure than Keychain/Keystore).'
      );
    }
  }
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
};

const isWeb = Platform.OS === 'web';
const hasLocalStorage = isWeb && typeof window !== 'undefined' && !!window.localStorage;

// ── Secure Store helpers (native only) ──

/**
 * Write a value to SecureStore. Falls back silently on failure.
 * Returns true if SecureStore write succeeded.
 */
async function secureSet(key: string, value: string): Promise<boolean> {
  if (!SecureStore) {
    if (!_secureStoreUnavailableWarned) {
      logger.warn(
        `[authStorage] SecureStore unavailable for key '${key}'. ` +
        `Auth tokens cannot use AsyncStorage fallback - operations will FAIL.`
      );
    }
    return false;
  }
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    // SecureStore can fail on some Android devices (no hardware-backed keystore,
    // rooted devices, etc.). Fall through to AsyncStorage.
    logger.error(
      `[authStorage] SecureStore write failed for '${key}'. ` +
      `This may indicate a rooted device or missing keystore. ` +
      `Auth operations will fail for security.`
    );
    return false;
  }
}

/**
 * Read a value from SecureStore. Returns null on failure or if not found.
 */
export async function secureGet(key: string): Promise<string | null> {
  if (!SecureStore) return null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch (_error) {
    return null;
  }
}

/**
 * Delete a value from SecureStore. Silently ignores failures.
 */
async function secureDelete(key: string): Promise<void> {
  if (!SecureStore) return;
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (_error) {
    // Ignore — value may not exist or SecureStore unavailable
  }
}

// ── Native read with migration ──

/**
 * Read a value on native: tries SecureStore first, then falls back to
 * AsyncStorage (migration path for users who had tokens before SecureStore
 * was introduced). If found only in AsyncStorage, promotes to SecureStore.
 */
async function nativeGet(key: string): Promise<string | null> {
  // Try SecureStore first
  const secureValue = await secureGet(key);
  if (secureValue) return secureValue;

  // Fallback: read from AsyncStorage (migration)
  const asyncValue = await AsyncStorage.getItem(key);
  if (asyncValue) {
    // SECURITY: Log migration from AsyncStorage to SecureStore
    const isToken = key === STORAGE_KEYS.ACCESS_TOKEN || key === STORAGE_KEYS.REFRESH_TOKEN;
    if (isToken) {
      logger.warn(
        `[authStorage] SECURITY: Found auth token in AsyncStorage (legacy migration). ` +
        `Migrating to SecureStore for improved security.`
      );
    }
    // Promote to SecureStore for future reads
    await secureSet(key, asyncValue);
  }
  return asyncValue;
}

/**
 * Write a value on native: MUST use SecureStore for auth tokens.
 * - For auth tokens (ACCESS_TOKEN, REFRESH_TOKEN), fail explicitly if SecureStore unavailable.
 * - For user data, fall back to AsyncStorage as a secondary measure.
 * - Never store auth tokens in plain AsyncStorage — it offers zero encryption
 *   and is readable by unknown app with READ_EXTERNAL_STORAGE permission.
 * CRITICAL FIX (CA-SEC-003): Reject AsyncStorage fallback for tokens on rooted/no-keystore devices.
 */
async function nativeSet(key: string, value: string): Promise<void> {
  const success = await secureSet(key, value);
  if (success) {
    // SecureStore write confirmed — clean up any old AsyncStorage copy
    await AsyncStorage.removeItem(key).catch(() => {});
  } else {
    // SecureStore unavailable — for auth tokens, FAIL EXPLICITLY; for user data, fall back
    if (key === STORAGE_KEYS.ACCESS_TOKEN || key === STORAGE_KEYS.REFRESH_TOKEN) {
      // SECURITY: Never store auth tokens unencrypted on native — fail instead
      throw new Error(
        `CRITICAL: Cannot store ${key} without SecureStore. ` +
        'Device may be rooted or lack hardware-backed keystore. ' +
        'Upgrade device or disable sensitive features.'
      );
    }
    // For user data (not auth tokens), fall back to AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Both stores failed — nothing we can do; the caller will get null on next read
    }
  }
}

/**
 * Delete a value on native: removes from both SecureStore and AsyncStorage.
 * Handles concurrent deletes gracefully by ignoring "item not found" errors.
 */
async function nativeDelete(key: string): Promise<void> {
  await secureDelete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // Ignore "not found" errors for already-deleted items
    if (error?.message?.includes('item not found') || error?.message?.includes('not found')) {
      return;
    }
    throw error;
  }
}

// ── Public API ──

/**
 * Save auth token
 * Phase 6: On web, httpOnly cookies manage auth — skip localStorage write.
 *           getAuthToken() still reads localStorage for backward compat (old sessions continue until re-login).
 * On native: SecureStore only
 */
export async function saveAuthToken(token: string): Promise<void> {
  if (isWeb) {
    // Phase 6: cookies handle auth on web — do not write to localStorage
    return;
  }
  await nativeSet(STORAGE_KEYS.ACCESS_TOKEN, token);
}

/**
 * Save refresh token
 * Phase 6: On web, httpOnly cookies manage refresh — skip localStorage write.
 */
export async function saveRefreshToken(token: string): Promise<void> {
  if (isWeb) {
    // Phase 6: cookies handle refresh on web — do not write to localStorage
    return;
  }
  await nativeSet(STORAGE_KEYS.REFRESH_TOKEN, token);
}

/**
 * Save user data
 */
export async function saveUser(user): Promise<void> {
  const userString = JSON.stringify(user);
  if (isWeb) {
    if (hasLocalStorage) {
      window.localStorage.setItem(STORAGE_KEYS.USER, userString);
    }
  } else {
    await nativeSet(STORAGE_KEYS.USER, userString);
  }
}

/**
 * Get auth token
 * On web: Reads from localStorage
 * On native: Tries SecureStore first, then AsyncStorage (migration)
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Phase 6: web auth is fully cookie-based — do not read from localStorage.
    // New sessions never write tokens here (saveAuthToken is a no-op on web),
    // so any localStorage token is from a pre-migration session. Returning null
    // forces re-login which issues a proper httpOnly cookie.
    if (isWeb) return null;
    return await nativeGet(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (_error) {
    return null;
  }
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    // Phase 6: web refresh is cookie-based — skip localStorage read.
    if (isWeb) return null;
    return await nativeGet(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (_error) {
    return null;
  }
}

/**
 * Get user data
 */
export async function getUser(): Promise<unknown | null> {
  try {
    let userString: string | null = null;

    if (isWeb) {
      if (hasLocalStorage) {
        const localStorageUser = window.localStorage.getItem(STORAGE_KEYS.USER);
        if (localStorageUser) return JSON.parse(localStorageUser);
      }
      userString = null;
    } else {
      userString = await nativeGet(STORAGE_KEYS.USER);
    }

    return userString ? JSON.parse(userString) : null;
  } catch (_error) {
    return null;
  }
}

/**
 * Clear all auth data
 */
export async function clearAuthData(): Promise<void> {
  // Remove any legacy AsyncStorage keys.
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);

  if (isWeb) {
    // Clear localStorage on web
    if (hasLocalStorage) {
      window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      window.localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      window.localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } else {
    // Clear SecureStore on native
    await secureDelete(STORAGE_KEYS.ACCESS_TOKEN);
    await secureDelete(STORAGE_KEYS.REFRESH_TOKEN);
    await secureDelete(STORAGE_KEYS.USER);
  }
}

/**
 * Save all auth data at once
 * Phase 6: On web, httpOnly cookies manage tokens — only user data is persisted (non-sensitive).
 *           Token writes are skipped; getAuthToken() reads are kept for backward compat.
 * On native: SecureStore only
 */
export async function saveAuthData(accessToken: string, refreshToken: string, user): Promise<void> {
  const userString = JSON.stringify(user);

  if (isWeb) {
    // Phase 6: skip token writes on web — cookies handle auth
    // Only persist user data so UI can show name/avatar without re-fetching
    if (hasLocalStorage) {
      window.localStorage.setItem(STORAGE_KEYS.USER, userString);
    }
    return;
  } else {
    // Write all three keys. If any write fails, clean up all keys so we never
    // leave partial auth state (e.g. token saved but user data missing).
    try {
      await Promise.all([
        nativeSet(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        nativeSet(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        nativeSet(STORAGE_KEYS.USER, userString),
      ]);
    } catch (writeError) {
      // Best-effort cleanup — ignore cleanup errors, rethrow the original
      await Promise.allSettled([
        nativeDelete(STORAGE_KEYS.ACCESS_TOKEN),
        nativeDelete(STORAGE_KEYS.REFRESH_TOKEN),
        nativeDelete(STORAGE_KEYS.USER),
      ]);
      throw writeError;
    }
  }
}
