// @ts-nocheck
/**
 * MMKV Storage Wrapper
 * High-performance key-value storage for React Native
 * 
 * MMKV is 10-100x faster than AsyncStorage
 */

import { MMKV } from 'react-native-mmkv';
import { Storage } from 'zustand/middleware';

// Initialize MMKV instances
export const storage = new MMKV({
  id: 'rez-app-storage',
  encryptionKey: 'rez-secure-key-v1', // In production, use a secure key
});

export const secureStorage = new MMKV({
  id: 'rez-app-secure',
  encryptionKey: 'rez-secure-key-v1',
});

// Generic storage interface for Zustand
export const mmkvStorage: Storage<unknown> = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

// Secure storage interface (encrypted)
export const secureMmkvStorage: Storage<unknown> = {
  getItem: (name: string): string | null => {
    const value = secureStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    secureStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    secureStorage.delete(name);
  },
};

// Convenience functions
export const mmkv = {
  // String operations
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },
  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  // Number operations
  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },
  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  // Boolean operations
  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },
  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  // Object operations (JSON)
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    if (!value) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Delete
  delete: (key: string): void => {
    storage.delete(key);
  },

  // Check existence
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },

  // Clear all
  clearAll: (): void => {
    storage.clearAll();
  },
};
