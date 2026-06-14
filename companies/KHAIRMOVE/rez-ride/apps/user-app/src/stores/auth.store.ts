import { logger } from '../../shared/logger';
/**
 * Auth Store with Secure Storage
 * Handles authentication state with encrypted token persistence
 */

import { create } from 'zustand';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setAuthenticated: (token: string, user: User, refreshToken?: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  /**
   * Initialize auth state from secure storage
   */
  initialize: async () => {
    if (get().isInitialized) return;

    try {
      set({ isLoading: true });

      // Dynamic import to avoid circular dependencies
      const { secureStorage } = await import('../services/secure-storage');

      const [token, refreshToken, userData] = await Promise.all([
        secureStorage.getToken(),
        secureStorage.getRefreshToken(),
        secureStorage.getUserData(),
      ]);

      if (token) {
        set({
          isAuthenticated: true,
          token,
          refreshToken,
          user: userData,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      logger.error('Auth initialization failed:', error);
      set({
        isLoading: false,
        isInitialized: true,
        error: 'Failed to initialize authentication',
      });
    }
  },

  /**
   * Set authenticated state with secure token storage
   */
  setAuthenticated: async (token, user, refreshToken) => {
    try {
      const { secureStorage } = await import('../services/secure-storage');

      // Store tokens securely
      await Promise.all([
        secureStorage.setToken(token),
        refreshToken ? secureStorage.setRefreshToken(refreshToken) : Promise.resolve(),
        secureStorage.setUserData({
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
        }),
      ]);

      set({
        isAuthenticated: true,
        token,
        refreshToken: refreshToken || null,
        user,
        error: null,
      });
    } catch (error) {
      logger.error('Failed to set authenticated:', error);
      set({ error: 'Failed to save authentication' });
    }
  },

  /**
   * Set loading state
   */
  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Set error message
   */
  setError: (error) => set({ error, isLoading: false }),

  /**
   * Clear auth state and secure storage
   */
  logout: async () => {
    try {
      const { secureStorage } = await import('../services/secure-storage');
      await secureStorage.clearAll();

      set({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        user: null,
        error: null,
      });
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  },

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),
}));

// Selector hooks for optimized re-renders
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
