/**
 * useAuthSession - Extracted login/logout/register logic for auth context
 * Part of AuthContext.tsx refactoring (Phase 7)
 */

import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/api/auth';
import { apiClient } from '@/services/api/client';
import { socketService } from '@/services/api/socket';
import { teamService } from '@/services/api/team';
import { queryClient } from '@/config/reactQuery';
import { logger } from '@/utils/logger';
import type { LoginRequest, RegisterRequest, User, Merchant } from '@/types/api';
import type { MerchantRole, Permission } from '@/types/team';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  merchant: Merchant | null;
  user: User | null;
  token: string | null;
  error: string | null;
  permissions: Permission[];
  role: MerchantRole | null;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { merchant: Merchant; user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_MERCHANT'; payload: Merchant }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'UPDATE_PERMISSIONS'; payload: { permissions: Permission[]; role: MerchantRole } };

// Initial state
export const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  merchant: null,
  user: null,
  token: null,
  error: null,
  permissions: [],
  role: null,
};

// Reducer
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        merchant: action.payload.merchant,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        merchant: null,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      logger.debug('LOGOUT action dispatched - updating auth state');
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        merchant: null,
        user: null,
        token: null,
        error: null,
        permissions: [],
        role: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_MERCHANT':
      return { ...state, merchant: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload.permissions,
        role: action.payload.role,
      };
    default:
      return state;
  }
}

// E7: Storage keys that must be wiped on logout.
export const LOGOUT_STORAGE_KEYS = [
  '@rez_connected_printer',
  'kds_sound_enabled',
  'kds_settings',
  'recent_exports',
  '@hotel_ota:staff_token',
];

// ─── Session Management ────────────────────────────────────────────────────────

export interface UseAuthSessionProps {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  refreshPermissions: () => Promise<void>;
}

export function useAuthSession({ state, dispatch, refreshPermissions }: UseAuthSessionProps) {
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);
  const isRefreshingPermissionsRef = useRef(false);

  const base64DecodeUrlSafe = (base64Url: string): string => {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4 || 4)) % 4);
    if (typeof atob !== 'undefined') {
      return atob(padded);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf8');
    }
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  };

  const decodeJwtExpiry = (token: string): number | null => {
    try {
      const payload = JSON.parse(base64DecodeUrlSafe(token.split('.')[1]));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  // Defined early so it can be referenced by scheduleSessionExpiry

  const logout = useCallback(async () => {
    try {
      logger.debug('Starting logout process...');

      socketService.disconnect();
      await authService.logout();

      try {
        await AsyncStorage.multiRemove(LOGOUT_STORAGE_KEYS);
      } catch (storageErr) {
        logger.warn('[Auth] Failed to clear merchant storage keys', storageErr);
      }

      apiClient.setToken(null);
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
      router.replace('/(auth)/login');

      logger.debug('Logout completed successfully');
    } catch (error) {
      logger.error('Error during logout:', error);
      apiClient.setToken(null);
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
      router.replace('/(auth)/login');
    }
  }, [dispatch]);

  // Update ref after logout is defined
  logoutRef.current = logout;

  // ── Schedule Session Expiry ──────────────────────────────────────────────────

  const scheduleSessionExpiry = useCallback(
    (token: string) => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      const jwtExpiry = decodeJwtExpiry(token);
      const timeout = jwtExpiry ? Math.max(jwtExpiry - Date.now(), 0) : SESSION_TIMEOUT_MS;

      logger.debug(`Session timeout scheduled: ${Math.round(timeout / 1000 / 60)}min`);

      sessionTimeoutRef.current = setTimeout(() => {
        logger.warn('Session timeout reached - logging out');
        logoutRef.current();
      }, timeout);
    },
    [SESSION_TIMEOUT_MS]
  );

  // ── Check Stored Token ──────────────────────────────────────────────────────

  const checkStoredToken = useCallback(async () => {
    try {
      logger.debug('Checking stored authentication...');

      const storedToken = await authService.getStoredToken();
      if (!storedToken) {
        logger.debug('No stored token found');
        apiClient.setToken(null);
        dispatch({ type: 'LOGOUT' });
        return;
      }

      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        const [user, merchant, token] = await Promise.all([
          authService.getStoredUserData(),
          authService.getStoredMerchantData(),
          authService.getStoredToken(),
        ]);

        if (user && merchant && token) {
          logger.debug('Valid stored authentication found');

          if (merchant.isActive === false || (merchant as unknown).isSuspended === true) {
            logger.warn('Merchant account is suspended - forcing logout');
            apiClient.setToken(null);
            await authService.clearAuthData();
            dispatch({ type: 'LOGOUT' });
            Alert.alert(
              'Account Suspended',
              'Your account has been suspended. Please contact support at support@rez.money.',
              [{ text: 'OK' }]
            );
            return;
          }

          apiClient.setToken(token);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, merchant, token },
          });

          try {
            await refreshPermissions();
          } catch (permError) {
            logger.warn('Failed to load permissions:', permError);
          }
        } else {
          logger.warn('Incomplete stored data, logging out');
          apiClient.setToken(null);
          await authService.clearAuthData();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        logger.debug('No valid authentication found');
        apiClient.setToken(null);
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      logger.error('Error checking stored authentication:', error);
      apiClient.setToken(null);
      await authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  }, [dispatch, refreshPermissions]);

  // ── Login ────────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      logger.debug('Attempting login for:', email);
      const authResponse = await authService.login({ email, password });
      logger.debug('Login successful');

      if (
        authResponse.merchant.isActive === false ||
        (authResponse.merchant as unknown).isSuspended === true
      ) {
        logger.warn('Suspended merchant attempted login - rejecting');
        apiClient.setToken(null);
        dispatch({
          type: 'AUTH_ERROR',
          payload: 'Your account has been suspended. Please contact support at support@rez.money.',
        });
        Alert.alert(
          'Account Suspended',
          'Your account has been suspended. Please contact support at support@rez.money.',
          [{ text: 'OK' }]
        );
        return;
      }

      apiClient.setToken(authResponse.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authResponse.user,
          merchant: authResponse.merchant,
          token: authResponse.token,
        },
      });

      try {
        await refreshPermissions();
      } catch (permError) {
        logger.warn('Failed to load permissions (continuing anyway):', permError);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('Login failed:', err.message);
      apiClient.setToken(null);
      dispatch({
        type: 'AUTH_ERROR',
        payload: err.message || 'Login failed',
      });
    }
  };

  // ── Register ────────────────────────────────────────────────────────────────

  const register = async (data: RegisterRequest) => {
    dispatch({ type: 'AUTH_START' });

    try {
      logger.debug('Attempting registration for:', data.email);
      const authResponse = await authService.register(data);
      logger.debug('Registration successful');

      apiClient.setToken(authResponse.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authResponse.user,
          merchant: authResponse.merchant,
          token: authResponse.token,
        },
      });

      try {
        await refreshPermissions();
      } catch (permError) {
        logger.warn('Failed to load permissions (continuing anyway):', permError);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('Registration failed:', err.message);
      apiClient.setToken(null);
      dispatch({
        type: 'AUTH_ERROR',
        payload: err.message || 'Registration failed',
      });
    }
  };

  // ── Refresh Permissions ───────────────────────────────────────────────────────

  const refreshPermissionsFn = useCallback(async () => {
    if (isRefreshingPermissionsRef.current) return;
    isRefreshingPermissionsRef.current = true;

    try {
      logger.debug('Refreshing permissions...');
      const userTeam = await teamService.getCurrentUserPermissions();

      dispatch({
        type: 'UPDATE_PERMISSIONS',
        payload: {
          permissions: userTeam.permissions,
          role: userTeam.role,
        },
      });

      logger.debug('Permissions refreshed');
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('Failed to refresh permissions:', err.message);
    } finally {
      isRefreshingPermissionsRef.current = false;
    }
  }, [dispatch]);

  // ── Profile & Password ───────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  const updateMerchant = useCallback(
    (merchant: Merchant) => {
      dispatch({ type: 'UPDATE_MERCHANT', payload: merchant });
    },
    [dispatch]
  );

  const updateUser = useCallback(
    (user: User) => {
      dispatch({ type: 'UPDATE_USER', payload: user });
    },
    [dispatch]
  );

  const refreshProfile = async () => {
    try {
      logger.debug('Refreshing profile...');
      const profileData = await authService.getProfile();

      dispatch({ type: 'UPDATE_USER', payload: profileData.user });
      dispatch({ type: 'UPDATE_MERCHANT', payload: profileData.merchant });

      logger.debug('Profile refreshed');
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('Failed to refresh profile:', err.message);
      if (err.message?.includes('No profile data found')) {
        await logout();
      }
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      logger.debug('Changing password...');
      await authService.changePassword(currentPassword, newPassword);
      logger.debug('Password changed successfully');
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('Failed to change password:', err.message);
      throw error;
    }
  };

  return {
    checkStoredToken,
    logout,
    login,
    register,
    clearError,
    updateMerchant,
    updateUser,
    refreshProfile,
    changePassword,
    refreshPermissions: refreshPermissionsFn,
    scheduleSessionExpiry,
    sessionTimeoutRef,
  };
}
