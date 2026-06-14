/**
 * Secure Storage Utility
 *
 * Provides encrypted storage for sensitive data using expo-secure-store.
 * Used for storing auth tokens and merchant credentials.
 */

import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'authToken';
const MERCHANT_DATA_KEY = 'merchantData';

/**
 * Secure storage keys and type definitions
 */
export interface MerchantData {
  merchantId: string;
  currentStoreId: string;
  storeIds?: string[];
  merchantName?: string;
}

/**
 * Get the authentication token from secure storage
 * @throws Error if no token is found
 */
export async function getAuthToken(): Promise<string> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

/**
 * Store the authentication token in secure storage
 */
export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

/**
 * Remove the authentication token from secure storage
 */
export async function removeAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

/**
 * Get merchant data from secure storage
 * @throws Error if no merchant data is found
 */
export async function getMerchantData(): Promise<MerchantData> {
  const data = await SecureStore.getItemAsync(MERCHANT_DATA_KEY);
  if (!data) {
    throw new Error('No merchant data found');
  }
  return JSON.parse(data) as MerchantData;
}

/**
 * Store merchant data in secure storage
 */
export async function setMerchantData(data: MerchantData): Promise<void> {
  await SecureStore.setItemAsync(MERCHANT_DATA_KEY, JSON.stringify(data));
}

/**
 * Get the current store ID from secure storage
 * @throws Error if no store is selected
 */
export async function getCurrentStoreId(): Promise<string> {
  const merchantData = await getMerchantData();
  if (!merchantData.currentStoreId) {
    throw new Error('No store selected');
  }
  return merchantData.currentStoreId;
}

/**
 * Get the merchant ID from secure storage
 * @throws Error if no merchant data is found
 */
export async function getMerchantId(): Promise<string> {
  const merchantData = await getMerchantData();
  if (!merchantData.merchantId) {
    throw new Error('No merchant ID found');
  }
  return merchantData.merchantId;
}

/**
 * Clear all secure storage data
 */
export async function clearSecureStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(MERCHANT_DATA_KEY);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return !!token;
}

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getMerchantData,
  setMerchantData,
  getCurrentStoreId,
  getMerchantId,
  clearSecureStorage,
  isAuthenticated,
};
