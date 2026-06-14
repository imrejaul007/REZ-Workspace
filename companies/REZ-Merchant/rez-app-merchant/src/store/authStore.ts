/**
 * Auth Store - Zustand State Management for Authentication
 *
 * Manages authentication state including:
 * - Auth token
 * - Merchant ID
 * - Current store selection
 * - User profile
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SecureStorage } from '@/utils/secureStorage';

export interface MerchantData {
  merchantId: string;
  currentStoreId: string;
  storeIds?: string[];
  merchantName?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  merchantId: string | null;
  currentStoreId: string | null;
  authToken: string | null;
  user: UserProfile | null;

  // Actions
  initialize: () => Promise<void>;
  login: (token: string, merchantData: MerchantData) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentStoreId: (storeId: string) => Promise<void>;
  updateMerchantData: (data: Partial<MerchantData>) => Promise<void>;
}

const AUTH_TOKEN_KEY = 'authToken';
const MERCHANT_DATA_KEY = 'merchantData';

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  merchantId: null,
  currentStoreId: null,
  authToken: null,
  user: null,

  /**
   * Initialize auth state from secure storage
   * Called on app startup
   */
  initialize: async () => {
    try {
      set({ isLoading: true });

      // Load from secure storage
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const merchantDataStr = await SecureStore.getItemAsync(MERCHANT_DATA_KEY);

      if (token && merchantDataStr) {
        const merchantData: MerchantData = JSON.parse(merchantDataStr);
        set({
          isAuthenticated: true,
          authToken: token,
          merchantId: merchantData.merchantId,
          currentStoreId: merchantData.currentStoreId,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Login and store credentials
   */
  login: async (token: string, merchantData: MerchantData) => {
    try {
      // Store in secure storage
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(MERCHANT_DATA_KEY, JSON.stringify(merchantData));

      set({
        isAuthenticated: true,
        authToken: token,
        merchantId: merchantData.merchantId,
        currentStoreId: merchantData.currentStoreId,
      });
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  },

  /**
   * Logout and clear credentials
   */
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(MERCHANT_DATA_KEY);

      set({
        isAuthenticated: false,
        authToken: null,
        merchantId: null,
        currentStoreId: null,
        user: null,
      });
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  },

  /**
   * Set the current store ID (for multi-store merchants)
   */
  setCurrentStoreId: async (storeId: string) => {
    try {
      const { merchantId, authToken } = get();
      if (!merchantId || !authToken) {
        throw new Error('Not authenticated');
      }

      const merchantData: MerchantData = {
        merchantId,
        currentStoreId: storeId,
      };

      await SecureStore.setItemAsync(MERCHANT_DATA_KEY, JSON.stringify(merchantData));
      set({ currentStoreId: storeId });
    } catch (error) {
      console.error('Failed to set store ID:', error);
      throw error;
    }
  },

  /**
   * Update merchant data in storage
   */
  updateMerchantData: async (data: Partial<MerchantData>) => {
    try {
      const { merchantId, currentStoreId, authToken } = get();
      if (!merchantId || !authToken) {
        throw new Error('Not authenticated');
      }

      const merchantData: MerchantData = {
        merchantId,
        currentStoreId: data.currentStoreId ?? currentStoreId ?? '',
        ...data,
      };

      await SecureStore.setItemAsync(MERCHANT_DATA_KEY, JSON.stringify(merchantData));

      set({
        currentStoreId: merchantData.currentStoreId,
      });
    } catch (error) {
      console.error('Failed to update merchant data:', error);
      throw error;
    }
  },
}));

export default useAuthStore;
