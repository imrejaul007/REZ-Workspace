// @ts-nocheck
/**
 * useAuthState Hook
 * State-only auth hook for pure UI needs
 * Split from AuthContext.tsx for better modularity
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Auth state shape
 */
export interface AuthState {
  user: import('@/services/authApi').User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  token: string | null;
}

/**
 * Derived auth state values
 */
export interface AuthDerivedState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  userRole: string | null;
  isOnboarded: boolean;
  isPremium: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Hook to get raw auth state
 */
export function useAuthState(): AuthState {
  const { state } = useAuth();
  return state;
}

/**
 * Hook to get derived auth state values
 */
export function useAuthDerivedState(): AuthDerivedState {
  const { state } = useAuth();

  return useMemo(() => {
    const user = state.user;
    return {
      userId: user?.id || user?._id || null,
      userName: user?.profile?.name || user?.name || null,
      userEmail: user?.email || user?.profile?.email || null,
      userPhone: user?.phone || user?.profile?.phone || null,
      userRole: user?.role || null,
      isOnboarded: user?.isOnboarded ?? false,
      isPremium: user?.isPremium ?? false,
      hasError: !!state.error,
      errorMessage: state.error,
    };
  }, [state.user, state.error]);
}

/**
 * Hook to check specific user permissions
 */
export function useAuthPermissions(): {
  isAdmin: boolean;
  isMerchant: boolean;
  isDriver: boolean;
  canAccessAdmin: boolean;
  canMakePayments: boolean;
} {
  const { state } = useAuth();

  return useMemo(() => {
    const user = state.user;
    const role = user?.role?.toLowerCase() || '';

    return {
      isAdmin: role === 'admin' || role === 'superadmin',
      isMerchant: role === 'merchant' || role === 'vendor' || role === 'store',
      isDriver: role === 'driver' || role === 'delivery',
      canAccessAdmin: role === 'admin' || role === 'superadmin',
      canMakePayments: state.isAuthenticated,
    };
  }, [state.user, state.isAuthenticated]);
}

/**
 * Hook to get user location/city
 */
export function useAuthLocation(): string | null {
  const { state } = useAuth();

  return useMemo(() => {
    const user = state.user;
    return user?.profile?.location?.city || user?.city || null;
  }, [state.user]);
}

/**
 * Hook to get user member since date
 */
export function useAuthMemberSince(): Date | null {
  const { state } = useAuth();

  return useMemo(() => {
    const user = state.user;
    if (!user?.createdAt) return null;
    return new Date(user.createdAt);
  }, [state.user]);
}
