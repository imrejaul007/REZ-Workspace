/**
 * AuthContext - Main auth context provider (refactored)
 *
 * This file now uses extracted hooks:
 * - useAuthSession: Login/logout/register, session management
 * - useAuthPermissions: Permission checking
 *
 * Part of Phase 7: Large File Refactoring
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { router } from 'expo-router';
import { apiClient } from '../services/api/client';
import type { User, Merchant, RegisterRequest } from '../types/api';
import type { Permission, MerchantRole } from '../types/team';
import { logger } from '@/utils/logger';

export type { LoginRequest, RegisterRequest } from '../types/api';
export type { Permission, MerchantRole } from '../types/team';

// Import from extracted module
export {
  initialAuthState,
  authReducer,
  LOGOUT_STORAGE_KEYS,
  type AuthState,
  type AuthAction,
} from './auth/useAuthSession';

export { useAuthPermissions } from './auth/useAuthPermissions';

import {
  initialAuthState,
  authReducer,
  useAuthSession,
  type AuthState,
} from './auth/useAuthSession';
import { useAuthPermissions } from './auth/useAuthPermissions';

// ─── Context Types ────────────────────────────────────────────────────────────

interface AuthContextType {
  state: AuthState;
  token: string | null;
  user: User | null;
  merchant: Merchant | null;
  permissions: Permission[];
  role: MerchantRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateMerchant: (merchant: Merchant) => void;
  updateUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use extracted session hook
  const session = useAuthSession({
    state,
    dispatch,
    refreshPermissions: async () => {
      // refreshPermissions will be called from within session
    },
  });

  // Fix: Properly wire up refreshPermissions from session
  const refreshPermissionsRef = useRef(session.refreshPermissions);
  useEffect(() => {
    refreshPermissionsRef.current = session.refreshPermissions;
  }, [session.refreshPermissions]);

  // Override checkStoredToken to use session's version
  const checkStoredToken = useCallback(async () => {
    try {
      logger.debug('Checking stored authentication...');

      const { authService } = await import('../services/api/auth');
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
            return;
          }

          apiClient.setToken(token);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, merchant, token },
          });

          try {
            await refreshPermissionsRef.current();
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
      const { authService } = await import('../services/api/auth');
      await authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Run checkStoredToken on mount
  useEffect(() => {
    checkStoredToken();
  }, [checkStoredToken]);

  // Schedule session expiry
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      session.scheduleSessionExpiry(state.token);
    } else {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
    }
  }, [state.isAuthenticated, state.token, session.scheduleSessionExpiry]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  // #5 — Register logout callback with apiClient so 401 after failed refresh triggers logout
  useEffect(() => {
    apiClient.setOnLogoutCallback(session.logout);
  }, [session.logout]);

  // Use extracted permissions hook
  const permissions = useAuthPermissions({ permissions: state.permissions });

  const value: AuthContextType = {
    state,
    token: state.token,
    user: state.user,
    merchant: state.merchant,
    permissions: state.permissions,
    role: state.role,
    hasPermission: permissions.hasPermission,
    hasAnyPermission: permissions.hasAnyPermission,
    hasAllPermissions: permissions.hasAllPermissions,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login: session.login,
    register: session.register,
    logout: session.logout,
    clearError: session.clearError,
    updateMerchant: session.updateMerchant,
    updateUser: session.updateUser,
    refreshProfile: session.refreshProfile,
    refreshPermissions: session.refreshPermissions,
    changePassword: session.changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
