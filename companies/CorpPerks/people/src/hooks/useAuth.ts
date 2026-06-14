// ==========================================
// MyTalent - Auth Hook
// Convenient hook for auth operations
// ==========================================

import { useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore, User } from '../store/authStore';
import { DEMO_CREDENTIALS } from '../services/authService';

// ==========================================
// Types
// ==========================================

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyId?: string;
  department?: string;
  designation?: string;
  acceptTerms: boolean;
}

// ==========================================
// Main Auth Hook
// ==========================================

export function useAuth() {
  const store = useAuthStore();

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await store.login(identifier, password);
    if (result.success) {
      router.replace('/(tabs)');
    }
    return result;
  }, [store]);

  const loginWithOTP = useCallback(async (phone: string, otp: string) => {
    const result = await store.loginWithOTP(phone, otp);
    if (result.success) {
      router.replace('/(tabs)');
    }
    return result;
  }, [store]);

  const register = useCallback(async (data: RegisterData) => {
    const result = await store.register({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      companyId: data.companyId,
      department: data.department,
      designation: data.designation,
      acceptTerms: data.acceptTerms,
    });
    if (result.success) {
      router.replace('/(tabs)');
    }
    return result;
  }, [store]);

  const logout = useCallback(async () => {
    await store.logout();
    router.replace('/auth/login');
  }, [store]);

  const refreshSession = useCallback(async () => {
    return store.refreshSession();
  }, [store]);

  const updateProfile = useCallback((data: Partial<User>) => {
    store.updateUser(data);
  }, [store]);

  const clearError = useCallback(() => {
    store.clearError();
  }, [store]);

  return {
    // State
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,

    // Actions
    login,
    loginWithOTP,
    register,
    logout,
    refreshSession,
    updateProfile,
    clearError,

    // Utilities
    isDemoUser: useMemo(() => {
      return store.user?.email === DEMO_CREDENTIALS.email;
    }, [store.user]),
  };
}

// ==========================================
// Quick Auth Hook (for components)
// ==========================================

export function useQuickAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
    updateProfile,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    updateProfile,

    // Quick profile checks
    isEmployee: !!user,
    userName: user?.name || 'Guest',
    userEmail: user?.email || '',
    userInitials: user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'MT',
  };
}

// ==========================================
// Auth Check Hook (for screens)
// ==========================================

export function useAuthCheck(redirectIfUnauthenticated = true) {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  const isReady = isInitialized && !isLoading;

  const check = useCallback(() => {
    if (isReady && !isAuthenticated && redirectIfUnauthenticated) {
      router.replace('/auth/login');
      return false;
    }
    return isAuthenticated;
  }, [isReady, isAuthenticated, redirectIfUnauthenticated]);

  return {
    isAuthenticated,
    isReady,
    isLoading,
    check,
  };
}

// ==========================================
// Guest Check Hook (for auth screens)
// ==========================================

export function useGuestCheck() {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  const isReady = isInitialized && !isLoading;
  const isGuest = !isAuthenticated;

  const check = useCallback(() => {
    if (isReady && isAuthenticated) {
      router.replace('/(tabs)');
      return false;
    }
    return true;
  }, [isReady, isAuthenticated]);

  return {
    isGuest,
    isReady,
    isLoading,
    check,
  };
}

export default useAuth;
