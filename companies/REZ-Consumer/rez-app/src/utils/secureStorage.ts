// @ts-nocheck
/**
 * Secure Storage Utility
 * Provides encrypted storage using device keychain/keystore
 *
 * @packageDocumentation
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage key prefixes for organization
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'rez_auth_token',
  REFRESH_TOKEN: 'rez_refresh_token',
  USER_SESSION: 'rez_user_session',
  BIOMETRIC_ENABLED: 'rez_biometric_enabled',
  ENCRYPTION_KEY: 'rez_encryption_key',
} as const;

/**
 * Accessibility levels for secure storage
 */
export type SecureStorageAccessibility =
  | SecureStore.ACCESSIBLE.WHEN_UNLOCKED
  | SecureStore.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  | SecureStore.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;

/**
 * Secure storage configuration
 */
interface SecureStorageConfig {
  accessibility: SecureStorageAccessibility;
  requireBiometric?: boolean;
}

/**
 * Default configuration - most secure setting
 */
const DEFAULT_CONFIG: SecureStorageConfig = {
  accessibility: SecureStore.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireBiometric: false,
};

/**
 * Secure storage instance with typed methods
 */
export const secureStorage = {
  /**
   * Store a value securely
   * @param key - Storage key
   * @param value - Value to store (will be stringified if object)
   * @param config - Storage configuration
   */
  async set(
    key: string,
    value: string | object,
    config: SecureStorageConfig = DEFAULT_CONFIG
  ): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    await SecureStore.setItemAsync(key, stringValue, {
      accessible: config.accessibility,
      requireBiometricAuthentication: config.requireBiometric,
    });
  },

  /**
   * Retrieve a stored value
   * @param key - Storage key
   * @returns Parsed value or null if not found
   */
  async get<T = string>(key: string): Promise<T | null> {
    const value = await SecureStore.getItemAsync(key);

    if (value === null) {
      return null;
    }

    // Try to parse as JSON, fall back to string
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  /**
   * Delete a stored value
   * @param key - Storage key
   */
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  /**
   * Check if a key exists
   * @param key - Storage key
   */
  async has(key: string): Promise<boolean> {
    const value = await SecureStore.getItemAsync(key);
    return value !== null;
  },

  /**
   * Clear all secure storage for this app
   * WARNING: Use only for complete logout/reset
   */
  async clearAll(): Promise<void> {
    // Note: SecureStore doesn't provide clearAll, so we track keys
    const keysToRemove = Object.values(STORAGE_KEYS);
    await Promise.all(keysToRemove.map(key => SecureStore.deleteItemAsync(key)));
  },

  /**
   * Get platform-specific storage info
   */
  getPlatformInfo(): { platform: string; secure: boolean } {
    return {
      platform: Platform.OS,
      secure: true, // SecureStore uses keychain/keystore
    };
  },
};

/**
 * Auth-specific secure storage helpers
 */
export const authSecureStorage = {
  /**
   * Store authentication tokens
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, accessToken),
      secureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  /**
   * Retrieve authentication tokens
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      secureStorage.get<string>(STORAGE_KEYS.AUTH_TOKEN),
      secureStorage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
    ]);

    return { accessToken, refreshToken };
  },

  /**
   * Clear authentication tokens
   */
  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN),
      secureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  /**
   * Store user session data
   */
  async setSession(session: object): Promise<void> {
    await secureStorage.set(STORAGE_KEYS.USER_SESSION, session);
  },

  /**
   * Retrieve user session data
   */
  async getSession<T = object>(): Promise<T | null> {
    return secureStorage.get<T>(STORAGE_KEYS.USER_SESSION);
  },

  /**
   * Clear user session
   */
  async clearSession(): Promise<void> {
    await secureStorage.remove(STORAGE_KEYS.USER_SESSION);
  },
};

export default secureStorage;
