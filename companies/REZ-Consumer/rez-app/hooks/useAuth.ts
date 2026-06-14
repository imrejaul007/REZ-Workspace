/**
 * useAuth Hook
 * Comprehensive auth hook combining context + Zustand store fallback
 * Split from AuthContext.tsx for better modularity
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useAuthStore, type AuthStoreState } from '@/stores/authStore';

/**
 * Full auth context type (subset of AuthContextType actions)
 */
export interface UseAuthState {
  user: import('@/services/authApi').User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  token: string | null;
}

export interface UseAuthActions {
  sendOTP: (phoneNumber: string, email?: string, referralCode?: string, flow?: 'login' | 'signup') => Promise<void>;
  login: (phoneNumber: string, otp: string) => Promise<import('@/services/authApi').User | undefined>;
  register: (phoneNumber: string, email: string, referralCode?: string) => Promise<void>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<import('@/services/authApi').User | undefined>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  updateProfile: (data: Partial<import('@/services/authApi').User>) => Promise<void>;
  completeOnboarding: (data: Partial<import('@/services/authApi').User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  loginWithTokens: (tokens: { accessToken: string; refreshToken: string }, user: import('@/services/authApi').User) => Promise<import('@/services/authApi').User>;
}

export interface UseAuthContext {
  state: UseAuthState;
  actions: UseAuthActions;
}

/**
 * Main useAuth hook
 * Falls back to Zustand store if used outside AuthProvider
 */
export function useAuth(): UseAuthContext {
  const context = useContext(AuthContext);
  const storeState = useAuthStore((s: AuthStoreState) => s.state);
  const storeActions = useAuthStore((s: AuthStoreState) => s.actions);

  if (context !== undefined) {
    return context as unknown as UseAuthContext;
  }

  // Fallback to Zustand store
  return {
    state: storeState as UseAuthState,
    actions: storeActions as unknown as UseAuthActions,
  };
}

/**
 * Shorthand to get just the user object
 */
export function useAuthUser(): import('@/services/authApi').User | null {
  const { state } = useAuth();
  return state.user;
}

/**
 * Shorthand to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { state } = useAuth();
  return state.isAuthenticated;
}

/**
 * Shorthand to check if auth is loading
 */
export function useAuthLoading(): boolean {
  const { state } = useAuth();
  return state.isLoading;
}

/**
 * Shorthand to get current auth error
 */
export function useAuthError(): string | null {
  const { state } = useAuth();
  return state.error;
}

/**
 * Shorthand to get auth token
 */
export function useAuthToken(): string | null {
  const { state } = useAuth();
  return state.token;
}
