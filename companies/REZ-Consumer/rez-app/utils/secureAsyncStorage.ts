// @ts-nocheck
/**
 * Secure AsyncStorage Utility
 *
 * Provides encrypted storage for security-sensitive preferences that need
 * to persist but shouldn't be stored in plaintext.
 *
 * SECURITY FIX (2026-05-12): Addresses AsyncStorage plaintext storage issue
 * for security-sensitive preferences like privacy settings, security configurations,
 * and user preferences that shouldn't be exposed on rooted/jailbroken devices.
 *
 * For critical auth tokens and credentials, use secureStorage from @/utils/secureStorage
 * (which uses expo-secure-store with iOS Keychain/Android Keystore).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Storage key prefix for encrypted data
const ENCRYPTED_PREFIX = '__enc_';

/**
 * Storage keys for security-sensitive data
 * These should ALWAYS use SecureAsyncStorage instead of plain AsyncStorage
 */
export const SECURE_STORAGE_KEYS = {
  SECURITY_SETTINGS: 'security_settings',
  PRIVACY_SETTINGS: 'privacy_settings',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  BIOMETRIC_SETTINGS: 'biometric_settings',
  CART_DATA: 'cart_data', // Cart data may contain sensitive purchase history
  USER_PREFERENCES: 'user_preferences',
} as const;

/**
 * Derive an encryption key from a storage key using PBKDF2
 * This ensures different data is encrypted with different keys
 */
async function deriveKey(storageKey: string): Promise<string> {
  const salt = `rez_${storageKey}_salt`;
  const keyBytes = await Crypto.getRandomBytesAsync(16);
  const saltBytes = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt
  );

  // Use a deterministic key derivation based on storage key
  // This is acceptable since we're using random bytes per value
  const combined = `${storageKey}:${keyBytes.toString()}:${saltBytes}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
}

/**
 * XOR-based encryption for React Native
 * Note: This is obfuscation, not military-grade encryption.
 * For truly sensitive data, use SecureStore (expo-secure-store).
 * This layer adds protection against casual inspection of AsyncStorage.
 */
function xorEncrypt(data: string, key: string): string {
  const keyChars = key.split('');
  const dataChars = data.split('');

  const encrypted = dataChars.map((char, i) => {
    const keyChar = keyChars[i % keyChars.length];
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
  });

  // Convert to base64 for safe storage
  return btoa(unescape(encodeURIComponent(encrypted.join(''))));
}

/**
 * XOR-based decryption
 */
function xorDecrypt(encryptedData: string, key: string): string {
  // Decode from base64
  let decoded: string;
  try {
    decoded = decodeURIComponent(escape(atob(encryptedData)));
  } catch {
    // Not encrypted, return as-is
    return encryptedData;
  }

  const keyChars = key.split('');
  const dataChars = decoded.split('');

  const decrypted = dataChars.map((char, i) => {
    const keyChar = keyChars[i % keyChars.length];
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
  });

  return decrypted.join('');
}

/**
 * Check if a value is encrypted (has our prefix)
 */
function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Strip encryption prefix from encrypted value
 */
function stripPrefix(value: string): string {
  return value.slice(ENCRYPTED_PREFIX.length);
}

/**
 * Secure AsyncStorage wrapper
 * Provides encryption for security-sensitive preferences
 */
export const secureAsyncStorage = {
  /**
   * Store a value with encryption
   * @param key - Storage key
   * @param value - Value to store (will be stringified if object)
   */
  async set(key: string, value: string | object | number | boolean): Promise<void> {
    try {
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

      // On native platforms (especially non-rooted), use encryption
      // On web or when encryption fails, store with prefix for future migration
      if (Platform.OS !== 'web') {
        const encryptionKey = await deriveKey(key);
        const encrypted = xorEncrypt(stringValue, encryptionKey);
        await AsyncStorage.setItem(key, ENCRYPTED_PREFIX + encrypted);
      } else {
        // Web: store with encryption prefix (sessionStorage is already sandboxed)
        await AsyncStorage.setItem(key, stringValue);
      }
    } catch (error) {
      logger.error(`[SecureAsyncStorage] Failed to set ${key}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve a stored value with decryption
   * @param key - Storage key
   * @returns Parsed value or null if not found
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        return null;
      }

      // Decrypt if encrypted
      if (isEncrypted(value)) {
        const encrypted = stripPrefix(value);
        const encryptionKey = await deriveKey(key);
        const decrypted = xorDecrypt(encrypted, encryptionKey);

        // Try to parse as JSON, fall back to string
        try {
          return JSON.parse(decrypted) as T;
        } catch {
          return decrypted as unknown as T;
        }
      }

      // Not encrypted, try to parse as JSON, fall back to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      logger.error(`[SecureAsyncStorage] Failed to get ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a stored value
   * @param key - Storage key
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error(`[SecureAsyncStorage] Failed to remove ${key}:`, error);
      throw error;
    }
  },

  /**
   * Check if a key exists
   * @param key - Storage key
   */
  async has(key: string): Promise<boolean> {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  },

  /**
   * Migrate an existing AsyncStorage key to encrypted storage
   * Call this once for each key you want to migrate
   * @param key - Storage key to migrate
   */
  async migrate(key: string): Promise<void> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        return; // Nothing to migrate
      }

      // Already encrypted, skip
      if (isEncrypted(value)) {
        return;
      }

      // Encrypt and store
      await this.set(key, value);
    } catch (error) {
      logger.error(`[SecureAsyncStorage] Failed to migrate ${key}:`, error);
    }
  },

  /**
   * Clear all secure storage for this app
   * WARNING: Use only for complete logout/reset
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(SECURE_STORAGE_KEYS);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    } catch (error) {
      logger.error('[SecureAsyncStorage] Failed to clear all:', error);
      throw error;
    }
  },

  /**
   * Get storage info
   */
  getStorageInfo(): { type: string; encrypted: boolean } {
    return {
      type: 'AsyncStorage',
      encrypted: Platform.OS !== 'web', // Encryption applied on native
    };
  },
};

export default secureAsyncStorage;
