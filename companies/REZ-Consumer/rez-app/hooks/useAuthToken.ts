// @ts-nocheck
/**
 * useAuthToken Hook
 * Token-specific auth hook with refresh capabilities
 * Split from AuthContext.tsx for better modularity
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { authStorage } from '@/utils/authStorage';
import authService from '@/services/authApi';
import apiClient from '@/services/apiClient';
import { isTokenExpired, isTokenExpiringSoon, getTimeUntilExpiration } from '@/utils/tokenUtils';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseAuthTokenReturn {
  token: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  timeUntilExpiry: number | null;
  refreshToken: () => Promise<boolean>;
  clearTokens: () => Promise<void>;
}

/**
 * Hook for token-specific operations
 */
export function useAuthToken(minutesBeforeExpiry: number = 3): UseAuthTokenReturn {
  const { state, actions } = useAuth();
  const { token } = state;
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const isExpired = token ? isTokenExpired(token) : true;
  const isExpiringSoon = token ? isTokenExpiringSoon(token, minutesBeforeExpiry) : false;
  const timeUntilExpiry = token ? getTimeUntilExpiration(token) : null;

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;
    let refreshSuccess = false;

    const refreshPromise = (async () => {
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            logger.warn('[useAuthToken] Token refresh timed out after 30s');
            reject(new Error('Token refresh timeout'));
          }, 30_000);
        });

        const refreshTokenValue = await Promise.race([
          authStorage.getRefreshToken(),
          timeoutPromise
        ]);

        if (!refreshTokenValue) return false;

        const response = await Promise.race([
          authService.refreshToken(refreshTokenValue),
          timeoutPromise
        ]);

        if (!response.success || !response.data?.tokens) {
          throw new Error(response.error || 'Token refresh failed');
        }

        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

        if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
          throw new Error('Invalid access token from server');
        }
        if (!newRefreshToken || typeof newRefreshToken !== 'string' || newRefreshToken.trim() === '') {
          throw new Error('Invalid refresh token from server');
        }

        await authStorage.saveAuthToken(accessToken);
        await authStorage.saveRefreshToken(newRefreshToken);
        authService.setAuthToken(accessToken);
        apiClient.setAuthToken(accessToken);

        const storedUser = await authStorage.getUser().catch(() => null);

        if (storedUser) {
          refreshSuccess = true;
          return true;
        }
        return false;
      } catch (error) {
        const errorMessage = error?.message?.toLowerCase() || '';
        const isInvalidToken =
          errorMessage.includes('token expired') ||
          errorMessage.includes('refresh token') ||
          errorMessage.includes('jwt expired') ||
          errorMessage.includes('token has been revoked') ||
          errorMessage.includes('session invalidated') ||
          errorMessage.includes('please login again') ||
          errorMessage.includes('token replay') ||
          errorMessage.includes('unauthorized');

        if (isInvalidToken) {
          await authStorage.clearAuthData().catch(() => {});
          apiClient.setAuthToken(null);
          authService.setAuthToken(null);
          refreshSuccess = false;
          return false;
        }
        return false;
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, []);

  const clearTokens = useCallback(async (): Promise<void> => {
    await authStorage.clearAuthData();
    authService.setAuthToken(null);
    apiClient.setAuthToken(null);
  }, []);

  return {
    token,
    isExpired,
    isExpiringSoon,
    timeUntilExpiry,
    refreshToken,
    clearTokens,
  };
}

/**
 * Hook for automatic token refresh
 */
export function useAuthTokenAutoRefresh(minutesBeforeExpiry: number = 2): void {
  const { state } = useAuth();
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    const scheduleRefresh = () => {
      const secsLeft = getTimeUntilExpiration(state.token!);
      if (secsLeft <= 0) return;

      const refreshInMs = Math.max(0, (secsLeft - minutesBeforeExpiry * 60) * 1000);

      return setTimeout(async () => {
        if (isRefreshingRef.current) return;
        isRefreshingRef.current = true;

        try {
          const { useAuthToken } = await import('./useAuthToken');
          const tokenState = useAuthToken();
          await tokenState.refreshToken();
        } finally {
          isRefreshingRef.current = false;
        }
      }, refreshInMs);
    };

    const timerId = scheduleRefresh();
    return () => { if (timerId) clearTimeout(timerId); };
  }, [state.isAuthenticated, state.token, minutesBeforeExpiry]);
}
