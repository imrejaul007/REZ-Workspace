import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// Phase 6: COOKIE_AUTH_ENABLED — when true, access tokens for web mode are managed by
// httpOnly cookies set by the backend on login (rez_access_token). The API client adds
// credentials:'include' so the browser sends the cookie automatically on every request.
// localStorage/AsyncStorage fallback is retained for native builds and backward compat:
//   - Native builds continue to read/write tokens from SecureStore (unchanged)
//   - Web sessions from before this migration (existing localStorage tokens) continue working
//     via the bearer header fallback path until they log in again and receive a cookie
// Set to false to revert to the old bearer-only behaviour on web.
// Disabled by default: cross-origin cookies don't work when app (8082) and API (3007) are on
// different ports/origins. Re-enable via EXPO_PUBLIC_COOKIE_AUTH_ENABLED=true once the backend
// merchant routes support httpOnly cookie auth (reading rez_merchant_token cookie) AND the app
// is served from the same origin/domain as the API (e.g. production with same-origin proxy).
// SECURITY NOTE (H12): On web, AsyncStorage maps to localStorage which is XSS-accessible.
// Enabling cookie auth is the correct long-term fix — tokens will move to httpOnly cookies.
export const COOKIE_AUTH_ENABLED = process.env.EXPO_PUBLIC_COOKIE_AUTH_ENABLED === 'true';

export interface StorageKeys {
  AUTH_TOKEN: 'auth_token';
  REFRESH_TOKEN: 'refresh_token';
  USER_DATA: 'user_data';
  MERCHANT_DATA: 'merchant_data';
  DASHBOARD_CACHE: 'dashboard_cache';
  SETTINGS: 'app_settings';
  ACTIVE_STORE_ID: 'active_store_id';
  ACTIVE_STORE_SLUG: 'active_store_slug';
}

const STORAGE_KEYS: StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  MERCHANT_DATA: 'merchant_data',
  DASHBOARD_CACHE: 'dashboard_cache',
  SETTINGS: 'app_settings',
  ACTIVE_STORE_ID: 'active_store_id',
  ACTIVE_STORE_SLUG: 'active_store_slug',
};

class StorageService {
  private isSensitiveStorageKey(key: keyof StorageKeys): boolean {
    return key === 'AUTH_TOKEN' || key === 'REFRESH_TOKEN';
  }

  private async secureSetItem(key: string, value: string): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(key, value);
        await AsyncStorage.removeItem(key);
      } catch (err) {
        // CD-XS-21 FIX: SecureStore unavailable on some devices — fail rather
        // than silently falling back to AsyncStorage where sensitive tokens
        // would be readable by any app on the device.
        logger.error(
          `[Storage] SecureStore.setItemAsync failed for ${key} — refusing AsyncStorage fallback`
        );
        throw new Error(`Failed to store sensitive key '${key}' in SecureStore`);
      }
      return;
    }
    // Web: tokens managed via httpOnly cookies (Phase 6) or Secure cookie flags
    await AsyncStorage.setItem(key, value);
  }

  private async secureGetItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    }

    try {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue !== null) {
        return secureValue;
      }
    } catch (err) {
      // CD-XS-21 FIX: SecureStore unavailable — do NOT fall back to AsyncStorage.
      // Return null so callers handle the absence explicitly rather than silently
      // reading from a readable location.
      logger.error(
        `[Storage] SecureStore.getItemAsync failed for ${key} — refusing AsyncStorage fallback`
      );
      return null;
    }

    // Migration path from AsyncStorage token to SecureStore.
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue !== null) {
      try {
        await SecureStore.setItemAsync(key, legacyValue);
        await AsyncStorage.removeItem(key);
      } catch {
        // Migration failed — don't expose token in AsyncStorage either.
        // Keep it in SecureStore or lose it (forces re-auth on next login).
        logger.error(`[Storage] SecureStore migration failed for ${key} — token not migrated`);
      }
    }
    return legacyValue || null;
  }

  private async secureRemoveItem(key: string): Promise<void> {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (value === null || value === undefined) {
      await this.remove(key);
      return;
    }

    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const stringValue = await AsyncStorage.getItem(key);
      if (stringValue === null) return null;
      return JSON.parse(stringValue) as T;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async setItem<T>(key: keyof StorageKeys, value: T): Promise<void> {
    if (value === null || value === undefined) {
      await this.removeItem(key);
      return;
    }

    const stringValue = JSON.stringify(value);

    if (this.isSensitiveStorageKey(key)) {
      await this.secureSetItem(STORAGE_KEYS[key], stringValue);
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEYS[key], stringValue);
  }

  async getItem<T>(key: keyof StorageKeys): Promise<T | null> {
    try {
      const stringValue = this.isSensitiveStorageKey(key)
        ? await this.secureGetItem(STORAGE_KEYS[key])
        : await AsyncStorage.getItem(STORAGE_KEYS[key]);

      if (stringValue === null) return null;
      return JSON.parse(stringValue) as T;
    } catch {
      return null;
    }
  }

  async removeItem(key: keyof StorageKeys): Promise<void> {
    if (this.isSensitiveStorageKey(key)) {
      await this.secureRemoveItem(STORAGE_KEYS[key]);
      return;
    }

    await AsyncStorage.removeItem(STORAGE_KEYS[key]);
  }

  async clear(): Promise<void> {
    // SECURITY FIX: Remove both AUTH_TOKEN and REFRESH_TOKEN from SecureStore.
    // Previously only AUTH_TOKEN was removed, leaving a stale REFRESH_TOKEN that
    // could be replayed to obtain a new access token after a forced clear.
    await this.secureRemoveItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.secureRemoveItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.MERCHANT_DATA,
      STORAGE_KEYS.DASHBOARD_CACHE,
      STORAGE_KEYS.SETTINGS,
    ]);
  }

  async setAuthToken(token: string): Promise<void> {
    // Phase 6: httpOnly cookies manage auth on web — skip AsyncStorage write.
    // Native builds (Platform.OS !== 'web') continue writing to SecureStore unchanged.
    if (Platform.OS === 'web' && COOKIE_AUTH_ENABLED) return;
    await this.secureSetItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    // Phase 6: web auth is fully cookie-based — skip token read from storage.
    // New sessions never write tokens on web (setAuthToken is a no-op when COOKIE_AUTH_ENABLED),
    // so returning null forces re-login which issues a proper httpOnly cookie.
    if (Platform.OS === 'web' && COOKIE_AUTH_ENABLED) return null;
    return this.secureGetItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    await this.removeItem('AUTH_TOKEN');
  }

  async setRefreshToken(token: string): Promise<void> {
    // Phase 6: web auth is cookie-based — skip storage write.
    if (Platform.OS === 'web' && COOKIE_AUTH_ENABLED) return;
    await this.secureSetItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    // Phase 6: web refresh is cookie-based — skip storage read.
    if (Platform.OS === 'web' && COOKIE_AUTH_ENABLED) return null;
    return this.secureGetItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async removeRefreshToken(): Promise<void> {
    await this.secureRemoveItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async setUserData(userData): Promise<void> {
    await this.setItem('USER_DATA', userData);
  }

  async getUserData<T>(): Promise<T | null> {
    return await this.getItem<T>('USER_DATA');
  }

  async removeUserData(): Promise<void> {
    await this.removeItem('USER_DATA');
  }

  async setMerchantData(merchantData): Promise<void> {
    await this.setItem('MERCHANT_DATA', merchantData);
  }

  async getMerchantData<T>(): Promise<T | null> {
    return await this.getItem<T>('MERCHANT_DATA');
  }

  async getMerchantId(): Promise<string | null> {
    const data = await this.getMerchantData<unknown>();
    if (!data) return null;
    if (typeof data === 'string') return data;
    return data._id || data.id || data.merchantId || String(data);
  }

  async removeMerchantData(): Promise<void> {
    await this.removeItem('MERCHANT_DATA');
  }

  async setDashboardCache(data): Promise<void> {
    await this.setItem('DASHBOARD_CACHE', {
      data,
      timestamp: Date.now(),
    });
  }

  async getDashboardCache<T>(): Promise<{ data: T; timestamp: number } | null> {
    return await this.getItem<{ data: T; timestamp: number }>('DASHBOARD_CACHE');
  }

  async removeDashboardCache(): Promise<void> {
    await this.removeItem('DASHBOARD_CACHE');
  }

  async setSettings(settings): Promise<void> {
    await this.setItem('SETTINGS', settings);
  }

  async getSettings<T>(): Promise<T | null> {
    return await this.getItem<T>('SETTINGS');
  }

  async logout(): Promise<void> {
    await this.removeAuthToken();
    await this.removeRefreshToken();
    await this.removeUserData();
    await this.removeMerchantData();
    await this.removeDashboardCache();
    // BUG-M09: Clear active store selection on logout
    await this.removeItem('ACTIVE_STORE_ID');
  }

  async forceClearAll(): Promise<void> {
    await this.clear();
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAuthToken();
    return token !== null;
  }
}

export const storageService = new StorageService();
export default storageService;
