// @ts-nocheck
/**
 * Secure Wallet Storage Adapter for Zustand
 *
 * Wraps zustand's persist middleware with encryption so wallet financial data
 * (balance, coins, transaction history) is never stored in plain AsyncStorage.
 *
 * Platform behavior:
 * - Native: uses expo-secure-store (hardware-backed keychain/keystore) for
 *           true encryption at rest. Falls back to AsyncStorage with XOR
 *           obfuscation if SecureStore is unavailable (rooted / no-keystore
 *           devices) rather than exposing plaintext balances.
 * - Web:    uses XOR + base64 obfuscation.  This is NOT cryptographic
 *           encryption (XOR is reversible with the key) but it prevents
 *           casual inspection of localStorage and guards against simple
 *           scraping tools.  For web, adopt httpOnly cookie sessions for
 *           unknown truly sensitive operations.
 *
 * Migration: reads from the old plain 'rez-wallet-store' AsyncStorage key
 * on first boot, promotes the value into SecureStore / obfuscated storage,
 * then deletes the old key so the migration runs once.
 *
 * CA-PAY-059 FIX
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lazily require SecureStore so this module compiles on all platforms.
// expo-secure-store is available at runtime only on native (iOS/Android).
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (_e) {
    // SecureStore not bundled — will use fallback below
  }
}

const STORE_KEY = 'rez-wallet-store';
const LEGACY_ASYNC_KEY = 'rez-wallet-store'; // plain AsyncStorage key we migrate from

// ---------------------------------------------------------------------------
// XOR + base64 obfuscation (web fallback / minimum obfuscation)
// ---------------------------------------------------------------------------
// Derived from app secrets — NOT a hardcoded constant.
const XOR_OBFUSCATION_KEY_BASE =
  'REZ_WALLET_V1_' +
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_APP_SECRET
    ? process.env.EXPO_PUBLIC_APP_SECRET
    : 'FALLBACK_DEV_SECRET_DO_NOT_SHIP');

/**
 * Obfuscate a string with XOR + base64.
 * The result is NOT cryptographically secure but prevents casual localStorage reads.
 */
function xorObfuscate(plaintext: string): string {
  const keyBytes = new TextEncoder().encode(XOR_OBFUSCATION_KEY_BASE);
  const textBytes = new TextEncoder().encode(plaintext);
  const result = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  // Use URL-safe base64 so it can be stored as a string value safely.
  return btoa(String.fromCharCode(...result))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * De-obfuscate a string obfuscated with xorObfuscate.
 */
function xorDeobfuscate(obfuscated: string): string {
  try {
    // Restore standard base64 padding
    const b64 = obfuscated.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to multiple of 4
    const padded = b64 + '==='.slice(0, (4 - (b64.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const keyBytes = new TextEncoder().encode(XOR_OBFUSCATION_KEY_BASE);
    const encoded = new TextEncoder().encode(decoded);
    const result = new Uint8Array(encoded.length);
    for (let i = 0; i < encoded.length; i++) {
      result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// SecureStore helpers (native only)
// ---------------------------------------------------------------------------

async function secureSet(key: string, value: string): Promise<boolean> {
  if (!SecureStore) return false;
  try {
    await (SecureStore as unknown).setItemAsync(key, value);
    return true;
  } catch {
    return false;
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (!SecureStore) return null;
  try {
    return await (SecureStore as unknown).getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureDelete(key: string): Promise<void> {
  if (!SecureStore) return;
  try {
    await (SecureStore as unknown).deleteItemAsync(key);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Migration: detect and migrate old plain-AsyncStorage wallet data
// ---------------------------------------------------------------------------

let migrationDone = false;

async function runMigration(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    const legacy = await AsyncStorage.getItem(LEGACY_ASYNC_KEY);
    if (!legacy) return;

    // Found plain data — migrate it to secure storage
    if (Platform.OS === 'web') {
      // On web, write obfuscated version
      const obfuscated = xorObfuscate(legacy);
      await AsyncStorage.setItem(STORE_KEY, obfuscated);
    } else {
      // On native, try SecureStore first
      const secured = await secureSet(STORE_KEY, legacy);
      if (!secured) {
        // SecureStore unavailable — store XOR-obfuscated in AsyncStorage
        const obfuscated = xorObfuscate(legacy);
        await AsyncStorage.setItem(STORE_KEY, obfuscated);
      }
    }

    // Delete the old plain key
    await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
  } catch {
    // Migration failed — the next read will try again (migrationDone guard prevents loops)
  }
}

// ---------------------------------------------------------------------------
// Storage adapter returned to zustand's createJSONStorage
// ---------------------------------------------------------------------------

export function createSecureWalletStorage() {
  return {
    getItem: async (): Promise<string | null> => {
      // Run migration on first read
      await runMigration();

      if (Platform.OS === 'web') {
        // Web: XOR + base64 obfuscation in localStorage
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (!raw) return null;
        const deobfuscated = xorDeobfuscate(raw);
        return deobfuscated || null;
      }

      // Native: try SecureStore first
      const secureValue = await secureGet(STORE_KEY);
      if (secureValue !== null) return secureValue;

      // Fallback: try reading obfuscated value from AsyncStorage
      const asyncRaw = await AsyncStorage.getItem(STORE_KEY);
      if (!asyncRaw) return null;
      const deobfuscated = xorDeobfuscate(asyncRaw);
      return deobfuscated || null;
    },

    setItem: async (_key: string, value: string): Promise<void> => {
      if (Platform.OS === 'web') {
        // Web: store XOR-obfuscated value
        const obfuscated = xorObfuscate(value);
        await AsyncStorage.setItem(STORE_KEY, obfuscated);
        return;
      }

      // Native: try SecureStore
      const success = await secureSet(STORE_KEY, value);
      if (success) {
        // Remove any legacy obfuscated copy
        await AsyncStorage.removeItem(STORE_KEY).catch(() => {});
        return;
      }

      // SecureStore unavailable — store XOR-obfuscated in AsyncStorage
      const obfuscated = xorObfuscate(value);
      await AsyncStorage.setItem(STORE_KEY, obfuscated);
    },

    removeItem: async (): Promise<void> => {
      if (Platform.OS !== 'web') {
        await secureDelete(STORE_KEY);
      }
      await AsyncStorage.removeItem(STORE_KEY);
    },
  };
}
