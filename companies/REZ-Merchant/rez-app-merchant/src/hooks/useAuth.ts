/**
 * useAuth Hook
 *
 * React hook for accessing authentication state and methods.
 * Provides merchantId, storeId, and auth token to components.
 */

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getAuthToken, getCurrentStoreId, getMerchantId } from '@/utils/secureStorage';

/**
 * Authentication hook interface
 */
export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  merchantId: string | null;
  storeId: string | null;
  authToken: string | null;

  // Secure accessors (always read from secure storage)
  getToken: () => Promise<string>;
  getStoreId: () => Promise<string>;
  getMerchantId: () => Promise<string>;

  // Actions
  logout: () => Promise<void>;
  setCurrentStoreId: (storeId: string) => Promise<void>;
}

/**
 * Authentication hook for accessing auth state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { merchantId, storeId, getToken } = useAuth();
 *
 *   useEffect(() => {
 *     const token = await getToken();
 *     // Use token for API calls
 *   }, []);
 *
 *   return <Text>Merchant: {merchantId}</Text>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const {
    isAuthenticated,
    isLoading,
    merchantId,
    currentStoreId,
    authToken,
    initialize,
    logout,
    setCurrentStoreId,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  /**
   * Get auth token from secure storage
   * Use this for API calls instead of the cached token
   */
  const getToken = useCallback(async (): Promise<string> => {
    return getAuthToken();
  }, []);

  /**
   * Get current store ID from secure storage
   * Use this for WebSocket room joining
   */
  const getStoreId = useCallback(async (): Promise<string> => {
    return getCurrentStoreId();
  }, []);

  /**
   * Get merchant ID from secure storage
   */
  const getMerchantId = useCallback(async (): Promise<string> => {
    return getMerchantId();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    merchantId,
    storeId: currentStoreId,
    authToken,
    getToken,
    getStoreId,
    getMerchantId,
    logout,
    setCurrentStoreId,
  };
}

/**
 * Hook for components that need the store ID
 * Returns the store ID from auth store or secure storage
 *
 * @example
 * ```tsx
 * function KitchenScreen() {
 *   const { storeId, isLoading } = useStoreId();
 *
 *   if (isLoading) return <Loading />;
 *   if (!storeId) return <NoStoreSelected />;
 *
 *   return <Kitchen orders={orders} storeId={storeId} />;
 * }
 * ```
 */
export function useStoreId(): { storeId: string | null; isLoading: boolean } {
  const { currentStoreId, isLoading } = useAuthStore();
  return { storeId: currentStoreId, isLoading };
}

/**
 * Hook for getting auth token only
 * Preferable when you only need the token
 */
export function useAuthToken(): { token: string | null; getToken: () => Promise<string> } {
  const { authToken } = useAuthStore();
  const getToken = useCallback(async (): Promise<string> => {
    return getAuthToken();
  }, []);
  return { token: authToken, getToken };
}

export default useAuth;
